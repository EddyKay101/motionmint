"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { TemplateConfig } from "../../lib/starter-templates";
import type { TemplateStudioConcept } from "../../lib/template-studio";
import { outputProfiles, profileByName } from "../../lib/output-profiles";

type Status = "draft" | "published" | "archived";
type RecordItem = { id: string; name: string; category: string; status: Status; config: TemplateConfig; updatedAt: string };
type FormState = TemplateConfig & { status: Status };

const blank = (): FormState => ({
  id: "", name: "Untitled template", category: "Custom", status: "draft",
  description: "Describe how this template should feel and what it is for.",
  ratios: ["9:16"], duration: 10, motif: "horizon", animation: "rise",
  colors: ["#151713", "#bfe95b", "#ffffff"],
  scenes: [{ primary: "Your headline", secondary: "Your secondary language", duration: 5 }],
  useCases: ["Social posts", "Creator templates"],
  defaultProfileId: "social-posts",
  brandDefaults: { required: false, position: "top-right", width: 18, animation: "fade" },
});

const useCaseOptions = ["Display advertising", "Social posts", "Digital signage", "Website heroes", "Event screens", "Livestream graphics", "Music visualisers", "Presentations", "Email & messaging", "Digital invitations", "Product advertising", "Fundraising campaigns", "Educational content", "Creator templates"];

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function DesignDecorations({ design }: { design?: TemplateConfig["design"] }) {
  return <>{design?.decorations.map((item, index) => <span aria-hidden="true" className="admin-generated-decoration" key={`${item.type}-${index}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, opacity: item.opacity, borderRadius: item.type === "circle" ? "50%" : `${item.radius}%`, background: `var(--admin-${item.color})`, transform: `rotate(${item.rotation}deg)` }} />)}</>;
}

export function AdminApp() {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [form, setForm] = useState<FormState>(blank);
  const [selectedId, setSelectedId] = useState<string>();
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("Loading template catalogue…");
  const [studioBrief, setStudioBrief] = useState("Create a premium business announcement with strong editorial typography, restrained cinematic movement, space for product media and a clear call to action.");
  const [studioCategory, setStudioCategory] = useState("");
  const [studioMood, setStudioMood] = useState("Refined");
  const [studioUseCase, setStudioUseCase] = useState("Social posts");
  const [studioScenes, setStudioScenes] = useState(3);
  const [studioRatios, setStudioRatios] = useState<TemplateConfig["ratios"]>(["9:16", "1:1", "16:9"]);
  const [concepts, setConcepts] = useState<TemplateStudioConcept[]>([]);
  const [studioState, setStudioState] = useState<"idle" | "generating" | "error">("idle");
  const [studioMessage, setStudioMessage] = useState("AI design director ready · prompts are sent only when you press Generate");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/templates?scope=admin", { cache: "no-store" });
      if (!response.ok) throw new Error("The local database is unavailable.");
      const data = (await response.json()) as { templates: RecordItem[] };
      setItems(data.templates);
      setState("ready");
      setMessage(`${data.templates.length} templates in catalogue`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not load templates.");
    }
  }, []);

  // The initial catalogue load intentionally owns the page-level loading state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const select = (item: RecordItem) => {
    setSelectedId(item.id);
    const assignedUses = item.config.useCases || ["Creator templates"];
    setForm({ ...item.config, id: item.id, name: item.name, category: item.category, status: item.status, useCases: assignedUses, defaultProfileId: item.config.defaultProfileId || profileByName(assignedUses[0]).id, brandDefaults: item.config.brandDefaults || { required: false, position: "top-right", width: 18, animation: "fade" }, colors: [...item.config.colors], scenes: item.config.scenes.map((scene) => ({ ...scene })) });
    setMessage(`Editing ${item.name}`);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const totalDuration = useMemo(() => form.scenes.reduce((sum, scene) => sum + scene.duration, 0), [form.scenes]);

  const save = async () => {
    const id = selectedId ?? slugify(form.id || form.name);
    if (!id || !form.name.trim() || !form.scenes.length || !form.ratios.length) {
      setState("error"); setMessage("Name, ID, one ratio and one scene are required."); return;
    }
    setState("saving"); setMessage("Saving template…");
    const config: TemplateConfig = { ...form, id, duration: totalDuration };
    delete (config as TemplateConfig & { status?: Status }).status;
    const response = await fetch(selectedId ? `/api/templates/${selectedId}` : "/api/templates", {
      method: selectedId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(selectedId ? { name: form.name, category: form.category, status: form.status, config } : { id, name: form.name, category: form.category, status: form.status, config }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setState("error"); setMessage(result.error ?? "Could not save the template."); return;
    }
    setSelectedId(id); setState("ready"); setMessage(`${form.name} saved as ${form.status}.`); await load();
  };

  const updateScene = (index: number, patch: Partial<FormState["scenes"][number]>) => update("scenes", form.scenes.map((scene, sceneIndex) => sceneIndex === index ? { ...scene, ...patch } : scene));
  const previewScene = form.scenes[0];
  const previewCopyLength = (previewScene?.primary.length || 0) + (previewScene?.secondary.length || 0);
  const previewCopyClass = previewCopyLength > 90 ? "copy-very-long" : previewCopyLength > 48 ? "copy-long" : "copy-standard";

  const generateConcepts = async () => {
    setStudioState("generating");
    setStudioMessage("Generating three structured concepts…");
    try {
      const response = await fetch("/api/admin/template-studio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: studioBrief, category: studioCategory || undefined, mood: studioMood, useCase: studioUseCase, sceneCount: studioScenes, ratios: studioRatios }),
      });
      const result = (await response.json()) as { concepts?: TemplateStudioConcept[]; error?: string; note?: string; provider?: string; simulated?: boolean };
      if (!response.ok || !result.concepts) throw new Error(result.error || "Could not generate concepts.");
      setConcepts(result.concepts);
      setStudioState("idle");
      setStudioMessage(`${result.concepts.length} original drafts generated${result.simulated ? " with fallback" : ` by ${result.provider || "OpenAI"}`} · ${result.note || "review before saving"}`);
    } catch (error) {
      setStudioState("error");
      setStudioMessage(error instanceof Error ? error.message : "Could not generate concepts.");
    }
  };

  const applyConcept = (concept: TemplateStudioConcept) => {
    const template = concept.template;
    setSelectedId(undefined);
    setForm({ ...template, status: "draft", colors: [...template.colors], scenes: template.scenes.map((scene) => ({ ...scene })), useCases: [...(template.useCases || [])], brandDefaults: { ...(template.brandDefaults || {}) } });
    setMessage(`${template.name} is now an editable draft. Review it, then save when ready.`);
    document.querySelector(".admin-editor-head")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div><span className="brand">Motion<span>Mint</span></span><span className="admin-label">Template Admin</span></div>
        <div className="admin-actions"><span className="dev-warning">Local testing only · no login</span><Link href="/create">Open creator ↗</Link></div>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-head"><div><p className="eyebrow">Catalogue</p><h1>Templates</h1></div><button className="admin-new" onClick={() => { setSelectedId(undefined); setForm(blank()); setMessage("Creating a new draft"); }}>＋ New</button></div>
          <div className="admin-template-list" aria-label="Template catalogue">
            {state === "loading" && !items.length && <p className="admin-empty">Loading…</p>}
            {items.map((item) => <button key={item.id} className={selectedId === item.id ? "active" : ""} onClick={() => select(item)}><span className="admin-swatch" style={{ background: item.config.colors?.[0] }} /><span><b>{item.name}</b><small>{item.category}</small></span><i data-status={item.status}>{item.status}</i></button>)}
          </div>
        </aside>

        <section className="admin-editor">
          <div className="admin-editor-head"><div><p className="eyebrow">{selectedId ? "Edit template" : "New template"}</p><h2>{form.name || "Untitled template"}</h2><p>{message}</p></div><button className="admin-save" disabled={state === "saving"} onClick={() => void save()}>{state === "saving" ? "Saving…" : "Save template"}</button></div>
          {state === "error" && <div className="admin-error" role="alert">{message}</div>}
          <div className="admin-content">
            <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
              <fieldset className="admin-ai-studio"><legend>Template Studio <span>AI design director</span></legend>
                <div className="admin-ai-intro"><div><b>Describe a completely new design direction</b><p>The AI starts from a blank canvas and returns three structurally different, responsive template systems. Drafts use safe percentage-based geometry—not arbitrary code—and remain editable before you publish them.</p></div><span>OpenAI connected</span></div>
                <label>Creative brief<textarea rows={5} value={studioBrief} onChange={(event) => setStudioBrief(event.target.value)} placeholder="Example: Create an elegant charity campaign with warm photography, hopeful typography and a gentle reveal…" /></label>
                <div className="admin-grid three admin-ai-options">
                  <label>Category<input list="admin-categories" value={studioCategory} onChange={(event) => setStudioCategory(event.target.value)} placeholder="Infer automatically" /></label>
                  <label>Visual mood<select value={studioMood} onChange={(event) => setStudioMood(event.target.value)}><option>Refined</option><option>Contemporary</option><option>Energetic</option><option>Calm</option><option>Playful</option><option>Cinematic</option></select></label>
                  <label>Primary use<select value={studioUseCase} onChange={(event) => setStudioUseCase(event.target.value)}>{useCaseOptions.map((useCase) => <option key={useCase}>{useCase}</option>)}</select></label>
                  <label>Scenes<select value={studioScenes} onChange={(event) => setStudioScenes(Number(event.target.value))}>{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count} scene{count === 1 ? "" : "s"}</option>)}</select></label>
                  <div className="admin-ai-ratios"><span>Aspect ratios</span>{(["9:16", "1:1", "16:9"] as const).map((ratio) => <label key={ratio}><input type="checkbox" checked={studioRatios.includes(ratio)} onChange={(event) => setStudioRatios(event.target.checked ? [...studioRatios, ratio] : studioRatios.filter((item) => item !== ratio))} /> {ratio}</label>)}</div>
                </div>
                <div className="admin-ai-generate"><button type="button" disabled={studioState === "generating" || studioBrief.trim().length < 12 || !studioRatios.length} onClick={() => void generateConcepts()}>{studioState === "generating" ? "Designing from a blank canvas…" : "✦ Generate three original drafts"}</button><small className={studioState === "error" ? "error" : ""}>{studioMessage}</small></div>
                {concepts.length > 0 && <div className="admin-ai-concepts">{concepts.map((concept, index) => <article key={concept.id}>
                  <div className={`admin-ai-concept-preview motif-${concept.template.motif} layout-${concept.template.layout || "editorial-left"} ${concept.template.design ? "layout-generated" : ""}`} style={{ "--admin-base": concept.template.colors[0], "--admin-accent": concept.template.colors[1], "--admin-text": concept.template.colors[2] } as React.CSSProperties}><DesignDecorations design={concept.template.design} /><span>0{index + 1}</span><h3 style={concept.template.design ? { position: "absolute", left: `${concept.template.design.contentX}%`, top: `${concept.template.design.contentY}%`, width: `${concept.template.design.contentWidth}%`, textAlign: concept.template.design.textAlign, transform: "translateY(-50%)" } : undefined}>{concept.template.scenes[0]?.primary}</h3><i>{concept.template.animation}</i></div>
                  <div className="admin-ai-concept-copy"><p>Concept {index + 1}</p><h4>{concept.template.name}</h4><span>{concept.template.category} · {concept.template.layout} · {concept.template.typography}</span><small>{concept.rationale}</small><button type="button" onClick={() => applyConcept(concept)}>Use this draft →</button></div>
                </article>)}</div>}
              </fieldset>
              <fieldset><legend>Identity &amp; publishing</legend><div className="admin-grid two">
                <label>Name<input value={form.name} onChange={(event) => { update("name", event.target.value); if (!selectedId) update("id", slugify(event.target.value)); }} /></label>
                <label>Template ID<input value={form.id} disabled={Boolean(selectedId)} onChange={(event) => update("id", slugify(event.target.value))} /></label>
                <label>Category<input list="admin-categories" value={form.category} onChange={(event) => update("category", event.target.value)} /><datalist id="admin-categories"><option>Islamic</option><option>Christian</option><option>Motivational</option><option>Wellness</option><option>Music</option><option>Business</option><option>Events</option><option>Community</option><option>Custom</option></datalist></label>
                <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value as Status)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
              </div><label>Description<textarea rows={2} value={form.description} onChange={(event) => update("description", event.target.value)} /></label></fieldset>

              <fieldset><legend>Create for</legend><p className="admin-field-note">These choices control which production modes customers can select for this template.</p><div className="admin-use-cases">{useCaseOptions.map((useCase) => <label key={useCase}><input type="checkbox" checked={(form.useCases || []).includes(useCase)} onChange={(event) => update("useCases", event.target.checked ? [...(form.useCases || []), useCase] : (form.useCases || []).filter((item) => item !== useCase))} />{useCase}</label>)}</div><label className="admin-default-profile">Default production mode<select value={form.defaultProfileId || ""} onChange={(event) => update("defaultProfileId", event.target.value)}><option value="">Choose a default</option>{outputProfiles.filter((profile) => (form.useCases || []).includes(profile.name)).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label></fieldset>

              <fieldset><legend>Canvas &amp; visual system</legend><div className="admin-ratios"><span>Supported ratios</span>{(["9:16", "1:1", "16:9"] as const).map((ratio) => <label key={ratio}><input type="checkbox" checked={form.ratios.includes(ratio)} onChange={(event) => update("ratios", event.target.checked ? [...form.ratios, ratio] : form.ratios.filter((item) => item !== ratio))} /> {ratio}</label>)}</div><div className="admin-grid two">
                <label>Background treatment<select value={form.motif} onChange={(event) => update("motif", event.target.value)}><option value="horizon">Horizon light</option><option value="paper">Editorial paper</option><option value="glass">Stained glass</option><option value="kinetic">Kinetic frame</option><option value="product">Product split</option><option value="rings">Event rings</option></select></label>
                <label>Animation preset<select value={form.animation} onChange={(event) => update("animation", event.target.value)}><option value="rise">Cinematic rise</option><option value="slide">Editorial slide</option><option value="reveal">Light reveal</option><option value="scale">Kinetic scale</option><option value="wipe">Product wipe</option><option value="orbit">Orbital build</option></select></label>
                <label>Composition layout<select value={form.layout || "editorial-left"} onChange={(event) => update("layout", event.target.value as NonNullable<TemplateConfig["layout"]>)}><option value="editorial-left">Editorial left</option><option value="centered-poster">Centred poster</option><option value="split-stage">Split stage</option><option value="lower-third">Lower third</option><option value="asymmetric-grid">Asymmetric grid</option></select></label>
                <label>Typography system<select value={form.typography || "Editorial"} onChange={(event) => update("typography", event.target.value as NonNullable<TemplateConfig["typography"]>)}><option>Editorial</option><option>Modern</option><option>Classic</option><option>Display</option><option>Humanist</option><option>Geometric</option><option>Monospace</option><option>Arabic Editorial</option></select></label>
              </div><div className="admin-colors">{["Base", "Accent", "Text"].map((label, index) => <label key={label}>{label}<input type="color" value={form.colors[index]} onChange={(event) => { const colors = [...form.colors] as TemplateConfig["colors"]; colors[index] = event.target.value; update("colors", colors); }} /></label>)}</div></fieldset>

              <fieldset><legend>Logo &amp; brand defaults</legend><p className="admin-field-note">Set the starting logo behaviour for projects created from this template. Customers can still adjust it in the editor.</p><div className="admin-grid two"><label className="admin-check"><input type="checkbox" checked={form.brandDefaults?.required || false} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), required: event.target.checked })} /> Require a logo before export</label><label>Default position<select value={form.brandDefaults?.position || "top-right"} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), position: event.target.value })}><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option><option value="custom">Custom</option></select></label><label>Default width<div className="admin-duration"><input type="range" min="6" max="40" value={form.brandDefaults?.width || 18} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), width: Number(event.target.value) })} /><output>{form.brandDefaults?.width || 18}%</output></div></label><label>Default entrance<select value={form.brandDefaults?.animation || "fade"} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), animation: event.target.value })}><option value="none">None</option><option value="fade">Gentle fade</option><option value="slide">Slide in</option><option value="scale">Scale up</option></select></label></div></fieldset>

              <fieldset><legend>Default scenes <span>{totalDuration}s total</span></legend>{form.scenes.map((scene, index) => <div className="admin-scene" key={index}><div className="admin-scene-title"><b>Scene {index + 1}</b><button type="button" disabled={form.scenes.length === 1} onClick={() => update("scenes", form.scenes.filter((_, sceneIndex) => sceneIndex !== index))}>Remove</button></div><label>Primary copy<textarea rows={2} value={scene.primary} onChange={(event) => updateScene(index, { primary: event.target.value })} /></label><label>Secondary-language copy<textarea dir="auto" rows={2} value={scene.secondary} onChange={(event) => updateScene(index, { secondary: event.target.value })} /></label><label>Duration<div className="admin-duration"><input type="range" min="2" max="20" value={scene.duration} onChange={(event) => updateScene(index, { duration: Number(event.target.value) })} /><output>{scene.duration}s</output></div></label></div>)}<button className="admin-add-scene" type="button" onClick={() => update("scenes", [...form.scenes, { primary: "New scene", secondary: "", duration: 5 }])}>＋ Add scene</button></fieldset>
            </form>

            <aside className="admin-preview-wrap"><div className="admin-preview-meta"><span>Live preview</span><b>{form.ratios[0] ?? "No ratio"}</b></div><div className={`admin-preview ${previewCopyClass} motif-${form.motif} layout-${form.layout || "editorial-left"} ${form.design ? "layout-generated" : ""}`} style={{ "--admin-base": form.colors[0], "--admin-accent": form.colors[1], "--admin-text": form.colors[2] } as React.CSSProperties}><DesignDecorations design={form.design} /><i>{form.category}</i><div style={form.design ? { position: "absolute", left: `${form.design.contentX}%`, top: `${form.design.contentY}%`, width: `${form.design.contentWidth}%`, textAlign: form.design.textAlign, transform: "translateY(-50%)", zIndex: 2 } : undefined}><h3 dir="auto" style={form.design ? { fontSize: `clamp(16px, ${2.9 * form.design.headlineScale}vw, 44px)` } : undefined}>{previewScene?.primary || "Your headline"}</h3><p dir="auto">{previewScene?.secondary}</p></div><small>{totalDuration}s · {form.animation} · {form.typography || "Editorial"}</small></div><p className="admin-preview-note">This compact preview shows the template’s visual identity. The creator uses the full GSAP and Three.js renderer.</p></aside>
          </div>
        </section>
      </div>
    </main>
  );
}
