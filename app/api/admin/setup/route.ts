import { env } from "cloudflare:workers";
import { getAuth } from "../../../../lib/auth";
import { apiError } from "../../../../lib/backend";

export async function GET(request: Request) {
  const local = ["localhost", "127.0.0.1"].includes(new URL(request.url).hostname);
  const existing = await env.DB.prepare("SELECT id FROM user WHERE role = 'admin' LIMIT 1").first();
  return Response.json({ available: !existing && local });
}

export async function POST(request: Request) {
  const runtime = env as unknown as Record<string, unknown>;
  const local = ["localhost", "127.0.0.1"].includes(new URL(request.url).hostname);
  const setupKey = typeof runtime.MOTIONMINT_ADMIN_SETUP_KEY === "string" ? runtime.MOTIONMINT_ADMIN_SETUP_KEY : "";
  if (!local && (!setupKey || request.headers.get("x-motionmint-setup-key") !== setupKey)) return apiError("Admin setup is not available.", 403);
  const existing = await env.DB.prepare("SELECT id FROM user WHERE role = 'admin' LIMIT 1").first();
  if (existing) return apiError("An administrator already exists.", 409);
  const payload = await request.json() as { username?: string; password?: string };
  const usernameValue = payload.username?.trim().toLowerCase() || "";
  if (!/^[a-z0-9_.-]{4,40}$/.test(usernameValue)) return apiError("Use 4–40 letters, numbers, dots, underscores or hyphens for the username.");
  if (!payload.password || payload.password.length < 12) return apiError("Use an admin password of at least 12 characters.");
  const created = await getAuth().api.signUpEmail({ body: { email: `${usernameValue}@admin.motionmint.local`, name: usernameValue, password: payload.password, username: usernameValue } });
  await env.DB.prepare("UPDATE user SET role = 'admin' WHERE id = ?").bind(created.user.id).run();
  return Response.json({ created: true, username: usernameValue }, { status: 201 });
}
