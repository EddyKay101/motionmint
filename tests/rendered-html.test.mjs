import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the MotionMint product homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>MotionMint/i);
  assert.match(html, /make your message move/i);
  assert.match(html, /Create|Start creating/i);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("email studio exposes the visual MJML workflow", async () => {
  const [studio, builder, gallery, creator, publicApi] = await Promise.all([
    readFile(new URL("../app/admin/email-studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/email-builder.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/email/template-gallery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/email/create/[id]/email-creator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/email-templates/route.ts", import.meta.url), "utf8"),
  ]);
  for (const block of ["heading", "paragraph", "image", "button", "divider", "spacer"]) {
    assert.match(studio, new RegExp(`${block}:`));
  }
  assert.match(studio, /Live output/);
  assert.match(studio, /Download MJML/);
  assert.match(studio, /Download HTML/);
  assert.match(studio, /Rendered email preview/);
  assert.match(builder, /export function buildCampaignMjml/);
  assert.match(builder, /export function compileCampaignHtml/);
  assert.match(builder, /export function validateCampaignConfig/);
  assert.match(builder, /<mj-image/);
  assert.match(builder, /href=/);
  assert.doesNotMatch(builder, /<a href=.*<mj-image/);
  assert.match(studio, /Publish to users/);
  assert.match(publicApi, /eq\(emailCampaigns\.status, "published"\)/);
  assert.match(gallery, /Use this template/);
  assert.match(creator, /Saved on this device/);
  assert.match(creator, /Download MJML/);
  assert.match(creator, /Upload from your device/);
  assert.match(creator, /readAsDataURL/);
  assert.match(creator, /Browse my creatives/);
  assert.match(creator, /bannerSnapshot/);
  assert.match(builder, /target="_blank"/);
});
