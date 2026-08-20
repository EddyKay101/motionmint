"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCampaignMjml,
  compileCampaignHtml,
  validateCampaignConfig,
  type EmailBlock,
  type EmailCampaignConfig,
} from "../../lib/email-builder";
import type { EmailStudioConcept } from "../../lib/email-studio";

type CampaignStatus = "draft" | "published" | "scheduled" | "sending" | "sent" | "archived";
type CampaignRecord = {
  id: string;
  name: string;
  status: CampaignStatus;
  subject: string;
  preheader: string | null;
  config: EmailCampaignConfig;
  updatedAt: string;
};

const blankConfig = (): EmailCampaignConfig => ({
  brandName: "MotionMint",
  accent: "#6d5bff",
  backgroundColor: "#f7f5fb",
  textColor: "#14121d",
  footerText:
    "You're receiving this email because you created a MotionMint account.",
  blocks: [
    { type: "heading", text: "Your next campaign starts here" },
    {
      type: "paragraph",
      text: "Tell people what's new, what's launching, or what's worth their time.",
    },
    {
      type: "button",
      label: "Open the studio",
      href: "https://motionmint.app/create",
    },
  ],
});

const blankForm = () => ({
  name: "New campaign",
  status: "draft" as CampaignStatus,
  subject: "",
  preheader: "",
  config: blankConfig(),
});

const blockLabels: Record<EmailBlock["type"], string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
};

const newBlock = (type: EmailBlock["type"]): EmailBlock => {
  switch (type) {
    case "heading": return { type, text: "A clear, compelling headline", size: 32 };
    case "paragraph": return { type, text: "Add concise supporting copy that is useful and easy to scan." };
    case "image": return { type, src: "https://placehold.co/1200x628/png", alt: "Campaign image" };
    case "button": return { type, label: "Learn more", href: "https://example.com" };
    case "divider": return { type };
    case "spacer": return { type, height: 24 };
  }
};

