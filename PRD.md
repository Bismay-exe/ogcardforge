# PRD: Developer Card Generator (Production Version)

**Version:** 3.0
**Owner:** Bismay
**Status:** Ready for build

---

## 1. Vision

A Canva-like builder for generating dynamic, beautifully designed developer branding cards (GitHub profile banners and repo cards) that pull live GitHub data and render as embeddable SVG/PNG images for READMEs and profiles.

Where existing tools (capsule-render, github-readme-stats) offer shallow customization (colors/text on one fixed layout), this product offers **real templates** — each with its own layout, spacing, typography, and safe areas — plus a curated preset system, so users get results that look designed, not generated.

**V1 card types:** Profile header banner, Repo card.
**Explicitly deferred:** additional card types (Dev.to, portfolio, stats, quote, roadmap, etc.) — see Section 12.

---

## 2. Goals & Non-Goals

### Goals
- Ship a builder where a non-technical user can produce a polished card in under 2 minutes.
- Every card is driven by a single config object, shareable as a URL and as JSON.
- Templates are pluggable — adding one should not require touching shared code.
- Preview and exported image are pixel-identical.
- Protect GitHub API quota and keep response times fast via caching.

### Non-Goals (V1)
- Free-form background image upload
- More than 2 card types
- Template marketplace / community submissions
- Animated SVGs
- Multi-user accounts / auth (unless required for save/load — see Section 9)

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | API routes + frontend in one deploy, first-class Vercel support |
| Hosting | Vercel | Zero-config deploys, serverless functions |
| Image generation | `satori` → SVG, `@resvg/resvg-js` → PNG | JSX/CSS-based layout compiled to SVG; PNG via resvg for export |
| GitHub data | GitHub REST API (authenticated) | 5,000 req/hr vs 60/hr unauthenticated |
| Caching | Vercel KV (fallback: in-memory + `Cache-Control` headers) | Avoid re-hitting GitHub API / re-rendering per view |
| Frontend state | React `useState`/`useReducer`, synced to a single config object | Single source of truth for preview, URL, and JSON |
| Icons | Lucide (or Phosphor), inline SVG | Clean, MIT-licensed, no emoji |
| Fonts | Google Fonts (OFL/Apache/MIT only), loaded via `satori`'s font API | License-safe, consistent rendering |
| Validation | `zod` | Validate/parse config from query params or JSON body |

---

## 4. Configuration Model (Single Source of Truth)

One config object drives everything: the builder UI, the live preview, the shareable URL, and the API render. Three views into the same data:

```ts
type CardConfig = {
  cardType: "profile" | "repo";
  template: string;          // e.g. "glass"
  size: "compact" | "standard" | "hero";
  font: string;
  colors: {
    background: string;      // hex, or preset name for gradients/images
    accent: string;
    title: string;
    description: string;
  };
  repo?: { owner: string; name: string };   // for repo cards
  fields: {                                  // GitHub data toggles, grouped
    repository?: { description?: boolean; topics?: boolean; homepage?: boolean };
    owner?: { avatar?: boolean };
    stats?: { stars?: boolean; forks?: boolean; issues?: boolean };
    metadata?: { license?: boolean; lastUpdated?: boolean; archived?: boolean };
  };
  advanced?: {                               // hidden behind "Advanced" toggle in UI
    radius?: number;
    shadow?: "none" | "soft" | "hard";
    glow?: boolean;
    opacity?: number;
    padding?: number;
    alignment?: "left" | "center";
    avatarPosition?: "top" | "inline";
  };
};
```

- **Query params** — canonical shareable/embeddable format (flattened, e.g. `template=glass&showStars=true`).
- **JSON** — same shape as above, used internally by the builder and accepted as an alternative POST body for programmatic use.
- **Simple vs Advanced in the UI is a display concern only** — both read/write the same `CardConfig`; "Advanced" just reveals the `advanced` block and full `fields` grouping. There are not separate simple/advanced data models.

All parsing/serialization goes through one `zod` schema (`lib/config-schema.ts`) so the UI, the URL, and the API can never drift out of sync.

---

## 5. Template System (Plugin Architecture)

Templates are not hardcoded folders with `if (template === "glass")` branching. Each template is a self-contained module implementing a shared interface:

```ts
type Template = {
  id: string;                 // "glass"
  name: string;               // "Glass"
  defaults: Partial<CardConfig>;
  controls: ControlSchema[];  // declares which advanced controls this template exposes
  safeArea: { textMaxWidth: number; illustrationSlot?: Rect };
  renderer: (config: CardConfig, data: GithubData) => JSX.Element; // satori-compatible JSX
};
```

The builder UI reads `controls` from the active template to render its Advanced panel — no manual UI wiring per template. Adding a template means adding one file to `lib/templates/` and registering it in the template registry; nothing else in the app changes.

