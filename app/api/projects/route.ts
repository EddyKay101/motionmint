import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";
import { apiError, databaseError, isProjectPayload, ownerKeyFrom } from "../../../lib/backend";

export async function GET(request: Request) {
  const ownerKey = ownerKeyFrom(request);
  if (!ownerKey) return apiError("A valid device owner key is required.", 401);
  try {
    const rows = await getDb().select({ id: projects.id, title: projects.title, templateId: projects.templateId, projectJson: projects.projectJson, updatedAt: projects.updatedAt }).from(projects).where(eq(projects.ownerKey, ownerKey)).orderBy(desc(projects.updatedAt)).limit(50);
    return Response.json({ projects: rows.map(({ projectJson, ...row }) => ({ ...row, project: JSON.parse(projectJson) })) });
  } catch (error) { return databaseError(error); }
}

export async function PUT(request: Request) {
  const ownerKey = ownerKeyFrom(request);
  if (!ownerKey) return apiError("A valid device owner key is required.", 401);
  try {
    const project = await request.json();
    if (!isProjectPayload(project)) return apiError("Invalid project data.");
    const now = new Date().toISOString();
    const db = getDb();
    await db.insert(projects).values({ id: project.id as string, ownerKey, title: (project.title as string).slice(0, 160), templateId: project.templateId as string, projectJson: JSON.stringify(project), createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: projects.id, set: { title: (project.title as string).slice(0, 160), templateId: project.templateId as string, projectJson: JSON.stringify(project), updatedAt: now }, setWhere: eq(projects.ownerKey, ownerKey) });
    return Response.json({ projectId: project.id, updatedAt: now });
  } catch (error) { return databaseError(error); }
}
