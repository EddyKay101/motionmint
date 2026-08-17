import { getDb } from "../../../db";
import { templates } from "../../../db/schema";

export async function GET() {
  try {
    await getDb().select({ id: templates.id }).from(templates).limit(1);
    return Response.json({ status: "ok", database: "connected", mediaStorage: "local-only", renderer: "queue-only" });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable", mediaStorage: "local-only", renderer: "queue-only" }, { status: 503 });
  }
}