**V1 templates (target 5):** Modern, Glass, Minimal, Terminal, GitHub.

---

## 6. Presets

A **preset** bundles template + background + typography + spacing + colors + icon style + decoration into one selectable option — the fast path for users who want a great result in one click, before ever touching individual controls.

```ts
type Preset = {
  id: string;
  label: string;
  thumbnail: string;
  config: Partial<CardConfig>;  // pre-filled values, still overridable
};
```

Presets are the primary entry point in the builder UI (shown as a visual gallery before the template/controls step). V1 target: 8–12 presets across the 5 templates.

---

## 7. GitHub Data Integration

Fields are grouped (not a flat list) for both the API and the UI:

| Group | Fields |
|---|---|
| Repository | description, topics, homepage |
| Owner | avatar |
| Stats | stars, forks, open issues |
| Metadata | license, last updated, archived status |

- Fetched via authenticated GitHub REST API.
- Cached per `owner/repo` (e.g. 1 hour TTL) — API route checks cache before hitting GitHub.
- **Repo autocomplete**: when a user types an owner/username, fetch and suggest their repositories (debounced, cached) so they don't need to know the exact repo name up front.

---

## 8. Builder UX

### Simple mode (default)
1. Choose card type (Profile / Repo)
2. Choose a preset (visual gallery) — or choose a template directly
3. Enter repo/owner (autocomplete)
4. Adjust: colors, font, size (Compact/Standard/Hero)
5. Done — live preview updates throughout

### Advanced (collapsed by default, "Advanced ▾")
- Radius, shadow, glow, opacity, padding, alignment, avatar position
- Full per-field GitHub data toggles (grouped as in Section 7)

### JSON view (power users)
- Read/write the raw `CardConfig` JSON directly; changes sync back into Simple/Advanced views live.

### Live Preview
- Renders via the **exact same renderer function** used by the API route (imported from the template module) — not a separate preview-only component. This guarantees pixel parity between preview and exported image.

### Save/Load
- "Export config" downloads the current `CardConfig` as `.json`.
- "Import config" loads a `.json` file back into the builder.
- No auth/accounts required for V1 — this is file-based, not account-based persistence.

---

## 9. API Design

Versioned from day one:

```
GET /api/v1/profile
GET /api/v1/repo
```

Query params (flattened `CardConfig`), example:
```
/api/v1/repo?
  owner=Bismay-exe&
  repo=nobadfonts&
  template=glass&
  size=standard&
  font=inter&
  accent=%23FFD700&
  showStars=true&
  showForks=false&
  radius=16&
  shadow=soft&
  format=svg
```

- `format` param: `svg` (default) or `png`.
- POST equivalent (`/api/v1/repo`) accepts a JSON `CardConfig` body — for programmatic/advanced use, not needed for basic README embedding.
- Response headers include `Cache-Control: public, max-age=3600` (tunable per endpoint).

---

## 10. Caching Strategy

Two independent cache layers:
1. **GitHub data cache** — keyed by `owner/repo`, ~1hr TTL, avoids redundant GitHub API calls across renders.
2. **Rendered image cache** — keyed by full config hash, so identical requests (very common — every README view) skip re-rendering entirely.

Both layers use Vercel KV where available, falling back to in-memory + HTTP cache headers for simpler deployments.

---

## 11. Font & Asset Licensing

- Only fonts licensed OFL, Apache 2.0, or MIT are eligible for inclusion (Google Fonts covers most of these — verify per font before adding).
- Illustration/background presets must be either originally created for this project or licensed for commercial redistribution — track license/source per asset in `public/illustrations/LICENSES.md`.

---

## 12. Future Directions (Explicitly Not V1)

The architecture (template plugin system, grouped config, versioned API) is designed to support these later without a rewrite:
- Additional card types: Dev.to post cards, portfolio cards, tech-stack cards, stats cards, quote/achievement cards, roadmap cards, launch banners
- User-uploaded background images with crop/positioning tool
- Template marketplace (community-submitted templates)
- Animated SVG support
- Account-based save/load (replacing file-based export/import)

---

## 13. Build Phases

Each phase is scoped to be independently completable and testable — suitable for an AI coding agent to execute sequentially, one phase per work session.

### Phase 0 — Project Setup
- Initialize Next.js (App Router, TypeScript) project
- Configure Vercel deployment
- Install core deps: `satori`, `@resvg/resvg-js`, `zod`
- Set up project structure per Section 14 (folder layout)
- Set up GitHub API client with auth token (env var), basic rate-limit-aware fetch wrapper
- **Deliverable:** empty app deploys to Vercel successfully; a hardcoded "hello world" SVG returns from a test API route.