const downloadText = (filename: string, value: string, type: string) => {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const fileSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "motionmint-email";

export function EmailStudio() {
  const [items, setItems] = useState<CampaignRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [form, setForm] = useState(blankForm());
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Loading campaigns…");
  const [recipients, setRecipients] = useState("");
  const [studioBrief, setStudioBrief] = useState(
    "Write a friendly email announcing a new feature for our users, with a clear call to action to try it.",
  );
  const [studioTone, setStudioTone] = useState("Confident");
  const [studioGoal, setStudioGoal] = useState("");
  const [concepts, setConcepts] = useState<EmailStudioConcept[]>([]);
  const [studioState, setStudioState] = useState<
    "idle" | "generating" | "error"
  >("idle");
  const [studioMessage, setStudioMessage] = useState(
    "AI copy director ready · prompts are sent only when you press Generate",
  );
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [previewMode, setPreviewMode] = useState<"preview" | "mjml" | "html">("preview");
  const [copied, setCopied] = useState(false);
  const compiled = useMemo(() => compileCampaignHtml(form.config), [form.config]);
  const mjml = useMemo(() => buildCampaignMjml(form.config), [form.config]);
  const validationErrors = useMemo(() => validateCampaignConfig(form.config), [form.config]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/admin/email-campaigns", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("The local database is unavailable.");
      const data = (await response.json()) as { campaigns: CampaignRecord[] };
      setItems(data.campaigns);
      setState("ready");
      setMessage(`${data.campaigns.length} campaigns`);
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Could not load campaigns.",
      );
    }
  }, []);

  useEffect(() => {
    // The initial request owns this view's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const select = (item: CampaignRecord) => {
    setSelectedId(item.id);
    setForm({
      name: item.name,
      status: item.status,
      subject: item.subject,
      preheader: item.preheader || "",
      config: item.config,
    });
    setMessage(`Editing ${item.name}`);
  };

  const updateBlock = (index: number, patch: Partial<EmailBlock>) =>
    setForm((current) => ({
      ...current,
      config: {
        ...current.config,
        blocks: current.config.blocks.map((block, i) =>
          i === index ? ({ ...block, ...patch } as EmailBlock) : block,
        ),
      },
    }));

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.config.blocks.length) return;
    setForm((current) => {
      const blocks = [...current.config.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, config: { ...current.config, blocks } };
    });
  };

  const duplicateBlock = (index: number) =>
    setForm((current) => ({
      ...current,
      config: {
        ...current.config,
        blocks: [
          ...current.config.blocks.slice(0, index + 1),
          { ...current.config.blocks[index] },
          ...current.config.blocks.slice(index + 1),
        ],
      },
    }));

  const addBlock = (type: EmailBlock["type"]) =>
    setForm((current) => ({
      ...current,
      config: { ...current.config, blocks: [...current.config.blocks, newBlock(type)] },
    }));

  const copySource = async () => {
    const source = previewMode === "html" ? compiled.html : mjml;
    await navigator.clipboard.writeText(source);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const save = async (statusOverride?: CampaignStatus) => {
    if (!form.name.trim() || !form.subject.trim()) {
      setState("error");
      setMessage("Name and subject are required.");
      return;
    }
    if (validationErrors.length) {
      setState("error");
      setMessage(validationErrors[0]);
      return;
    }
    setState("saving");
    setMessage("Saving campaign…");
    const response = await fetch(
      selectedId
        ? `/api/admin/email-campaigns/${selectedId}`
        : "/api/admin/email-campaigns",
      {
        method: selectedId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, status: statusOverride || form.status }),
      },
    );
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setState("error");
      setMessage(result.error ?? "Could not save the campaign.");
      return;
    }
    const result = (await response.json()) as { campaign: { id: string } };
    setSelectedId(result.campaign.id);
    if (statusOverride) setForm((current) => ({ ...current, status: statusOverride }));
    setState("ready");
    setMessage(`${form.name} saved.`);
    await load();
  };

  const queueSend = async () => {
    if (!selectedId) {
      setMessage("Save the campaign before sending.");
      return;
    }
    const list = recipients
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter(Boolean);
    if (!list.length) {
      setMessage("Add at least one recipient email.");
      return;
    }
    const response = await fetch(
      `/api/admin/email-campaigns/${selectedId}/send`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipients: list }),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      queued?: number;
      error?: string;
    };
    setMessage(
      response.ok
        ? `${result.queued} recipient(s) queued for sending.`
        : result.error || "Could not queue send.",
    );
    await load();
  };

  const generateConcepts = async () => {
    setStudioState("generating");
    setStudioMessage("Generating three email drafts…");
    try {
      const response = await fetch("/api/admin/email-studio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: studioBrief,
          tone: studioTone,
          goal: studioGoal || undefined,
        }),
      });
      const result = (await response.json()) as {
        concepts?: EmailStudioConcept[];
        error?: string;
        note?: string;
        provider?: string;
        simulated?: boolean;
      };
      if (!response.ok || !result.concepts)
        throw new Error(result.error || "Could not generate email drafts.");
      setConcepts(result.concepts);
      setStudioState("idle");
      setStudioMessage(
        `${result.concepts.length} original drafts generated${result.simulated ? " with fallback" : ` by ${result.provider || "OpenAI"}`} · ${result.note || "review before sending"}`,
      );
    } catch (error) {
      setStudioState("error");
      setStudioMessage(
        error instanceof Error
          ? error.message
          : "Could not generate email drafts.",
      );
    }
  };

  const applyConcept = (concept: EmailStudioConcept) => {
    setSelectedId(undefined);
    setForm({
      name: concept.name,
      status: "draft",
      subject: concept.subject,
      preheader: concept.preheader,
      config: concept.config,
    });
    setMessage(`Draft "${concept.name}" loaded. Review and save.`);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <div>
            <p className="eyebrow">Campaigns</p>
            <h1>Email</h1>
          </div>
          <button
            className="admin-new"
            onClick={() => {
              setSelectedId(undefined);
              setForm(blankForm());
              setMessage("Creating a new campaign");
            }}
          >
            ＋ New
          </button>
        </div>
        <div className="admin-template-list" aria-label="Email campaigns">
          {state === "loading" && !items.length && (
            <p className="admin-empty">Loading…</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              className={selectedId === item.id ? "active" : ""}
              onClick={() => select(item)}
            >
              <span
                className="admin-swatch"
                style={{ background: item.config.accent }}
              />
              <span>
                <b>{item.name}</b>
                <small>{item.subject}</small>
              </span>
              <i data-status={item.status}>{item.status}</i>
            </button>
          ))}
        </div>
      </aside>

      <section className="admin-editor">
        <div className="admin-editor-head">
          <div>
            <p className="eyebrow">
              {selectedId ? "Edit campaign" : "New campaign"}
            </p>
            <h2>{form.name || "Untitled campaign"}</h2>
            <p>{message}</p>
          </div>
          <div className="email-admin-save-actions">
            {form.status !== "published" && <button className="email-publish" onClick={() => void save("published")} disabled={state === "saving"}>Publish to users</button>}
            <button className="admin-save" onClick={() => void save()} disabled={state === "saving"}>
              {state === "saving" ? "Saving…" : "Save template"}
            </button>
          </div>
        </div>
        {state === "error" && <p className="admin-error">{message}</p>}
        <div className="admin-content">
          <form
            className="admin-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <fieldset className="admin-ai-studio">
              <legend>
                AI Email Studio{" "}
                <span>original drafts, generated on request</span>
              </legend>
              <div className="admin-ai-intro">
                <b>Draft a campaign from a brief</b>
                <span>
                  {studioState === "generating" ? "Generating…" : "Ready"}
                </span>
              </div>
              <label>
                Creative brief
                <textarea
                  rows={3}
                  value={studioBrief}
                  onChange={(event) => setStudioBrief(event.target.value)}
                />
              </label>
              <div className="admin-ai-options admin-grid two">
                <label>
                  Tone
                  <input
                    value={studioTone}
                    onChange={(event) => setStudioTone(event.target.value)}
                    placeholder="Confident, warm, playful…"
                  />
                </label>
                <label>
                  Goal
                  <input
                    value={studioGoal}
                    onChange={(event) => setStudioGoal(event.target.value)}
                    placeholder="Announce a launch, drive a promotion…"
                  />
                </label>
              </div>
              <div className="admin-ai-generate">
                <button
                  type="button"
                  onClick={generateConcepts}
                  disabled={studioState === "generating"}
                >
                  {studioState === "generating"
                    ? "Generating…"
                    : "Generate 3 drafts"}
                </button>
                <small className={studioState === "error" ? "error" : ""}>
                  {studioMessage}
                </small>
              </div>
              {concepts.length > 0 && (
                <div className="admin-ai-concepts email-concepts">
                  {concepts.map((concept) => (
                    <article key={concept.id}>
                      <div className="admin-ai-concept-copy">
                        <p>
                          {Math.round(concept.confidence * 100)}% confidence
                        </p>
                        <h4>{concept.subject}</h4>
                        <span>{concept.preheader}</span>
                        <small>{concept.rationale}</small>
                        <button
                          type="button"
                          onClick={() => applyConcept(concept)}
                        >
                          Use this draft
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>Details</legend>
              <div className="admin-grid two">
                <label>
                  Campaign name
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Availability
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CampaignStatus }))}>
                    <option value="draft">Draft · admin only</option>
                    <option value="published">Published · visible to users</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label>
                  Subject line
                  <input
                    value={form.subject}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label>
                Preheader
                <input
                  value={form.preheader}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      preheader: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="admin-grid three">
                <label>
                  Brand name
                  <input
                    value={form.config.brandName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        config: {
                          ...current.config,
                          brandName: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  Accent colour
                  <input
                    type="color"
                    value={form.config.accent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        config: {
                          ...current.config,
                          accent: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  Background
                  <input
                    type="color"
                    value={form.config.backgroundColor}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        config: {
                          ...current.config,
                          backgroundColor: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  Text colour
                  <input
                    type="color"
                    value={form.config.textColor}
                    onChange={(event) => setForm((current) => ({ ...current, config: { ...current.config, textColor: event.target.value } }))}
                  />
                </label>
              </div>
              <label>
                Footer copy
                <textarea rows={2} value={form.config.footerText} onChange={(event) => setForm((current) => ({ ...current, config: { ...current.config, footerText: event.target.value } }))} />
              </label>
            </fieldset>

            <fieldset>
              <legend>Content blocks</legend>
              <p className="admin-field-note">
                Each block becomes a responsive MJML section. Image URLs must
                be publicly reachable by recipients&apos; email clients.
              </p>
              {form.config.blocks.map((block, index) => (
                <div key={`${block.type}-${index}`} className="admin-scene email-block-card">
                  <div className="admin-scene-title">
                    <b><span>{index + 1}</span>{blockLabels[block.type]}</b>
                    <div className="email-block-actions">
                      <button type="button" aria-label={`Move ${blockLabels[block.type]} up`} disabled={index === 0} onClick={() => moveBlock(index, -1)}>↑</button>
                      <button type="button" aria-label={`Move ${blockLabels[block.type]} down`} disabled={index === form.config.blocks.length - 1} onClick={() => moveBlock(index, 1)}>↓</button>
                      <button type="button" onClick={() => duplicateBlock(index)}>Duplicate</button>
                      <button
                        type="button"
                        className="email-remove"
                        disabled={form.config.blocks.length === 1}
                        onClick={() => setForm((current) => ({ ...current, config: { ...current.config, blocks: current.config.blocks.filter((_, i) => i !== index) } }))}
                      >Remove</button>
                    </div>
                  </div>
                  {(block.type === "heading" || block.type === "paragraph") && (
                    <label>
                      Text
                      <textarea
                        rows={block.type === "paragraph" ? 3 : 1}
                        value={block.text}
                        onChange={(event) =>
                          updateBlock(index, {
                            text: event.target.value,
                          } as Partial<EmailBlock>)
                        }
                      />
                    </label>
                  )}
                  {block.type === "heading" && (
                    <label>
                      Heading size
                      <div className="email-range">
                        <input type="range" min="16" max="64" value={block.size || 26} onChange={(event) => updateBlock(index, { size: Number(event.target.value) })} />
                        <output>{block.size || 26}px</output>
                      </div>
                    </label>
                  )}
                  {block.type === "image" && (
                    <div className="admin-grid two">
                      <label className="email-wide-field">Image URL<input type="url" value={block.src} onChange={(event) => updateBlock(index, { src: event.target.value } as Partial<EmailBlock>)} /></label>
                      <label>Alternative text<input value={block.alt || ""} onChange={(event) => updateBlock(index, { alt: event.target.value } as Partial<EmailBlock>)} /></label>
                      <label>Optional image link<input type="url" placeholder="https://…" value={block.href || ""} onChange={(event) => updateBlock(index, { href: event.target.value || undefined } as Partial<EmailBlock>)} /></label>
                    </div>
                  )}
                  {block.type === "button" && (
                    <div className="admin-grid two">
                      <label>
                        Label
                        <input
                          value={block.label}
                          onChange={(event) =>
                            updateBlock(index, {
                              label: event.target.value,
                            } as Partial<EmailBlock>)
                          }
                        />
                      </label>
                      <label>
                        Link
                        <input
                          value={block.href}
                          onChange={(event) =>
                            updateBlock(index, {
                              href: event.target.value,
                            } as Partial<EmailBlock>)
                          }
                        />
                      </label>
                    </div>
                  )}
                  {block.type === "divider" && <p className="email-static-block">Accent-colour divider</p>}
                  {block.type === "spacer" && (
                    <label>
                      Space height
                      <div className="email-range">
                        <input type="range" min="4" max="160" step="4" value={block.height || 24} onChange={(event) => updateBlock(index, { height: Number(event.target.value) } as Partial<EmailBlock>)} />
                        <output>{block.height || 24}px</output>
                      </div>
                    </label>
                  )}
                </div>
              ))}
              <div className="email-add-blocks" aria-label="Add content block">
                <span>Add block</span>
                {(Object.keys(blockLabels) as EmailBlock["type"][]).map((type) => (
                  <button type="button" key={type} onClick={() => addBlock(type)}>＋ {blockLabels[type]}</button>
                ))}
              </div>
            </fieldset>

            {selectedId && (
              <fieldset>
                <legend>Send</legend>
                <label>
                  Recipients (comma or newline separated)
                  <textarea
                    rows={3}
                    value={recipients}
                    onChange={(event) => setRecipients(event.target.value)}
                    placeholder="ada@example.com, grace@example.com"
                  />
                </label>
                <button
                  type="button"
                  className="admin-save"
                  onClick={queueSend}
                >
                  Queue send
                </button>
                <p className="admin-field-note">
                  Sends are queued in the database. Dispatch to your email
                  provider (Resend, Postmark, etc.) runs from a scheduled
                  worker, not from this request.
                </p>
              </fieldset>
            )}
          </form>
          <aside className="email-preview-panel" aria-label="Email preview and export">
            <div className="email-preview-heading">
              <div>
                <p className="eyebrow">Live output</p>
                <h3>{form.subject || "Your subject line"}</h3>
                <span>{form.preheader || "Add preheader copy to support the subject."}</span>
              </div>
              <i className={validationErrors.length ? "has-errors" : "is-ready"}>
                {validationErrors.length ? `${validationErrors.length} issue${validationErrors.length === 1 ? "" : "s"}` : "Ready"}
              </i>
            </div>
            <div className="email-preview-tabs" role="tablist" aria-label="Email output view">
              <button type="button" role="tab" aria-selected={previewMode === "preview"} className={previewMode === "preview" ? "active" : ""} onClick={() => setPreviewMode("preview")}>Preview</button>
              <button type="button" role="tab" aria-selected={previewMode === "mjml"} className={previewMode === "mjml" ? "active" : ""} onClick={() => setPreviewMode("mjml")}>MJML</button>
              <button type="button" role="tab" aria-selected={previewMode === "html"} className={previewMode === "html" ? "active" : ""} onClick={() => setPreviewMode("html")}>HTML</button>
            </div>
            {previewMode === "preview" ? (
              <>
                <div className="email-device-toggle" aria-label="Preview width">
                  <button type="button" className={previewWidth === "desktop" ? "active" : ""} onClick={() => setPreviewWidth("desktop")}>Desktop</button>
                  <button type="button" className={previewWidth === "mobile" ? "active" : ""} onClick={() => setPreviewWidth("mobile")}>Mobile</button>
                </div>
                {validationErrors.length ? (
                  <div className="email-validation" role="alert">
                    <b>Fix before saving or exporting</b>
                    <ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul>
                  </div>
                ) : (
                  <div className={`email-preview-stage ${previewWidth}`}>
                    <iframe title="Rendered email preview" srcDoc={compiled.html} sandbox="allow-popups allow-popups-to-escape-sandbox" />
                  </div>
                )}
              </>
            ) : (
              <pre className="email-code"><code>{previewMode === "mjml" ? mjml : compiled.html}</code></pre>
            )}
            <div className="email-export-actions">
              {previewMode !== "preview" && <button type="button" onClick={() => void copySource()}>{copied ? "Copied" : `Copy ${previewMode.toUpperCase()}`}</button>}
              <button type="button" disabled={validationErrors.length > 0} onClick={() => downloadText(`${fileSlug(form.name)}.mjml`, mjml, "text/plain;charset=utf-8")}>Download MJML</button>
              <button type="button" disabled={validationErrors.length > 0} onClick={() => downloadText(`${fileSlug(form.name)}.html`, compiled.html, "text/html;charset=utf-8")}>Download HTML</button>
            </div>
            <p className="email-preview-note">MJML is the portable editable source. The HTML download is the email-safe version ready for testing with an email provider.</p>
          </aside>
        </div>
      </section>
    </div>
  );
}
