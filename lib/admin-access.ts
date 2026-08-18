import { getAuth } from "./auth";

export async function canManageTemplates(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}
