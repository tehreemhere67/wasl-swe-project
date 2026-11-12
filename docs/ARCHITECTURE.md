# Wasl — Architecture

This document describes how the delivered Sprint 1 code is put together: the layers, the database
adapter, authentication, localization, access control, notifications and audit. It is written
against the code in `src/`, so every claim can be checked in the repository.

Requirement IDs refer to the SRS v1.0 (`../.analysis/srs.txt`).

---

## 1. Layers

```text
Browser
  │  HTML forms (work without JS) + a few client components that call JSON APIs
  ▼
Next.js App Router (src/app)
  │  Server Components render pages; layouts enforce role/verification guards
  ├─ Route handlers (src/app/api/**)          forms & fetch() endpoints
  ├─ Components (src/components)              ui/ (design system), forms/, shell/
  ▼
Library layer (src/lib) — framework-free where practical
  ├─ validation.ts, format.ts, csrf.ts         pure, unit-tested
  ├─ auth/                                     password, rules, sessions, login, OTP, guards
  ├─ i18n/                                     dictionaries + server locale resolution
  ├─ notifications.ts, messaging.ts, audit.ts  data-facing services
  ▼
Database adapter (src/lib/db)
  ├─ PGlite (embedded PostgreSQL)   when DATABASE_URL is empty — development
  └─ pg Pool (real PostgreSQL)      when DATABASE_URL is set — staging/production
```

Rules of the layering:

- **Pages never run SQL directly** — they call `src/lib` functions (a page may call `query()` only
  for a read that has no service function yet, e.g. the administrator queue).
- **Pure policy lives outside React and outside the database.** `validation.ts` and
  `auth/rules.ts` have no `server-only` marker and no database import, which is exactly why they can
  be unit-tested with plain `node` (see [`TRACEABILITY.md`](TRACEABILITY.md)).
- **Route handlers are thin.** They: check the same-origin header, validate input, call a `src/lib`
  function, write an audit entry where the action is significant, and return JSON or a redirect.
- **User-visible text is never hard-coded in components.** Components receive already-translated
  labels, or call `createTranslator(locale)`; see §7 (NFR-MAIN-02).

## 2. Database adapter — one dialect, two drivers

`src/lib/db/index.ts` defines the only interface the rest of the app knows:

```ts
interface DbClient { query(sql, params?): Promise<{ rows, rowCount }>; exec(sql): Promise<void> }
interface Db extends DbClient { transaction(fn): Promise<T>; close(): Promise<void> }
```

| Situation | Driver | Notes |
| --- | --- | --- |
| `DATABASE_URL` empty (development) | `@electric-sql/pglite` | Real PostgreSQL 16 compiled to WebAssembly; data directory `PGLITE_DIR` (default `.data/wasl-pg`) |
| `DATABASE_URL` set (staging/production) | `pg` `Pool` | `PG_POOL_MAX` (default 10), `PG_SSL=true` for managed providers |

Because PGlite **is** PostgreSQL, there is a single SQL dialect: the same DDL, `$1` placeholders,
`JSONB`, `TIMESTAMPTZ`, `gen_random_uuid()` and `interval` expressions work in both. No conditional
SQL exists anywhere in the code.

The connection is a process-wide singleton stored on `globalThis.__waslDb` so Next.js hot reload and
route handlers share one pool; a failed initialisation clears the cached promise so the next request
retries. `transaction(fn)` gives the callback a `DbClient` bound to one connection (`BEGIN`/`COMMIT`
/`ROLLBACK` for `pg`, `pg.transaction` for PGlite).

`scripts/connect.ts` is the equivalent connection helper for the command-line scripts. Scripts
cannot import `src/lib/db/index.ts` because it is marked `server-only`, so they open the same
database with the same driver choice.

## 3. Migrations

- All schema changes are plain PostgreSQL statements in `src/lib/db/migrations.ts`, an ordered
  `MIGRATIONS: Migration[]` array of `{ id, name, sql }`.
- `schema_migrations (id, applied_at)` records what has run. Migrations are applied inside a
  transaction and skipped if their `id` is already present, so applying them is idempotent.
- They run **automatically** on the first database call in the app (`createDb()` → `applyMigrations`)
  and explicitly via `pnpm db:migrate` / `pnpm db:seed`.
