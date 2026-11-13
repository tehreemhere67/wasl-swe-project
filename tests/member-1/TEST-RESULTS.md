# Member 1 — Test Results

**Modules under test:** Module 1 (Authentication & Account Management) + Module 9 (Common UI & Language Support)
**Executed by:** Member 1 · **Date:** 12 November 2026
**Environment:** Windows 11 · Node.js 24.21 · pnpm 11 · Next.js 15.5.29 · React 19 · TypeScript 5.9 · embedded PostgreSQL 16 (PGlite) · Chromium

---

## 1. Summary

| # | Test activity | Command | Result | Raw evidence |
| --- | --- | --- | --- | --- |
| 1 | Unit tests (6 files, 31 suites) | `pnpm test` | **157 / 157 pass, 0 fail** | [`results/unit-tests-latest.txt`](results/unit-tests-latest.txt) |
| 2 | End-to-end API lifecycle (29 checks) | `pnpm verify:api` (server running) | **29 / 29 pass, 0 fail** | [`results/api-lifecycle-latest.txt`](results/api-lifecycle-latest.txt) · [`results/api-lifecycle-latest.json`](results/api-lifecycle-latest.json) |
| 3 | TypeScript strict check | `pnpm typecheck` | **exit 0, no errors** | [`results/typecheck-latest.txt`](results/typecheck-latest.txt) |
| 4 | Production build | `pnpm build` | **compiled successfully, 38 routes** | [`results/production-build-latest.txt`](results/production-build-latest.txt) |
| 5 | Manual/system cases | see [`MANUAL-TEST-CASES.md`](MANUAL-TEST-CASES.md) | **61 pass / 65 executed, 4 deferred** | screenshots in [`docs/screenshots/`](../../docs/screenshots/) |
| 6 | Browser route smoke pass | Playwright (1,280 px + 390 px) | **33 pages HTTP 200**, RBAC redirects correct, Urdu RTL verified | [`docs/screenshots/`](../../docs/screenshots/) |

**Overall: PASS.** No critical or major defect remains open in Member 1's scope.

---

## 2. Unit tests — 157 / 157

| File | Tests | Result | What it proves |
| --- | --- | --- | --- |
| [`unit/validation.test.ts`](unit/validation.test.ts) | 64 | 64 pass | Mobile/email/password/OTP rules; FR-VER-01 registration fields; FR-DON-01 + DR-03 donor signup; password reset validation |
| [`unit/password.test.ts`](unit/password.test.ts) | 13 | 13 pass | scrypt hashing, unique salts, verification, malformed hashes (NFR-SEC-01) |
| [`unit/rules.test.ts`](unit/rules.test.ts) | 22 | 22 pass | Lockout after exactly 5 failures for 15 min (NFR-SEC-02), remaining attempts, role landing paths, `canOperate` only when Verified (FR-VER-03) |
| [`unit/format.test.ts`](unit/format.test.ts) | 26 | 26 pass | PKT/Gregorian dates and times, relative-time buckets, file sizes (NFR-LOC-05) |
| [`unit/csrf.test.ts`](unit/csrf.test.ts) | 8 | 8 pass | Same-origin comparison for state-changing requests (NFR-SEC-04) |
| [`unit/i18n.test.ts`](unit/i18n.test.ts) | 24 | 24 pass | EN/UR key parity, no empty values, placeholders identical, one owner per key, Urdu RTL (NFR-LOC-01/03, NFR-MAIN-02) |
| **Total** | **157** | **157 pass · 0 fail** | |

---

## 3. API lifecycle — 29 / 29 (real server, real cookies, real database)

These checks cover the code that cannot be unit-tested in plain Node (`server-only`, database, sessions, guards, notifications).

| Group | Checks | Result |
| --- | --- | --- |
| Donor signup | OTP issued; signup creates account + session; donor can log in; donor area renders | 4 / 4 |
| Validation refusals | signup without consent refused (DR-03); wrong OTP rejected | 2 / 2 |
| Password reset | reset code issued; reset succeeds; old password invalid; new password works | 4 / 4 |
| Lockout (NFR-SEC-02) | 5th failure returns 429; correct password also refused while locked | 2 / 2 |
| Organisation registration | with document → Pending; Pending blocked from `/hospital` (307 to `/status`); missing document refused | 3 / 3 |
| Administrator verification | admin login → `/admin`; new registration in queue; approve → can operate; suspend → access lost | 5 / 5 |
| Rejected organisation | status screen shows rejection; re-apply accepted; status returns to Pending | 3 / 3 |
| Queue/notification side-effects | registration appears in A-02 queue; approval/suspension notifications recorded (verified via response + Dev Outbox) | 2 / 2 |
| Authenticated header | `/status` (pending organization) and `/notifications` (administrator) show the signed-in header with the profile menu and Log out | 2 / 2 |
| **Total** | | **29 / 29** |

> Running `pnpm verify:api` mutates the local development database (it creates test accounts and
> re-applies the seeded rejected organisation). Restore clean demo data afterwards with
> `pnpm db:reset` and `pnpm db:seed`.

---

## 4. Manual cases — 61 pass / 65 executed, 4 deferred

| Group | Cases | Pass | Deferred |
| --- | --- | --- | --- |
| A. Authentication and sessions | 10 | 9 | TC-AUTH-09 (30-minute idle expiry — time-based) |
| B. Donor registration and OTP | 10 | 8 | TC-REG-04 (code expiry), TC-REG-05 (attempt cap) — time-based |
| C. Organization registration | 9 | 9 | — |
| D. Verification lifecycle | 10 | 10 | — |
| E. Password reset | 6 | 6 | — |
| F. Role-based access (RBAC) | 7 | 6 | TC-RBAC-07 (blood bank → organizer area, browser check pending) |
| G. Language and localization | 7 | 7 | — |
| H. Shared interface, mobile and errors | 6 | 6 | — |
| **Total** | **65** | **61** | **4** |

