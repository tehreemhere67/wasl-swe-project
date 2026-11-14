# Member 3 — Test results (Modules 4 + 7)

**Run date:** 14 November 2026, ~18:20 PKT
**Environment:** Windows 11 · Node.js v26.13.1 · npm 11.20.0 · Next.js 15.5.29 ·
embedded PostgreSQL (PGlite) in `.data/wasl-pg` · branch `feature/inventory`

## Summary

| Suite | Result | Evidence |
| --- | --- | --- |
| Unit tests (whole repo) | **232 / 232 pass** (43 new for Modules 4 + 7) | `results/unit-tests-latest.txt` |
| Inventory API lifecycle | **38 / 38 checks pass** | `results/inventory-api-latest.txt` + `.json` |
| Manual browser cases | **15 / 15 pass**, 3 deferred | [`MANUAL-TEST-CASES.md`](MANUAL-TEST-CASES.md) |
| TypeScript (`tsc --noEmit`) | clean | command output |
| Production build (`next build`) | clean — 49 routes generated | `results/production-build-latest.txt` |

## How to reproduce

```powershell
npm run db:migrate          # 001..006
npm run db:seed             # demo accounts (includes the test blood bank)
npm run dev                 # terminal 1 — http://localhost:3000
npm test                    # unit suite (no server needed)
node scripts/verify-inventory.mjs --json tests/member-3/results/inventory-api-latest.json
npm run typecheck
npm run build
```

## What the unit suite covers (`tests/member-3/unit/`)

| File | Areas | Requirements |
| --- | --- | --- |
| `inventory-rules.test.ts` | batch validation, availability, movements, manual movements, reservations, transfers, `diffBatch` | FR-INV-01/02/03/04/05/06/08, DR-01, A-08, A-10, A-11 |
| `monitoring-rules.test.ts` | expiry windows, low stock, alert identity, 24-hour rule, sweep timing, B-05 settings | FR-MON-01/03/04/05/06, A-05, A-31, A-32 |

The availability group is the formal proof of **4.8**: awaiting-testing, rejected,
expired, fully-reserved and unverified stock all return `false` from
`countsAsAvailable`.

## What the API script covers (`scripts/verify-inventory.mjs`)

Login as administrator / blood bank / hospital, then: create a batch, reject
negative units, past expiry and an invalid blood group, list it with its batch
reference, edit + approve it (Correction movement), issue units, refuse an
over-issue, reserve and release a hold, transfer out to the second verified bank,
refuse to archive a non-empty batch, mark expired, archive it, confirm it leaves
the list but its history stays reachable, save thresholds, raise a low-stock alert,
acknowledge it, and confirm a hospital is refused (403) and redirected away from
`/bank`.

## Defects found during the sprint, and fixes

| Defect | How it was found | Fix |
| --- | --- | --- |
| A double click created two batches | Manual testing (two B− Platelets batches appeared) | Submit lock (`useRef`) in the batch form, action bar and reservations panel |
| No way to remove an empty batch | Manual testing | Soft delete: `archived_at`, "Remove from list", list filtered, history kept |
| An empty/archived batch kept an "expires" alert | Manual testing (stale "5 units expire") | Alerts resolved when a batch empties, is archived, or its condition clears |
| Deleting an alert condition left the alert active | Code review while wiring 7.3 | The sweep resolves expiry and low-stock alerts whose condition no longer holds |
| Three identical A+ Platelets rows were indistinguishable | User review of the inventory list | Batch reference column (`#1C61B494`) |

## Deferred checks

| Item | Reason | Covered by |
| --- | --- | --- |
| 24-hour alert repeat window | Cannot wait 24 h in a test run | `monitoring-rules.test.ts` with an injected clock |
| Exact expiry moment | Needs the clock to pass a batch's expiry | Database ageing + `verify-inventory.mjs` (Expired movement, 0 units) |
| Hourly sweep interval | Needs an hour | `sweepDue` unit tests (30 min = false, 61 min = true) |

## Notes

- `scripts/verify-inventory.mjs` creates and archives test batches. Reset the demo
  data afterwards with `npm run db:reset && npm run db:seed`.
- Manual cases were executed by Member 3 on the local app; the automated script was
  executed against the same running server.
