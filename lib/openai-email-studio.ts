import type { EmailBlock, EmailCampaignConfig } from "./email-builder";
import type { EmailStudioBrief, EmailStudioConcept } from "./email-studio";

const blockSchema = {
  type: "object",
  additionalProperties: false,
  required: ["type", "text", "label", "href"],
  properties: {
    type: { type: "string", enum: ["heading", "paragraph", "button", "divider", "spacer"] },
    text: { type: "string", maxLength: 400 },
    label: { type: "string", maxLength: 40 },
    href: { type: "string", maxLength: 300 },
  },
} as const;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["concepts"],
  properties: {
    concepts: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "subject", "preheader", "rationale", "accent", "blocks"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 70 },
          subject: { type: "string", minLength: 5, maxLength: 90 },
          preheader: { type: "string", minLength: 5, maxLength: 100 },
          rationale: { type: "string", minLength: 20, maxLength: 300 },
          accent: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
          blocks: { type: "array", minItems: 3, maxItems: 8, items: blockSchema },
        },
      },
    },
  },
} as const;

function outputText(response: unknown) {
  const data = response as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (data.output_text) return data.output_text;
  return data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
}

export async function generateOpenAIEmailConcepts(
  brief: EmailStudioBrief,
  apiKey: string,
  model: string,
): Promise<EmailStudioConcept[]> {
  const prompt = brief.prompt?.trim().slice(0, 3000);
  if (!prompt || prompt.length < 12) throw new Error("Describe the email campaign in at least 12 characters.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      instructions:
        "You are MotionMint's senior lifecycle email copywriter. Draft three original marketing email concepts from a blank canvas. Do not reuse or imitate any specific existing brand's email. Each concept must have a distinct opening line, structure and call to action. Use only heading, paragraph, button, divider and spacer block types (no images, no raw HTML/markdown). Button href must be a real-looking placeholder URL like https://example.com/action. Keep copy concise and skimmable.",
      input: `Creative brief: ${prompt}\nTone: ${brief.tone || "confident and clear"}\nGoal: ${brief.goal || "infer from the brief"}`,
      text: { format: { type: "json_schema", name: "motionmint_email_concepts", strict: true, schema } },
      max_output_tokens: 4000,
    }),
  });
  const payload = (await response.json()) as { error?: { message?: string }; [key: string]: unknown };
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI request failed (${response.status}).`);
  const text = outputText(payload);
  if (!text) throw new Error("The model returned no email data.");
  const parsed = JSON.parse(text) as {
    concepts: Array<{ name: string; subject: string; preheader: string; rationale: string; accent: string; blocks: Array<{ type: EmailBlock["type"]; text?: string; label?: string; href?: string }> }>;
  };
  const stamp = Date.now().toString(36);
  return parsed.concepts.slice(0, 3).map((item, index) => {
    const blocks: EmailBlock[] = item.blocks.map((block) => {
      switch (block.type) {
        case "heading":
          return { type: "heading", text: block.text || "" };
        case "paragraph":
          return { type: "paragraph", text: block.text || "" };
        case "button":
          return { type: "button", label: block.label || "Learn more", href: block.href || "https://example.com" };
        case "divider":
          return { type: "divider" };
        case "spacer":
          return { type: "spacer" };
        default:
          return { type: "paragraph", text: block.text || "" };
      }
    });
    const config: EmailCampaignConfig = {
      brandName: "MotionMint",
      accent: item.accent,
      backgroundColor: "#f7f5fb",
      textColor: "#14121d",
      footerText: "You're receiving this email because you opted in to MotionMint updates.",
      blocks,
    };
    return {
      id: `ai-email-${stamp}-${index + 1}`,
      rationale: item.rationale,
      confidence: 0.9,
      name: item.name,
      subject: item.subject,
      preheader: item.preheader,
      config,
    };
  });
}
