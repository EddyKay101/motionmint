import { canManageTemplates } from "../../../../lib/admin-access";
import { apiError } from "../../../../lib/backend";
import {
  generateEmailConcepts,
  type EmailStudioBrief,
} from "../../../../lib/email-studio";
import { generateOpenAIEmailConcepts } from "../../../../lib/openai-email-studio";
import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  if (!(await canManageTemplates(request)))
    return apiError("Email Studio is restricted to administrators.", 403);
  try {
    const brief = (await request.json()) as EmailStudioBrief;
    const runtime = env as unknown as Record<string, unknown>;
    const apiKey =
      typeof runtime.OPENAI_API_KEY === "string"
        ? runtime.OPENAI_API_KEY.trim()
        : "";
    const model =
      typeof runtime.OPENAI_MODEL === "string" && runtime.OPENAI_MODEL.trim()
        ? runtime.OPENAI_MODEL.trim()
        : "gpt-5.6-luna";
    if (apiKey && !apiKey.includes("replace_with")) {
      const concepts = await generateOpenAIEmailConcepts(brief, apiKey, model);
      return Response.json({
        provider: model,
        simulated: false,
        concepts,
        note: `Original drafts generated with ${model}. Review before sending.`,
      });
    }
    const concepts = generateEmailConcepts(brief);
    return Response.json({
      provider: "local-copy-engine",
      simulated: true,
      concepts,
      note: "OpenAI key is not configured, so these are procedural fallback drafts.",
    });
  } catch (error) {
    return apiError(
      error instanceof Error
        ? error.message
        : "Could not generate email concepts.",
    );
  }
}
