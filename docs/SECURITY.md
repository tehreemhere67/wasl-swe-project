# Wasl — Security and Privacy

Controls delivered in Sprint 1, mapped to the SRS security requirements (NFR-SEC-01..06) and the
data requirements (DR-01..05). This is a working foundation for an academic first version, **not a
production-hardened system**; §5 lists what must happen before a public launch.

The honest summary: passwords, sessions, lockout, OTPs, input validation, parameterized SQL,
document access control and CSRF protection are implemented and covered by tests or code review.
Rate limiting, at-rest encryption of personal data, a viewer for refused actions and the production
deployment controls are **not** implemented yet.

---

## 1. Controls by requirement

| ID | Requirement (SRS) | Control in the code | Evidence |
| --- | --- | --- | --- |
| **NFR-SEC-01** | Passwords ≥ 8 characters, never stored or shown in readable form | scrypt with a per-password random salt (`N=16384, r=8, p=1`, 64-byte key), stored as `scrypt$N$r$p$salt$hash`; length rule in `isStrongEnoughPassword` (8–200) used by organization registration, donor signup and password reset; no code path returns or logs a password | `src/lib/auth/password.ts`, `src/lib/validation.ts`; `tests/password.test.ts` (13 tests), `tests/validation.test.ts` |
| **NFR-SEC-02** | Session ends after 30 min without activity; account locked 15 min after 5 failed logins | `sessions.expires_at = now + SESSION_IDLE_MINUTES (30)`, sliding but at most one write/minute; lockout starts on the 5th failure and lasts `LOCKOUT_MINUTES (15)`, stored on the `users` row; `isLocked()` checked before password verification | `src/lib/auth/session.ts`, `src/lib/auth/rules.ts`, `src/lib/auth/login.ts`; `tests/rules.test.ts` |
| **NFR-SEC-03** | Donor phone numbers and verification documents protected at rest and in transit | Session tokens stored only as SHA-256 hashes; OTPs stored only as a scrypt hash bound to the phone; supporting documents stored as `BYTEA` and served by an authorised endpoint only (`GET /api/documents/[id]`: administrator, or the submitting organization); response headers `private, no-store`, `X-Content-Type-Options: nosniff`; production cookies `Secure`; TLS terminates at the host for the `pg` connection when `PG_SSL=true` | `src/lib/auth/session.ts`, `src/lib/auth/otp.ts`, `src/app/api/documents/[id]/route.ts`, `src/lib/db/index.ts` |
| **NFR-SEC-04** | Check every input; resist injection, XSS and CSRF; checked in testing before release | Every form has a pure validation function returning field errors; SQL uses `$1` placeholders everywhere (no string-built queries); React escapes rendered text and there is no `dangerouslySetInnerHTML`; POST routes call `isSameOrigin()` (same `Origin`/`X-Forwarded-Host` comparison) and cookies are `SameSite=Lax`; uploads limited to PDF/PNG/JPG ≤ 5 MB; redirect targets restricted to same-site paths (`safeRedirectPath`) | `src/lib/validation.ts`, `src/lib/csrf.ts`, all `src/app/api/**` routes; `tests/validation.test.ts`, `tests/csrf.test.ts` |
| **NFR-SEC-05** | Record failed logins and refused actions for administrator review | `audit_log` records `login_failed`, `login_locked`, `login_success`, `logout`, plus every verification decision, registration, re-apply, password reset and language change; audit writes are best-effort and never break the action | `src/lib/audit.ts`, called from `auth/login.ts`, the API routes and the route guards (`access_refused`) |
| **NFR-SEC-06** | Use personal data only for the stated purposes; share only with the messaging provider | Registration collects only the fields in SRS §4.1; donor location is an area, never a live position (DR-02); DR-03 consent is stored (`donors.consent_share_contact_at`); SMS goes only to Twilio when configured, otherwise stays in the development outbox; no analytics or third-party scripts | `src/lib/validation.ts`, `src/lib/messaging.ts`, `src/lib/notifications.ts` |

## 2. Authentication and session details

| Item | Value | Where |
| --- | --- | --- |
| Password hash | scrypt, N=16384, r=8, p=1, 64-byte key, 16-byte random salt | `auth/password.ts` |
| Session cookie | `wasl_session`, httpOnly, SameSite=Lax, `Secure` in production, path `/`, 12-hour cookie lifetime | `auth/session.ts` |
| Session storage | only SHA-256(token) in `sessions.token_hash` | `auth/session.ts` |
| Idle timeout | 30 minutes (`SESSION_IDLE_MINUTES`); sliding, extended at most once a minute | `auth/session.ts` |
| Lockout | 5 failures → 15 minutes (`MAX_FAILED_LOGINS`, `LOCKOUT_MINUTES`); cleared on success | `auth/rules.ts`, `auth/login.ts` |
| Deactivated accounts | refused at login **and** on every later `getSession()` | `auth/login.ts`, `auth/session.ts` |
| Password reset | OTP verified first, then password replaced and **all** sessions deleted | `api/auth/password/reset/route.ts` |
| Account enumeration | unknown identifier and wrong password return the same `invalid`; forgot-password always answers `ok` | `auth/login.ts`, `api/auth/password/forgot/route.ts` |

