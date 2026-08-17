# MotionMint MVP architecture

## Backend foundation

- Cloudflare D1 stores JSON-driven templates, projects, media records and render-job state.
- A random per-install owner key scopes project and render APIs until account authentication is added.
- Local storage remains the offline draft and instant autosave layer; database sync is best-effort.
- Uploaded image, video and audio bytes remain on the customer device. R2 is intentionally disabled until authenticated private uploads are introduced.
- `POST /api/render-jobs` queues the deterministic headless-browser + FFmpeg contract. It does not yet run the production renderer.
- Template writes require a server-side `MOTIONMINT_ADMIN_KEY`; published templates are available through the catalogue endpoint.

## Prototype audit

The two source projects remain unchanged. Reusable patterns:

- `banner-creation`: fixed-design canvas scaled to its viewport, GSAP composition timelines, per-scene durations, bilingual/RTL text, local image/video and soundtrack object URLs, WebM capture, and documented FFmpeg output settings.
- `afro-nasheed`: Vite modules, media-time-driven GSAP seeking, renderer lifecycle and disposal, transparent atmospheric layers, lyric timing data, responsive 16:9 composition, and asset provenance.

The browser screen-recording path is deliberately not carried forward as the production renderer because it is not deterministic. The heavy procedural Three.js scene is also excluded from the mobile MVP.

## Boundaries

`TemplateDefinition` describes defaults and creative constraints. `Project` stores a user's content, chosen theme, aspect ratio, scene order/timing, and local media references. The preview consumes only project plus template data. The backend now accepts that same document and creates a durable `RenderRequest`; a future worker will render exact frames before FFmpeg encoding.

Local media blobs are session-only in this vertical slice. Project text/settings and original filenames autosave to localStorage; production local persistence should promote blobs to IndexedDB after storage quota UX is added.

## Project document (v1)

```ts
type Project = {
  schemaVersion: 1
  id: string
  title: string
  templateId: string
  category: string // open string; never a religious enum
  ratio: '9:16' | '1:1' | '16:9'
  scenes: Array<{ id: string; primary: string; secondary: string; duration: number }>
  theme: { accent: string; text: string; overlay: number; font: string }
  media: { underlayName?: string; soundtrackName?: string }
  updatedAt: string
}
```

## Later adapters

- `ProjectStore`: localStorage offline draft plus D1 synchronization today; authenticated account ownership later.
- `MediaStore`: browser object URLs today; encrypted object storage with signed URLs later.
- `Renderer`: GSAP DOM preview today; deterministic Chromium frame capture plus FFmpeg H.264/AAC later.
- `RenderQueue`: durable D1 jobs today; worker processing and progress events later.

Authentication, billing, sharing, cloud uploads and actual render execution are outside the current backend boundary.
