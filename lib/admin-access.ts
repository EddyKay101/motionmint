import { env } from "cloudflare:workers";

export function canManageTemplates(request: Request) {
  const url = new URL(request.url);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (isLocal) return true;
  const configured = (env as unknown as Record<string, unknown>).MOTIONMINT_ADMIN_KEY;
  return typeof configured === "string" && configured.length >= 20 && request.headers.get("authorization") === `Bearer ${configured}`;
}