## 3. OTP, SMS and the Dev Outbox

This is the behaviour that reviewers most often trip over, so it is spelled out exactly:

- No SMS provider is configured by default (`TWILIO_*` empty).
- `sendSms()` then inserts the message into the `dev_outbox` table and logs it, returning
  `status: "dev_outbox"`. The rest of the flow behaves as if the message was sent.
- In development (`NODE_ENV !== "production"`):
  - `POST /api/auth/otp/send` returns `devCode` in the JSON response;
  - the donor signup form displays that code in a development notice;
  - `/dev/outbox` lists the last 30 messages (phone, body, time).
- In production (`NODE_ENV=production`): `devCode` is omitted, and `/dev/outbox` renders
  "Not available in production." without querying the outbox.
- OTP protections: six digits, TTL 5 minutes, resend cooldown 60 seconds, at most 5 verification
  attempts, single use (`consumed_at`), and the code hash is bound to the phone number.
- **Honest caveat:** in development the code is deliberately readable. That is a demo aid, not a
  control; a real deployment must configure Twilio and run with `NODE_ENV=production`.

## 4. CSRF and same-origin protection

- Primary defence: the session cookie is `SameSite=Lax`, so cross-site `POST`s do not carry it.
- Secondary defence: `isSameOrigin(request)` in `src/lib/csrf.ts` compares the `Origin` header host
  with `X-Forwarded-Host` (falling back to `Host`). A missing `Origin` is allowed so that same-site
  form posts without an `Origin` header keep working; the cookie remains the primary defence.
- Applied to every state-changing POST route: login, organization registration, donor signup,
  OTP send, password forgot/reset, admin verify, organization re-apply, notification read, logout
  and the language switch.
- Uploaded files are accepted only as `application/pdf`, `image/png` or `image/jpeg`, ≤ 5 MB, and are
  never rendered as HTML; the document endpoint sends `nosniff`.

## 5. Gaps and what is needed before production

Priority order for a real deployment:

1. **Change every default credential.** `admin@wasl.pk / WaslAdmin#2026` and `WaslDemo#2026` are in
   the repository and in the seed script. Rotate before any shared or public environment.
2. **Run with `NODE_ENV=production`** so the OTP `devCode` and `/dev/outbox` are disabled, and put
   the app behind HTTPS so the `Secure` cookie is actually required and all traffic is encrypted
   (NFR-SEC-03, IR-10).
3. **Rate limiting** on login, OTP send and password reset per IP and per account/IP pair. Lockout
   covers per-account password guessing, but nothing limits OTP spam or credential stuffing across
   many accounts. Do this at the proxy/edge or with a shared store, not in memory.
4. **Encrypt personal data at rest.** Donor phone numbers and organization documents are stored in
   plaintext columns/`BYTEA`; rely on database or disk encryption (and restricted DB access) at the
   hosting layer, or add column-level encryption. TLS for the `pg` connection must be on
   (`PG_SSL=true`).
5. **Cleanup jobs.** Expired sessions and OTP rows are deleted lazily/not at all; add a scheduled
   cleanup. DR-05 also requires a deleted donor's personal data to be removed within 30 days and
   records kept at least 12 months — no retention job exists yet (donor account deletion is a
   Module 3 screen, not yet delivered).
6. **Verify the messaging provider path** with real Twilio credentials (IR-05, IR-07), including the
   failure/retry behaviour of FR-NOT-10, which is not implemented yet.
7. **Security testing before release** (NFR-SEC-04): dependency audit, an XSS/CSRF pass over every
   form, upload-type bypass checks (content sniffing, polyglot files), and a malware scan decision
   for uploaded documents.
8. **Remove or guard the development page.** `/dev/outbox` already refuses in production; also
   decide whether it should exist at all in the release build.
9. **Data-protection review** (SRS §8.1): confirm with the client which health-data rules apply;
   NFR-LOC-07 also requires a native Urdu speaker to review all Urdu wording before release.

Actions completed after the first draft of this document (kept here as a record):

- **Refused actions are now audited** (NFR-SEC-05): `requireRole` and `requireVerifiedOrganization`
  write `access_refused` with the requested path and the reason before redirecting.
  Remaining nuance: API handlers that return 403 directly (e.g. a non-owner reading a document)
  are not audited yet.
- **Same-origin checks are now applied to every state-changing POST**, including
  `/api/auth/logout` and `/api/language`.
- **No signing secret is required:** `SESSION_SECRET` was removed from `.env.example` because session
  tokens are random and stored only as SHA-256 hashes. Do not add one back unless code actually reads
  it.

## 6. Privacy notes

- Donor contact details are shared with a requesting hospital only after the donor responds
  **Willing** (FR-DON-12, A-25). The consent statement shown at signup is stored as
  `donors.consent_share_contact_at` (DR-03).
- Requests must contain no patient names or medical details (DR-02, A-16); the request form owned by
  the hospital module must enforce that.
- Verification documents are visible only to administrators and to the submitting organization
  (DR-04) — implemented in `GET /api/documents/[id]`.
- Wasl makes no medical eligibility decision; the required statement appears in
  `notice.eligibility` and on the shared footer/screens that show availability (FR-DON-11,
  NFR-SAF-01).
