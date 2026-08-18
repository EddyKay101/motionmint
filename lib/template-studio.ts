import type { TemplateConfig } from "./starter-templates";

export type TemplateStudioBrief = {
  prompt: string;
  category?: string;
  ratios?: TemplateConfig["ratios"];
  sceneCount?: number;
  mood?: string;
  useCase?: string;
};

export type TemplateStudioConcept = {
  id: string;
  rationale: string;
  confidence: number;
  template: TemplateConfig;
};

const palettes = [
  ["#09162a", "#e9bc67", "#fff9ec"],
  ["#f3eee4", "#e14e36", "#201d1a"],
  ["#22123d", "#69ddd0", "#fff4dc"],
  ["#101814", "#bfe95b", "#f8fff0"],
  ["#ee5d35", "#132b4b", "#fff8ed"],
  ["#dff7ff", "#3358ff", "#101a38"],
] as const;
const motifs = ["horizon", "paper", "glass", "kinetic", "product", "rings"];
const animations = ["rise", "slide", "reveal", "scale", "wipe", "orbit"];
const layouts = ["editorial-left", "centered-poster", "split-stage", "lower-third", "asymmetric-grid"] as const;
const typography = ["Editorial", "Display", "Geometric", "Humanist", "Monospace"] as const;

const hash = (value: string) => [...value].reduce((sum, character) => ((sum << 5) - sum + character.charCodeAt(0)) | 0, 0);
const titleCase = (value: string) => value.trim().replace(/\s+/g, " ").split(" ").slice(0, 6).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 58);
const contains = (source: string, words: string[]) => words.some((word) => source.includes(word));

function inferCategory(prompt: string, requested?: string) {
  if (requested?.trim()) return requested.trim();
  const text = prompt.toLowerCase();
  if (contains(text, ["sale", "business", "product", "launch", "financial", "corporate"])) return "Business";
  if (contains(text, ["event", "conference", "concert", "announcement", "wedding"])) return "Events";
  if (contains(text, ["wellness", "calm", "mindful", "health"])) return "Wellness";
  if (contains(text, ["music", "lyric", "album", "song"])) return "Music";
  if (contains(text, ["islam", "ramadan", "eid", "quran"])) return "Islamic";
  if (contains(text, ["church", "christian", "gospel", "sunday"])) return "Christian";
  if (contains(text, ["charity", "community", "fundrais"])) return "Community";
  return "Custom";
}

function suggestedCopy(category: string, prompt: string, count: number) {
  const subject = titleCase(prompt.replace(/\b(create|design|template|animated|premium|modern|elegant|with|using|use|colours?|colors?|movement|typography|cinematic|hopeful|warm|and|an|a|the)\b/gi, " ").trim()) || `${category} Story`;
  const sets: Record<string, string[]> = {
    Business: [subject, "Designed for what comes next", "Discover the difference"],
    Events: [subject, "A moment worth showing up for", "Save the date"],
    Wellness: [subject, "Make space for what matters", "Begin gently"],
    Music: [subject, "Turn the feeling all the way up", "Listen now"],
    Islamic: [subject, "A moment for reflection", "Carry the light forward"],
    Christian: [subject, "Come together in hope", "Everyone is welcome"],
    Community: [subject, "Small actions create lasting change", "Join the movement"],
    Custom: [subject, "Make the message memorable", "Your next chapter starts here"],
  };
  return Array.from({ length: count }, (_, index) => ({ primary: (sets[category] || sets.Custom)[index % 3], secondary: index === count - 1 ? "Learn more" : "", duration: 5 }));
}

export function generateTemplateConcepts(brief: TemplateStudioBrief): TemplateStudioConcept[] {
  const prompt = brief.prompt.trim().slice(0, 2000);
  if (prompt.length < 12) throw new Error("Describe the template in at least 12 characters.");
  const category = inferCategory(prompt, brief.category);
  const seed = Math.abs(hash(`${prompt}|${brief.mood}|${brief.useCase}`));
  const ratios = brief.ratios?.length ? brief.ratios : ["9:16", "1:1", "16:9"];
  const sceneCount = Math.max(1, Math.min(6, brief.sceneCount || 3));
  const promptLower = prompt.toLowerCase();
  const mood = brief.mood?.trim() || (contains(promptLower, ["luxury", "premium", "elegant"]) ? "Refined" : contains(promptLower, ["bold", "energy", "youth"]) ? "Energetic" : "Contemporary");

  return Array.from({ length: 3 }, (_, conceptIndex) => {
    const paletteIndex = (seed + conceptIndex * 2) % palettes.length;
    const systemIndex = (seed + conceptIndex * 2) % motifs.length;
    const names = ["Editorial Signal", "Kinetic Focus", "Atmospheric Story"];
    const name = `${mood} ${names[conceptIndex]}`;
    const scenes = suggestedCopy(category, prompt, sceneCount);
    const template: TemplateConfig = {
      id: `${slugify(name)}-${String(seed).slice(-4)}-${conceptIndex + 1}`,
      name,
      category,
      description: `${mood} ${category.toLowerCase()} template generated from the admin creative brief. Concept ${conceptIndex + 1} emphasises ${["typographic hierarchy", "graphic movement", "cinematic atmosphere"][conceptIndex]}.`,
      ratios,
      duration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
      motif: motifs[systemIndex],
      animation: animations[(seed + conceptIndex) % animations.length],
      layout: layouts[(seed + conceptIndex) % layouts.length],
      typography: typography[(seed + conceptIndex * 2) % typography.length],
      colors: [...palettes[paletteIndex]],
      scenes,
      useCases: [brief.useCase || "Social posts", "Creator templates"].filter((value, index, all) => all.indexOf(value) === index),
      defaultProfileId: brief.useCase === "Display advertising" ? "display-advertising" : "social-posts",
      brandDefaults: { required: category === "Business", position: conceptIndex === 1 ? "top-left" : "top-right", width: conceptIndex === 2 ? 14 : 18, animation: conceptIndex === 1 ? "slide" : "fade" },
    };
    return {
      id: `concept-${seed}-${conceptIndex + 1}`,
      rationale: `${names[conceptIndex]} uses a ${template.layout} composition, ${template.typography} typography and ${template.motif} geometry with a ${template.animation} entrance.`,
      confidence: 0.86 - conceptIndex * 0.03,
      template,
    };
  });
}
