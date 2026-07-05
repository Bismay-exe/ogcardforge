## Phase0
[✓] Clean boilerplate from layout/page, set up folder structure

[✓] Install satori, @resvg/resvg-js, zod

[✓] Create .env.example and github token validation

[✓] Create src/lib/github.ts with rate-limit-aware fetch wrapper

[✓] Configure next.config.ts (satori needs Node runtime)

[✓] Create test /api/v1/repo route returning hardcoded SVG

[✓] Verify typecheck and lint pass

---

## Phase1

[✓] Create lib/config-schema.ts with CardConfig + zod schema

[✓] Add serialization: query params ⇄ config ⇄ JSON

[✓] Build /api/v1/repo GET + POST returning placeholder SVG/PNG

[✓] Build /api/v1/profile GET + POST with cardType locked to profile

[✓] Add format=svg|png handling via @resvg/resvg-js for PNG

[✓] Add validation error responses (400 with details)

[✓] Verify endpoints + typecheck and lint (final pass)

[✓] Test PNG rendering on both routes

[✓] Test POST endpoints with JSON body

---

## Phase2

[✓] Implement GitHub REST fetch for repo data (owner/repo)
[✓] Implement GitHub REST fetch for user data (username/profile)

[✓] Build caching layer in src/lib/cache.ts (in-memory singleton, 1-hour TTL)

[✓] Wire cache into github.ts fetch functions (fetchRepo, fetchUser, listUserRepos)

[✓] Add X-Cache: HIT/MISS response header on all API routes

[✓] Add ?debug=json mode returning live config, data, and cache stats

[✓] Test graceful-degradation when GitHub API fails (empty data fallback)

[✓] Inter font downloaded (4.0), extracted to /public/fonts/ (Regular, Medium, SemiBold, Bold)
[✓] FONT_LICENSES.md documented (SIL OFL)

---

## Phase3

[✓] Define Template interface in src/lib/templates/types.ts (id, name, defaults, controls, safeArea, renderer)

[✓] Define GitHubData unified type + normalizers (normalizeRepo, normalizeUser, emptyGithubData)

[✓] Create src/lib/fonts.ts async font loader (Buffer data for satori, file paths for resvg)

[✓] Implement src/lib/render.ts — satori → SVG, resvg → PNG, template-driven

[✓] Implement src/lib/templates/modern/index.tsx — first full template:
    - Dark background (#0f172a), blue accent (#38bdf8)
    - Avatar, title, description, topics, stats
    - Gradient background, glow overlay
    - Stats array built with ReactNode elements + field toggles

[✓] Create template registry stub at src/lib/templates/registry.ts (singleton class, only modern registered)

[✓] Wire Modern template as renderer into /api/v1/repo and /api/v1/profile (replace placeholder)

[✓] Fix circular import: extracted fmtNumber/escXml/truncate to src/lib/templates/utils.ts

[✓] Terminal render verified: SVG (27KB), PNG (30KB), Profile (69KB)

---

## Phase4

[✓] Implement Glass template — frosted glassmorphism (#0a0a1a, #a78bfa accent, radial glow, semi-transparent panels)

[✓] Implement Minimal template — clean typographic (white bg, blue #2563eb accent, border-bottom stripe, #hash tags)

[✓] Implement Terminal template — monospace, dark (#0d1117), green (#3fb950) accent, macOS dots, prompt-style `> name`, `> desc`

[✓] Implement GitHub template — GitHub-branded (white bg, purple #0969da accent, GitHub repo header bar with "Public" badge, inline SVG star/fork icons)

[✓] Wire all 5 templates into src/lib/templates/registry.ts (modern, glass, minimal, terminal, github)

[✓] Fix satori div-display rule: every <div> with multiple children needs explicit `display: "flex"` — switched `&&` conditionals to ternary `? <img /> : null` patterns

[✓] Remove unsupported satori CSS: backdrop-filter, WebkitBackdropFilter (glass template)

[✓] Replace `flex:1` shorthand with `flexGrow:1` (github template — satori may not parse the shorthand)

[✓] Rewrite GitHub template renderer: React.Fragment for profile name block, SVG stats icons built with `.push()` array pattern

[✓] Live tests: all 5 templates × repo-SVG + repo-PNG + profile-SVG = 15/15 passing

---

## Phase5

[✓] Create src/lib/hash.ts — SHA-256 hash of (CardConfig + GitHubData + format) → 16-char hex cache key

[✓] Add renderCache singleton to src/lib/cache.ts (separate in-memory instance, shared Cache interface)

[✓] Wire renderCache into src/lib/render.ts (check before satori, store after render — skip cost on hit)

[✓] Add X-Render-Cache: HIT/MISS header to /api/v1/repo and /api/v1/profile

[✓] Include renderCache stats in ?debug=json responses

[✓] Live verification:
    - Repo SVG: 1st request MISS (1446ms) → 2nd request HIT (74ms) = 20x speedup
    - Profile: 1st request MISS (988ms) → 2nd request HIT (31ms) = 32x speedup
    - Repo PNG: 1st request MISS (141ms) → 2nd request HIT (31ms)
    - debug=json shows renderCache hits/misses/sets accurately
    - Cross-template isolation verified (glass vs modern = different keys)
    - Cache TTL 3600s (1 hour) matching GitHub data cache pattern