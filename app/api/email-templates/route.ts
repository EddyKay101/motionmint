import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { emailCampaigns } from "../../../db/schema";
import { databaseError } from "../../../lib/backend";

export async function GET() {
  try {
    const rows = await getDb()
      .select({
        id: emailCampaigns.id,
        name: emailCampaigns.name,
        subject: emailCampaigns.subject,
        preheader: emailCampaigns.preheader,
        configJson: emailCampaigns.configJson,
        updatedAt: emailCampaigns.updatedAt,
      })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.status, "published"))
      .orderBy(asc(emailCampaigns.name));
    return Response.json({
      templates: rows.map(({ configJson, ...row }) => ({
        ...row,
        config: JSON.parse(configJson),
      })),
    });
  } catch (error) {
    return databaseError(error);
  }
}