- Existing migrations are immutable once shared with the team. New tables go in a new
  `00N_<module>.ts` entry appended to the array — see [`HANDOFF.md`](HANDOFF.md#1-database-migration).
- Controlled values from SRS §4.2 are enforced with `CHECK` constraints in the schema, not only in
  application code (`verification_status`, `role`, `preferred_language`, batch status, …), so an
  invalid status cannot be stored even if a code path is wrong.
- Timestamps are `timestamptz`, stored in UTC and rendered in PKT by `src/lib/format.ts`.

Delivered schema (migrations `001_initial_schema`, `002_default_settings`, `003_campaigns`): `organizations`,
`organization_documents`, `verification_history`, `users`, `donors`, `sessions`, `otp_codes`,
`audit_log`, `notifications`, `settings`, `dev_outbox`, `campaigns`. Module-owned tables (inventory, requests,
campaigns, donor history, …) are added by the owning modules in later migrations.

## 4. Authentication and sessions

### Passwords (`src/lib/auth/password.ts`)

- **scrypt** with a random 16-byte salt per password, `N=16384, r=8, p=1`, 64-byte output
  (NFR-SEC-01: passwords are never stored or shown in readable form).
- Stored as a self-describing string so the cost can be raised later without invalidating hashes:
  `scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>`.
- Verification re-derives with the stored parameters and compares with `timingSafeEqual`; malformed,
  truncated or unknown-algorithm records return `false` instead of throwing.
- `randomToken(bytes = 32)` returns base64url tokens for sessions.

### Sessions (`src/lib/auth/session.ts`)

- On login a 32-byte random token is generated, put in an **httpOnly, SameSite=Lax** cookie
  (`wasl_session`, `secure` in production), and only its **SHA-256 hash** is stored in `sessions`.
  A database dump therefore cannot be replayed as a session.
- `SESSION_IDLE_MINUTES` (default **30**) is enforced by the database row: `expires_at` is
  `now + idle window`. `getSession()` returns `null` and deletes the row once expired.
- Sliding expiry extends the window on activity, but at most once a minute to avoid a write per
  request. This satisfies NFR-SEC-02 ("a session ends after 30 minutes without activity").
- `destroyCurrentSession()` (logout) deletes the row and clears the cookie;
  `destroyAllSessionsForUser()` invalidates every session after a password reset.
- `getSession()` also refuses rows whose user `status` is not `active` — a deactivated account is
  signed out on its next request.

### Login, lockout and landing (`src/lib/auth/login.ts`, `src/lib/auth/rules.ts`)

```text
validateLogin → authenticate()
  ├─ normalizeIdentifier(): email → lower-case; phone → E.164 (+92…)
  ├─ unknown account ............ "invalid" (same message as a wrong password: no account probing)
  ├─ status ≠ active ............ "deactivated"
  ├─ isLocked(locked_until) ..... "locked" (429 with minutes remaining)
  ├─ verifyPassword(wrong) ...... registerFailedLogin(); lock on the 5th failure
  └─ correct .................... reset counters → createSession() → audit "login_success"
→ landingPath(role, verificationStatus): unverified org → /status, else its role home
```

- NFR-SEC-02: **5 failed attempts → 15-minute lock**, stored on the `users` row so it survives
  restarts. The thresholds come from `MAX_FAILED_LOGINS` / `LOCKOUT_MINUTES` and are owned by the
  pure functions in `rules.ts` (defaults 5 and 15).
- The lock starts on the fifth failure; the counter is cleared on success.
- Audit entries: `login_success`, `login_failed`, `login_locked`, `logout`.

### Guards (`src/lib/auth/guards.ts`)

| Guard | Behaviour |
| --- | --- |
| `requireUser(nextPath?)` | No session → redirect to `/?next=<path>` |
| `requireRole(roles, nextPath?)` | Wrong role → redirect to that user's own home (`landingPathFor`) |
| `requireVerifiedOrganization(nextPath?)` | No organization → own home; not **Verified** → `/status` (FR-VER-03) |
| `requireAdmin()` | Shorthand for `requireRole(["admin"])` |

Every role area layout calls one of these (`hospital/layout.tsx` and `bank/layout.tsx` and
`organizer/layout.tsx` use `requireVerifiedOrganization`, `donor/layout.tsx` uses `requireRole`,
`admin/layout.tsx` uses `requireAdmin`), so a page cannot be reached without passing the guard.
Pages that must not share the role shell (G-04 status, G-05 notifications) call `requireUser`
directly. API handlers re-check the session and role themselves because route handlers do not run
the layout (`/api/admin/verify` returns 401/403).

## 5. One-time passcodes and the Dev Outbox

- `src/lib/auth/otp.ts` issues a **six-digit** code (`randomInt`) for `donor_signup` or
  `password_reset`.
- At rest the code is bound to the phone number and hashed:
  `scrypt(sha256(phone + ":" + code))` — the same slow password hash. A code is useless for another
  number and the plain code is never stored.
- Rules: `OTP_TTL_SECONDS` (default 300), `OTP_RESEND_SECONDS` (default 60, enforced by a newest-row
  check that raises `OtpCooldownError`), `OTP_MAX_ATTEMPTS` (default 5). A successful verification
  sets `consumed_at`; wrong codes increment `attempts`.
- `src/lib/messaging.ts` is the replaceable provider boundary (IR-05):
  - Twilio credentials present → HTTPS POST to Twilio's Messages API.
  - Otherwise → **Dev Outbox**: the message is inserted into `dev_outbox` and logged, so signup and
    password reset can be demonstrated with no paid provider (A-27).
- In development `/api/auth/otp/send` also returns `devCode`, and `/dev/outbox` shows the recorded
  messages. Neither is available when `NODE_ENV=production` (`isProduction()`), and the outbox page
  refuses to render there.
- The OTP message is written in the recipient's saved language (NFR-LOC-04); an unknown number gets
  English.

The forgot-password flow is deliberately non-enumerable: `/api/auth/password/forgot` returns the
same `{ ok: true }` shape whether or not the number is registered.

## 6. Localization (i18n)

- `src/lib/i18n/types.ts`: `Locale = "en" | "ur"`, `Dictionary = Record<string, string>`,
  `DictionaryPart = { en, ur }`, `directionOf()` / `isRtl()`, and `interpolate()` for
  `{placeholder}` substitution.
- `src/lib/i18n/parts/<area>.ts` — one file per module area (`common`, `nav`, `auth`,
  `notifications`, `stub`, `hospital`, `bloodbank`, `donor`, `organizer`, `admin`). A module owns
  its part, so translation work does not collide between team members (NFR-MAIN-02).
- `src/lib/i18n/index.ts` merges the parts in a fixed order into `DICTIONARIES.en` / `DICTIONARIES.ur`
  and exposes `translate(locale, key, values?)`, `createTranslator(locale)`, `allKeys()` and
  `missingTranslations()`. `translate` falls back **Urdu → English → the key itself**, so a missing
  translation can never break a screen; the test suite asserts there are none (NFR-LOC-01).
- English and Urdu must define exactly the same keys with the same `{placeholders}`; this is enforced
  by `tests/i18n.test.ts`.
- `src/lib/i18n/server.ts` resolves the locale on the server, in order: signed-in user's saved
  preference → `wasl_lang` cookie (visitors, remembered for a year) → English (NFR-LOC-02). It is
  wrapped in React `cache()` so one request resolves it once.
- `src/app/layout.tsx` writes `<html lang={locale} dir={directionOf(locale)}>`, so the **whole**
  application mirrors for Urdu (NFR-LOC-03), not individual screens. `globals.css` switches to an
  Urdu font family under `html[dir="rtl"]`, sets a minimum 16 px text size (NFR-USA-05) and prevents
  horizontal overflow at 360 px (NFR-LOC-03, NFR-USA-01).
- The language switch (`src/components/shell/language-switch.tsx`) is a plain form present in the
  global header on every page (IR-03). `POST /api/language` stores the choice in the cookie and, for
  a signed-in user, on the account (`savePreferredLanguage`), records an audit entry, and redirects
  back to the page the user was on.
- Dates and times are formatted by `src/lib/format.ts` in **Asia/Karachi** with the Gregorian
  calendar, in both languages (NFR-LOC-05).

## 7. UI shell and design system

- `src/components/ui/index.tsx` holds the small design system: `Button`, `LinkButton`, `Field`,
  `TextInput`, `SelectInput`, `TextArea`, `Checkbox`, `Card`, `CardHeader`, `Alert`, `EmptyState`,
  `PageHeader`, `SectionTitle`, `DetailRow`, `StatusBadge`, `VerifiedMark`, `Badge`.
- `StatusBadge` is the single place the verification status is rendered, which keeps the label and
  appearance identical everywhere (IR-02). Labels come from `status.pending|verified|rejected|
  suspended` and are always short words.
- `src/components/shell/app-shell.tsx` provides `AppShell` (header + role navigation + content +
  footer) for signed-in areas and `PublicShell` (header + content + footer) for public screens.
- The header (`header-bar.tsx`) carries the organisation name and verification badge, the
  notification bell with unread count, the language switch and the profile menu — on **every screen**
  (wireframe sheet 15).
- Styling is Tailwind with tokens in `tailwind.config.ts` (`wasl` red scale, `ink` neutrals,
  `ok`/`warn` states, `min-h-touch: 44px`). Interactive-only components are the exception:
  forms, `RoleNav` (active-link) and `LanguageSwitch` are the few `"use client"` files.

## 8. Notification centre

- FR-NOT-04: every notification the system sends is also stored in the in-platform centre, so the
  platform keeps working when SMS/WhatsApp does not (NFR-REL-03).
- `notifications` rows carry **both languages** (`title_en`/`title_ur`, `body_en`/`body_ur`), a
  category, an optional `link`, a `delivery_status` (`in_platform|sent|delivered|failed`) and
  `read_at`. The page renders the column matching the reader's language.
- `src/lib/notifications.ts` exposes `createNotification`, `listNotifications`,
  `unreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead`, and
  `notifyOrganizationDecision` (FR-VER-06: decision notification stored in-platform and sent by SMS
  to the organization's official phone).
- The bell (`notification-bell.tsx`) is a server component reading the unread count; `/notifications`
  (G-05) lists, marks one/all read via `POST /api/notifications/read` (form post works without JS),
  and shows the delivery status per item.

## 9. Audit log

- FR-ADM-05 / NFR-SEC-05: `audit_log (actor_user_id, actor_role, action, entity_type, entity_id,
  details JSONB, ip_address, created_at)`.
- `recordAudit()` is **best effort**: a failed audit insert is logged and never breaks the user's
  action.
- Recorded actions in the delivered code: `login_success`, `login_failed`, `login_locked`, `logout`,
  `organization_registered`, `organization_reapply`, `organization_approved|rejected|suspended|reinstated`,
  `account_deactivated`, `account_reactivated`, `campaign_approved|rejected|returned`,
  `donor_signup_completed`, `password_reset_completed`, `language_changed`.
  The remaining action names are already declared in the `AuditAction` union for other modules.
- Failed logins and refused actions are recorded (NFR-SEC-05). Administrators read the log on the
  A-06 screen, which is owned by the administrator module and is a placeholder in Sprint 1 — the
  data is being written, the viewer is not delivered by Member 1.

## 10. Request lifecycle (example: organization registration)

```text
GET  /register/organization          page.tsx renders OrgRegistrationForm (client)
POST /api/auth/org/register          multipart/form-data
  1. isSameOrigin()                  CSRF check (NFR-SEC-04)
  2. validateOrganizationRegistration()  nine mandatory fields (FR-VER-01)
  3. document checks                 required · PDF/PNG/JPG · ≤ 5 MB
  4. normalizeMobile()               official phone → E.164
  5. hashPassword()                  scrypt (NFR-SEC-01)
  6. transaction: organizations (status pending) + organization_documents + users
  7. createSession()                 signed in immediately, sent to G-04
  8. recordAudit("organization_registered")
  9. → 200 { ok: true, redirect: "/status" }
```

The administrator decision path is `POST /api/admin/verify`: same-origin check → admin session check
→ validate decision and require a reason for reject/suspend → one transaction updating
`organizations` and inserting `verification_history` → audit → `notifyOrganizationDecision`
(FR-VER-02, FR-VER-04, FR-VER-06).

## 11. Known limitations of the Sprint 1 foundation

Recorded here so nobody mistakes them for finished work:

1. The schema contains the Module 1/9 tables plus `campaigns` (migration 003); other operational tables arrive with their modules.
2. `/admin/verifications` is the only administrator screen delivered by Member 1 (A-02 baseline).
   A-01, A-05–A-08 are placeholders owned by the administrator module.
3. `/dev/outbox` contains hard-coded English strings; it is a development-only page, but it is the
   one screen that does not yet meet NFR-LOC-01.  
4. Session-expiry handling is enforced on the next request rather than by a background job; an
   expired row is deleted lazily.
5. The audit log is written but has no viewer until A-06 is delivered.
6. Organization registration captures the official contact phone as a **Pakistani mobile number**
   (`officialPhone` is validated with `isMobile`). This is deliberate: the same number is the account's
   OTP verification and password-recovery contact, so a landline would leave the account unable to
   recover its password. The G-02 field is labelled **"Official mobile"** with a hint explaining this,
   so the form no longer suggests a landline. Supporting landlines would need a separate account-recovery
   number — a product decision, not a bug.
7. Guard refusals (wrong role, or an organization that is not Verified) are written to the audit log as
   `access_refused`. API handlers that refuse an action by returning 403 do not audit yet — see
   [`SECURITY.md`](SECURITY.md#5-gaps-and-what-is-needed-before-production).
