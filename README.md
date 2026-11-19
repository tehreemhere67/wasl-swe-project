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

Captured from the running app with a headless browser (Playwright) at 1280 px and 390 px widths.
They are the verification evidence that the delivered screens follow the wireframes.

| # | Screen | Screenshot |
| --- | --- | --- |
| 1 | **G-01** Landing / login | ![G-01](docs/screenshots/01-G-01-landing.png) |
| 2 | **G-02** Organization registration | ![G-02](docs/screenshots/02-G-02-organization-registration.png) |
| 3 | **G-03** Donor signup + OTP | ![G-03](docs/screenshots/03-G-03-donor-signup-otp.png) |
| 4 | **G-04** Account status (Pending) | ![G-04](docs/screenshots/04-G-04-account-status-pending.png) |
| 5 | **G-05** Notification centre | ![G-05](docs/screenshots/05-G-05-notification-centre.png) |
| 6 | **G-06** Urdu RTL (donor profile) | ![G-06](docs/screenshots/06-G-06-urdu-rtl-donor-profile.png) |
| 7 | **A-02** Administrator verification queue | ![A-02](docs/screenshots/07-A-02-admin-verification-queue.png) |
| 8 | **B-01** Blood bank dashboard (wireframe-faithful stub) | ![B-01](docs/screenshots/08-B-01-blood-bank-dashboard-stub.png) |
| 9 | **H-02** Hospital blood search (wireframe-faithful stub) | ![H-02](docs/screenshots/09-H-02-hospital-search-stub.png) |
| 10 | **A-07** Reports (Sprint 2 placeholder) | ![A-07](docs/screenshots/10-A-07-admin-reports-stub.png) |

Every route in the app was loaded in a real browser as each seeded account: 33 pages returned 200,
cross-role access was refused (a hospital opening `/bank/inventory` is redirected home, a donor
opening `/hospital` is redirected to `/donor`), a Pending organization is held on `/status`, and the
Urdu switch sets `<html lang="ur" dir="rtl">` on the whole app.

## Tests

Tests are grouped **by team member**: Member 1's are in `tests/member-1/`, and Members 2–5 add theirs
under `tests/member-N/`. `pnpm test` discovers every `*.test.ts` file automatically. Full instructions,
conventions and per-member templates: [`tests/README.md`](tests/README.md).

```bash
pnpm test          # unit suite, no server needed (157 tests for Member 1)
pnpm verify:api    # 29-check end-to-end API lifecycle; run `pnpm dev` in another window first
pnpm typecheck     # strict TypeScript check
pnpm build         # production build
```

Member 1's evidence: [TEST-RESULTS.md](tests/member-1/TEST-RESULTS.md),
[MANUAL-TEST-CASES.md](tests/member-1/MANUAL-TEST-CASES.md) and raw output in
`tests/member-1/results/`.

**Current Member 1 status:** 157/157 unit tests, 29/29 API lifecycle checks, 61/65 manual cases
(4 time-based deferred), clean typecheck and production build.

**Suite total: 189/189 passing** — Member 1's 157 (six files under `tests/member-1/unit/`) plus
Member 2's 32 admin tests in `tests/admin.test.ts`.

| File (under `tests/member-1/unit/`) | Covers |
| --- | --- |
| `validation.test.ts` | `src/lib/validation.ts` — mobile/email/password/OTP rules, **FR-VER-01** registration fields, **FR-DON-01** + **DR-03** donor signup |
| `password.test.ts` | `src/lib/auth/password.ts` — scrypt hashing, verification, malformed hashes (**NFR-SEC-01**) |
| `rules.test.ts` | `src/lib/auth/rules.ts` — landing paths, **FR-VER-03**, **NFR-SEC-02** lockout |
| `i18n.test.ts` | `src/lib/i18n/*` — EN/UR key parity and RTL (**NFR-LOC-01**, **NFR-LOC-03**) |
| `format.test.ts` | `src/lib/format.ts` — PKT dates, relative time, file sizes (**NFR-LOC-05**) |
| `csrf.test.ts` | `src/lib/csrf.ts` — same-origin check (**NFR-SEC-04**) |
| `tests/admin.test.ts` (Member 2) | `src/lib/admin/rules.ts` — account actions, campaign decisions, admin search (**FR-ADM-02**, **FR-ADM-03/04**) |

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
├─ docs/                       architecture, traceability, sprint backlog, trello import, handoff
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

**Implemented (Member 2 — Modules 2 and 8, Sprint 1 slice):** administrator account management
(A-03) with search, deactivate/reactivate and audited changes, and campaign review (A-04) with
approve / reject-with-reason / return-for-changes and an organizer notification. The A-02 queue
gained a text search and an organisation-type filter.

**Member 5 — Module 5 (hospital blood availability search) is implemented:** H-02 `/hospital/search`
with required blood group and component, results per verified blood bank (quantity, earliest expiry,
area, phone, e-mail, last updated), exclusion of expired / unapproved / reserved stock and unverified
banks, the "as reported by the blood bank" statement, and a no-results state with a create-request
option. Hospital-only (A-12). Docs: [`docs/member-5/`](docs/member-5/IMPLEMENTATION-NOTES.md) ·
tests: [`tests/member-5/`](tests/member-5/MANUAL-TEST-CASES.md) · live check: `node scripts/verify-search.mjs`.

**Placeholders for the other modules:** the role areas exist with their shell, navigation and
correct access guards, but their operational screens are wireframe-faithful placeholders — they show
the wireframe structure, name the wireframe ID and owning module, and disable actions that are not
built yet. These are the **other four members' Sprint 1 targets** (H-01, H-02, B-01…B-05, B-07,
D-03…D-06, O-01…O-03) plus the screens reserved for Sprint 2 (H-03…H-07, B-06, D-01,
D-02, A-01, A-05…A-08); they are not part of Member 1's delivery. See
[`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) for the exact status of every wireframe screen and
[`docs/TRACEABILITY.md`](docs/TRACEABILITY.md) for the requirement-by-requirement status. Sprint work breakdown and ownership: [`docs/SPRINT-BACKLOG.md`](docs/SPRINT-BACKLOG.md).
