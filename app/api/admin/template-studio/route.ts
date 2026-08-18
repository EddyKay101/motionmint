import { canManageTemplates } from "../../../../lib/admin-access";
import { apiError } from "../../../../lib/backend";
import { generateTemplateConcepts, type TemplateStudioBrief } from "../../../../lib/template-studio";
import { generateOpenAITemplateConcepts } from "../../../../lib/openai-template-studio";
import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  if (!canManageTemplates(request)) return apiError("Template Studio is restricted to administrators.", 403);
  try {
    const brief = (await request.json()) as TemplateStudioBrief;
    const runtime = env as unknown as Record<string, unknown>;
    const apiKey = typeof runtime.OPENAI_API_KEY === "string" ? runtime.OPENAI_API_KEY.trim() : "";
    const model = typeof runtime.OPENAI_MODEL === "string" && runtime.OPENAI_MODEL.trim() ? runtime.OPENAI_MODEL.trim() : "gpt-5.6-luna";
    if (apiKey && !apiKey.includes("replace_with")) {
      const concepts = await generateOpenAITemplateConcepts(brief, apiKey, model);
      return Response.json({ provider: model, simulated: false, concepts, note: `Original drafts generated with ${model}. Review before publishing.` });
    }
    const concepts = generateTemplateConcepts(brief);
    return Response.json({
      provider: "local-design-engine",
      simulated: true,
      concepts,
      note: "OpenAI key is not configured, so these are procedural fallback drafts.",
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Could not generate template concepts.");
  }
}
