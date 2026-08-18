import { authConfiguration } from "../../../../lib/auth";

export const dynamic = "force-dynamic";
export async function GET() { return Response.json(authConfiguration()); }
