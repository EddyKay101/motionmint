export type EmailBlock =
  | { type: "image"; src: string; alt?: string; href?: string }
  | { type: "heading"; text: string; size?: number }
  | { type: "paragraph"; text: string }
  | { type: "button"; label: string; href: string }
  | { type: "divider" }
  | { type: "spacer"; height?: number };

export type EmailCampaignConfig = {
  brandName: string;
  accent: string;
  backgroundColor: string;
  textColor: string;
  blocks: EmailBlock[];
  footerText: string;
};

const escapeHtml = (value: string) =>
  value.replace(/[<>&"]/g, (char) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[char] || char,
  );

function renderBlockMjml(block: EmailBlock, accent: string, textColor: string): string {
  switch (block.type) {
    case "image": {
      const image = `<mj-image src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" padding="0" />`;
      return block.href
        ? `<mj-column><a href="${escapeHtml(block.href)}">${image}</a></mj-column>`
        : `<mj-column>${image}</mj-column>`;
    }
    case "heading":
      return `<mj-column><mj-text font-size="${block.size || 26}px" font-weight="700" color="${textColor}" padding="16px 24px 0">${escapeHtml(block.text)}</mj-text></mj-column>`;
    case "paragraph":
      return `<mj-column><mj-text font-size="15px" line-height="1.6" color="${textColor}" padding="8px 24px">${escapeHtml(block.text)}</mj-text></mj-column>`;
    case "button":
      return `<mj-column><mj-button background-color="${accent}" href="${escapeHtml(block.href)}" padding="20px 24px">${escapeHtml(block.label)}</mj-button></mj-column>`;
    case "divider":
      return `<mj-column><mj-divider border-color="${accent}" padding="16px 24px" /></mj-column>`;
    case "spacer":
      return `<mj-column><mj-spacer height="${block.height || 24}px" /></mj-column>`;
    default:
      return "";
  }
}

/** Kept for portability: lets an admin copy this markup into any MJML editor/CLI outside the app. */
export function buildCampaignMjml(config: EmailCampaignConfig): string {
  const sections = config.blocks
    .map((block) => `<mj-section>${renderBlockMjml(block, config.accent, config.textColor)}</mj-section>`)
    .join("");
  return `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="${config.backgroundColor}">
    <mj-section padding="24px 24px 0">
      <mj-column>
        <mj-text font-size="12px" font-weight="800" letter-spacing="1px" color="${config.accent}" text-transform="uppercase">${escapeHtml(config.brandName)}</mj-text>
      </mj-column>
    </mj-section>
    ${sections}
    <mj-section padding="24px">
      <mj-column>
        <mj-text font-size="11px" color="${config.textColor}" align="center">${escapeHtml(config.footerText)}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}

// Direct table-based HTML generation (no MJML runtime compiler). The MJML
// compiler (mjml/mjml-browser) bundles a Node `buffer` polyfill that breaks
// when actually invoked inside the Cloudflare Workers edge runtime, so we
// emit the same style of email-safe, inline-styled, 600px table markup
// ourselves instead of depending on it at request time.
function renderBlockHtml(block: EmailBlock, accent: string, textColor: string): string {
  const cell = (content: string, padding = "16px 24px") =>
    `<tr><td style="padding:${padding};font-family:Arial,Helvetica,sans-serif;">${content}</td></tr>`;
  switch (block.type) {
    case "image": {
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />`;
      return cell(block.href ? `<a href="${escapeHtml(block.href)}">${img}</a>` : img, "0");
    }
    case "heading":
      return cell(
        `<h1 style="margin:0;font-size:${block.size || 26}px;font-weight:700;color:${textColor};line-height:1.25;">${escapeHtml(block.text)}</h1>`,
        "16px 24px 0",
      );
    case "paragraph":
      return cell(
        `<p style="margin:0;font-size:15px;line-height:1.6;color:${textColor};">${escapeHtml(block.text)}</p>`,
      );
    case "button":
      return cell(
        `<a href="${escapeHtml(block.href)}" style="display:inline-block;padding:12px 22px;border-radius:6px;background:${accent};color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;">${escapeHtml(block.label)}</a>`,
        "20px 24px",
      );
    case "divider":
      return cell(`<hr style="border:none;border-top:1px solid ${accent};margin:0;" />`);
    case "spacer":
      return `<tr><td style="height:${block.height || 24}px;line-height:${block.height || 24}px;font-size:0;">&nbsp;</td></tr>`;
    default:
      return "";
  }
}

export function compileCampaignHtml(config: EmailCampaignConfig): { html: string; errors: string[] } {
  const rows = config.blocks
    .map((block) => renderBlockHtml(block, config.accent, config.textColor))
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(config.brandName)}</title>
</head>
<body style="margin:0;padding:0;background:${config.backgroundColor};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${config.backgroundColor};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
<tr><td style="padding:24px 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;letter-spacing:1px;color:${config.accent};text-transform:uppercase;">${escapeHtml(config.brandName)}</td></tr>
${rows}
<tr><td style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${config.textColor};text-align:center;">${escapeHtml(config.footerText)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  return { html, errors: [] };
}
