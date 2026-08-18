# MotionMint

MotionMint is a mobile-first PWA for creating animated social-media banners, lyric videos, HTML5 adverts, event graphics, website heroes, broadcast overlays, and other motion-led visual content.

This repository is a working MVP and product prototype. It turns ideas explored in the earlier `banner-creation` and `afro-nasheed` prototypes into a reusable, JSON-driven editor instead of separate hard-coded banners.

> **Current status:** the browser editor, local media workflow, templates, admin studio, authentication, AI-assisted template drafting, local/database saving, live preview, static downloads, and self-contained HTML exports work. Video/GIF jobs can be queued, but a production headless-browser/FFmpeg worker is not connected yet.

## Product principles

- Category-neutral core model; religious content is supported but never assumed.
- Mobile-first editing with responsive previews and safe text boundaries.
- Content, theme, animation, media, brand, and output profiles are separate concerns.
- Customer uploads stay in the browser during the MVP and are not sent to external media services.
- Browser preview and exports use the same project/template data.
- Production video should use deterministic server rendering and FFmpeg, not mobile screen recording.
- Reduced motion, contrast, RTL text, Arabic shaping, and accessible controls are product requirements.

## Implemented features

### Public product

- Animated showcase homepage at `/`.
- Responsive product hero, banner examples, use cases, workflow, and calls to action.
- Creator at `/create`.
- Installable manifest and service worker.
- Public/creator MotionMint logos link home; the admin logo deliberately does not.

### Creator

- Category and template gallery.
- Six visually distinct starters: Hope after hardship, Weekly reflection, Faith-based announcement, Motivational quote, Business promotion, and Event announcement.
- Project title plus add/remove/edit/reorder scene controls.
- Primary and secondary-language copy per scene.
- Automatic text direction and RTL/Arabic-compatible alignment.
- Scene duration, base colour, accent colour, text colour, opacity, and multiple type systems.
- Background image/video, separate feature image/video, and soundtrack/voice upload.
- Logo upload with position, size, opacity, padding, visibility, and animation.
- Independent grayscale treatment and playback speed for background and feature media.
- Slow-motion video playback.
- Optional animated media masks: clock, circle, triangle, and diagonal reveals.
- Mask guide, looping, enable/disable, and manual replay controls.
- Lottie `.json`/`.lottie` upload with position, size, rotation, opacity, speed, loop, and scene visibility.
- GSAP scene transitions, JSON-driven motion systems, animated shapes, and Three.js atmospheres.
- Sticky live preview and freeze-while-editing mode.
- Responsive copy sizing/overflow handling across portrait, square, landscape, and display-ad sizes.
- `prefers-reduced-motion` support.
- Local autosave and D1 project persistence when the backend is available.

### Output profiles

Requirements differ by use case rather than treating every design as a social video. Current profiles include:

- Display advertising
- Social posts
- Digital signage
- Website heroes
- Event screens
- Livestream graphics / OBS
- Music visualisers
- Presentations
- Email and messaging
- Digital invitations
- Product advertising
- Fundraising campaigns
- Educational content
- Creator templates

Each profile defines sizes, maximum duration, safe inset, audio, transparency, click-through, looping, export choices, and format requirements. Sizes include `9:16`, `1:1`, `16:9`, `300x250`, `728x90`, `970x250`, `1080x1350`, ultra-wide event screens, and 4K outputs.

### Export status

Working local exports:

- Static image snapshots offered by the selected profile.
- Standalone self-contained HTML.
- HTML5 ZIP with `index.html`, manifest, and instructions.
- OBS/browser-source-style HTML.
- Click-through URLs for interactive profiles.
- Embedded local image, video, and logo assets.
- Scene timing, responsive text, playback speed, masks, motion systems, decorative shapes, and supported atmosphere effects in the standalone renderer.

Queued/simulated formats:

- MP4
- WebM and transparent WebM
- GIF
- PNG sequences
- Other renderer-dependent profile outputs

These create render-job records but do **not** yet create final videos. The planned production path is:

```text
project JSON + private media
        -> render queue
        -> headless browser composition
        -> deterministic frames and audio
        -> FFmpeg encoding
        -> private download
```

### Admin template studio

The protected admin area is at `/admin`.

