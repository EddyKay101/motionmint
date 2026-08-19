import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { emailCampaigns, emailSends } from "../../../../../../db/schema";
import { apiError, databaseError } from "../../../../../../lib/backend";
import { canManageTemplates } from "../../../../../../lib/admin-access";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await canManageTemplates(request)))
    return apiError("Administrator sign-in is required.", 403);
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { recipients?: string[] };
    const recipients = [
      ...new Set(
        (payload.recipients || []).map((email) => email.trim().toLowerCase()),
      ),
    ].filter((email) => EMAIL_PATTERN.test(email));
    if (!recipients.length)
      return apiError("At least one valid recipient email is required.");
    const db = getDb();
    const [campaign] = await db
      .select({ id: emailCampaigns.id })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id))
      .limit(1);
    if (!campaign) return apiError("Campaign not found.", 404);
    const now = new Date().toISOString();
    await db.insert(emailSends).values(
      recipients.map((recipient) => ({
        id: crypto.randomUUID(),
        campaignId: id,
        recipient,
        status: "queued" as const,
        createdAt: now,
        updatedAt: now,
      })),
    );
    await db
      .update(emailCampaigns)
      .set({ status: "scheduled", updatedAt: now })
      .where(eq(emailCampaigns.id, id));
    return Response.json({ queued: recipients.length }, { status: 202 });
  } catch (error) {
    return databaseError(error);
  }
}
