import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { templates } from "../../../db/schema";
import { apiError, databaseError } from "../../../lib/backend";
import { canManageTemplates } from "../../../lib/admin-access";
import { starterTemplateConfigs } from "../../../lib/starter-templates";

async function seedStarterTemplates() {
  const now = new Date().toISOString();
  await getDb().insert(templates).values(starterTemplateConfigs.map((config) => ({ id: config.id, name: config.name, category: config.category, status: "published" as const, configJson: JSON.stringify(config), createdAt: now, updatedAt: now }))).onConflictDoNothing();
}

export async function GET(request: Request) {
  try {
    await seedStarterTemplates();
    const showAll = new URL(request.url).searchParams.get("scope") === "admin" && await canManageTemplates(request);
    const base = getDb().select().from(templates);
    const rows = showAll ? await base.orderBy(asc(templates.category), asc(templates.name)) : await base.where(eq(templates.status, "published")).orderBy(asc(templates.category), asc(templates.name));
    return Response.json({ templates: rows.map(({ configJson, ...row }) => ({ ...row, config: JSON.parse(configJson) })) });
  } catch (error) { return databaseError(error); }
}

export async function POST(request: Request) {
  if (!await canManageTemplates(request)) return apiError("Administrator sign-in is required.", 403);
  try {
    const payload = (await request.json()) as { id?: string; name?: string; category?: string; status?: "draft" | "published"; config?: Record<string, unknown> };
    const id = payload.id?.trim().toLowerCase();
    if (!id || !/^[a-z0-9-]{2,80}$/.test(id) || !payload.name?.trim() || !payload.category?.trim() || !payload.config) return apiError("id, name, category and config are required.");
    const now = new Date().toISOString();
    await getDb().insert(templates).values({ id, name: payload.name.trim().slice(0, 120), category: payload.category.trim().slice(0, 80), status: payload.status ?? "draft", configJson: JSON.stringify(payload.config), createdAt: now, updatedAt: now });
    return Response.json({ template: { id, status: payload.status ?? "draft" } }, { status: 201 });
  } catch (error) { return databaseError(error); }
}
