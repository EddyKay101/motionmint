"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";

type Ratio = "9:16" | "1:1" | "16:9";
type MotionPreset =
  "horizon" | "shapes" | "momentum" | "time" | "cascade" | "footage";
type AtmospherePreset = "none" | "dust" | "stars" | "rain" | "aurora";
type Scene = {
  id: string;
  primary: string;
  secondary: string;
  duration: number;
};
type Project = {
  schemaVersion: 1;
  id: string;
  title: string;
  templateId: string;
  category: string;
  ratio: Ratio;
  scenes: Scene[];
  theme: {
    accent: string;
    text: string;
    base?: string;
    overlay: number;
    font: string;
    atmosphere?: AtmospherePreset;
    atmosphereIntensity?: number;
    atmosphereColor?: string;
    motionPreset?: MotionPreset;
  };
  media: { underlayName?: string; soundtrackName?: string };
  updatedAt: string;
};
type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  ratios: Ratio[];
  duration: number;
  motif: string;
  animation: string;
  colors: [string, string, string];
  scenes: Omit<Scene, "id">[];
};

const starterTemplates: Template[] = [
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
const categories = [
  "All",
  "Islamic",
  "Christian",
  "Motivational",
  "Wellness",
  "Music",
  "Business",
  "Events",
  "Community",
  "Custom",
];
const storageKey = "motionmint.project.v1";
const ownerStorageKey = "motionmint.owner.v1";
const getOwnerKey = () => {
  let key = localStorage.getItem(ownerStorageKey);
  if (!key) {
    key = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    localStorage.setItem(ownerStorageKey, key);
  }
  return key;
};
const restoreProject = () => {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try { return JSON.parse(raw) as Project; } catch { /* use a clean project */ }
    }
  }
  return makeProject(starterTemplates[0]);
};
const motionPresets: Array<{ id: MotionPreset; name: string; note: string }> = [
  {
    id: "horizon",
    name: "Rising Horizon",
    note: "Masked copy with a slow cinematic lift",
  },
  {
    id: "shapes",
    name: "Shape Story",
    note: "Geometry morphs continuously between scenes",
  },
  {
    id: "momentum",
    name: "Global Momentum",
    note: "Sliding copy and a constructed end frame",
  },
  {
    id: "time",
    name: "Time & Value",
    note: "Ticker motion and character-style flips",
  },
  {
    id: "cascade",
    name: "Colour Cascade",
    note: "Layered bars sweep through the composition",
  },
  {
    id: "footage",
    name: "Footage Narrative",
    note: "Quiet editorial fades over moving media",
  },
];
const typographyPresets = {
  Editorial: {
    font: 'Georgia, "Times New Roman", serif',
    weight: 500,
    tracking: "-0.035em",
  },
  Modern: {
    font: "Arial, Helvetica, sans-serif",
    weight: 700,
    tracking: "-0.045em",
  },
  Classic: {
    font: 'Baskerville, "Baskerville Old Face", Georgia, serif',
    weight: 400,
    tracking: "-0.02em",
  },
  Geometric: {
    font: 'Avenir Next, Avenir, "Century Gothic", sans-serif',
    weight: 700,
    tracking: "-0.055em",
  },
  Humanist: {
    font: "Gill Sans, Gill Sans MT, Calibri, sans-serif",
    weight: 500,
    tracking: "-0.025em",
  },
  Condensed: {
    font: "Arial Narrow, HelveticaNeue-CondensedBold, sans-serif",
    weight: 700,
    tracking: "-0.045em",
  },
  Monospace: {
    font: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    weight: 600,
    tracking: "-0.045em",
  },
  "Arabic Editorial": {
    font: "Geeza Pro, Noto Naskh Arabic, Tahoma, serif",
    weight: 500,
    tracking: "0",
  },
} as const;
const presetForTemplate: Record<string, MotionPreset> = {
  hope: "horizon",
  weekly: "footage",
  faith: "cascade",
  motivation: "time",
  business: "shapes",
  event: "momentum",
};
const uid = () => Math.random().toString(36).slice(2, 9);
const makeProject = (template: Template): Project => ({
  schemaVersion: 1,
  id: uid(),
  title: template.name,
  templateId: template.id,
  category: template.category,
  ratio: template.ratios[0],
  scenes: template.scenes.map((s) => ({ ...s, id: uid() })),
  theme: {
    accent: template.colors[1],
    text: template.colors[2],
    base: template.colors[0],
    overlay: 0.46,
    font: "Editorial",
    atmosphere: "dust",
    atmosphereIntensity: 0.75,
    atmosphereColor: "#ffd67a",
    motionPreset: presetForTemplate[template.id] || "horizon",
  },
  media: {},
  updatedAt: new Date().toISOString(),
});

