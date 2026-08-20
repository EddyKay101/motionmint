"use client";
/* eslint-disable @next/next/no-img-element -- customer-selected data URLs cannot use the Next image optimiser */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildCampaignMjml,
  compileCampaignHtml,
  validateCampaignConfig,
  type EmailBlock,
  type EmailCampaignConfig,
} from "../../../../lib/email-builder";

type TemplatePayload = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  config: EmailCampaignConfig;
};
type Draft = { title: string; subject: string; preheader: string; config: EmailCampaignConfig };
type BannerProject = {
  id: string; title: string; templateId: string; category?: string; ratio?: "9:16" | "1:1" | "16:9";
  scenes?: Array<{ primary?: string; secondary?: string }>;
  theme?: { base?: string; accent?: string; text?: string; font?: string; motionPreset?: string };
};

const addable: EmailBlock["type"][] = ["heading", "paragraph", "image", "button", "divider", "spacer"];
const labels: Record<EmailBlock["type"], string> = { heading: "Heading", paragraph: "Paragraph", image: "Image", button: "Button", divider: "Divider", spacer: "Spacer" };
const makeBlock = (type: EmailBlock["type"]): EmailBlock => {
  if (type === "heading") return { type, text: "A new headline", size: 30 };
  if (type === "paragraph") return { type, text: "Add useful supporting copy here." };
  if (type === "image") return { type, src: "https://placehold.co/1200x628/png", alt: "Email image" };
  if (type === "button") return { type, label: "Learn more", href: "https://example.com" };
  if (type === "spacer") return { type, height: 24 };
  return { type: "divider" };
};
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "turnbine-email";
const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
};
const ownerStorageKey = "turnbine.owner.v1";
const projectStorageKey = "turnbine.project.v1";
const legacyOwnerStorageKey = "motionmint.owner.v1";
const legacyProjectStorageKey = "motionmint.project.v1";
const getOwnerKey = () => {
  let key = localStorage.getItem(ownerStorageKey) || localStorage.getItem(legacyOwnerStorageKey);
  if (!key) key = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  localStorage.setItem(ownerStorageKey, key);
  return key;
};
const bannerSnapshot = (project: BannerProject) => {
  const ratio = project.ratio || "16:9";
  const [width, height] = ratio === "9:16" ? [675, 1200] : ratio === "1:1" ? [900, 900] : [1200, 675];
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Your browser could not create the image.");
  const base = project.theme?.base || "#171522", accent = project.theme?.accent || "#bdf532", ink = project.theme?.text || "#ffffff";
  context.fillStyle = base; context.fillRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, `${accent}dd`); gradient.addColorStop(1, `${accent}00`);
  context.fillStyle = gradient; context.beginPath(); context.moveTo(width * .52, 0); context.lineTo(width, 0); context.lineTo(width, height * .72); context.closePath(); context.fill();
  context.globalAlpha = .16; context.fillStyle = ink; context.beginPath(); context.arc(width * .84, height * .82, Math.min(width, height) * .27, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1;
  const pad = width * .075, scene = project.scenes?.[0]; context.fillStyle = accent; context.font = `700 ${Math.max(15, width * .018)}px Arial`; context.fillText((project.category || "TURNBINE").toUpperCase(), pad, height * .13);
  const drawLines = (value: string, y: number, size: number, weight: number, color: string) => {
    context.fillStyle = color; context.font = `${weight} ${size}px ${project.theme?.font || "Arial"}, Arial`; const max = width - pad * 2; const words = value.split(/\s+/); let line = "", cursor = y;
    for (const word of words) { const test = line ? `${line} ${word}` : word; if (context.measureText(test).width > max && line) { context.fillText(line, pad, cursor); line = word; cursor += size * 1.08; } else line = test; }
    if (line) context.fillText(line, pad, cursor); return cursor;
  };
  const primarySize = Math.round(Math.min(width * .085, height * .09)); const last = drawLines(scene?.primary || project.title || "Untitled creative", height * .39, primarySize, 700, ink);
  if (scene?.secondary) drawLines(scene.secondary, last + primarySize * 1.25, Math.round(primarySize * .42), 500, ink);
  context.fillStyle = accent; context.fillRect(pad, height - pad, width * .18, Math.max(6, height * .008));
  return canvas.toDataURL("image/png");
};

