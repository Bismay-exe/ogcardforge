# OG Card — Developer Card Generator

Generate beautiful, dynamic Open Graph cards for GitHub repositories and profiles. Built with Next.js, satori, and the GitHub API.

**[Live Demo](https://og-card.vercel.app)** — Open the builder, pick a template, enter a repo, and copy the embed URL into your README.

---

## Features

- **5 templates**: Modern, Glass, Minimal, Terminal, GitHub
- **10 curated presets**: One-click visual themes across all templates
- **Live preview**: Pixel-identical preview powered by the same renderer the API uses
- **GitHub data**: Pulls real stars, forks, description, topics, license and more
- **Advanced controls**: Radius, shadow, glow, opacity, padding, alignment, avatar position
- **JSON export/import**: Download and reload full card configurations
- **PNG + SVG download**: Export rendered cards directly from the UI
- **Repo autocomplete**: Type an owner and get instant repo suggestions
- **Shareable URLs**: Every card configuration is encoded in a URL — share without an account
- **Caching**: GitHub data (1hr TTL) and rendered images are cached to keep responses fast

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/og-card.git
cd og-card
npm install
```

### 2. Add a GitHub token (optional, for higher rate limits)

```bash
# .env.local
GITHUB_TOKEN=ghp_your_token_here
```

Without a token you get 60 req/hr. With a token: 5,000 req/hr.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

### 5. Deploy to Vercel

```bash
npx vercel deploy
```

Set `GITHUB_TOKEN` in your Vercel project environment variables for production.

---

## Usage

### Via the Builder UI

1. Choose **Repository** or **Profile** card type
2. Pick a **preset** or a template directly
3. Enter a **GitHub owner** (and repo name for repository cards)
4. Adjust colors, size, and advanced controls
5. Copy the **Embed URL** into your GitHub README

### Via URL Query Parameters

Any card can be shared via URL. All builder state is encoded in the query string:

```
https://your-domain.com/api/v1/repo?owner=vercel&repo=next.js&template=glass&size=standard&accent=%230969da&showStars=true
```

**Full parameter reference:**

| Param | Values | Description |
|-------|--------|-------------|
| `owner` | string | GitHub username or org |
| `repo` | string | Repository name (for repo cards) |
| `username` | string | GitHub username (for profile cards) |
| `template` | `modern` `glass` `minimal` `terminal` `github` | Card template |
| `size` | `compact` `standard` `hero` | Card size |
| `font` | string | Font name (default: `inter`) |
| `bg` | hex color | Background color |
| `accent` | hex color | Accent color |
| `title` | hex color | Title text color |
| `desc` | hex color | Description text color |
| `showStars` `showForks` `showIssues` | `true`/`false` | Show/hide stats |
| `showDescription` `showTopics` `showHomepage` | `true`/`false` | Show/hide repo fields |
| `showAvatar` | `true`/`false` | Show/hide owner avatar |
| `showLicense` `showLastUpdated` `showArchived` | `true`/`false` | Show/hide metadata |
| `format` | `svg` `png` | Output format (API only) |
| `radius` `padding` | number | Advanced controls |
| `shadow` | `none` `soft` `hard` | Shadow style |
| `glow` | `true` `false` | Glow effect |
| `opacity` | 0–1 | Background opacity (glass template) |
| `alignment` | `left` `center` | Text alignment |
| `avatarPosition` | `top` `inline` | Avatar position |

### Via API (Programmatic)

**GET** — render by query params:

```bash
curl "https://your-domain.com/api/v1/repo?owner=vercel&repo=next.js&template=glass&format=png" -o card.png
```

**POST** — render with JSON body:

```bash
curl -X POST "https://your-domain.com/api/v1/repo" \
  -H "Content-Type: application/json" \
  -d '{"template":"glass","size":"hero","repo":{"owner":"vercel","name":"next.js"},"colors":{"background":"#0a0a1a","accent":"#a78bfa","title":"#f8fafc","description":"#94a3b8"}}' \
  -o card.svg
```

Debug mode (returns JSON with cache/render stats):

```
/api/v1/repo?owner=vercel&repo=next.js&debug=json
```

---

## API Reference

### `GET /api/v1/repo`

Renders a repository card.

| Query Param | Required | Description |
|------------|----------|-------------|
| `owner` | Yes | Repository owner |
| `repo` | Yes | Repository name |
| `template` | No | Default: `modern` |
| `size` | No | Default: `standard` |
| `format` | No | `svg` (default) or `png` |

### `GET /api/v1/profile`

Renders a profile card.

| Query Param | Required | Description |
|------------|----------|-------------|
| `username` (or `owner`) | Yes | GitHub username |
| `template` | No | Default: `modern` |
| `size` | No | Default: `standard` |
| `format` | No | `svg` (default) or `png` |

---

## Architecture

```
/app
  /page.tsx              → Builder UI (React, client component)
  /api/v1/repo/route.ts   → GET/POST repo card render endpoint
  /api/v1/profile/route.ts→ GET/POST profile card render endpoint
  /api/v1/preview/route.ts→ Live preview endpoint (SVG only)
  /api/v1/repos/route.ts  → Repo autocomplete endpoint

/lib
  /config-schema.ts       → CardConfig type + Zod schema + serialization
  /render.ts              → satori renderer + PNG conversion
  /cache.ts               → In-memory cache (KV-ready)
  /github.ts              → GitHub API client + rate-limit handling
  /hash.ts                → Config hashing for render cache
  /fonts.ts               → Font loading for satori
  /templates/
    modern/index.tsx      → Modern template renderer
    glass/index.tsx       → Glass template renderer
    minimal/index.tsx     → Minimal template renderer
    terminal/index.tsx    → Terminal template renderer
    github/index.tsx      → GitHub template renderer
    registry.ts           → Template plugin registry
    types.ts              → Template interface + GitHubData types
  /presets.ts             → 10 curated preset definitions

/public/fonts
  /Inter-*.ttf            → Inter font (OFL 1.1 licensed)
```

**Key design decisions:**
- Templates are self-contained plugins — add a template by creating one file and registering it
- The builder and API share the exact same renderer functions — preview and export are pixel-identical
- All config parsing goes through one Zod schema — UI, URL, and API stay in sync
- Two cache layers: GitHub data (1hr TTL) and rendered images (keyed by config hash)

---

## Font Licensing

This project includes **Inter** (SIL Open Font License 1.1). See `public/fonts/FONT_LICENSES.md` for full details.

Only fonts licensed under OFL, Apache 2.0, or MIT are eligible for inclusion.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Recommended | GitHub personal access token for higher API rate limits (5,000 req/hr vs 60 req/hr unauthenticated) |

Create a token at [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens). No special scopes are required — public repo data only.

---

## Troubleshooting

**Rate limit hit (`429`):** Add a `GITHUB_TOKEN` environment variable. Without a token, GitHub limits unauthenticated requests to 60/hour.

**"Repository not found" on a private repo:** OG Card only works with public GitHub data. Private repos require GitHub OAuth which is not implemented in V1.

**Preview not updating:** The live preview debounces GitHub data fetches by 500ms and repo list lookups by 350ms. Wait a moment after typing.

**PNG download fails:** PNG rendering requires the font files in `public/fonts/`. If fonts are missing, the server will log an error but still return an SVG.

---

## V1 Scope

Explicitly **not** in V1 (deferred to future releases):
- Account-based save/load (file-based export/import only)
- User-uploaded background images
- Template marketplace
- Animated SVG support
- Additional card types (Dev.to, portfolio, stats, etc.)