export function MotionMintApp() {
  const [view, setView] = useState<"gallery" | "editor">("gallery");
  const [filter, setFilter] = useState("All");
  const [templates, setTemplates] = useState<Template[]>(starterTemplates);
  const [project, setProject] = useState<Project>(restoreProject);
  const [underlay, setUnderlay] = useState<string>();
  const [audioUrl, setAudioUrl] = useState<string>();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [status, setStatus] = useState("Saved on this device");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/templates")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((result: { templates?: Array<{ config?: Template }> }) => {
        const remote = result.templates?.map((item) => item.config).filter((item): item is Template => Boolean(item?.id && item?.name));
        if (!remote?.length) return;
        setTemplates((current) => {
          const merged = new Map(current.map((item) => [item.id, item]));
          remote.forEach((item) => merged.set(item.id, item));
          return [...merged.values()];
        });
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus("Saving…");
      localStorage.setItem(storageKey, JSON.stringify(project));
      try {
        const response = await fetch("/api/projects", {
          method: "PUT",
          headers: { "content-type": "application/json", "x-motionmint-owner": getOwnerKey() },
          body: JSON.stringify(project),
        });
        setStatus(response.ok ? "Saved locally + synced" : "Saved on this device");
      } catch {
        setStatus("Saved on this device · offline");
      }
    }, 450);
    return () => clearTimeout(saveTimer.current);
  }, [project]);
  const update = (patch: Partial<Project>) =>
    setProject((p) => ({
      ...p,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  const choose = (t: Template) => {
    setProject(makeProject(t));
    setSceneIndex(0);
    setView("editor");
    setPlaying(true);
  };
  const scene = project.scenes[sceneIndex] || project.scenes[0];
  const template =
    templates.find((t) => t.id === project.templateId) || templates[0];
  const updateScene = (patch: Partial<Scene>) =>
    update({
      scenes: project.scenes.map((s, i) =>
        i === sceneIndex ? { ...s, ...patch } : s,
      ),
    });
  const move = (delta: number) => {
    const next = sceneIndex + delta;
    if (next < 0 || next >= project.scenes.length) return;
    const scenes = [...project.scenes];
    [scenes[sceneIndex], scenes[next]] = [scenes[next], scenes[sceneIndex]];
    update({ scenes });
    setSceneIndex(next);
  };
  const upload = (file: File | undefined, kind: "underlay" | "soundtrack") => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (kind === "underlay") {
      if (underlay) URL.revokeObjectURL(underlay);
      setUnderlay(url);
      update({ media: { ...project.media, underlayName: file.name } });
    } else {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      update({ media: { ...project.media, soundtrackName: file.name } });
    }
  };
  const renderRequest = async () => {
    setStatus("Queueing MP4 render…");
    try {
      await fetch("/api/projects", { method: "PUT", headers: { "content-type": "application/json", "x-motionmint-owner": getOwnerKey() }, body: JSON.stringify(project) });
      const response = await fetch("/api/render-jobs", {
        method: "POST",
        headers: { "content-type": "application/json", "x-motionmint-owner": getOwnerKey() },
        body: JSON.stringify({ projectId: project.id, ratio: project.ratio, fps: 30 }),
      });
      if (!response.ok) throw new Error("queue unavailable");
      const result = (await response.json()) as { job: { id: string } };
      setStatus(`Render queued · ${result.job.id.slice(0, 8)}`);
    } catch {
      setStatus("Saved locally · render queue unavailable");
    }
  };
  if (view === "gallery")
    return (
      <main className="shell gallery">
        <header className="topbar">
          <span className="brand">
            Motion<span>Mint</span>
          </span>
          <div className="header-actions">
            <span className="local-pill">Private · on device</span>
            <button className="avatar" aria-label="Account placeholder">
              EN
            </button>
          </div>
        </header>
        <section className="hero">
          <p className="eyebrow">Animated stories, made by you</p>
          <h1>
            Turn words into
            <br />
            <em>movement.</em>
          </h1>
          <p>
            Create scroll-stopping social banners and lyric videos from your
            phone. Your media stays on this device.
          </p>
        </section>
        <nav className="category-row" aria-label="Template categories">
          {categories.map((c) => (
            <button
              className={filter === c ? "active" : ""}
              onClick={() => setFilter(c)}
              key={c}
            >
              {c}
            </button>
          ))}
        </nav>
        <section className="template-grid" aria-label="Templates">
          {templates
            .filter((t) => filter === "All" || t.category === filter)
            .map((t, i) => (
              <button
                className={`template-card motif-${t.motif}`}
                style={
                  {
                    "--c1": t.colors[0],
                    "--c2": t.colors[1],
                    "--c3": t.colors[2],
                  } as React.CSSProperties
                }
                onClick={() => choose(t)}
                key={t.id}
              >
                <span className="card-visual">
                  <i>{String(i + 1).padStart(2, "0")}</i>
                  <b>{t.name}</b>
                  <small>{t.category}</small>
                </span>
                <span className="card-copy">
                  <b>{t.name}</b>
                  <span>{t.description}</span>
                  <small>
                    {t.ratios.join(" · ")} · {t.duration}s
                  </small>
                </span>
              </button>
            ))}
        </section>
        <button className="resume" onClick={() => setView("editor")}>
          Continue your saved project <span>→</span>
        </button>
      </main>
    );
  return (
    <main className="editor-shell">
      <header className="editor-top">
        <button
          className="icon-btn"
          onClick={() => setView("gallery")}
          aria-label="Back to templates"
        >
          ←
        </button>
        <div>
          <input
            className="project-title"
            value={project.title}
            onChange={(e) => update({ title: e.target.value })}
            aria-label="Project title"
          />
          <span>{status}</span>
        </div>
        <button className="export-top" onClick={renderRequest}>
          Request MP4
        </button>
      </header>
      <div className="workspace">
        <section className="preview-panel">
          <Preview
            project={project}
            template={template}
            sceneIndex={sceneIndex}
            playing={playing}
            underlay={underlay}
          />
          <div className="transport">
            <button
              onClick={() => {
                setSceneIndex(0);
                setPlaying(false);
                setTimeout(() => setPlaying(true), 10);
              }}
              aria-label="Restart"
            >
              ↺
            </button>
            <button
              className="play"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "Ⅱ" : "▶"}
            </button>
            <span>
              Scene {sceneIndex + 1} / {project.scenes.length}
            </span>
          </div>
        </section>
        <section className="controls-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Edit your story</p>
              <h2>Scene {sceneIndex + 1}</h2>
            </div>
            <button
              onClick={() => {
                const scenes = project.scenes.filter(
                  (_, i) => i !== sceneIndex,
                );
                if (!scenes.length) return;
                update({ scenes });
                setSceneIndex(Math.max(0, sceneIndex - 1));
              }}
              disabled={project.scenes.length === 1}
              className="danger"
            >
              Remove
            </button>
          </div>
          <div className="scene-tabs">
            {project.scenes.map((s, i) => (
              <button
                key={s.id}
                className={i === sceneIndex ? "active" : ""}
                onClick={() => setSceneIndex(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => {
                update({
                  scenes: [
                    ...project.scenes,
                    {
                      id: uid(),
                      primary: "Your message",
                      secondary: "",
                      duration: 5,
                    },
                  ],
                });
                setSceneIndex(project.scenes.length);
              }}
            >
              ＋
            </button>
          </div>
          <div className="reorder">
            <button onClick={() => move(-1)} disabled={sceneIndex === 0}>
              ← Move earlier
            </button>
            <button
              onClick={() => move(1)}
              disabled={sceneIndex === project.scenes.length - 1}
            >
              Move later →
            </button>
          </div>
          <label>
            Primary text
            <textarea
              value={scene.primary}
              onChange={(e) => updateScene({ primary: e.target.value })}
              rows={3}
            />
          </label>
          <label>
            Secondary language <span>RTL detected automatically</span>
            <textarea
              dir="auto"
              lang="ar"
              value={scene.secondary}
              onChange={(e) => updateScene({ secondary: e.target.value })}
              rows={2}
            />
          </label>
          <div className="two-col">
            <label>
              Duration{" "}
              <div className="range-line">
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={scene.duration}
                  onChange={(e) => updateScene({ duration: +e.target.value })}
                />
                <output>{scene.duration}s</output>
              </div>
            </label>
            <label>
              Format
              <select
                value={project.ratio}
                onChange={(e) => update({ ratio: e.target.value as Ratio })}
              >
                {(["9:16", "1:1", "16:9"] as Ratio[]).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="upload-grid">
            <label className="upload">
              Image or video
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => upload(e.target.files?.[0], "underlay")}
              />
              <span>{project.media.underlayName || "Choose underlay"}</span>
            </label>
            <label className="upload">
              Soundtrack / voice
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => upload(e.target.files?.[0], "soundtrack")}
              />
              <span>{project.media.soundtrackName || "Choose audio"}</span>
            </label>
          </div>
          {/* Uploaded soundtrack preview is audio-only, so no caption track exists. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          {audioUrl && <audio className="audio" controls src={audioUrl} />}
          <details open>
            <summary>Style &amp; atmosphere</summary>
            <div className="style-grid">
              <label>
                Accent
                <input
                  type="color"
                  value={project.theme.accent}
                  onChange={(e) =>
                    update({
                      theme: { ...project.theme, accent: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Base colour
                <input
                  aria-label="Base colour"
                  type="color"
                  value={project.theme.base || template.colors[0]}
                  onChange={(e) =>
                    update({
                      theme: { ...project.theme, base: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Text
                <input
                  type="color"
                  value={project.theme.text}
                  onChange={(e) =>
                    update({
                      theme: { ...project.theme, text: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Overlay
                <input
                  type="range"
                  min="0"
                  max=".85"
                  step=".05"
                  value={project.theme.overlay}
                  onChange={(e) =>
                    update({
                      theme: { ...project.theme, overlay: +e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Typography
                <select
                  value={project.theme.font}
                  onChange={(e) =>
                    update({
                      theme: { ...project.theme, font: e.target.value },
                    })
                  }
                >
                  {Object.keys(typographyPresets).map((font) => (
                    <option key={font}>{font}</option>
                  ))}
                </select>
              </label>
              <label className="motion-select">
                Motion system
                <select
                  aria-label="Motion system"
                  value={project.theme.motionPreset || "horizon"}
                  onChange={(e) =>
                    update({
                      theme: {
                        ...project.theme,
                        motionPreset: e.target.value as MotionPreset,
                      },
                    })
                  }
                >
                  {motionPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <small>
                  {
                    motionPresets.find(
                      (preset) =>
                        preset.id === (project.theme.motionPreset || "horizon"),
                    )?.note
                  }
                </small>
              </label>
              <label>
                Three.js atmosphere
                <select
                  aria-label="Three.js atmosphere"
                  value={project.theme.atmosphere || "none"}
                  onChange={(e) =>
                    update({
                      theme: {
                        ...project.theme,
                        atmosphere: e.target.value as AtmospherePreset,
                      },
                    })
                  }
                >
                  <option value="none">None</option>
                  <option value="dust">Floating dust</option>
                  <option value="stars">Star drift</option>
                  <option value="rain">Rain glass</option>
                  <option value="aurora">Aurora glow</option>
                </select>
              </label>
              <label>
                Atmosphere strength
                <input
                  aria-label="Atmosphere strength"
                  type="range"
                  min=".15"
                  max="1"
                  step=".05"
                  value={project.theme.atmosphereIntensity ?? 0.75}
                  disabled={(project.theme.atmosphere || "none") === "none"}
                  onChange={(e) =>
                    update({
                      theme: {
                        ...project.theme,
                        atmosphereIntensity: +e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Effect colour
                <input
                  aria-label="Effect colour"
                  type="color"
                  value={project.theme.atmosphereColor || "#ffd67a"}
                  disabled={(project.theme.atmosphere || "none") === "none"}
                  onChange={(e) =>
                    update({
                      theme: {
                        ...project.theme,
                        atmosphereColor: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
            <p className="effect-note">
              <span /> WebGL effect · seeded for repeatable rendering
            </p>
          </details>
          <button className="render-button" onClick={renderRequest}>
            <span>Prepare final MP4 request</span>
            <small>Downloads a server-render-ready project manifest</small>
          </button>
          <p className="privacy">
            Uploads remain private in this browser session. Project text and
            settings autosave locally.
          </p>
        </section>
      </div>
    </main>
  );
}

function Preview({
  project,
  template,
  sceneIndex,
  playing,
  underlay,
}: {
  project: Project;
  template: Template;
  sceneIndex: number;
  playing: boolean;
  underlay?: string;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const scene = project.scenes[sceneIndex];
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const motionPreset = project.theme.motionPreset || "horizon";
  const typography =
    typographyPresets[project.theme.font as keyof typeof typographyPresets] ||
    typographyPresets.Editorial;
  const animate = useCallback(() => {
    if (!inner.current || !playing) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf(inner.current);
    const entrances: Record<MotionPreset, gsap.TweenVars> = {
      horizon: { opacity: 0, y: 62, clipPath: "inset(100% 0 0 0)" },
      shapes: { opacity: 0, x: -48, rotate: -2 },
      momentum: { opacity: 0, x: 72, filter: "blur(5px)" },
      time: { opacity: 0, rotateX: 82, transformPerspective: 500 },
      cascade: { opacity: 0, y: 24, clipPath: "inset(0 100% 0 0)" },
      footage: { opacity: 0, y: 18, filter: "blur(10px)", scale: 1.025 },
    };
    gsap.fromTo(
      inner.current,
      reduce ? { opacity: 0 } : entrances[motionPreset],
      {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        rotateX: 0,
        scale: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        filter: "blur(0px)",
        duration: reduce ? 0.15 : motionPreset === "horizon" ? 1.35 : 1,
        ease: motionPreset === "time" ? "back.out(1.5)" : "power3.out",
      },
    );
  }, [playing, sceneIndex, scene?.primary, motionPreset]);
  useEffect(() => {
    animate();
    return () => gsap.killTweensOf(inner.current);
  }, [animate]);
  useEffect(() => {
    clearTimeout(timer.current);
    if (!playing) return;
    timer.current = setTimeout(
      () =>
        document
          .querySelector<HTMLButtonElement>(
            `.scene-tabs button:nth-child(${((sceneIndex + 1) % project.scenes.length) + 1})`,
          )
          ?.click(),
      scene.duration * 1000,
    );
    return () => clearTimeout(timer.current);
  }, [playing, sceneIndex, scene.duration, project.scenes.length]);
  const isVideo =
    underlay &&
    /^(blob:)/.test(underlay) &&
    project.media.underlayName?.match(/\.(mp4|webm|mov)$/i);
  return (
    <div
      className={`composition ratio-${project.ratio.replace(":", "-")} motif-${template.motif} motion-${motionPreset} ${playing ? "is-playing" : "is-paused"}`}
      style={
        {
          "--accent": project.theme.accent,
          "--text": project.theme.text,
          "--overlay": project.theme.overlay,
          "--base": project.theme.base || template.colors[0],
          "--display-font": typography.font,
          "--display-weight": typography.weight,
          "--display-tracking": typography.tracking,
        } as React.CSSProperties
      }
    >
      {underlay &&
        (isVideo ? (
          <video src={underlay} autoPlay muted loop playsInline />
        ) : (
          <img src={underlay} alt="Uploaded underlay preview" />
        ))}
      <div className="backdrop" />
      <PersistentMotion preset={motionPreset} sceneIndex={sceneIndex} />
      {(project.theme.atmosphere || "none") !== "none" && (
        <Atmosphere
          preset={
            (project.theme.atmosphere || "dust") as Exclude<
              AtmospherePreset,
              "none"
            >
          }
          color={project.theme.atmosphereColor || "#ffd67a"}
          intensity={project.theme.atmosphereIntensity ?? 0.75}
          playing={playing}
        />
      )}
      <div className="composition-frame" />
      <div className="composition-label">
        {project.category} · {project.title}
      </div>
      <div ref={inner} className="scene-content">
        <p>
          {String(sceneIndex + 1).padStart(2, "0")} /{" "}
          {String(project.scenes.length).padStart(2, "0")}
        </p>
        <h3 dir="auto">{scene.primary}</h3>
        {scene.secondary && (
          <h4 dir="auto" lang="ar">
            {scene.secondary}
          </h4>
        )}
        <i />
      </div>
      <div
        className="progress"
        style={{
          width: `${((sceneIndex + 1) / project.scenes.length) * 100}%`,
        }}
      />
    </div>
  );
}

function PersistentMotion({
  preset,
  sceneIndex,
}: {
  preset: MotionPreset;
  sceneIndex: number;
}) {
  return (
    <div
      className={`persistent-motion persistent-${preset}`}
      aria-hidden="true"
      style={
        {
          "--shift": `${sceneIndex * 18}%`,
          "--shift-back": `${sceneIndex * -18}%`,
          "--shift-small": `${sceneIndex * 12}%`,
          "--shift-small-back": `${sceneIndex * -12}%`,
          "--turn": `${sceneIndex * 25}deg`,
          "--turn-back": `${sceneIndex * -30}deg`,
          "--shape-scale": 1 + sceneIndex * 0.14,
        } as React.CSSProperties
      }
    >
      {preset === "horizon" && (
        <>
          <i className="horizon-line" />
          <i className="horizon-sun" />
        </>
      )}
      {preset === "shapes" && (
        <>
          <i />
          <i />
          <i />
          <i />
        </>
      )}
      {preset === "momentum" && (
        <>
          <i className="momentum-panel" />
          <i className="momentum-rule" />
        </>
      )}
      {preset === "time" && (
        <>
          <span>0 1 2 3 4 5 6 7 8 9</span>
          <i className="ticker-hand" />
        </>
      )}
      {preset === "cascade" && (
        <>
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} />
          ))}
        </>
      )}
      {preset === "footage" && (
        <>
          <i className="film-wash" />
          <i className="film-line" />
        </>
      )}
    </div>
  );
}

function Atmosphere({
  preset,
  color,
  intensity,
  playing,
}: {
  preset: Exclude<AtmospherePreset, "none">;
  color: string;
  intensity: number;
  playing: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    host.current.appendChild(renderer.domElement);
    const world = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;
    const count = preset === "stars" ? 120 : preset === "rain" ? 150 : 90;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    let seed = 7319;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = random() * 2 - 1;
      positions[i * 3 + 1] = random() * 2 - 1;
      positions[i * 3 + 2] = random();
      sizes[i] =
        preset === "rain"
          ? 9 + random() * 12
          : preset === "stars"
            ? 1.5 + random() * 3.5
            : 3 + random() * 6;
    }
    const geometry =
      preset === "aurora"
        ? new THREE.PlaneGeometry(2, 2)
        : new THREE.BufferGeometry();
    if (geometry instanceof THREE.BufferGeometry && preset !== "aurora") {
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    }
    const mode =
      preset === "dust"
        ? 0
        : preset === "stars"
          ? 1
          : preset === "rain"
            ? 2
            : 3;
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: intensity * 0.9 },
        uMode: { value: mode },
      },
      vertexShader: `attribute float size; uniform float uTime; uniform int uMode; varying float vAlpha; varying vec2 vUv; void main(){vUv=uv;vec3 p=position;float phase=position.x*7.0+position.y*11.0;if(uMode==0){p.y=mod(p.y+1.0+uTime*(.025+size*.002),2.0)-1.0;p.x+=sin(uTime*.22+phase)*.035;}else if(uMode==1){p.x=mod(p.x+1.0+uTime*(.018+p.z*.02),2.0)-1.0;p.y+=sin(uTime*.35+phase)*.012;}else if(uMode==2){p.y=mod(p.y+1.0-uTime*(.18+p.z*.22),2.0)-1.0;p.x+=uTime*.035;}vAlpha=.25+.55*(size/12.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);gl_PointSize=size;}`,
      fragmentShader: `uniform vec3 uColor;uniform float uOpacity;uniform float uTime;uniform int uMode;varying float vAlpha;varying vec2 vUv;void main(){if(uMode==3){float wave=sin(vUv.x*9.0+uTime*.35+sin(vUv.y*5.0))*0.5+0.5;float band=smoothstep(.18,.78,wave)*smoothstep(.98,.28,abs(vUv.y-.52));vec3 second=vec3(uColor.b,uColor.r,uColor.g);vec3 col=mix(uColor,second,vUv.x);gl_FragColor=vec4(col,band*uOpacity*.42);return;}if(uMode==2){float line=smoothstep(.16,0.0,abs(gl_PointCoord.x-.5))*smoothstep(.52,.02,abs(gl_PointCoord.y-.5));gl_FragColor=vec4(uColor,line*uOpacity*.48);return;}float d=distance(gl_PointCoord,vec2(.5));float glow=smoothstep(.5,0.0,d);float core=smoothstep(.16,0.0,d);float twinkle=uMode==1?(.55+.45*sin(uTime*2.0+vAlpha*19.0)):1.0;gl_FragColor=vec4(uColor,(glow*.72+core*.55)*vAlpha*uOpacity*twinkle);}`,
    });
    world.add(
      preset === "aurora"
        ? new THREE.Mesh(geometry, material)
        : new THREE.Points(geometry, material),
    );
    const start = performance.now();
    let frame = 0;
    const resize = () => {
      if (host.current)
        renderer.setSize(
          host.current.clientWidth,
          host.current.clientHeight,
          false,
        );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host.current);
    resize();
    const render = () => {
      material.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render(world, camera);
      frame = requestAnimationFrame(render);
    };
    if (playing && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      render();
    else renderer.render(world, camera);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [color, intensity, playing, preset]);
  return <div className="three-atmosphere" ref={host} aria-hidden="true" />;
}
