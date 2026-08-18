import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { projects } from "../../../../db/schema";
import { apiError, databaseError, ownerKeyFrom } from "../../../../lib/backend";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const ownerKey = await ownerKeyFrom(request);
  if (!ownerKey) return apiError("A valid device owner key is required.", 401);
  try {
    const { id } = await context.params;
    const [row] = await getDb().select().from(projects).where(and(eq(projects.id, id), eq(projects.ownerKey, ownerKey))).limit(1);
    if (!row) return apiError("Project not found.", 404);
    return Response.json({ project: JSON.parse(row.projectJson), updatedAt: row.updatedAt });
  } catch (error) { return databaseError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const ownerKey = await ownerKeyFrom(request);
  if (!ownerKey) return apiError("A valid device owner key is required.", 401);
  try {
    const { id } = await context.params;
    await getDb().delete(projects).where(and(eq(projects.id, id), eq(projects.ownerKey, ownerKey)));
    return new Response(null, { status: 204 });
  } catch (error) { return databaseError(error); }
}