export function EmailCreator({ templateId }: { templateId: string }) {
  const [template, setTemplate] = useState<TemplatePayload>();
  const [draft, setDraft] = useState<Draft>();
  const [status, setStatus] = useState("Loading template…");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [bannerProjects, setBannerProjects] = useState<BannerProject[]>([]);
  const [creativeOpen, setCreativeOpen] = useState(false);
  const [creativeHref, setCreativeHref] = useState("");
  const storageKey = `turnbine.email.${templateId}`;

  useEffect(() => {
    void fetch(`/api/email-templates/${encodeURIComponent(templateId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("This email template is unavailable.");
        return response.json() as Promise<{ template: TemplatePayload }>;
      })
      .then(({ template: item }) => {
        setTemplate(item);
        const saved = localStorage.getItem(storageKey);
        setDraft(saved ? JSON.parse(saved) as Draft : { title: item.name, subject: item.subject, preheader: item.preheader || "", config: item.config });
        setStatus(saved ? "Local draft restored" : "Template ready");
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load template."));
  }, [storageKey, templateId]);

  const loadBannerProjects = async () => {
    setCreativeOpen(true); setStatus("Loading your Turnbine creatives…");
    let local: BannerProject | undefined;
    try { const raw = localStorage.getItem(projectStorageKey) || localStorage.getItem(legacyProjectStorageKey); if (raw) { local = JSON.parse(raw) as BannerProject; localStorage.setItem(projectStorageKey, raw); } } catch { /* ignore damaged local project */ }
    try {
      const response = await fetch("/api/projects", { headers: { "x-turnbine-owner": getOwnerKey() }, cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json() as { projects?: Array<{ project: BannerProject }> };
      const unique = new Map<string, BannerProject>(); if (local?.id) unique.set(local.id, local); result.projects?.forEach(({ project }) => unique.set(project.id, project));
      setBannerProjects([...unique.values()]); setStatus(unique.size ? "Choose a creative to insert" : "No saved banner projects yet");
    } catch { setBannerProjects(local ? [local] : []); setStatus(local ? "Showing your local banner project" : "Create and save a banner first"); }
  };
  const insertBannerProject = (project: BannerProject) => {
    try {
      const block: EmailBlock = { type: "image", src: bannerSnapshot(project), alt: `${project.title} Turnbine creative`, href: creativeHref.trim() || undefined };
      setDraft((current) => current ? { ...current, config: { ...current.config, blocks: [...current.config.blocks, block] } } : current);
      setCreativeOpen(false); setStatus(`${project.title} inserted as an email-safe image`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not create the image"); }
  };

  useEffect(() => {
    if (!draft) return;
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(draft)); setStatus("Saved on this device"); }
      catch { setStatus("This draft is too large to autosave · use a smaller image"); }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, storageKey]);

  const compiled = useMemo(() => draft ? compileCampaignHtml(draft.config) : { html: "", errors: [] }, [draft]);
  const mjml = useMemo(() => draft ? buildCampaignMjml(draft.config) : "", [draft]);
  const errors = useMemo(() => draft ? validateCampaignConfig(draft.config) : [], [draft]);
  const updateBlock = (index: number, patch: Partial<EmailBlock>) => setDraft((current) => current ? ({ ...current, config: { ...current.config, blocks: current.config.blocks.map((block, position) => position === index ? { ...block, ...patch } as EmailBlock : block) } }) : current);
  const uploadImage = (index: number, file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { setStatus("Choose a PNG, JPG, WebP or GIF image"); return; }
    if (file.size > 1_500_000) { setStatus("Images must be smaller than 1.5 MB for local email drafts"); return; }
    const reader = new FileReader();
    reader.onerror = () => setStatus("Could not read that image");
    reader.onload = () => { updateBlock(index, { src: String(reader.result), alt: file.name.replace(/\.[^.]+$/, "") } as Partial<EmailBlock>); setStatus(`${file.name} added locally`); };
    reader.readAsDataURL(file);
  };
  const move = (index: number, amount: -1 | 1) => setDraft((current) => {
    if (!current) return current; const target = index + amount; if (target < 0 || target >= current.config.blocks.length) return current;
    const blocks = [...current.config.blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    return { ...current, config: { ...current.config, blocks } };
  });

  if (!draft) return <main className="email-creator-loading"><Link href="/">Turnbine</Link><p>{status}</p><Link href="/email">← Back to email templates</Link></main>;

  return (
    <main className="email-creator-page">
      <header className="email-creator-nav">
        <Link className="showcase-brand" href="/">Turnbine<i /></Link>
        <div><Link href="/email">← Templates</Link><span>{template?.name}</span></div>
        <p>{status}</p>
      </header>
      <section className="email-creator-workspace">
        <div className="email-creator-controls">
          <div className="email-creator-title"><p>Your email project</p><input aria-label="Project title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div>
          <fieldset>
            <legend>Message details</legend>
            <label>Subject line<input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></label>
            <label>Preheader<input value={draft.preheader} onChange={(event) => setDraft({ ...draft, preheader: event.target.value })} /></label>
            <div className="email-creator-colours">
              <label>Accent<input type="color" value={draft.config.accent} onChange={(event) => setDraft({ ...draft, config: { ...draft.config, accent: event.target.value } })} /></label>
              <label>Background<input type="color" value={draft.config.backgroundColor} onChange={(event) => setDraft({ ...draft, config: { ...draft.config, backgroundColor: event.target.value } })} /></label>
              <label>Text<input type="color" value={draft.config.textColor} onChange={(event) => setDraft({ ...draft, config: { ...draft.config, textColor: event.target.value } })} /></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Content</legend>
            {draft.config.blocks.map((block, index) => (
              <article className="email-user-block" key={`${block.type}-${index}`}>
                <header><b>{index + 1}. {labels[block.type]}</b><div><button disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button disabled={index === draft.config.blocks.length - 1} onClick={() => move(index, 1)}>↓</button><button disabled={draft.config.blocks.length === 1} onClick={() => setDraft({ ...draft, config: { ...draft.config, blocks: draft.config.blocks.filter((_, position) => position !== index) } })}>Remove</button></div></header>
                {(block.type === "heading" || block.type === "paragraph") && <label>Text<textarea rows={block.type === "heading" ? 2 : 4} value={block.text} onChange={(event) => updateBlock(index, { text: event.target.value })} /></label>}
                {block.type === "heading" && <label>Size<input type="range" min="16" max="64" value={block.size || 26} onChange={(event) => updateBlock(index, { size: Number(event.target.value) })} /></label>}
                {block.type === "image" && <><label className="email-image-upload">Upload from your device<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { uploadImage(index, event.target.files?.[0]); event.currentTarget.value = ""; }} /><span>{block.src.startsWith("data:image/") ? "Image stored privately in this draft · choose another" : "Choose PNG, JPG, WebP or animated GIF"}</span></label>{block.src && <img className="email-upload-thumb" src={block.src} alt="Current email block preview" />}<label>Or use a hosted image URL<input type="url" value={block.src.startsWith("data:image/") ? "" : block.src} placeholder="https://…" onChange={(event) => updateBlock(index, { src: event.target.value } as Partial<EmailBlock>)} /></label><label>Alternative text<input value={block.alt || ""} onChange={(event) => updateBlock(index, { alt: event.target.value } as Partial<EmailBlock>)} /></label><label>Click destination (optional)<input type="url" value={block.href || ""} placeholder="https://…" onChange={(event) => updateBlock(index, { href: event.target.value || undefined } as Partial<EmailBlock>)} /></label><small className="email-image-delivery-note">Animated GIFs play in many inboxes; some versions of Outlook show only the first frame.</small></>}
                {block.type === "button" && <><label>Button label<input value={block.label} onChange={(event) => updateBlock(index, { label: event.target.value } as Partial<EmailBlock>)} /></label><label>Destination<input type="url" value={block.href} onChange={(event) => updateBlock(index, { href: event.target.value } as Partial<EmailBlock>)} /></label></>}
                {block.type === "spacer" && <label>Height<input type="range" min="4" max="160" step="4" value={block.height || 24} onChange={(event) => updateBlock(index, { height: Number(event.target.value) } as Partial<EmailBlock>)} /></label>}
              </article>
            ))}
            <div className="email-user-add"><span>Add block</span>{addable.map((type) => <button key={type} onClick={() => setDraft({ ...draft, config: { ...draft.config, blocks: [...draft.config.blocks, makeBlock(type)] } })}>＋ {labels[type]}</button>)}</div>
            <div className="email-turnbine-insert">
              <div><b>Insert a Turnbine creative</b><p>Reuse one of your saved banner projects as a clickable, email-safe visual.</p></div>
              <button onClick={() => void loadBannerProjects()}>Browse my creatives</button>
              {creativeOpen && <div className="email-creative-picker"><label>Click destination (optional)<input type="url" value={creativeHref} placeholder="https://your-page.com" onChange={(event) => setCreativeHref(event.target.value)} /></label>{bannerProjects.length ? <div>{bannerProjects.map((project) => <button key={project.id} onClick={() => insertBannerProject(project)}><span style={{ background: project.theme?.base || "#171522", color: project.theme?.text || "#fff", borderColor: project.theme?.accent || "#bdf532" }}>{project.scenes?.[0]?.primary || project.title}</span><b>{project.title}</b><small>{project.ratio || "16:9"} · {project.theme?.motionPreset || "motion"}</small></button>)}</div> : <p className="email-empty-creatives">No saved creatives found. <Link href="/create">Create a banner first →</Link></p>}<small>The email receives a static fallback now. For animation, upload a rendered GIF; one-click GIF rendering will connect to the production render worker.</small></div>}
            </div>
          </fieldset>
        </div>
        <aside className="email-user-preview">
          <div className="email-user-preview-head"><div><p>Live email</p><h1>{draft.subject || "Your subject"}</h1><span>{draft.preheader || "Your preheader"}</span></div><div><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}>Desktop</button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}>Mobile</button></div></div>
          {errors.length ? <div className="email-user-errors"><b>Fix these items</b><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : <div className={`email-user-frame ${device}`}><iframe title="Email project preview" srcDoc={compiled.html} sandbox="allow-popups allow-popups-to-escape-sandbox" /></div>}
          <div className="email-user-downloads"><button disabled={Boolean(errors.length)} onClick={() => download(`${slug(draft.title)}.mjml`, mjml, "text/plain;charset=utf-8")}>Download MJML</button><button disabled={Boolean(errors.length)} onClick={() => download(`${slug(draft.title)}.html`, compiled.html, "text/html;charset=utf-8")}>Download HTML</button></div>
          <small>Your edits autosave privately on this device.</small>
        </aside>
      </section>
    </main>
  );
}
