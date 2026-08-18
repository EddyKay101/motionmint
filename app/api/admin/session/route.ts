import { getAuth } from "../../../../lib/auth";

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  const role = (session?.user as { role?: string } | undefined)?.role;
  return Response.json({ authenticated: Boolean(session), admin: role === "admin", user: session?.user ? { id: session.user.id, name: session.user.name } : null });
}
