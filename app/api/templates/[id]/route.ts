import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { templates } from "../../../../db/schema";
import { apiError, databaseError } from "../../../../lib/backend";
import { canManageTemplates } from "../../../../lib/admin-access";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await canManageTemplates(request)) return apiError("Administrator sign-in is required.", 403);
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { name?: string; category?: string; status?: "draft" | "published" | "archived"; config?: Record<string, unknown> };
    const updates: Partial<typeof templates.$inferInsert> = { updatedAt: new Date().toISOString() };
    if (payload.name) updates.name = payload.name.trim().slice(0, 120);
    if (payload.category) updates.category = payload.category.trim().slice(0, 80);
    if (payload.status) updates.status = payload.status;
    if (payload.config) updates.configJson = JSON.stringify(payload.config);
    await getDb().update(templates).set(updates).where(eq(templates.id, id));
    return Response.json({ template: { id, ...updates, configJson: undefined } });
  } catch (error) { return databaseError(error); }
}
