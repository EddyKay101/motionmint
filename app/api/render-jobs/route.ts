import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects, renderJobs } from "../../../db/schema";
import { apiError, databaseError, ownerKeyFrom } from "../../../lib/backend";

export async function GET(request: Request) {
  const ownerKey = ownerKeyFrom(request);
  if (!ownerKey) return apiError("A valid device owner key is required.", 401);
  try {
    const rows = await getDb().select().from(renderJobs).where(eq(renderJobs.ownerKey, ownerKey)).orderBy(desc(renderJobs.createdAt)).limit(20);
    return Response.json({ jobs: rows.map(({ requestJson, ...row }) => ({ ...row, request: JSON.parse(requestJson) })) });
  } catch (error) { return databaseError(error); }
}

export async function POST(request: Request) {
  const ownerKey = ownerKeyFrom(request);
  if (!ownerKey) return apiError("A valid device owner key is required.", 401);
  try {
    const payload = (await request.json()) as { projectId?: string; ratio?: string; fps?: number; profileId?: string; sizeId?: string; format?: string };
    if (!payload.projectId) return apiError("projectId is required.");
    const db = getDb();
    const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, payload.projectId), eq(projects.ownerKey, ownerKey))).limit(1);
    if (!project) return apiError("Save the project before requesting a render.", 409);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const format = (payload.format || "MP4").slice(0, 40);
    const renderRequest = { requestVersion: 1, renderer: format.toLowerCase() === "mp4" ? "headless-browser-ffmpeg" : "profile-export-adapter", projectId: payload.projectId, profileId: payload.profileId, output: { format, sizeId: payload.sizeId, ratio: payload.ratio ?? "9:16", fps: payload.fps ?? 30 } };
    await db.insert(renderJobs).values({ id, projectId: payload.projectId, ownerKey, status: "queued", requestJson: JSON.stringify(renderRequest), createdAt: now, updatedAt: now });
    return Response.json({ job: { id, status: "queued", createdAt: now } }, { status: 202 });
  } catch (error) { return databaseError(error); }
}