- First local admin setup at `/admin/setup`.
- Username/password-only login at `/admin/login`.
- Create, edit, preview, publish, archive, and delete templates.
- Configure identity, category, ratios, scenes, timing, layout, typography, colours, motif, animation, use cases, and brand defaults.
- Percentage-based geometry so generated layouts remain responsive.
- Animated circle, rectangle, and line decorations.
- AI prompt composer and original template draft generator.
- Drafts start from a blank design brief instead of recolouring or referencing starter templates.
- Strict structured-output validation before AI results enter the editor.
- Three distinct generated concepts per request, varying composition, typography, geometry, motion, palette, copy, and scenes.

The AI model is configurable with `OPENAI_MODEL`.

## Authentication

Authentication uses [Better Auth](https://www.better-auth.com/) and secure cookie sessions—not JWTs stored in browser `localStorage`.

### Customers

- Register and sign in with email/password at `/login`.
- View the current session and sign out at `/account`.
- Google sign-in is wired and activates when valid OAuth credentials exist.
- Signed-in projects use the user ID; anonymous projects use a generated device owner key.

### Administrators

- Separate username/password access.
- `/admin` checks the authenticated `admin` role server-side.
- Admin template and AI APIs also enforce the role server-side.
- First-admin setup is local-only by default. Production additionally requires a setup key and closes once an admin exists.

Not implemented yet: email verification, reset-password email, recovery UI, and transactional email delivery.

## Technology

- React 19 and TypeScript
- [vinext](https://github.com/cloudflare/vinext) / Vite
- Cloudflare Workers and D1
- Drizzle ORM
- Better Auth
- GSAP
- Three.js
- dotLottie React
- JSZip
- `html-to-image`
- OpenAI Responses API for admin-only drafting
- PWA manifest and service worker

## Repository map

```text
app/
  page.tsx                         public homepage
  showcase.tsx                     animated showcase
  create/page.tsx                  creator route
  motion-mint-app.tsx              editor and browser renderer
  login/page.tsx                   customer registration/login
  account/page.tsx                 customer session page
  admin/                            template studio and admin auth
  api/auth/                         Better Auth endpoints/config
  api/admin/                        setup, session, templates, AI studio
  api/projects/                     project persistence
  api/render-jobs/                  render queue
  api/templates/                    template endpoints
  api/health/                       backend status
db/
  schema.ts                         auth, templates, projects, jobs, media
drizzle/                            D1 migrations
lib/
  auth.ts                           Better Auth server configuration
  admin-access.ts                   admin authorization
  backend.ts                        ownership and API validation
  starter-templates.ts              template schema/starters
  output-profiles.ts                format-specific requirements
  html-export.ts                    standalone web renderer
  template-studio.ts                admin validation/data helpers
  openai-template-studio.ts         structured AI generation
public/
  manifest.webmanifest              PWA metadata
  sw.js                             service worker
```

## Run locally

Requirements: Node.js `>=22.13.0` and npm.

```bash
cd ~/Documents/projects/motionmint
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| --- | --- |
| `/` | Public showcase |
| `/create` | Creator/editor |
| `/login` | Customer login/registration |
| `/account` | Account/session |
| `/admin/setup` | First local administrator |
| `/admin/login` | Administrator login |
| `/admin` | Protected template studio |
| `/api/health` | Database, media, and renderer status |

Stop the server with `Ctrl+C` in its terminal. If port 3000 is occupied, inspect the exact process first:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

## Environment configuration

Local secrets live in `.dev.vars`. Keep that file private; never commit it or paste its values into documentation.

```dotenv
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=generate_a_long_random_secret_for_production

# Optional until Google login is enabled
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Protects first-admin setup outside local development
MOTIONMINT_ADMIN_SETUP_KEY=generate_a_separate_random_setup_key

# Admin-only AI template generation
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6-luna
```

Generate strong secrets locally with, for example:

```bash
openssl rand -base64 48
```

Google OAuth development configuration:

- Origin: `http://localhost:3000`
- Redirect: `http://localhost:3000/api/auth/callback/google`

Production equivalents:

- Origin: `https://motionmint.com`
- Redirect: `https://motionmint.com/api/auth/callback/google`

The server refuses to use the development fallback auth secret in production.

## Database and migrations

The app uses the `DB` D1 binding declared in `.openai/hosting.json`. Its schema contains Better Auth users/sessions/accounts/verifications, templates, projects, render jobs, and media metadata.

After editing `db/schema.ts`:

```bash
npm run db:generate
```

The current auth migration is already in `drizzle/`. Apply all migrations to the chosen local or production D1 database before testing a new environment.

## Verification

```bash
npm run build
npm test
npm run lint
```

The latest work was verified with a production build, customer registration/session/sign-out, protected admin redirects, local first-admin availability, creator routing, and responsive browser checks. The temporary verification account was removed.

## Data and renderer direction

The schema-versioned project document includes its template, scenes, theme, output choice, media treatment, brand, Lottie, motion, and timing. Templates define identity, category, ratios, default copy/duration, motif, animation, palette, typography, layout, responsive geometry, decorations, use cases, and brand defaults.

The next architectural cleanup should move the `Project` types currently colocated with the editor into a shared versioned schema consumed by:

- browser preview,
- HTML export,
- API validation,
- the future render worker, and
- migrations for older saved projects.

## Privacy and security

- Uploaded media remains local in the MVP.
- Do not send customer files to OpenAI or another service without explicit consent and a proper privacy flow.
- AI generation handles admin template configuration, not customer media.
- Never expose OpenAI keys, auth secrets, Google secrets, setup keys, cookies, or passwords in client code.
- Preserve server-side admin checks on both pages and mutation APIs.
- Before launch, add production rate limits, audit logs, CSRF/origin review, media validation, retention rules, monitoring, D1 backups, and tested migration/rollback procedures.

## Known limitations

- MP4/WebM/GIF rendering is queue-only; no worker is connected.
- Private object storage is absent, so media-heavy projects cannot fully roam between devices.
- Email verification/recovery needs an email provider.
- Google login needs project-specific credentials.
- Offline caching is basic and needs a versioning review.
- Lottie exists in the creator, but parity across every export needs completion/testing.
- Every new GSAP, Three.js, Lottie, or motion feature must also be added to the shared/export renderer.
- Generated templates need automated overflow, contrast, safe-zone, RTL, and reduced-motion checks before publishing.
- Admin remains an MVP, not a complete multi-role operations console.
- Billing, subscriptions, quotas, cloud rendering, and customer-facing AI are intentionally absent.

## Recommended next milestones

1. Create the real local admin at `/admin/setup` and test the full publish flow.
2. Replace placeholder secrets and configure Google OAuth.
3. Add email verification, password recovery, and transactional email.
4. Extract/version the shared project and renderer schema.
5. Add automated responsive QA for every template/output size.
6. Add private R2 uploads with signed access, limits, and retention.
7. Implement a deterministic headless-browser + FFmpeg worker.
8. Test preview/export parity for GSAP, Three.js, Lottie, masks, speed, logos, audio, and RTL.
9. Add render progress, retry, cancellation, expiry, and private downloads.
10. Define free/paid tiers after render/storage costs and user behaviour are understood.
11. Add observability, backups, legal/privacy pages, and deployment hardening.
12. Add billing after authentication, rendering, quotas, and cost controls are stable.

## Earlier prototypes

`~/Desktop/banner-creation` and `~/Desktop/afro-nasheed` were reference prototypes for GSAP animation, bilingual/RTL layouts, underlays, audio, timing, browser recording/conversion concepts, cinematic templates, vertical banners, and landscape lyric videos. MotionMint lives separately at `~/Documents/projects/motionmint`; preserve those prototypes unless a future task explicitly requires a reviewed change.

## Commercial direction

MotionMint is broader than a video-template tool. Its output-profile model creates a path toward social content, HTML5 advertising, website motion, signage, OBS graphics, events, music visualisers, invitations, campaigns, and reusable brand templates from one composition system.

Its clearest differentiation is the combination of mobile-first professional motion creation, responsive reusable templates, bilingual/RTL support, web and video outputs from one project, admin-controlled original template generation, GSAP/Three.js/masks/Lottie, and a future deterministic commercial rendering pipeline.

---

MotionMint is a working product foundation, not yet a production service. Preserve local data and prototypes, keep secrets private, and use the roadmap above as the handover point for the next development session.
