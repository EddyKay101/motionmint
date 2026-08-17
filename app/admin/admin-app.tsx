"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { TemplateConfig } from "../../lib/starter-templates";
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

export function AdminApp() {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [form, setForm] = useState<FormState>(blank);
  const [selectedId, setSelectedId] = useState<string>();
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("Loading template catalogue…");

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

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div><Link className="brand" href="/">Motion<span>Mint</span></Link><span className="admin-label">Template Admin</span></div>
        <div className="admin-actions"><span className="dev-warning">Local testing only · no login</span><Link href="/">Open creator ↗</Link></div>
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
              </div><div className="admin-colors">{["Base", "Accent", "Text"].map((label, index) => <label key={label}>{label}<input type="color" value={form.colors[index]} onChange={(event) => { const colors = [...form.colors] as TemplateConfig["colors"]; colors[index] = event.target.value; update("colors", colors); }} /></label>)}</div></fieldset>

              <fieldset><legend>Logo &amp; brand defaults</legend><p className="admin-field-note">Set the starting logo behaviour for projects created from this template. Customers can still adjust it in the editor.</p><div className="admin-grid two"><label className="admin-check"><input type="checkbox" checked={form.brandDefaults?.required || false} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), required: event.target.checked })} /> Require a logo before export</label><label>Default position<select value={form.brandDefaults?.position || "top-right"} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), position: event.target.value })}><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option><option value="custom">Custom</option></select></label><label>Default width<div className="admin-duration"><input type="range" min="6" max="40" value={form.brandDefaults?.width || 18} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), width: Number(event.target.value) })} /><output>{form.brandDefaults?.width || 18}%</output></div></label><label>Default entrance<select value={form.brandDefaults?.animation || "fade"} onChange={(event) => update("brandDefaults", { ...(form.brandDefaults || {}), animation: event.target.value })}><option value="none">None</option><option value="fade">Gentle fade</option><option value="slide">Slide in</option><option value="scale">Scale up</option></select></label></div></fieldset>

              <fieldset><legend>Default scenes <span>{totalDuration}s total</span></legend>{form.scenes.map((scene, index) => <div className="admin-scene" key={index}><div className="admin-scene-title"><b>Scene {index + 1}</b><button type="button" disabled={form.scenes.length === 1} onClick={() => update("scenes", form.scenes.filter((_, sceneIndex) => sceneIndex !== index))}>Remove</button></div><label>Primary copy<textarea rows={2} value={scene.primary} onChange={(event) => updateScene(index, { primary: event.target.value })} /></label><label>Secondary-language copy<textarea dir="auto" rows={2} value={scene.secondary} onChange={(event) => updateScene(index, { secondary: event.target.value })} /></label><label>Duration<div className="admin-duration"><input type="range" min="2" max="20" value={scene.duration} onChange={(event) => updateScene(index, { duration: Number(event.target.value) })} /><output>{scene.duration}s</output></div></label></div>)}<button className="admin-add-scene" type="button" onClick={() => update("scenes", [...form.scenes, { primary: "New scene", secondary: "", duration: 5 }])}>＋ Add scene</button></fieldset>
            </form>

            <aside className="admin-preview-wrap"><div className="admin-preview-meta"><span>Live preview</span><b>{form.ratios[0] ?? "No ratio"}</b></div><div className={`admin-preview motif-${form.motif}`} style={{ "--admin-base": form.colors[0], "--admin-accent": form.colors[1], "--admin-text": form.colors[2] } as React.CSSProperties}><i>{form.category}</i><div><h3 dir="auto">{previewScene?.primary || "Your headline"}</h3><p dir="auto">{previewScene?.secondary}</p></div><small>{totalDuration}s · {form.animation}</small></div><p className="admin-preview-note">This compact preview shows the template’s visual identity. The creator uses the full GSAP and Three.js renderer.</p></aside>
          </div>
        </section>
      </div>
    </main>
  );
}
