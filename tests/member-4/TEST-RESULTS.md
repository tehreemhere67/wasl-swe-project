# Member 4 — Test results (Modules 3 and 6)

Run date: 20 Nov 2026 · Node 22 · local PGlite database, freshly seeded before each live run.

| Check | Command | Result | Evidence file |
| --- | --- | --- | --- |
| Unit tests (all members) | `pnpm test` | **345 / 345 pass** (262 before Module 3/6 + 83 new) | results/unit-tests-latest.txt |
| Type check | `pnpm typecheck` | Pass, no errors | results/typecheck-latest.txt |
| Production build | `pnpm build` | Pass (all new routes listed) | results/production-build-latest.txt |
| Donor + campaign end-to-end (live HTTP) | `node scripts/verify-campaigns.mjs` | **109 / 109 pass** | results/campaigns-api-latest.txt / .json |
| Same, with account deletion | `node scripts/verify-campaigns.mjs --destructive` | **113 / 113 pass** | (run on a separate fresh database) |
| Member 5 search regression | `node scripts/verify-search.mjs` | **34 / 34 pass** | — |
| Member 3 inventory regression | `node scripts/verify-inventory.mjs` | **38 / 38 pass** | — |
| Earlier API lifecycle regression | `node scripts/verify-api-lifecycle.mjs` | Pass | — |

Manual cases: see `MANUAL-TEST-CASES.md` — all executable cases Pass; 3 cases are marked **To confirm in browser**
(TC-M4-006 Urdu after saving the language, TC-M4-054 Urdu look and right-to-left layout, TC-M4-055 phone-width layout).

Nothing previously delivered broke: all 262 earlier unit tests and the three earlier live scripts still pass.

## What the 83 new unit tests cover
* `donor-rules.test.ts` (38): profile validation, past-donation validation (including the Karachi-day rule), history total and order,
  reminder validation and due-date rules (due on the day, sent once, again after a newer donation), who is told about a campaign (A-21), account anonymising.
* `campaign-rules.test.ts` (45): Karachi time conversion, create/submit validation, status rules, material-change rule (A-29),
  what donors see (including unverified organizers and the kept approved version), filters, outcome validation, notice wording in both languages.

## To repeat
```
pnpm db:reset && pnpm db:seed
pnpm dev
node scripts/verify-campaigns.mjs
```
(The script creates campaigns; reset with `pnpm db:reset && pnpm db:seed` before running it again, because the
"Drive - Library" completion can only be recorded once as Completed.)
