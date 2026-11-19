# Member 5 — Test results (Module 5)

Run date: 19 Nov 2026 · Node 22 · local PGlite database, freshly seeded.

| Check | Command | Result | Evidence file |
| --- | --- | --- | --- |
| Unit tests (all members) | `pnpm test` | **262 / 262 pass** (232 before Module 5 + 30 new) | results/unit-tests-latest.txt |
| Type check | `pnpm typecheck` | Pass, no errors | results/typecheck-latest.txt |
| Production build | `pnpm build` | Pass | results/production-build-latest.txt |
| Search end-to-end (live HTTP) | `node scripts/verify-search.mjs` | **34 / 34 pass** | results/search-api-latest.txt / .json |
| Member 3 inventory regression | `node scripts/verify-inventory.mjs` | **38 / 38 pass** | — |

Manual cases: see `MANUAL-TEST-CASES.md` — 13 Pass, 2 "To confirm in browser" (Urdu/RTL look and phone-width layout).

Nothing previously delivered broke. Search response time measured: ~21 ms (limit 2 s).

To repeat: `pnpm db:seed && pnpm dev`, then `node scripts/verify-search.mjs`.
(The script adds test batches; reset with `pnpm db:reset && pnpm db:seed`.)
