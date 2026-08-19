import type { EmailBlock, EmailCampaignConfig } from "./email-builder";

export type EmailStudioBrief = {
  prompt: string;
  tone?: string;
  goal?: string;
};

export type EmailStudioConcept = {
  id: string;
  rationale: string;
  confidence: number;
  name: string;
  subject: string;
  preheader: string;
  config: EmailCampaignConfig;
};

const accents = ["#6d5bff", "#2fe6ac", "#ff6b6a", "#4b39c7", "#e14e36"];
const hash = (value: string) =>
  [...value].reduce((sum, character) => ((sum << 5) - sum + character.charCodeAt(0)) | 0, 0);
const titleCase = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const contains = (source: string, words: string[]) => words.some((word) => source.includes(word));

function inferGoal(prompt: string, requested?: string) {
  if (requested?.trim()) return requested.trim();
  const text = prompt.toLowerCase();
  if (contains(text, ["launch", "new feature", "release"])) return "Announce a launch";
  if (contains(text, ["sale", "discount", "offer", "promo"])) return "Drive a promotion";
  if (contains(text, ["event", "webinar", "workshop"])) return "Invite to an event";
  if (contains(text, ["newsletter", "update", "digest"])) return "Share an update";
  return "Re-engage the audience";
}

const openers: Record<string, string[]> = {
  "Announce a launch": ["It's here.", "Meet what's new.", "The wait is over."],
  "Drive a promotion": ["Don't miss this.", "A deal worth opening.", "Limited time, real value."],
  "Invite to an event": ["Save your seat.", "Join us live.", "You're invited."],
  "Share an update": ["Here's what's new.", "A quick update for you.", "Catch up in two minutes."],
  "Re-engage the audience": ["We've missed you.", "Something worth coming back for.", "Pick up where you left off."],
};

function buildConcept(prompt: string, goal: string, tone: string, seed: number, index: number): EmailStudioConcept {
  const subjectBase = titleCase(prompt.replace(/\b(write|create|draft|email|campaign|about|for|the|and|an|a)\b/gi, " ").trim()) || goal;
  const openerSet = openers[goal] || openers["Re-engage the audience"];
  const accent = accents[(seed + index) % accents.length];
  const blocks: EmailBlock[] = [
    { type: "heading", text: openerSet[index % openerSet.length] },
    { type: "paragraph", text: `${subjectBase}. Crafted with ${tone.toLowerCase()} tone to match your brand voice.` },
    { type: "divider" },
    { type: "paragraph", text: "Tell your audience why this matters right now and what happens when they click through." },
    { type: "button", label: "Take a look", href: "https://example.com" },
  ];
  const config: EmailCampaignConfig = {
    brandName: "MotionMint",
    accent,
    backgroundColor: "#f7f5fb",
    textColor: "#14121d",
    footerText: "You're receiving this email because you opted in to MotionMint updates.",
    blocks,
  };
  return {
    id: `email-concept-${seed}-${index + 1}`,
    rationale: `${tone} tone email built around "${goal.toLowerCase()}" with a ${index === 0 ? "direct" : index === 1 ? "story-led" : "benefit-led"} opening line.`,
    confidence: 0.82 - index * 0.03,
    name: `${goal} · Concept ${index + 1}`,
    subject: subjectBase,
    preheader: `${openerSet[index % openerSet.length]} ${subjectBase}`.slice(0, 90),
    config,
  };
}

export function generateEmailConcepts(brief: EmailStudioBrief): EmailStudioConcept[] {
  const prompt = brief.prompt.trim().slice(0, 2000);
  if (prompt.length < 12) throw new Error("Describe the email campaign in at least 12 characters.");
  const goal = inferGoal(prompt.toLowerCase(), brief.goal);
  const tone = brief.tone?.trim() || "Confident";
  const seed = Math.abs(hash(`${prompt}|${goal}|${tone}`));
  return Array.from({ length: 3 }, (_, index) => buildConcept(prompt, goal, tone, seed, index));
}
