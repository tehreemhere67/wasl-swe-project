# Member 2 — Test Results

**Modules:** Module 2 (Organization Registration & Verification — administrator side) and Module 8 (Basic Administration)
**Executed:** 21 November 2026
**Environment:** Windows · Node.js 24+ · pnpm 11 · Next.js 15.5 · embedded PostgreSQL 16 (PGlite)

## Summary

| Activity | Command | Result | Evidence |
| --- | --- | --- | --- |
| Unit tests (7 suites) | `pnpm test` (or `node tests/member-2/admin.test.ts`) | **32 / 32 pass, 0 fail** | [`results/unit-tests-latest.txt`](results/unit-tests-latest.txt) |
| Full project suite | `pnpm test` | 32 of the **345** passing tests are Member 2's | `tests/run-all.ts` |
| Manual cases | [`MANUAL-TEST-CASES.md`](MANUAL-TEST-CASES.md) | **16 / 16 Pass** | screenshots 07, 08, 09 |
| Type check / build | `pnpm typecheck`, `pnpm build` | clean (whole project) | run by Member 1 before submission |

## Unit test breakdown

| Suite | Tests | What it proves |
| --- | ---: | --- |
| `matchesAccountQuery` / `normalizeQuery` | 9 | Account search by name, email, phone and organisation; SQL/regex characters treated as text |
| `validateAccountAction` | 5 | Only `deactivate` / `reactivate` are accepted; a user id is required |
| `canChangeAccountStatus` | 7 | Cannot deactivate yourself or the last active administrator; cannot repeat a status change |
| `validateCampaignDecision` | 5 | Approve needs no reason; reject and return require a reason; unknown decision refused |
| `campaign decision mapping` | 4 | approve → approved, reject → rejected, return → draft; only Pending Approval is reviewable; six SRS statuses preserved |
| `type guards` | 2 | `isAccountAction` / `isCampaignDecision` accept only allowed values |
| **Total** | **32** | |

## Coverage

| Requirement | Covered by |
| --- | --- |
| FR-ADM-02 (account administration) | A-03 page + API; account search, deactivate/reactivate, audit; unit tests above |
| FR-ADM-03/04 (administration actions and records) | Account actions and campaign decisions recorded in `audit_log`; tests above |
| FR-ADM-01 (role-based access) | Admin routes guarded by `requireAdmin`; non-admin redirect/403 (TC-M2-016) |
| FR-VER-02/04 (verification decisions) | A-02 queue, approve/reject/suspend/reinstate, validity rules (TC-M2-001…006) |
| FR-CAM-02 (campaign approval) | A-04 review: approve / reject with reason / return for changes (TC-M2-012…015) |
| DR-04 (document visibility) | Administrator + submitting organisation only (TC-M2-006) |

## How to reproduce

```powershell
cd "C:\Users\tehreem\Desktop\swe project\wasl"
pnpm db:seed
pnpm test                                  # 345 tests, Member 2's 32 included
node tests/member-2/admin.test.ts          # Member 2's 32 tests only
pnpm dev                                   # then walk the manual cases in the browser
```

## Defects

No open defects in Member 2's scope. The admin pages were manually tested (account search,
deactivate/reactivate, campaign review) and the rules are covered by the unit tests above.

## Notes

- Tests are auto-discovered from `tests/member-2/`; no registration is needed.
- A-02's original baseline (approve/reject/suspend/reinstate + verification history) was delivered by
  Member 1; Member 2 extended the queue and added A-03/A-04.
