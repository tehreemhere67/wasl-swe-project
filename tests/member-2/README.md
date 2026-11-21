# Member 2 — tests (Modules 2 + 8)

**Owner:** Member 2 · **Modules:** 2 (Organization Registration & Verification) + 8 (Basic Administrator Functionality)
**Delivered:** A-02 verification queue extensions (search/filter, waiting time, details and documents),
A-03 account management (search, deactivate/reactivate, audited changes), A-04 campaign review
(approve / reject with reason / return for changes), plus their access rules.

## Contents

| File | Purpose |
| --- | --- |
| `admin.test.ts` | 32 unit tests for the admin rules (account search, account status changes, campaign decisions, type guards) |
| `MANUAL-TEST-CASES.md` | 16 browser/administrator cases with evidence |
| `TEST-RESULTS.md` | Execution summary, coverage and reproduction steps |
| `results/unit-tests-latest.txt` | Captured `node tests/member-2/admin.test.ts` output (32/32 pass) |

## Run

```powershell
pnpm test                            # whole suite (Member 2's 32 included)
node tests/member-2/admin.test.ts    # Member 2 only
```

`pnpm test` discovers every `*.test.ts` under `tests/` automatically. The pure admin rules are unit
tested; the database-backed admin flows were verified manually against the running app
(see `MANUAL-TEST-CASES.md`). Member 1 owns `tests/member-1/`; do not edit other members' tests.
