# Wasl — Requirements Traceability (Sprint 1)

Maps every requirement Member 1 owns in Sprint 1 (Modules 1 and 9) to the code that implements it
and to the evidence that proves it. The second table lists the remaining Sprint 1 requirements with
their owner module and honest status.

Evidence types used below:

- **Unit test** — an automated `node:test` file in `tests/` (189 tests, all passing).
- **Code review** — the implementation is present; it imports `server-only`/the database, so it is
  excluded from the plain-Node suite (see [`README.md`](../README.md#tests)).
- **Manual** — a scripted click-through using the seeded accounts; steps are in §3.

Requirement wording is summarised; the authoritative text is SRS v1.0.

---

## 1. Requirements owned by Member 1 (Modules 1 and 9)

### 1.1 Authentication, accounts and verification

| ID | Requirement (summary) | Implementation | Verification |
| --- | --- | --- | --- |
| **FR-ADM-01** | Users must log in; each user class reaches only its own features; other actions are refused | [`auth/login.ts`](../src/lib/auth/login.ts) (authenticate), [`auth/guards.ts`](../src/lib/auth/guards.ts) (`requireUser`, `requireRole`, `requireVerifiedOrganization`, `requireAdmin`), [`auth/rules.ts`](../src/lib/auth/rules.ts) (`ROLE_HOME`, `landingPath`), role layouts in `src/app/*/layout.tsx`, [`api/auth/login/route.ts`](../src/app/api/auth/login/route.ts) | **Unit test:** `tests/rules.test.ts` — role-home map, landing path per role, `canOperate`. **Manual:** log in as hospital, open `/admin` → redirected to `/hospital`; open `/bank/inventory` → redirected to `/hospital` (each area layout enforces both the role and the Verified status); log in as pending organization → `/status`; every signed-in page (`/status`, `/notifications`, role areas) has the profile menu with **Log out** (API lifecycle checks + `TC-UI-06`). |
| **FR-VER-01** | Organization registration with name, type, Karachi address, official phone + email, licence number, representative name + designation, and at least one supporting document; incomplete submissions rejected with a clear message | [`validation.ts`](../src/lib/validation.ts) (`validateOrganizationRegistration`), [`api/auth/org/register/route.ts`](../src/app/api/auth/org/register/route.ts) (document required, PDF/PNG/JPG, ≤ 5 MB; organization + document + user in one transaction), [`org-registration-form.tsx`](../src/components/forms/org-registration-form.tsx), `organizations` + `organization_documents` tables | **Unit test:** `tests/validation.test.ts` — every mandatory field, invalid type/email/mobile/licence, password and mismatch. **Code review:** document checks and `organization_documents` insert. **Manual:** submit with no file → “Attach at least one supporting document.”; upload a `.gif` → type error; submit valid → status Pending. **Deliberate scope:** the official phone is captured as a Pakistani **mobile** number because it is also the account's OTP verification and password-recovery contact; the field is labelled "Official mobile" with a hint. Landline-only organizations would need a separate recovery number — see [`ARCHITECTURE.md`](ARCHITECTURE.md#11-known-limitations-of-the-sprint-1-foundation). |
| **FR-VER-02** | Exactly one verification status per organization; administrator reviews Pending registrations and approves/rejects; rejection needs a reason; every decision kept with administrator, date, time and reason; re-apply allowed after rejection (A-04) | [`api/admin/verify/route.ts`](../src/app/api/admin/verify/route.ts) (status + `verification_history` + audit in one flow; reason required to reject/suspend), [`status/page.tsx`](../src/app/status/page.tsx) (status + full history), [`admin/verifications/page.tsx`](../src/app/admin/verifications/page.tsx) (A-02 queue), [`api/organization/reapply/route.ts`](../src/app/api/organization/reapply/route.ts); `verification_history` and `CHECK` constraint on `organizations.verification_status` | **Code review:** state transitions and reason validation. **Manual:** approve one registration and reject another with a reason; both appear in the history and on `/status`; rejected account can re-apply → Pending. |
| **FR-VER-03** | Until Verified, an organization may not post requests, record inventory, create campaigns or appear as having blood available | [`auth/rules.ts`](../src/lib/auth/rules.ts) (`canOperate`), [`auth/guards.ts`](../src/lib/auth/guards.ts) (`requireVerifiedOrganization` → `/status`), used by the hospital, bank and organizer layouts; `landingPath` sends unverified organizations to `/status` | **Unit test:** `tests/rules.test.ts` — `canOperate` false for pending/rejected/suspended for all three organization roles. **Manual:** pending hospital logs in → `/status`; direct visit to `/hospital` → `/status`. |
| **FR-VER-04** | Administrator may suspend a Verified organization with a reason; while suspended it loses operational access (and its content is hidden from others) | Suspend + reinstate with reason in [`api/admin/verify/route.ts`](../src/app/api/admin/verify/route.ts); loss of access via `requireVerifiedOrganization`; `organizations.status_reason` | **Code review; manual:** suspend the seeded verified blood bank → its user is sent to `/status`; reinstate → access restored. **Partial:** hiding its requests/inventory/campaigns can only be added with those tables (Sprint 2, M2+M4/M6). |
| **FR-VER-05** | The verification status is shown wherever an organization's item is shown to another user | [`StatusBadge`](../src/components/ui/index.tsx) is the single badge component; the header shows the signed-in organization's badge and the account-status screen shows it; `status.*` labels have exactly one definition | **Unit test:** `tests/i18n.test.ts` — short status labels exist in both languages and each key has one owner. **Manual:** badge visible in header on every signed-in screen. Other modules must use `StatusBadge` when they show an organization (placeholders already do). |
| **FR-VER-06** | The applicant is told the outcome of its registration through the contact details it gave | [`notifications.ts`](../src/lib/notifications.ts) (`notifyOrganizationDecision`: in-platform notification in both languages + SMS to the official phone), called by the admin decision route; G-04 status screen | **Code review; manual:** approve a registration → notification appears on `/notifications` and the message appears on `/dev/outbox`. |
| **FR-DON-01** | A person registers as a donor with a name and mobile number, and the number is confirmed by a one-time passcode; a wrong code is rejected | [`validation.ts`](../src/lib/validation.ts) (`validateDonorSignup`), [`auth/otp.ts`](../src/lib/auth/otp.ts) (6 digits, 5-minute expiry, 60-second resend cooldown, ≤ 5 attempts, bound to phone, hashed), [`api/auth/otp/send/route.ts`](../src/app/api/auth/otp/send/route.ts), [`api/auth/donor/signup/route.ts`](../src/app/api/auth/donor/signup/route.ts), [`donor-signup-form.tsx`](../src/components/forms/donor-signup-form.tsx) | **Unit test:** `tests/validation.test.ts` — name/mobile rules, 6-digit OTP format, donor fields. **Manual:** send code, read `/dev/outbox`, enter a wrong code → rejected; correct code → account created and signed in. |
| **DR-03** | The registration explains, in English and Urdu, that donor contact details are shared only after the donor responds Willing, and records consent | Consent statement in both languages (`donorSignup.consent`), required checkbox in the form, server-side rejection without consent (`validateDonorSignup`), stored in `donors.consent_share_contact_at` on signup | **Unit test:** `tests/validation.test.ts` — consent is mandatory, must be boolean `true`. **Code review:** `consent_share_contact_at` written at signup. **Manual:** submit without ticking consent → blocked with the consent message. |

### 1.2 Security requirements

| ID | Requirement (summary) | Implementation | Verification |
| --- | --- | --- | --- |
| **NFR-SEC-01** | Passwords ≥ 8 characters, never stored or shown in readable form | [`auth/password.ts`](../src/lib/auth/password.ts) — scrypt, per-password salt, self-describing record, `timingSafeEqual`; `isStrongEnoughPassword` 8–200 used on every password form; no endpoint returns a password | **Unit test:** `tests/password.test.ts` (hash ≠ password, wrong password rejected, different salts, malformed/tampered hashes rejected) and `tests/validation.test.ts` (8-char boundary). |
| **NFR-SEC-02** | Session ends after 30 minutes without activity; account locked 15 minutes after 5 failed logins | [`auth/session.ts`](../src/lib/auth/session.ts) (idle `expires_at`, sliding at most once/minute, hashed tokens), [`auth/rules.ts`](../src/lib/auth/rules.ts) (`registerFailedLogin`, `isLocked`, `minutesUntil`, defaults 5/15, env-overridable), [`auth/login.ts`](../src/lib/auth/login.ts) (lock check + counter + lock persistence) | **Unit test:** `tests/rules.test.ts` — lock starts exactly on the 5th failure, lasts exactly 15 minutes, remaining attempts 4→0, `isLocked` transitions. **Code review:** session expiry path in `getSession()`. |
| **NFR-SEC-03** | Donor phone numbers and verification documents protected at rest and in transit | Sessions stored as SHA-256 only; OTPs as scrypt hashes; documents in `BYTEA` served only to the administrator or the submitting organization with `private, no-store` + `nosniff`; `Secure` cookie in production; TLS for the database when `PG_SSL=true` | **Code review:** [`api/documents/[id]/route.ts`](../src/app/api/documents/[id]/route.ts). See [`SECURITY.md`](SECURITY.md) for the remaining at-rest/production work. |
| **NFR-SEC-04** | Validate every input; resist injection, XSS, CSRF; checked in testing before release | [`validation.ts`](../src/lib/validation.ts) on every form/API; parameterized SQL only; React escaping and no `dangerouslySetInnerHTML`; [`csrf.ts`](../src/lib/csrf.ts) same-origin check on **every** state-changing POST route (including logout and language); file type/size limits; `safeRedirectPath` | **Unit test:** `tests/validation.test.ts` (64 cases) and `tests/csrf.test.ts` (8 cases). **Code review:** parameterized queries. Full security testing remains a release task (SRS requires it before release). |
| **NFR-SEC-05** | Record failed logins and refused actions for administrator review | [`audit.ts`](../src/lib/audit.ts) — `audit_log` with actor, action, details, IP; login records `login_failed`/`login_locked`; organization/verification/password/language actions recorded | **Code review:** audit calls in login and routes. Route guards write `access_refused` with the requested path and reason before redirecting; direct API 403s are not audited yet. The audit viewer (A-06) is an M2/M8 Sprint 2 screen. |
| **NFR-SEC-06** | Use personal data only for stated purposes; share only with the messaging provider | Registration collects only SRS §4.1 fields; donor location is an area; DR-03 consent stored; SMS only through the provider adapter or the local dev outbox; no analytics or third-party scripts | **Code review:** [`messaging.ts`](../src/lib/messaging.ts), forms, `validation.ts`. |

### 1.3 Localization requirements

| ID | Requirement (summary) | Implementation | Verification |
| --- | --- | --- | --- |
| **NFR-LOC-01** | All user text available in English and Urdu, no untranslated text in either; screens, notifications, SMS, errors, reports | [`i18n/index.ts`](../src/lib/i18n/index.ts) + `parts/*` (identical key sets in both languages); `translate` falls back EN → key; OTP SMS text in both languages; validation error codes map to `validation.*` keys | **Unit test:** `tests/i18n.test.ts` — `missingTranslations()` empty both ways, no empty values, identical placeholder sets, no duplicate key ownership, Urdu script checks. |
| **NFR-LOC-02** | Switch language at any time from every page; registered choice saved in the profile, visitor's remembered on the device | [`language-switch.tsx`](../src/components/shell/language-switch.tsx) in the global header; [`api/language/route.ts`](../src/app/api/language/route.ts); [`i18n/server.ts`](../src/lib/i18n/server.ts) resolution order (account → `wasl_lang` cookie → English); `savePreferredLanguage` writes users + donors | **Code review** (server module is `server-only`). **Manual:** switch to اردو, navigate, reload; sign in → choice persists in `/profile` menu and after re-login. |
| **NFR-LOC-03** | Urdu right-to-left with mirrored layout and a legible Urdu typeface; no clipping/overlap at 360 px in either language | [`app/layout.tsx`](../src/app/layout.tsx) sets `dir` on `<html>`; `globals.css` switches font family + line-height under `html[dir="rtl"]`, hides horizontal overflow; components use logical `ms-*`/`me-*`/`start-*`/`end-*` classes | **Unit test:** `tests/i18n.test.ts` — `directionOf("ur") === "rtl"`. **Manual:** 360 px viewport in both languages, every delivered screen; check `dir="rtl"` on `<html>`. |
| **NFR-LOC-04** | Notifications sent in the recipient's preferred language | Notifications store both languages and the centre renders the reader's language; OTP/reset SMS use `users.preferred_language`; decision notification sent in both stored forms | **Code review** ([`notifications.ts`](../src/lib/notifications.ts), [`otp/send`](../src/app/api/auth/otp/send/route.ts)). **Manual:** switch the seeded user to Urdu, request a code, inspect `/dev/outbox`. |
| **NFR-LOC-05** | Blood groups, units and dates consistent in both languages; dates/times in PKT and Gregorian | [`format.ts`](../src/lib/format.ts) — `Asia/Karachi`, explicit en-GB/ur-PK locales, Gregorian, 24-hour clock; `—` for invalid values; verification history and dates use it | **Unit test:** `tests/format.test.ts` — 26 tests including a UTC→PKT day boundary. |
| **NFR-LOC-06** | Text users type is shown as entered, not translated; campaign organizers can enter title/description in both languages (A-39) | Framework behaviour: user-typed values are rendered verbatim (no machine translation); the bilingual campaign fields belong to M6 | **Code review:** no translation of user values. **Gap:** bilingual campaign entry is Sprint 2 (M6) and is not delivered in Sprint 1. |
| **NFR-LOC-07** | Urdu wording reviewed by a native Urdu speaker before release | Process requirement; dictionaries are isolated per part to make review easy | **Not done** — release task, recorded in [`SECURITY.md`](SECURITY.md#5-gaps-and-what-is-needed-before-production). |

### 1.4 Interface, usability and maintainability requirements

| ID | Requirement (summary) | Implementation | Verification |
| --- | --- | --- | --- |
| **IR-01** | Responsive web app for mobile browsers, tablets and desktop from 360 px | Mobile-first Tailwind classes, `AppShell`/`PublicShell` max-widths, 44 px touch targets (`min-h-touch`), `viewport` in [`app/layout.tsx`](../src/app/layout.tsx) | **Manual:** 360 px / 768 px / desktop in both languages; no sideways scrolling. |
| **IR-02** | Each user class sees only its own navigation and screens; verification status shown with the same label and appearance everywhere | Role-specific `nav` arrays in each area layout + [`role-nav.tsx`](../src/components/shell/role-nav.tsx); `StatusBadge` is the single status rendering; `status.*` keys have one owner | **Unit test:** `tests/i18n.test.ts` (single owner per key, short status labels), `tests/rules.test.ts` (role homes). **Manual:** each seeded role sees only its navigation. |
| **IR-03** | English and Urdu, with a language switch on every page | Language switch inside the global header, rendered by both shells, which wrap every page via `src/app/layout.tsx` | **Code review; manual:** switch is present on public and signed-in screens. |
| **NFR-USA-01** | Every feature usable at 360 px without sideways scrolling | `globals.css`: `overflow-x: hidden`, 16 px base; responsive grids; scrollable role nav | **Manual:** 360 px audit of every delivered screen in both directions. |
| **NFR-USA-04** | Error messages in plain language, in the user's chosen language, saying what to do next | Validation returns field + code; forms map codes to `validation.*` messages in the current dictionary; server messages are human-readable sentences | **Unit test:** `tests/validation.test.ts` (`errorKey` mapping) + `tests/i18n.test.ts` (all messages translated). **Manual:** submit each form with errors in both languages. |
| **NFR-USA-05** | Text at least 16 px on mobile; contrast ratio at least 4.5:1 | `body { font-size: 16px }` in `globals.css`; colour tokens in `tailwind.config.ts` | **Partial:** 16 px implemented. Contrast has **not** been formally measured; some small secondary text uses `ink-400`/`ink-500` and needs a contrast audit before release (recorded as a gap). |
| **NFR-MAIN-02** | All user-visible text kept separately from program logic | Dictionaries in `src/lib/i18n/parts/<module>.ts`, one owner per key; components receive translated labels; no user-facing strings in `src/lib` logic (except development-only pages/logs) | **Unit test:** `tests/i18n.test.ts` — key parity, placeholder parity, no duplicate ownership, no empty values. **Code review:** the only hard-coded English left in a screen is the development-only `/dev/outbox` page (recorded as a known limitation). |

---

## 2. Remaining Sprint 1 requirements — owner and status

Status legend:

- **Implemented** — delivered, wired and demonstrable in Sprint 1.
- **Partial** — the Sprint 1 foundation covers part of it; the rest belongs to another module or to
  production hardening.
- **Placeholder** — the screen exists as a navigable, wireframe-faithful placeholder naming its
  wireframe ID and owning module, but the requirement's behaviour is not implemented. The exact
  Sprint 1-target / Sprint 2-reserved split per screen is in [`WIREFRAMES.md`](WIREFRAMES.md).
- **Sprint 2** — reserved; no screen behaviour yet.
- **Release task** — process/production work, not a coding module.

| ID | Requirement (summary) | Owner module (member) | Status |
| --- | --- | --- | --- |
| FR-ADM-01 | Login required, role-scoped access | M1 (Member 1) | **Implemented** |
| FR-ADM-02 | Administrator views/searches/deactivates/reactivates accounts; each action recorded | M2 (Member 2) | **Implemented** — A-03/admin/accounts: search, deactivate/reactivate with session invalidation, changes audited; self- and last-admin protection |
| FR-ADM-03 | Administrator cancels/hides false or harmful content, notifies organization | M2 (Member 2) | **Partial** — A-04 rejects/returns a campaign with a reason and notifies the organizer; the A-05 flags/hide queue is Sprint 2 |
| FR-ADM-04 | Users flag suspicious content; administrator flag queue | M2 (Member 2) | **Placeholder** — the A-05 flag queue is Sprint 2 reserved; users cannot flag content yet |
| FR-ADM-05 | Audit log of significant actions, viewable by administrators | M2 + M8 (Member 2) | **Partial** — Member 1 writes login/verification/registration/password/language entries; Member 2 adds account and campaign decisions; the A-06 viewer is a Sprint 2 placeholder |
| FR-ADM-06 | Inventory dashboard across verified blood banks | M8 (Member 2) | **Placeholder** — A-01 is Sprint 2 reserved |
| FR-ADM-07 | Request report by date range | M8 (Member 2) | **Placeholder** — A-07 is Sprint 2 reserved |
| FR-ADM-08 | Donation activity report, aggregate only | M8 (Member 2) | **Placeholder** — A-07 is Sprint 2 reserved |
| FR-ADM-09 | Administrators see pending registrations, campaigns and unreviewed flags with waiting time | M2 + M8 (Member 2) | **Partial** — pending registrations (A-02) and pending campaigns (A-04) with waiting time; unreviewed flags remain Sprint 2 |
| FR-ADM-10 | Administrator-maintained values changeable without software changes | M8 (Member 2) | **Partial** — values seeded in the `settings` table (matching distances, expiry windows, Karachi areas); the A-08 editor is a Sprint 2 placeholder |
| FR-INV-01..03 | Record/update inventory batches with testing status and movements | M4 (Member 3) | **Implemented** — B-02/B-03/B-04, `src/lib/inventory/{rules,data}.ts`, migration `004_inventory`; proved by `tests/member-3/unit/inventory-rules.test.ts` and `scripts/verify-inventory.mjs` (4.1–4.3) |
| FR-INV-04..09 | Reservations, issuance, transfers, cross-bank search and exclusions | M4 (Member 3) | **Implemented** for inventory (FR-INV-04/05/06/08); FR-INV-07 (search screen H-02) and FR-INV-09 (hospital-facing last-updated + disclaimer) are **Implemented** by Member 5 (`src/lib/search/*`, `/hospital/search`, `/api/hospital/search`; tests in `tests/member-5/`) and read these tables. The exclusion rule lives in `rules.countsAsAvailable` and is proved by the availability unit tests (4.8) |
| FR-REQ-01..09 | Hospital requests: create, statuses, history, auto-expiry, matching banks, offers, edits, listing | M5 (Member 5) | **Placeholder** — H-03/H-04/H-05/H-06/H-07 are Sprint 2 reserved; H-01/H-02 (dashboard, search) are Sprint 1 targets |
| FR-DON-01 | Donor signup with mobile + OTP | M1 (Member 1) | **Implemented** |
| FR-DON-02..13 | Donor profile, history, availability, matching, ranking, privacy of contact details, relevant requests | M3 (Member 4) | **Placeholder** — D-03/D-04 are Sprint 1 targets; D-01/D-02 and matching responsibility are Sprint 2 reserved |
| FR-NOT-01..03, 05..11 | Donor responses/outcomes, multi-channel notifications, delivery status, escalation | M3/M5/M7 (Members 3–5) with the M9 shell | **Partial** — notification centre shell (FR-NOT-04) by Member 1; response/matching/notification business rules Sprint 2 |
| FR-NOT-04 | In-platform notification centre with unread count; every notification stored | M9 (Member 1) | **Implemented** |
| FR-CAM-01..09 | Campaign create/submit/approve/browse/interest/cancel/complete | M6 (Member 4) | **Placeholder** — O-01/O-02/O-03/D-05/D-06 are Sprint 1 targets; approval effects and records Sprint 2 |
| FR-MON-01..06 | Expiry and low-stock alerts, thresholds, dashboard, evaluation interval | M7 (Member 3) | **Implemented** — B-01/B-05, `src/lib/inventory/monitoring.ts`, alerts + acknowledge + optional SMS + hourly guard; proved by `tests/member-3/unit/monitoring-rules.test.ts` and `scripts/verify-inventory.mjs` (7.3/7.4) |
| FR-VER-01..06 | Organization verification lifecycle | M1 (Member 1) | **Implemented** (FR-VER-04/05 content-hiding completed with Sprint 2 modules) |
| NFR-PERF-01..05 | Performance targets under load | All modules (Member 1 owns the foundation) | **Not measured** — requires load testing with seeded data (release task) |
| NFR-REL-01..04 | Availability, request durability, messaging-failure tolerance, daily backups | Foundation + operations | **Partial** — in-platform notifications keep working when SMS fails (REL-03); backups are a deployment task |
| NFR-SEC-03/06 | Data protection at rest/in transit; purpose limitation | M1 foundation + operations | **Partial** — see [`SECURITY.md`](SECURITY.md) |
| NFR-USA-02 | Usability test: 90% of create-request tasks in 3 minutes with ≥ 5 hospital staff | M5 + QA | **Sprint 2 / release task** — depends on the request screen |
| NFR-USA-03 | Donor responds in ≤ 3 steps from the notification link | M3/M5 | **Sprint 2** |
| NFR-COM-01 | Supported browsers (latest two versions of Chrome/Edge/Firefox/Safari; mobile Chrome/Safari) | QA | **Release task** — no browser matrix has been run |
| NFR-SCAL-01 | 25 hospitals, 25 blood banks, 20,000 donors | All modules | **Not measured** |
| NFR-MAIN-01 | FR-ADM-10 values changeable without code changes | M8 (Member 2) | **Partial** — values live in the `settings` table and are read from there when seeded; editor Sprint 2 |
| NFR-MAIN-02 | User-facing text separated from program logic | M9 (Member 1) | **Implemented** |
| NFR-SAF-01..03 | Eligibility/availability statements; no medical advice; units described only by staff-entered status | M1 wording + all modules | **Partial** — statements exist in both languages (`notice.eligibility`, `notice.availabilityDisclaimer`) and the footer states coordination-only; matching/availability screens are Sprint 2 |
| IR-04 | Notification link opens the response page, asking for login first | M1 (guard) + M5/M3 (page) | **Partial** — `requireUser(nextPath)` supports `?next=`; the response page is Sprint 2 |
| IR-05 | SMS through a replaceable external provider with delivery reports | M1 (adapter) | **Partial** — provider abstraction + Twilio path implemented and replaceable; no provider configured; delivery reports/retries (FR-NOT-10) Sprint 2 |
| IR-06 | WhatsApp messages where technically feasible | M3/M5 | **Sprint 2** — not implemented |
| IR-07 | OTP sent through the same SMS interface | M1 (Member 1) | **Implemented** |
| IR-08 | Karachi areas list with approximate locations and English/Urdu names, administrator-maintained | M8 (Member 2) | **Partial** — 26 areas with EN/UR names and coordinates seeded in `settings`; the A-08 editor is Sprint 2 |
| IR-09 | No special hardware; supported browser + internet | All | **Satisfied by design** |
| IR-10 | All communication encrypted and authenticated | Operations + M1 | **Partial** — authenticated sessions and `Secure` cookies in production; TLS is a deployment task |
| DR-01 | Data consistency: non-negative quantities, valid expiry, valid needed-by, valid references | M1 schema foundation + all modules | **Partial** — `CHECK` constraints and foreign keys exist for the delivered tables; operational tables Sprint 2 |
| DR-02 | Collect only SRS §4.1 data; no patient names/medical details; donor location is an area | M1 + M3/M5 | **Partial** — delivered forms collect only the listed fields; the request form is Sprint 2 |
| DR-03 | Donor informed (EN/UR) that contact details are shared after Willing; consent recorded | M1 (Member 1) | **Implemented** |
| DR-04 | Verification documents visible only to administrators and the submitting organization | M1 (Member 1) | **Implemented** — `GET /api/documents/[id]` |
| DR-05 | Records kept ≥ 12 months; deleted donor persona removed within 30 days | M2/M3 + operations | **Sprint 2 / release task** — no retention or donor-deletion job exists yet |

---

## 3. Manual verification script (Sprint 1)

```bash
pnpm db:seed      # verify accounts + one pending and one rejected organization
pnpm dev          # http://localhost:3000
```

1. **Login and lockout (FR-ADM-01, NFR-SEC-02):** sign in as `hospital@demo.wasl` with a wrong
   password five times. The fifth attempt reports the account is locked for 15 minutes; the demo
   admin account is unaffected.
2. **Role routing (FR-ADM-01, FR-VER-03):** sign in as a verified hospital → `/hospital` area;
   visit `/admin` → redirected to the hospital home; visit `/bank/inventory` → redirected to the
   hospital home as well. Sign in as `pending@demo.wasl` → `/status`.
3. **Registration (FR-VER-01):** `/register/organization` with no supporting document → inline error.
   With a PDF and all fields → signed in and sent to `/status` with Pending.
4. **Verification (FR-VER-02, FR-VER-06):** as admin, open `/admin/verifications`, reject the pending
   registration with a reason, then approve it. `/status` for that organization shows both decisions
   with date, time, administrator and reason. `/notifications` shows the outcome notice.
5. **Re-apply (A-04):** sign in as `rejected@demo.wasl`, press Reapply → status Pending and a
   `reapplied` history row.
6. **Donor signup (FR-DON-01, DR-03):** `/register/donor`; send the code, read it in the development
   notice or `/dev/outbox`, try a wrong code (rejected), then the right one. Do not tick consent
   first — submission is refused. Create the account → signed in at `/donor`.
7. **Password reset:** `/forgot-password`, request a code, set a new password; all old sessions stop
   working at the next request.
8. **Language (NFR-LOC-01..05):** switch to اردو on the landing page and on a signed-in screen. The
   whole page mirrors (`<html dir="rtl">`), text is Urdu, dates stay in PKT/Gregorian, and the
   preference survives a re-login.
9. **Notification centre (FR-NOT-04):** the bell shows the seeded unread count; `/notifications`
   lists items with delivery status; “Mark all as read” clears the bell.
10. **Documents (DR-04):** as admin, open the seeded document; as a different organization, the same
    URL returns 403.
