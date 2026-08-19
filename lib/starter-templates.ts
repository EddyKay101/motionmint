export type TemplateConfig = {
  id: string;
  name: string;
  category: string;
  description: string;
  ratios: Array<"9:16" | "1:1" | "16:9">;
  duration: number;
  motif: string;
  animation: string;
  colors: [string, string, string];
  layout?:
    | "editorial-left"
    | "centered-poster"
    | "split-stage"
    | "lower-third"
    | "asymmetric-grid";
  typography?:
    | "Editorial"
    | "Modern"
    | "Classic"
    | "Display"
    | "Humanist"
    | "Geometric"
    | "Monospace"
    | "Arabic Editorial";
  design?: {
    contentX: number;
    contentY: number;
    contentWidth: number;
    textAlign: "left" | "center" | "right";
    headlineScale: number;
    secondaryScale: number;
    decorations: Array<{
      type: "circle" | "rectangle" | "line";
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      opacity: number;
      radius: number;
      color: "base" | "accent" | "text";
      animation: "float" | "spin" | "pulse" | "drift" | "none";
    }>;
  };
  scenes: Array<{ primary: string; secondary: string; duration: number }>;
  useCases?: string[];
  defaultProfileId?: string;
  brandDefaults?: {
    required?: boolean;
    position?: string;
    width?: number;
    animation?: string;
  };
  hideNameAndCategory?: boolean;
  hideSceneIndex?: boolean;
};

export const starterTemplateConfigs: TemplateConfig[] = [
  {
    id: "hope",
    name: "Hope after hardship",
    category: "Islamic",
    description: "Quiet light, generous type and contemplative pacing.",
    ratios: ["9:16", "1:1", "16:9"],
    duration: 18,
    motif: "horizon",
    animation: "rise",
    colors: ["#101714", "#d9b96e", "#f7f2e7"],
    scenes: [
      {
        primary: "The night can feel endless.",
        secondary: "قد يبدو الليل بلا نهاية",
        duration: 6,
      },
      {
        primary: "But hardship is not the whole story.",
        secondary: "لكن العسر ليس نهاية القصة",
        duration: 6,
      },
      { primary: "Light will come.", secondary: "سيأتي النور", duration: 6 },
    ],
  },
  {
    id: "weekly",
    name: "Weekly reflection",
    category: "Wellness",
    description: "Editorial cards with a gentle page-turn rhythm.",
    ratios: ["9:16", "1:1"],
    duration: 15,
    motif: "paper",
    animation: "slide",
    colors: ["#eee7da", "#c75b39", "#29231f"],
    scenes: [
      { primary: "Pause before the week begins.", secondary: "", duration: 5 },
      { primary: "What deserves your attention?", secondary: "", duration: 5 },
      { primary: "Choose with intention.", secondary: "", duration: 5 },
    ],
  },
  {
    id: "faith",
    name: "Faith-based announcement",
    category: "Christian",
    description: "Stained-light geometry with a clear event hierarchy.",
    ratios: ["9:16", "1:1", "16:9"],
    duration: 12,
    motif: "glass",
    animation: "reveal",
    colors: ["#221b38", "#ef9d6d", "#fff8ec"],
    scenes: [
      {
        primary: "Community Sunday",
        secondary: "All are welcome",
        duration: 6,
      },
      {
        primary: "10:30 AM · Main Hall",
        secondary: "Come as you are",
        duration: 6,
      },
    ],
  },
  {
    id: "motivation",
    name: "Motivational quote",
    category: "Motivational",
    description: "Bold kinetic framing built around one decisive line.",
    ratios: ["9:16", "1:1"],
    duration: 10,
    motif: "kinetic",
    animation: "scale",
    colors: ["#e8ff3d", "#121212", "#121212"],
    scenes: [
      {
        primary: "Start before you feel ready.",
        secondary: "Progress creates momentum.",
        duration: 10,
      },
    ],
  },
  {
    id: "business",
    name: "Business promotion",
    category: "Business",
    description: "Product spotlight, offer block and crisp call to action.",
    ratios: ["9:16", "1:1", "16:9"],
    duration: 12,
    motif: "product",
    animation: "wipe",
    colors: ["#e8572a", "#152a45", "#fff7ef"],
    scenes: [
      {
        primary: "A better daily essential.",
        secondary: "Made for real life.",
        duration: 6,
      },
      {
        primary: "Launch offer · 20% off",
        secondary: "Shop the collection",
        duration: 6,
      },
    ],
  },
  {
    id: "event",
    name: "Event announcement",
    category: "Events",
    description: "Poster-inspired countdown with energetic rings.",
    ratios: ["9:16", "1:1", "16:9"],
    duration: 15,
    motif: "rings",
    animation: "orbit",
    colors: ["#29124d", "#ff4f93", "#fff5d8"],
    scenes: [
      {
        primary: "Summer Social",
        secondary: "Music · Food · Community",
        duration: 5,
      },
      { primary: "Saturday · 6 PM", secondary: "Riverside Hall", duration: 5 },
      {
        primary: "Save your place",
        secondary: "Doors open at 5:30",
        duration: 5,
      },
    ],
  },
];
