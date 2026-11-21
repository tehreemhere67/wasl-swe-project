# Wasl — Blood Donation and Coordination Platform for Karachi

Wasl (Arabic/Urdu for *connection*) is a web application that lets **verified hospitals, verified
blood banks, donation organizations and donors** share information about blood availability and
blood needs in Karachi.

Wasl **only coordinates information**. It does not store, transport or handle blood, it takes no
payment, and it never decides whether a person is medically eligible to donate — eligibility remains
with qualified medical staff at the time of donation (SRS §1.3, BR-3, BR-4, BR-5).

- **Never run a Node project before?** Follow [`docs/GETTING-STARTED.md`](docs/GETTING-STARTED.md)
  step by step — it includes a 5-minute demo script and troubleshooting.
- **New teammate?** Read [`docs/MEMBER-1-EXPLAINED.md`](docs/MEMBER-1-EXPLAINED.md) first: it explains
  what is built in plain words and what each member does next. Then read
  [`docs/HANDOFF.md`](docs/HANDOFF.md) for the exact technical recipe.
- **Sprint 1 backlog:** [`docs/SPRINT-BACKLOG.md`](docs/SPRINT-BACKLOG.md) — module breakdown, member
  responsibilities, and the To Do / In Progress / Done lists. Import [`docs/trello-board.json`](docs/trello-board.json)
  into Trello to create the matching board.
- **Daily Scrum minutes (Sprint 1):** [`docs/DAILY-SCRUM-MINUTES.md`](docs/DAILY-SCRUM-MINUTES.md) —
  the five minuted team check-ins, their durations and decisions.
- **Tests:** [`tests/README.md`](tests/README.md) (how to run/add tests) and Member 1's
  [`tests/member-1/TEST-RESULTS.md`](tests/member-1/TEST-RESULTS.md).
- Full requirements: [`docs/`](docs/) — start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
  [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md) and [`docs/SPRINT-BACKLOG.md`](docs/SPRINT-BACKLOG.md).
- Source documents: [`docs/source/`](docs/source/) — the Wasl SRS v1.0 (18 October 2026), the project
  proposal, and the wireframe sheets (as originally submitted).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15.5 (App Router, React 19, Server Components) |
| Language | TypeScript 5.9 (strict) |
| Styling | Tailwind CSS 3.4, design tokens in `tailwind.config.ts` + `src/app/globals.css` |
| Data store | PostgreSQL. **Embedded PostgreSQL (PGlite)** in development, `pg` against a real PostgreSQL server in production — one schema, one SQL dialect |
| Auth | scrypt password hashing, opaque session tokens (SHA-256 at rest), httpOnly cookie |
| i18n | English + Urdu dictionaries in `src/lib/i18n/parts/*` (no runtime i18n package) |
| Messaging | Twilio adapter, with a development "Dev Outbox" when no provider is configured |
| Tests | `node:test` + `node:assert/strict`, no test framework dependency |

## Prerequisites

- **Node.js 22.18+ or 24.x** — the app *and* the `scripts/*.ts` helpers run through Node's built-in
  TypeScript type stripping, so an older Node cannot run `pnpm db:seed` (verified on Node 24.21).
- **pnpm 9+** (`corepack enable` is the easiest way to get it). The repository pins
  `nodeLinker: hoisted` in `pnpm-workspace.yaml` so `node_modules` is a flat tree; keep that file —
  symlinked layouts break `next build` in environments that do not follow symlinks.
- No PostgreSQL server is needed for local development. The embedded PostgreSQL database is created
  on first run in `.data/wasl-pg` (git-ignored).

## Setup

```bash
pnpm install

# Configuration - only needed once. The defaults work for local development,
# so you can skip this step entirely if you do not want a custom admin account.
cp .env.example .env.local        # macOS / Linux
# Copy-Item .env.example .env.local   # Windows PowerShell

pnpm db:seed   # creates the schema and the demo accounts (safe to run twice)
pnpm dev       # http://localhost:3000
```

The organization registration form asks for an **official mobile number** (not a landline): the
same number is the account's OTP verification and password-recovery contact.

