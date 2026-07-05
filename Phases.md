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