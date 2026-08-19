"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmailBlock, EmailCampaignConfig } from "../../lib/email-builder";
import type { EmailStudioConcept } from "../../lib/email-studio";

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "archived";
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
  footerText: "You're receiving this email because you created a MotionMint account.",
  blocks: [
    { type: "heading", text: "Your next campaign starts here" },
    { type: "paragraph", text: "Tell people what's new, what's launching, or what's worth their time." },
    { type: "button", label: "Open the studio", href: "https://motionmint.app/create" },
  ],
});

const blankForm = () => ({ name: "New campaign", subject: "", preheader: "", config: blankConfig() });

export function EmailStudio() {
  const [items, setItems] = useState<CampaignRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [form, setForm] = useState(blankForm());
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("Loading campaigns…");
  const [recipients, setRecipients] = useState("");
  const [studioBrief, setStudioBrief] = useState(
    "Write a friendly email announcing a new feature for our users, with a clear call to action to try it.",
  );
  const [studioTone, setStudioTone] = useState("Confident");
  const [studioGoal, setStudioGoal] = useState("");
  const [concepts, setConcepts] = useState<EmailStudioConcept[]>([]);
  const [studioState, setStudioState] = useState<"idle" | "generating" | "error">("idle");
  const [studioMessage, setStudioMessage] = useState(
    "AI copy director ready · prompts are sent only when you press Generate",
  );

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/admin/email-campaigns", { cache: "no-store" });
      if (!response.ok) throw new Error("The local database is unavailable.");
      const data = (await response.json()) as { campaigns: CampaignRecord[] };
      setItems(data.campaigns);
      setState("ready");
      setMessage(`${data.campaigns.length} campaigns`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not load campaigns.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const select = (item: CampaignRecord) => {
    setSelectedId(item.id);
    setForm({ name: item.name, subject: item.subject, preheader: item.preheader || "", config: item.config });
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

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      setState("error");
      setMessage("Name and subject are required.");
      return;
    }
    setState("saving");
    setMessage("Saving campaign…");
    const response = await fetch(
      selectedId ? `/api/admin/email-campaigns/${selectedId}` : "/api/admin/email-campaigns",
      {
        method: selectedId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setState("error");
      setMessage(result.error ?? "Could not save the campaign.");
      return;
    }
    const result = (await response.json()) as { campaign: { id: string } };
    setSelectedId(result.campaign.id);
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
    const response = await fetch(`/api/admin/email-campaigns/${selectedId}/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipients: list }),
    });
    const result = (await response.json().catch(() => ({}))) as { queued?: number; error?: string };
    setMessage(response.ok ? `${result.queued} recipient(s) queued for sending.` : result.error || "Could not queue send.");
    await load();
  };

  const generateConcepts = async () => {
    setStudioState("generating");
    setStudioMessage("Generating three email drafts…");
    try {
      const response = await fetch("/api/admin/email-studio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: studioBrief, tone: studioTone, goal: studioGoal || undefined }),
      });
      const result = (await response.json()) as {
        concepts?: EmailStudioConcept[];
        error?: string;
        note?: string;
        provider?: string;
        simulated?: boolean;
      };
      if (!response.ok || !result.concepts) throw new Error(result.error || "Could not generate email drafts.");
      setConcepts(result.concepts);
      setStudioState("idle");
      setStudioMessage(
        `${result.concepts.length} original drafts generated${result.simulated ? " with fallback" : ` by ${result.provider || "OpenAI"}`} · ${result.note || "review before sending"}`,
      );
    } catch (error) {
      setStudioState("error");
      setStudioMessage(error instanceof Error ? error.message : "Could not generate email drafts.");
    }
  };

  const applyConcept = (concept: EmailStudioConcept) => {
    setSelectedId(undefined);
    setForm({ name: concept.name, subject: concept.subject, preheader: concept.preheader, config: concept.config });
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
          {state === "loading" && !items.length && <p className="admin-empty">Loading…</p>}
          {items.map((item) => (
            <button key={item.id} className={selectedId === item.id ? "active" : ""} onClick={() => select(item)}>
              <span className="admin-swatch" style={{ background: item.config.accent }} />
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
            <p className="eyebrow">{selectedId ? "Edit campaign" : "New campaign"}</p>
            <h2>{form.name || "Untitled campaign"}</h2>
            <p>{message}</p>
          </div>
          <button className="admin-save" onClick={save} disabled={state === "saving"}>
            {state === "saving" ? "Saving…" : "Save campaign"}
          </button>
        </div>
        {state === "error" && <p className="admin-error">{message}</p>}
        <div className="admin-content">
          <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
            <fieldset className="admin-ai-studio">
              <legend>
                AI Email Studio <span>original drafts, generated on request</span>
              </legend>
              <div className="admin-ai-intro">
                <b>Draft a campaign from a brief</b>
                <span>{studioState === "generating" ? "Generating…" : "Ready"}</span>
              </div>
              <label>
                Creative brief
                <textarea rows={3} value={studioBrief} onChange={(event) => setStudioBrief(event.target.value)} />
              </label>
              <div className="admin-ai-options admin-grid two">
                <label>
                  Tone
                  <input value={studioTone} onChange={(event) => setStudioTone(event.target.value)} placeholder="Confident, warm, playful…" />
                </label>
                <label>
                  Goal
                  <input value={studioGoal} onChange={(event) => setStudioGoal(event.target.value)} placeholder="Announce a launch, drive a promotion…" />
                </label>
              </div>
              <div className="admin-ai-generate">
                <button type="button" onClick={generateConcepts} disabled={studioState === "generating"}>
                  {studioState === "generating" ? "Generating…" : "Generate 3 drafts"}
                </button>
                <small className={studioState === "error" ? "error" : ""}>{studioMessage}</small>
              </div>
              {concepts.length > 0 && (
                <div className="admin-ai-concepts email-concepts">
                  {concepts.map((concept) => (
                    <article key={concept.id}>
                      <div className="admin-ai-concept-copy">
                        <p>{Math.round(concept.confidence * 100)}% confidence</p>
                        <h4>{concept.subject}</h4>
                        <span>{concept.preheader}</span>
                        <small>{concept.rationale}</small>
                        <button type="button" onClick={() => applyConcept(concept)}>
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
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  Subject line
                  <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
                </label>
              </div>
              <label>
                Preheader
                <input value={form.preheader} onChange={(event) => setForm((current) => ({ ...current, preheader: event.target.value }))} />
              </label>
              <div className="admin-grid three">
                <label>
                  Brand name
                  <input
                    value={form.config.brandName}
                    onChange={(event) => setForm((current) => ({ ...current, config: { ...current.config, brandName: event.target.value } }))}
                  />
                </label>
                <label>
                  Accent colour
                  <input
                    type="color"
                    value={form.config.accent}
                    onChange={(event) => setForm((current) => ({ ...current, config: { ...current.config, accent: event.target.value } }))}
                  />
                </label>
                <label>
                  Background
                  <input
                    type="color"
                    value={form.config.backgroundColor}
                    onChange={(event) => setForm((current) => ({ ...current, config: { ...current.config, backgroundColor: event.target.value } }))}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Content blocks</legend>
              <p className="admin-field-note">
                Each block becomes an MJML section. Images should point to a hosted PNG export of your MotionMint banner.
              </p>
              {form.config.blocks.map((block, index) => (
                <div key={index} className="admin-scene">
                  <div className="admin-scene-title">
                    <b>{block.type}</b>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          config: { ...current.config, blocks: current.config.blocks.filter((_, i) => i !== index) },
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  {(block.type === "heading" || block.type === "paragraph") && (
                    <label>
                      Text
                      <textarea
                        rows={block.type === "paragraph" ? 3 : 1}
                        value={block.text}
                        onChange={(event) => updateBlock(index, { text: event.target.value } as Partial<EmailBlock>)}
                      />
                    </label>
                  )}
                  {block.type === "image" && (
                    <label>
                      Image URL
                      <input value={block.src} onChange={(event) => updateBlock(index, { src: event.target.value } as Partial<EmailBlock>)} />
                    </label>
                  )}
                  {block.type === "button" && (
                    <div className="admin-grid two">
                      <label>
                        Label
                        <input value={block.label} onChange={(event) => updateBlock(index, { label: event.target.value } as Partial<EmailBlock>)} />
                      </label>
                      <label>
                        Link
                        <input value={block.href} onChange={(event) => updateBlock(index, { href: event.target.value } as Partial<EmailBlock>)} />
                      </label>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="admin-add-scene"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    config: { ...current.config, blocks: [...current.config.blocks, { type: "paragraph", text: "New paragraph" }] },
                  }))
                }
              >
                ＋ Add paragraph block
              </button>
            </fieldset>

            {selectedId && (
              <fieldset>
                <legend>Send</legend>
                <label>
                  Recipients (comma or newline separated)
                  <textarea rows={3} value={recipients} onChange={(event) => setRecipients(event.target.value)} placeholder="ada@example.com, grace@example.com" />
                </label>
                <button type="button" className="admin-save" onClick={queueSend}>
                  Queue send
                </button>
                <p className="admin-field-note">
                  Sends are queued in the database. Dispatch to your email provider (Resend, Postmark, etc.) runs from a
                  scheduled worker, not from this request.
                </p>
              </fieldset>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
