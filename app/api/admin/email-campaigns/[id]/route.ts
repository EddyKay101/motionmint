import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { emailCampaigns } from "../../../../../db/schema";
import { apiError, databaseError } from "../../../../../lib/backend";
import { canManageTemplates } from "../../../../../lib/admin-access";
import {
  compileCampaignHtml,
  type EmailCampaignConfig,
} from "../../../../../lib/email-builder";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await canManageTemplates(request)))
    return apiError("Administrator sign-in is required.", 403);
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      name?: string;
      subject?: string;
      preheader?: string;
      status?: "draft" | "published" | "scheduled" | "sending" | "sent" | "archived";
      config?: EmailCampaignConfig;
    };
    const updates: Partial<typeof emailCampaigns.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };
    if (payload.name) updates.name = payload.name.trim().slice(0, 120);
    if (payload.subject) updates.subject = payload.subject.trim().slice(0, 200);
    if (payload.preheader !== undefined)
      updates.preheader = payload.preheader?.trim().slice(0, 200) || null;
    if (payload.status) updates.status = payload.status;
    if (payload.config) {
      const { html, errors } = compileCampaignHtml(payload.config);
      if (errors.length) return apiError(`Email validation error: ${errors[0]}`);
      updates.configJson = JSON.stringify(payload.config);
      updates.htmlCache = html;
    }
    await getDb()
      .update(emailCampaigns)
      .set(updates)
      .where(eq(emailCampaigns.id, id));
    return Response.json({
      campaign: { id, ...updates, configJson: undefined, htmlCache: undefined },
    });
  } catch (error) {
    return databaseError(error);
  }
}
