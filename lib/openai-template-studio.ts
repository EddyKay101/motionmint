import type { TemplateConfig } from "./starter-templates";
import type { TemplateStudioBrief, TemplateStudioConcept } from "./template-studio";

const typography = ["Editorial", "Modern", "Classic", "Display", "Humanist", "Geometric", "Monospace", "Arabic Editorial"] as const;
const motifs = ["horizon", "paper", "glass", "kinetic", "product", "rings"] as const;
const animations = ["rise", "slide", "reveal", "scale", "wipe", "orbit"] as const;
const layouts = ["editorial-left", "centered-poster", "split-stage", "lower-third", "asymmetric-grid"] as const;
const ratios = ["9:16", "1:1", "16:9"] as const;

const stringEnum = (values: readonly string[]) => ({ type: "string", enum: values });
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["concepts"],
  properties: {
    concepts: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        required: ["name", "category", "description", "rationale", "colors", "typography", "motif", "animation", "layout", "design", "scenes"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 70 },
          category: { type: "string", minLength: 2, maxLength: 40 },
          description: { type: "string", minLength: 20, maxLength: 260 },
          rationale: { type: "string", minLength: 20, maxLength: 320 },
          colors: { type: "array", minItems: 3, maxItems: 3, items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" } },
          typography: stringEnum(typography), motif: stringEnum(motifs), animation: stringEnum(animations), layout: stringEnum(layouts),
          design: {
            type: "object", additionalProperties: false,
            required: ["contentX", "contentY", "contentWidth", "textAlign", "headlineScale", "secondaryScale", "decorations"],
            properties: {
              contentX: { type: "number", minimum: 6, maximum: 55 }, contentY: { type: "number", minimum: 22, maximum: 78 },
              contentWidth: { type: "number", minimum: 34, maximum: 88 }, textAlign: stringEnum(["left", "center", "right"]),
              headlineScale: { type: "number", minimum: 0.65, maximum: 1.2 }, secondaryScale: { type: "number", minimum: 0.7, maximum: 1.15 },
              decorations: {
                type: "array", minItems: 2, maxItems: 6,
                items: {
                  type: "object", additionalProperties: false,
                  required: ["type", "x", "y", "width", "height", "rotation", "opacity", "radius", "color", "animation"],
                  properties: {
                    type: stringEnum(["circle", "rectangle", "line"]), x: { type: "number", minimum: -10, maximum: 100 }, y: { type: "number", minimum: -10, maximum: 100 },
                    width: { type: "number", minimum: 2, maximum: 90 }, height: { type: "number", minimum: 0.3, maximum: 70 }, rotation: { type: "number", minimum: -180, maximum: 180 },
                    opacity: { type: "number", minimum: 0.08, maximum: 0.9 }, radius: { type: "number", minimum: 0, maximum: 50 },
                    color: stringEnum(["base", "accent", "text"]), animation: stringEnum(["float", "spin", "pulse", "drift", "none"]),
                  },
                },
              },
            },
          },
          scenes: {
            type: "array", minItems: 1, maxItems: 6,
            items: { type: "object", additionalProperties: false, required: ["primary", "secondary", "duration"], properties: {
              primary: { type: "string", minLength: 1, maxLength: 90 }, secondary: { type: "string", maxLength: 110 }, duration: { type: "number", minimum: 3, maximum: 15 },
            } },
          },
        },
      },
    },
  },
} as const;

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function outputText(response: unknown) {
  const data = response as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (data.output_text) return data.output_text;
  return data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
}

export async function generateOpenAITemplateConcepts(brief: TemplateStudioBrief, apiKey: string, model: string): Promise<TemplateStudioConcept[]> {
  const prompt = brief.prompt?.trim().slice(0, 3000);
  if (!prompt || prompt.length < 12) throw new Error("Describe the template in at least 12 characters.");
  const requestedRatios = brief.ratios?.filter((ratio) => ratios.includes(ratio)) || ["9:16"];
  const sceneCount = clamp(Number(brief.sceneCount) || 3, 1, 6);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      instructions: "You are Turnbine's senior motion-design director. Invent three original commercial template systems from a blank canvas. Do not refer to, imitate, remix, or name any existing Turnbine template, brand, artist, or copyrighted campaign. The three concepts must be materially different in composition, geometry, palette, type system, and motion—not recolours. Design mobile-first for 9:16, keep whole words readable, maintain strong contrast and safe margins, support RTL copy, and use only the supplied schema. Decorations are responsive percentage-based layers and must support the composition rather than obscure copy. Return production-ready concise copy. Do not output HTML, JavaScript, URLs, or markdown.",
      input: `Creative brief: ${prompt}\nRequested category: ${brief.category || "infer without religious assumptions"}\nMood: ${brief.mood || "open"}\nUse case: ${brief.useCase || "social content"}\nExact scene count per concept: ${sceneCount}\nSupported ratios: ${requestedRatios.join(", ")}.`,
      text: { format: { type: "json_schema", name: "turnbine_original_templates", strict: true, schema } },
      max_output_tokens: 7000,
    }),
  });
  const payload = await response.json() as { error?: { message?: string }; [key: string]: unknown };
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI request failed (${response.status}).`);
  const text = outputText(payload);
  if (!text) throw new Error("The model returned no template data.");
  const parsed = JSON.parse(text) as { concepts: Array<Omit<TemplateStudioConcept, "id" | "confidence" | "template"> & { colors: string[]; typography: TemplateConfig["typography"]; motif: string; animation: string; layout: TemplateConfig["layout"]; design: NonNullable<TemplateConfig["design"]>; scenes: TemplateConfig["scenes"]; category: string; name: string; description: string }> };
  const stamp = Date.now().toString(36);
  return parsed.concepts.slice(0, 3).map((item, index) => {
    const scenes = item.scenes.slice(0, sceneCount);
    const safeWidth = Math.min(item.design.contentWidth, 94 - item.design.contentX);
    const template: TemplateConfig = {
      id: `${slugify(item.name) || "original-template"}-${stamp}-${index + 1}`,
      name: item.name, category: brief.category?.trim() || item.category, description: item.description,
      ratios: requestedRatios, duration: scenes.reduce((sum, scene) => sum + scene.duration, 0), motif: item.motif, animation: item.animation,
      layout: item.layout, typography: item.typography, colors: item.colors as TemplateConfig["colors"], scenes,
      design: { ...item.design, contentWidth: Math.max(34, safeWidth) },
      useCases: [brief.useCase || "Creator templates"], defaultProfileId: brief.useCase === "Display advertising" ? "display-advertising" : "social-posts",
      brandDefaults: { required: item.category === "Business", position: "top-right", width: 16, animation: "fade" },
    };
    return { id: `ai-${stamp}-${index + 1}`, rationale: item.rationale, confidence: 0.9, template };
  });
}