`pnpm db:seed` applies the migrations and seeds one account per role. Other useful commands:

| Command | What it does |
| --- | --- |
| `pnpm db:migrate` | Applies pending migrations only |
| `pnpm db:seed` | Migrates, then creates/updates the demo accounts |
| `pnpm db:reset` | Deletes the local PGlite data directory (refuses if `DATABASE_URL` is set) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Runs the unit-test suite |

To run against a real PostgreSQL server instead, set `DATABASE_URL` in `.env.local` — nothing else
changes (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#4-database)).

## Demo accounts

Created by `pnpm db:seed` (`scripts/seed.ts`). Passwords can be overridden with `ADMIN_PASSWORD`
and `DEMO_PASSWORD` in the environment.

| Role | Login | Password | Notes |
| --- | --- | --- | --- |
| Administrator | `admin@wasl.pk` | `WaslAdmin#2026` | From `.env.example`; created only by seeding |
| Verified hospital | `hospital@demo.wasl` | `WaslDemo#2026` | Aga Khan University Hospital |
| Verified blood bank | `bank@demo.wasl` | `WaslDemo#2026` | Karachi Blood Bank |
| Verified blood bank 2 | `bank2@demo.wasl` | `WaslDemo#2026` | Clifton Community Blood Bank (test bank for transfers) |
| Verified organizer | `organizer@demo.wasl` | `WaslDemo#2026` | Wasl Founding Initiative (donation organization) |
| Pending hospital | `pending@demo.wasl` | `WaslDemo#2026` | Stays on the account-status screen (G-04) |
| Rejected organization | `rejected@demo.wasl` | `WaslDemo#2026` | Status screen with the rejection reason |
| Donor | `+923009876543` | `WaslDemo#2026` | Log in with the phone number |

The demo organizations each come with a placeholder licence document so the administrator
verification queue (A-02) has something to open.

### One-time passcodes without an SMS provider

No messaging provider is configured by default, so `sendSms()` writes the message to the
`dev_outbox` table instead of sending it. To finish a donor signup or a password reset locally:

1. Open `/dev/outbox` after pressing **Send code** (development only — the page refuses to render
   when `NODE_ENV=production`), **or** read the code shown in the form's development notice,
   **or** use the `devCode` field in the `/api/auth/otp/send` response.

## Screens

Captured from the running Sprint 1 app with a headless browser (Playwright) at 1280 px and 390 px
widths, as the seeded demo accounts. They are the verification evidence that the delivered
screens follow the wireframes. The full set is in `docs/screenshots/`.

| # | Screen | Screenshot |
| --- | --- | --- |
| 1 | **G-01** Landing / login | ![G-01](docs/screenshots/01-G-01-landing.png) |
| 2 | **G-01** Landing / login (mobile) | ![G-01 mobile](docs/screenshots/24-G-01-landing-mobile.png) |
| 3 | **G-02** Organization registration | ![G-02](docs/screenshots/02-G-02-organization-registration.png) |
| 4 | **G-03** Donor signup + OTP (mobile) | ![G-03](docs/screenshots/03-G-03-donor-signup-otp.png) |
| 5 | **G-04** Account status — Pending (mobile) | ![G-04](docs/screenshots/04-G-04-account-status-pending.png) |
| 6 | **G-05** Notification centre | ![G-05](docs/screenshots/05-G-05-notification-centre.png) |
| 7 | **G-06** Urdu RTL — donor profile (mobile) | ![G-06](docs/screenshots/06-G-06-urdu-rtl-donor-profile.png) |
| 8 | Forgot password | ![forgot password](docs/screenshots/forgot-password.png) |
| 9 | **A-02** Administrator verification queue | ![A-02](docs/screenshots/07-A-02-admin-verification-queue.png) |
| 10 | **A-03** Administrator account management | ![A-03](docs/screenshots/08-A-03-admin-accounts.png) |
| 11 | **A-04** Campaign review | ![A-04](docs/screenshots/09-A-04-campaign-review.png) |
| 12 | **B-01** Blood-bank dashboard with alerts | ![B-01](docs/screenshots/10-B-01-blood-bank-dashboard.png) |
| 13 | **B-02** Inventory list | ![B-02](docs/screenshots/11-B-02-inventory-list.png) |
| 14 | **B-03** Add batch | ![B-03](docs/screenshots/12-B-03-add-batch.png) |
| 15 | **B-04** Batch detail | ![B-04](docs/screenshots/13-B-04-batch-detail.png) |
| 16 | **B-05** Monitoring settings | ![B-05](docs/screenshots/14-B-05-bank-settings.png) |
| 17 | **H-01** Hospital dashboard | ![H-01](docs/screenshots/15-H-01-hospital-dashboard.png) |
| 18 | **H-02** Blood availability search (with results) | ![H-02](docs/screenshots/16-H-02-hospital-search.png) |
| 19 | **D-03** Donor profile | ![D-03](docs/screenshots/17-D-03-donor-profile.png) |
| 20 | **D-04** Donation history | ![D-04](docs/screenshots/18-D-04-donor-history.png) |
| 21 | **D-05** Browse campaigns | ![D-05](docs/screenshots/19-D-05-campaigns-browse.png) |
| 22 | **D-06** Campaign detail | ![D-06](docs/screenshots/20-D-06-campaign-detail.png) |
| 23 | **O-01** Create campaign | ![O-01](docs/screenshots/21-O-01-create-campaign.png) |
| 24 | **O-02** My campaigns | ![O-02](docs/screenshots/22-O-02-my-campaigns.png) |

Every implemented route area was loaded in a real browser as each seeded account; cross-role
access is refused (a hospital opening `/bank/inventory` is redirected home, a donor opening
`/hospital` is redirected to `/donor`), a Pending organisation is held on `/status`, and the Urdu
switch sets `<html lang="ur" dir="rtl">` on the whole app. The only remaining placeholder
screens are the ones reserved for Sprint 2.
## Tests

Tests are grouped **by team member**: Member 1's are in `tests/member-1/`, and Members 2–5 add theirs
under `tests/member-N/`. `pnpm test` discovers every `*.test.ts` file automatically. Full instructions,
conventions and per-member templates: [`tests/README.md`](tests/README.md).

```bash
pnpm test          # unit suite, no server needed (345 tests across all members)
pnpm verify:api    # 29-check end-to-end API lifecycle; run `pnpm dev` in another window first
pnpm typecheck     # strict TypeScript check
pnpm build         # production build
```

**Evidence per member:** Member 1 — [TEST-RESULTS](tests/member-1/TEST-RESULTS.md), [MANUAL-TEST-CASES](tests/member-1/MANUAL-TEST-CASES.md), `tests/member-1/results/`; Member 2 — [TEST-RESULTS](tests/member-2/TEST-RESULTS.md), [MANUAL-TEST-CASES](tests/member-2/MANUAL-TEST-CASES.md); Member 3 — [TEST-RESULTS](tests/member-3/TEST-RESULTS.md); Member 4 — [TEST-RESULTS](tests/member-4/TEST-RESULTS.md); Member 5 — [TEST-RESULTS](tests/member-5/TEST-RESULTS.md).

**Suite total: 345/345 passing** — Member 1: 157 (six files under `tests/member-1/unit/`), Member 2: 32, Members 3–5: 156 (inventory, monitoring, donor, campaign and search rules). Member 1 also has 29/29 API lifecycle checks, Member 3 38/38 inventory checks, Member 4 109/109 campaign checks and Member 5 34/34 search checks (all `scripts/verify-*.mjs`).

| File (under `tests/member-1/unit/`) | Covers |
| --- | --- |
| `validation.test.ts` | `src/lib/validation.ts` — mobile/email/password/OTP rules, **FR-VER-01** registration fields, **FR-DON-01** + **DR-03** donor signup |
| `password.test.ts` | `src/lib/auth/password.ts` — scrypt hashing, verification, malformed hashes (**NFR-SEC-01**) |
| `rules.test.ts` | `src/lib/auth/rules.ts` — landing paths, **FR-VER-03**, **NFR-SEC-02** lockout |
| `i18n.test.ts` | `src/lib/i18n/*` — EN/UR key parity and RTL (**NFR-LOC-01**, **NFR-LOC-03**) |
| `format.test.ts` | `src/lib/format.ts` — PKT dates, relative time, file sizes (**NFR-LOC-05**) |
| `csrf.test.ts` | `src/lib/csrf.ts` — same-origin check (**NFR-SEC-04**) |
| `tests/member-2/admin.test.ts` | `src/lib/admin/rules.ts` — account search and status changes, campaign decisions, type guards (**FR-ADM-02**, **FR-ADM-03/04**, **FR-CAM-02**) |
| `tests/member-3/unit/inventory-rules.test.ts` | `src/lib/inventory/rules.ts` — batch validation, availability, movements, reservations, transfers (**FR-INV-01…FR-INV-06**) |
| `tests/member-3/unit/monitoring-rules.test.ts` | `src/lib/inventory/monitoring.ts` — expiry windows, low-stock threshold, 24-hour alert rule, sweep timing (**FR-MON-01…FR-MON-06**) |
| `tests/member-4/unit/donor-rules.test.ts` | `src/lib/donor/rules.ts` — donor profile, history, reminders, campaign notices (**FR-DON-02…FR-DON-06**) |
| `tests/member-4/unit/campaign-rules.test.ts` | `src/lib/campaigns/rules.ts` — campaign status rules, approval visibility, filters, outcomes (**FR-CAM-01…FR-CAM-09**) |
| `tests/member-5/unit/search-rules.test.ts` | `src/lib/search/rules.ts` — search validation, grouping, exclusions (**FR-INV-07**, **FR-INV-08**) |

`tests/ts-loader.mjs` is a test-only resolver shim: the i18n module imports its dictionary parts
without file extensions (correct for Next.js/TypeScript, but plain Node needs the extension).
`tests/run-all.ts` imports every discovered test file in one process because some sandboxed
environments block the child-process spawn that `node --test` uses; the tests themselves are plain
`node:test`, so `node --test` works too on a normal machine.

## Project structure

```text
wasl/
├─ src/
│  ├─ app/                     Next.js App Router
│  │  ├─ page.tsx              G-01 landing + login
│  │  ├─ register/organization G-02 organization registration
│  │  ├─ register/donor        G-03 donor signup + OTP
│  │  ├─ status                G-04 pending / rejected / suspended / verified
│  │  ├─ notifications         G-05 notification centre
│  │  ├─ forgot-password       password reset (code + new password)
│  │  ├─ admin/                administrator area (A-01..A-08)
│  │  ├─ hospital/ bank/ donor/ organizer/   role areas
│  │  ├─ dev/outbox            development SMS viewer (not in production)
│  │  └─ api/                  route handlers (auth, documents, language, notifications)
│  ├─ components/
│  │  ├─ ui/                   buttons, fields, badges, cards (design system)
│  │  ├─ forms/                client forms (login, signup, registration, admin verify)
│  │  └─ shell/                header bar, navigation, language switch, notification bell
│  └─ lib/
│     ├─ validation.ts         pure validation rules
│     ├─ format.ts             PKT date/time formatting
│     ├─ csrf.ts               same-origin guard
│     ├─ audit.ts              audit log
│     ├─ messaging.ts          SMS adapter + dev outbox
│     ├─ notifications.ts      notification centre storage
│     ├─ auth/                 password, tokens, sessions, login, OTP, rules, guards
│     ├─ db/                   driver abstraction + migrations
│     └─ i18n/                 dictionaries per module + server locale resolution
├─ scripts/                    connect, migrate, seed, reset (plain Node)
├─ tests/                      tests by member (member-1/ … member-5/) + runner
├─ docs/                       architecture, traceability, sprint backlog, trello board, daily scrum minutes, handoff
└─ .data/                      local PGlite data (git-ignored)
```

## Implemented vs. stubbed

**Implemented (Member 1 — Modules 1 and 9):** login with lockout and deactivation handling,
sessions with a 30-minute idle timeout, organization registration with a mandatory supporting
document, the verification lifecycle (Pending → Verified / Rejected / Suspended / reinstated and
re-apply), the administrator verification queue (A-02 baseline), donor signup with a one-time
passcode and recorded DR-03 consent, the account-status screen with full decision history, forgot
password / reset password, the notification centre shell with unread count, English/Urdu with RTL,
the global header (language switch, notification bell, profile menu), role-based access and route
guards, and the audit log.

**Implemented (Member 2 — Modules 2 and 8):** the verification queue (A-02) with text search,
organisation-type filter, waiting time and the supporting document; administrator account
management (A-03) with search over users and organisations, deactivate/reactivate, protection
against deactivating yourself or the last active administrator, and audited changes; campaign
review (A-04) with approve / reject-with-reason / return-for-changes and an organiser
notification. Tests: [`tests/member-2/`](tests/member-2/MANUAL-TEST-CASES.md) · results:
[`TEST-RESULTS.md`](tests/member-2/TEST-RESULTS.md).

**Member 3 — Modules 4 and 7 (blood-bank inventory and monitoring) are implemented:** B-01
dashboard with expiry and low-stock alerts, B-02 inventory list with the batch reference, B-03
add batch, B-04 batch detail with movement history, B-05 monitoring settings (per-component
expiry windows and low-stock thresholds), plus reservations, transfers out, issuing units,
corrections, archiving and the 24-hour alert rule. Docs: [`docs/member-3/`](docs/member-3/IMPLEMENTATION-NOTES.md) ·
tests: [`tests/member-3/`](tests/member-3/MANUAL-TEST-CASES.md) · live check: `node scripts/verify-inventory.mjs`.

**Member 5 — Module 5 (hospital blood availability search) is implemented:** H-02 `/hospital/search`
with required blood group and component, results per verified blood bank (quantity, earliest expiry,
area, phone, e-mail, last updated), exclusion of expired / unapproved / reserved stock and unverified
banks, the "as reported by the blood bank" statement, and a no-results state with a create-request
option. Hospital-only (A-12). Docs: [`docs/member-5/`](docs/member-5/IMPLEMENTATION-NOTES.md) ·
tests: [`tests/member-5/`](tests/member-5/MANUAL-TEST-CASES.md) · live check: `node scripts/verify-search.mjs`.

**Member 4 — Modules 3 and 6 (donor profile, history, reminders and donation campaigns) are implemented:**
D-03 `/donor/profile` (blood group, Karachi area, availability, SMS / WhatsApp / Platform channels,
urgent / campaign notices, language, Save, Delete account), D-04 `/donor/history` (total, Self reported /
Recorded by org rows, "+ Add past donation", "Remind me after N days"), D-05 `/donor/campaigns` (Area / Date /
Group filters, search, verified campaign cards), D-06 `/donor/campaigns/[id]` ("I plan to attend"),
O-01 `/organizer/campaigns/new` (Save draft / Submit for approval), O-02 `/organizer/campaigns` (status rows,
Cancel campaign), O-03 `/organizer/campaigns/[id]/complete` (attendees, donations, donor phone), plus an
organizer detail/edit page. Edits to an approved campaign go back to the administrator while donors keep seeing
the approved version. Docs: [`docs/member-4/`](docs/member-4/IMPLEMENTATION-NOTES.md) ·
tests: [`tests/member-4/`](tests/member-4/MANUAL-TEST-CASES.md) · live check: `node scripts/verify-campaigns.mjs`.

**User Manual (all roles, Sprint 1):** [`docs/USER-MANUAL.md`](docs/USER-MANUAL.md).

**Remaining placeholders (reserved for Sprint 2):** H-03…H-07 (blood request creation,
management, detail, cancellation and matching), B-06 (blood-bank offers for requests), D-01/D-02
(donor request matching and response), A-01 (consolidated administrator dashboard), A-05 (flags),
A-06 (audit viewer), A-07 (reports) and A-08 (settings). Every other Sprint 1 screen is live. See
[`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) for the exact status of every wireframe screen and
[`docs/TRACEABILITY.md`](docs/TRACEABILITY.md) for the requirement-by-requirement status. Sprint work breakdown and ownership: [`docs/SPRINT-BACKLOG.md`](docs/SPRINT-BACKLOG.md).
