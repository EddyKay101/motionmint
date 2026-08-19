import { asc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { emailCampaigns } from "../../../../db/schema";
import { apiError, databaseError } from "../../../../lib/backend";
import { canManageTemplates } from "../../../../lib/admin-access";
import {
  compileCampaignHtml,
  type EmailCampaignConfig,
} from "../../../../lib/email-builder";

export async function GET(request: Request) {
  if (!(await canManageTemplates(request)))
    return apiError("Administrator sign-in is required.", 403);
  try {
    const rows = await getDb()
      .select()
      .from(emailCampaigns)
      .orderBy(asc(emailCampaigns.name));
    return Response.json({
      campaigns: rows.map(({ configJson, htmlCache, ...row }) => ({
        ...row,
        config: JSON.parse(configJson),
      })),
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  if (!(await canManageTemplates(request)))
    return apiError("Administrator sign-in is required.", 403);
  try {
    const payload = (await request.json()) as {
      name?: string;
      subject?: string;
      preheader?: string;
      config?: EmailCampaignConfig;
    };
    if (!payload.name?.trim() || !payload.subject?.trim() || !payload.config) {
      return apiError("name, subject and config are required.");
    }
    const { html, errors } = compileCampaignHtml(payload.config);
    if (errors.length) return apiError(`MJML compile error: ${errors[0]}`);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await getDb()
      .insert(emailCampaigns)
      .values({
        id,
        name: payload.name.trim().slice(0, 120),
        subject: payload.subject.trim().slice(0, 200),
        preheader: payload.preheader?.trim().slice(0, 200) || null,
        status: "draft",
        configJson: JSON.stringify(payload.config),
        htmlCache: html,
        createdAt: now,
        updatedAt: now,
      });
    return Response.json(
      { campaign: { id, status: "draft" } },
      { status: 201 },
    );
  } catch (error) {
    return databaseError(error);
  }
}