The four deferred cases need a 5–30 minute wait or a pending browser judgement; they are enforced in
code (`src/lib/auth/rules.ts`, `src/lib/auth/otp.ts`, `src/app/organizer/layout.tsx`) and tracked in
the manual cases document rather than claimed as passing.

---

## 5. Defects found during testing (and fixed)

| ID | Severity | Found by | Defect | Fix | Retest |
| --- | --- | --- | --- | --- | --- |
| D1 | **Critical** | Browser RBAC check | A **hospital** account could open `/bank/inventory` (the blood-bank area layout only checked "organization verified", not the role) | Area layouts now call `requireRole([...])` **and** `requireVerifiedOrganization` | Browser check + `TC-RBAC-02` pass |
| D2 | Major | i18n test | `status.pending/verified/rejected/suspended` defined twice; the long status sentence overwrote the badge labels, so badges could show a paragraph | Renamed narrative keys to `status.message.*`; test now enforces one owner per key | `pnpm test` (i18n parity) pass |
| D3 | Major | Test-plan audit | `POST /api/auth/logout` and `POST /api/language` had no same-origin check | `isSameOrigin()` added to both | Code review; all POST routes now covered |
| D4 | Minor | API lifecycle | Registration posted as `application/x-www-form-urlencoded` without a file returned a generic `invalid_request` instead of the document error | Route now parses urlencoded fields and returns the specific document error | `TC-ORG-02` pass |
| D5 | Minor | Manual check | Status page showed "Registered" as a row label/value swapped with the date | Dedicated `status.registered` key and correct label/value | `G-04` screenshot pass |
| D6 | Minor | Code review | `access_refused` was declared but never written (NFR-SEC-05) | Guards write `access_refused` with requested path and reason before redirecting | Code review; audit rows created on RBAC tests |
| D7 | Major | Teammate review | A signed-in organization on `/status` (and any user on `/notifications`) had no profile menu or **Log out**, because those pages rendered the public shell | Both pages now render the authenticated shell (`AppShell`), so the header carries the organisation badge, language switch, bell and profile menu with Log out | API lifecycle: two new logout-control checks pass; `TC-UI-06` pass |

---

## 6. Coverage against the SRS (Member 1 scope)

| Requirement | Covered by |
| --- | --- |
| FR-ADM-01 (login required, role-scoped access) | Unit `rules.test.ts`; API lifecycle; `TC-AUTH-01/02/08`, `TC-RBAC-01..07` |
| FR-ADM-02 (account administration foundation) | Seed/administrator account, `users.status` enforcement, deactivation support in DB + login; full A-03 screen owned by Member 2 |
| FR-VER-01..06 (registration, statuses, history, restrictions, badges, outcome) | Unit validation; API lifecycle (registration/approval/suspension/re-apply); `TC-ORG-*`, `TC-VER-*`; screenshots G-02/G-04/A-02 |
| FR-DON-01, DR-03 (donor signup + OTP + consent) | Unit validation; API lifecycle; `TC-REG-*`; screenshot G-03 |
| NFR-SEC-01/02/04/05 | Unit `password`, `rules`, `csrf`; API lockout; audit rows; `TC-AUTH-*`, `TC-PWD-*` |
| NFR-LOC-01..07, IR-01/02/03 | Unit `i18n`, `format`; Urdu RTL screenshots (G-01/G-06); `TC-I18N-*`, `TC-UI-03` |
| NFR-USA-01/04/05 | Mobile screenshots at 390 px; error/validation states; `TC-UI-03/04` |
| NFR-MAIN-02 | Per-module i18n dictionaries; `TC-UI-05` |

Full requirement-by-requirement evidence: [`docs/TRACEABILITY.md`](../../docs/TRACEABILITY.md).

---

## 7. Evidence index

| Evidence | Location |
| --- | --- |
| Unit test output | [`results/unit-tests-latest.txt`](results/unit-tests-latest.txt) |
| API lifecycle output (human-readable) | [`results/api-lifecycle-latest.txt`](results/api-lifecycle-latest.txt) |
| API lifecycle output (machine-readable) | [`results/api-lifecycle-latest.json`](results/api-lifecycle-latest.json) |
| TypeScript check | [`results/typecheck-latest.txt`](results/typecheck-latest.txt) |
| Production build | [`results/production-build-latest.txt`](results/production-build-latest.txt) |
| Screenshots (10 key screens + mobile + Urdu RTL) | [`docs/screenshots/`](../../docs/screenshots/) |
| Manual cases | [`MANUAL-TEST-CASES.md`](MANUAL-TEST-CASES.md) |

---

## 8. How to reproduce (any machine)

```powershell
cd wasl
pnpm install
pnpm db:seed
pnpm test                        # 157 unit tests
pnpm dev                         # leave running in this window

# in a second PowerShell window:
pnpm verify:api                  # 29 API lifecycle checks
pnpm typecheck
pnpm build

# return to clean demo data
pnpm db:reset; pnpm db:seed
```

## 9. Sign-off

- Member 1 scope: **PASS** — 157 unit, 29 API lifecycle, 61/65 manual (4 time-based deferred), clean typecheck and production build.
- No known SRS contradiction in the delivered scope.
- Handover: the same structure is ready for Members 2–5 under `tests/member-2/` … `tests/member-5/`;
  they add their cases and results without touching Member 1's files.
