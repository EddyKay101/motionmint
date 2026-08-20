import { createServer } from "node:http";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, open, rm } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = positiveInteger(process.env.PORT, 8080);
const maxUploadBytes = positiveInteger(process.env.MAX_UPLOAD_MB, 250) * 1024 * 1024;
const timeoutMs = positiveInteger(process.env.CONVERSION_TIMEOUT_SECONDS, 300) * 1000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
let activeConversions = 0;
const maxConcurrent = positiveInteger(process.env.MAX_CONCURRENT_CONVERSIONS, 2);

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function headers(extra = {}) {
  return {
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-methods": "POST, OPTIONS, GET",
    "access-control-allow-headers": "content-type, x-file-name",
    "access-control-expose-headers": "content-disposition",
    "x-content-type-options": "nosniff",
    ...extra,
  };
}

function json(response, status, body) {
  response.writeHead(status, headers({ "content-type": "application/json; charset=utf-8" }));
  response.end(JSON.stringify(body));
}

function safeBaseName(value) {
  const decoded = (() => { try { return decodeURIComponent(value || ""); } catch { return value || ""; } })();
  return decoded.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "turnbine-video";
}

async function runFfmpeg(input, output) {
  const args = [
    "-hide_banner", "-loglevel", "error", "-y", "-i", input,
    "-map", "0:v:0", "-map", "0:a?",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart", output,
  ];
  await new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { if (stderr.length < 8_000) stderr += chunk; });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.once("error", reject);
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(signal ? "Conversion timed out." : stderr.trim() || `FFmpeg exited with code ${code}.`));
    });
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") { response.writeHead(204, headers()); response.end(); return; }
  if (request.method === "GET" && request.url === "/health") {
    json(response, 200, { status: "ok", service: "turnbine-webm-to-mp4", activeConversions }); return;
  }
  if (request.method !== "POST" || request.url !== "/convert") {
    json(response, 404, { error: "Use POST /convert with a raw video/webm request body." }); return;
  }
  if (!request.headers["content-type"]?.toLowerCase().startsWith("video/webm")) {
    json(response, 415, { error: "Content-Type must be video/webm." }); return;
  }
  const declaredSize = Number(request.headers["content-length"] || 0);
  if (declaredSize > maxUploadBytes) { json(response, 413, { error: "WebM upload exceeds the configured size limit." }); return; }
  if (activeConversions >= maxConcurrent) { json(response, 429, { error: "Converter is busy. Try again shortly." }); return; }

  const directory = await mkdtemp(join(tmpdir(), "turnbine-convert-"));
  const input = join(directory, "input.webm");
  const output = join(directory, "output.mp4");
  let received = 0;
  let conversionStarted = false;
  request.on("data", (chunk) => {
    received += chunk.length;
    if (received > maxUploadBytes) request.destroy(new Error("Upload too large"));
  });
  try {
    await pipeline(request, createWriteStream(input, { flags: "wx" }));
    const handle = await open(input, "r");
    const signatureBytes = Buffer.alloc(4);
    await handle.read(signatureBytes, 0, 4, 0);
    await handle.close();
    const signature = signatureBytes.toString("hex");
    if (signature !== "1a45dfa3") { json(response, 400, { error: "The uploaded file is not a valid WebM container." }); return; }
    activeConversions += 1;
    conversionStarted = true;
    await runFfmpeg(input, output);
    const fileName = `${safeBaseName(String(request.headers["x-file-name"] || ""))}.mp4`;
    response.writeHead(200, headers({
      "content-type": "video/mp4",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    }));
    await pipeline(createReadStream(output), response);
  } catch (error) {
    if (!response.headersSent) json(response, received > maxUploadBytes ? 413 : 422, { error: error instanceof Error ? error.message : "Conversion failed." });
    else response.destroy();
  } finally {
    if (conversionStarted) activeConversions = Math.max(0, activeConversions - 1);
    await rm(directory, { recursive: true, force: true });
  }
});

server.requestTimeout = timeoutMs + 30_000;
server.listen(port, "0.0.0.0", () => console.log(`Turnbine converter listening on :${port}`));
