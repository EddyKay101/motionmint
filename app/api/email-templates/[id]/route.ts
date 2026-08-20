import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { emailCampaigns } from "../../../../db/schema";
import { apiError, databaseError } from "../../../../lib/backend";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const [row] = await getDb()
      .select({
        id: emailCampaigns.id,
        name: emailCampaigns.name,
        subject: emailCampaigns.subject,
        preheader: emailCampaigns.preheader,
        configJson: emailCampaigns.configJson,
        updatedAt: emailCampaigns.updatedAt,
      })
      .from(emailCampaigns)
      .where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.status, "published")))
      .limit(1);
    if (!row) return apiError("Email template not found.", 404);
    const { configJson, ...template } = row;
    return Response.json({ template: { ...template, config: JSON.parse(configJson) } });
  } catch (error) {
    return databaseError(error);
  }
}