### Phase 1 — Config Schema & API Skeleton
- Define `CardConfig` type + `zod` schema (`lib/config-schema.ts`)
- Build query-param ⇄ `CardConfig` ⇄ JSON serialization utilities
- Create versioned API routes: `/api/v1/repo`, `/api/v1/profile` (GET + POST), returning a static placeholder SVG regardless of input
- Add `format=svg|png` handling stub (PNG via resvg, even with placeholder content)
- **Deliverable:** hitting either endpoint with valid query params returns a rendered SVG or PNG placeholder; invalid params return a clear validation error.

### Phase 2 — GitHub Data Layer
- Implement GitHub REST fetch for repo data (Section 7 fields)
- Implement caching layer (GitHub data cache, 1hr TTL)
- Wire real data into the API response (still using placeholder rendering, but with real stars/forks/etc. values available to it)
- **Deliverable:** `/api/v1/repo?owner=x&repo=y` returns real GitHub data fields in a temporary debug JSON mode, and cache hits are verifiable (e.g. via logs/headers).

### Phase 3 — First Template + Renderer
- Build the `Template` interface (Section 5)
- Implement one full template (e.g. "Modern") with real `satori`-based renderer, safe-area logic, and real data binding
- Wire this template into the API route as the default renderer
- **Deliverable:** `/api/v1/repo` returns a fully designed, on-brand SVG card using real GitHub data for the "Modern" template.

### Phase 4 — Template Registry + Remaining Templates
- Build template registry (add/register pattern, no if/else branching)
- Implement remaining V1 templates: Glass, Minimal, Terminal, GitHub
- Each template declares its own `controls` and `safeArea`
- **Deliverable:** switching `template=` in the query string produces visually distinct, correctly laid-out cards across all 5 templates.

### Phase 5 — Rendered Image Cache
- Implement config-hash-based rendered image cache (Section 10, layer 2)
- **Deliverable:** identical requests measurably skip re-render (cache hit confirmed via logs/timing).

### Phase 6 — Builder UI: Simple Mode
- Build `/` page: card type selector, preset gallery, repo/owner input with autocomplete, basic controls (colors, font, size)
- Wire live preview using the **same renderer functions** as the API (import from `lib/templates/*`, not a separate preview component)
- Generate and display the shareable query-param URL
- **Deliverable:** a user can pick a preset, enter a repo, adjust basics, and get a working embeddable URL with live-updating preview.

### Phase 7 — Builder UI: Advanced Mode + JSON View
- Add collapsible "Advanced" panel driven by the active template's declared `controls`
- Add grouped GitHub field toggles (Section 7 groups)
- Add JSON view (read/write raw `CardConfig`, synced bidirectionally with Simple/Advanced UI)
- **Deliverable:** all fields in Section 4's `CardConfig` are editable through the UI via some combination of Simple/Advanced/JSON views.

### Phase 8 — Presets
- Define preset data structure and 8–12 curated presets across the 5 templates
- Build preset gallery UI (thumbnails, one-click apply)
- **Deliverable:** selecting a preset instantly configures template/colors/typography/spacing; user can still override afterward.

### Phase 9 — Save/Load
- "Export config" (download current `CardConfig` as `.json`)
- "Import config" (upload `.json`, populate builder state)
- **Deliverable:** exporting then re-importing a config reproduces an identical card.

### Phase 10 — Polish & Launch Readiness
- PNG export button in UI (in addition to SVG)
- Font licensing audit (Section 11)
- Illustration asset licensing audit
- Error states (invalid repo, GitHub API failure, rate limit hit) surfaced cleanly in both API responses and UI
- Basic analytics/logging for cache hit rate and render latency
- **Deliverable:** production-ready V1, deployed, with documented README covering setup and usage.

---

## 14. Project Structure

```
/app
  /page.tsx                    → builder UI (presets, templates, controls, live preview)
  /api
    /v1
      /repo/route.ts           → GET/POST, returns SVG or PNG for repo cards
      /profile/route.ts        → GET/POST, returns SVG or PNG for profile cards
/lib
  /config-schema.ts            → CardConfig type + zod schema + serialization (query params ⇄ JSON)
  /templates/
    registry.ts                → template registration
    modern/index.ts
    glass/index.ts
    minimal/index.ts
    terminal/index.ts
    github/index.ts
  /presets.ts                  → curated preset definitions
  /github.ts                   → GitHub API fetch + cache logic
  /cache.ts                    → shared cache layer (Vercel KV / in-memory fallback)
/public
  /illustrations/               → curated background art assets
  /illustrations/LICENSES.md    → asset licensing tracker
```

---

## 15. Success Criteria for V1

- A user can go from landing page to a finished, embeddable card URL in under 2 minutes using Simple mode alone.
- Preview and exported image are visually identical, across all 5 templates.
- Generated image loads reliably when embedded in an actual GitHub README.
- Cached responses return in well under 1s; uncached (cold) renders return in under 3s.
- Config export/import round-trips without loss.
- All shipped fonts and illustration assets have verified, redistribution-safe licenses.