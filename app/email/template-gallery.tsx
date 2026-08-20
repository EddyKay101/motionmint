"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EmailCampaignConfig } from "../../lib/email-builder";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  config: EmailCampaignConfig;
};

export function EmailTemplateGallery() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    void fetch("/api/email-templates", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load email templates.");
        return response.json() as Promise<{ templates: EmailTemplate[] }>;
      })
      .then((result) => { setTemplates(result.templates); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  return (
    <main className="email-gallery-page">
      <header className="email-public-nav">
        <Link className="showcase-brand" href="/">Motion<span>Mint</span><i /></Link>
        <nav><Link href="/create">Motion templates</Link><Link className="active" href="/email">Email templates</Link></nav>
        <Link className="email-nav-cta" href="/account">My account</Link>
      </header>
      <section className="email-gallery-hero">
        <p>Responsive email design studio</p>
        <h1>Choose a starting point.<br /><em>Make the message yours.</em></h1>
        <span>Every published template is editable, mobile-ready and available as MJML or email-safe HTML.</span>
      </section>
      {state === "loading" && <div className="email-gallery-state">Loading published templates…</div>}
      {state === "error" && <div className="email-gallery-state error">The template catalogue is unavailable right now.</div>}
      {state === "ready" && !templates.length && (
        <div className="email-gallery-empty"><b>No email templates have been published yet.</b><span>An administrator can publish one from Admin → Email.</span></div>
      )}
      <section className="email-template-grid" aria-label="Published email templates">
        {templates.map((template, index) => {
          const firstHeading = template.config.blocks.find((block) => block.type === "heading");
          const firstParagraph = template.config.blocks.find((block) => block.type === "paragraph");
          const heading = firstHeading?.type === "heading" ? firstHeading.text : template.subject;
          const paragraph = firstParagraph?.type === "paragraph" ? firstParagraph.text : template.preheader;
          return (
            <article key={template.id} style={{ "--email-accent": template.config.accent, "--email-bg": template.config.backgroundColor, "--email-text": template.config.textColor } as React.CSSProperties}>
              <div className="email-template-card-preview">
                <small>{template.config.brandName}</small>
                <h2>{heading}</h2>
                <p>{paragraph}</p>
                <b>Call to action</b>
                <i>0{index + 1}</i>
              </div>
              <div className="email-template-card-copy">
                <span>Responsive · MJML · HTML</span>
                <h3>{template.name}</h3>
                <p>{template.preheader || template.subject}</p>
                <Link href={`/email/create/${template.id}`}>Use this template <b>↗</b></Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
