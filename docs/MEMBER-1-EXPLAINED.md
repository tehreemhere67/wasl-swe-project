# Member 1's work — explained simply, and what everyone does next

This document is written to be read out loud in a team meeting. No jargon needed.

---

## 1. What Wasl is (one sentence)

Wasl is a website for Karachi where **hospitals** can find blood, **blood banks** can say what
they have, **donors** can find real requests/campaigns, and the **Wasl team** (administrators)
checks that every hospital/blood bank/campaign is genuine before it goes live.

---

## 2. What I (Member 1) built — in plain words

Think of the app as a building.

- **I built the entrance and the reception desk.** Everyone who comes in creates an account,
  logs in, and is sent to the right floor for who they are. A hospital can never wander into
  the blood-bank floor, and an unverified organisation cannot use the operational floors at all.
- **I built the "papers please" system.** An organisation registers, uploads its licence, and is
  marked **Pending**. Until the administrator approves it, it can only see its status page —
  it cannot touch inventory, requests or campaigns. When the admin approves, rejects (with a
  reason) or suspends it, the organisation sees exactly what happened and when.
- **I built the language switch.** Every screen works in **English and Urdu**, with proper
  right-to-left Urdu, and the choice is remembered.
- **I built the shared furniture** that every other member's screens sit inside: the top bar
  (logo, organisation name + ✓ Verified badge, language switch, notification bell, profile menu),
  the role-based navigation, the footer, the buttons, form fields, badges, empty states and
  error messages.
- **I built the notification centre shell**, the audit log that records important actions, and
  the one administrator account (there is no public "register as admin").

The concrete things you can log in and see:

| What | Where | Who did it |
| --- | --- | --- |
| Landing / login | `/` | Member 1 |
| Organisation registration + licence upload | `/register/organization` | Member 1 |
| Donor signup with OTP + consent | `/register/donor` | Member 1 |
| Pending / Rejected / Suspended / Verified status page + re-apply | `/status` | Member 1 |
| Forgot / reset password | `/forgot-password` | Member 1 |
| Notification centre | `/notifications` | Member 1 (shell) |
| Administrator verification queue | `/admin/verifications` | Member 1 (baseline — Member 2 extends it) |
| Shared header, nav, language switch, design components | every page | Member 1 |

**Also built so the team can move fast:** the project skeleton (Next.js + TypeScript +
Tailwind), the database schema for accounts/organisations/donors/verification/sessions/OTP/
notifications/audit/settings, the embedded-PostgreSQL setup (nobody needs to install a database),
demo seed data, 157 automated tests, and the documentation set in `docs/`.

**What is NOT mine and is intentionally a placeholder right now:** the hospital request screens,
inventory screens, donor profile/history/campaigns, organiser campaign screens, and the
administrator dashboard/report screens. Each of those exists as a page with the correct
wireframe layout and a clear label saying which wireframe ID it is, who owns it, and whether it
is Sprint 1 or Sprint 2. That means nobody is blocked: the navigation, guards and styling are
already correct, and the owner only needs to fill in the screen's logic.

---

## 3. What each member does next (Sprint 1 remainder)

Ground rule that applies to everyone: **do not edit Member 1's files** (`src/lib/auth/**`,
`src/lib/db/migrations.ts` existing entries, `src/app/page.tsx`, `src/app/register/**`,
`src/app/status/**`, `src/components/**` except your own additions, `package.json`, configs).
You *use* them. The full technical recipe is in [`HANDOFF.md`](HANDOFF.md).

### Member 2 — Modules 2 + 8 (organisation verification + basic administration)

You already have a working admin area: navigation, the verification queue (A-02) that approves/
rejects/suspends and notifies the organisation, and the account status page the organisation sees.
What is left for Sprint 1:

1. **Finish A-02**: make the queue filterable/searchable, show waiting time, allow suspend +
   reinstate on the same panel, and add the organisation detail/documents view polish.
2. **A-03 Accounts**: list users and organisations, search, **deactivate/reactivate** (the button
   and layout exist as a placeholder). Use `users.status` — login already refuses deactivated
   accounts; record each change with `recordAudit`.
3. **A-04 Campaign review**: approve / reject with reason / return for changes. You will need the
   campaigns table (coordinate with Member 4). Statuses are fixed by the SRS: Draft, Pending
   Approval, Approved, Rejected, Cancelled, Completed.
4. **A-01 inventory view, A-05 flags, A-06 audit log, A-07 reports, A-08 settings** — these are
   reserved for **Sprint 2** except the basic inventory visibility required by Module 8.3. The
   audit log data is already being written (`audit_log` table + `listAuditLog()`), so A-06 is a
   read-only screen when you get to it.
5. Keep the verification status label/badge identical everywhere (reuse `StatusBadge`).

### Member 3 — Modules 4 + 7 (inventory + expiry/low-stock)

You own the biggest data change. Sprint 1:

1. **Add a new migration** at the end of `src/lib/db/migrations.ts` (id like `010_inventory`) for
   `inventory_batches`, `inventory_movements`, `stock_thresholds`, `stock_alerts`. Follow the SRS:
   batch = group + component + units + testing status + expiry; movement types are exactly
   `Added, Reserved, Reservation released, Issued, Transferred out, Expired, Discarded, Correction`.
2. **Data entry**: B-03 add/edit batch (validation: no negative units, no past expiry), B-02
   inventory list, B-04 batch detail with movement history.
3. **Monitoring** (Module 7): expiry warning windows (Platelets 2d, Whole blood/RBC 7d, Plasma 30d),
   default low-stock threshold 5, alerts on B-01 dashboard + notification centre; mark batches
   Expired automatically and remove them from availability. The defaults are already in the
   `settings` table under key `monitoring`.
4. **B-07 record donation** (donor identification by phone number) — coordinate with Member 4,
   because the entry belongs in the donor's history.
5. **You are the dependency for Member 5's search**: agreed table/column names early and tell
   Member 5 when the migration is merged.

### Member 4 — Modules 3 + 6 (donor profile/history + campaigns)

Donor *signup with OTP* is already working (Member 1). Your Sprint 1 work:

1. **D-03 Profile**: blood group, area (use the `karachi_areas` list in `settings`), availability,
   contact channels, notification types, language, save, delete account. The `donors` table
   already has these columns — you are filling in the screen and API.
2. **D-04 History**: self-reported donations (`Self-reported`) + organisation-recorded donations
   (`Recorded by organization`), total count, optional reminder days. Add `donations` table
   migration (`010_donations`).
3. **D-05/D-06 campaigns browse/detail**, **O-01 create**, **O-02 my campaigns**, **O-03 completion**
   for verified organisers. Campaign statuses and the re-approval rule (editing an approved
   campaign sends it back to Pending Approval while the old version stays visible) are in the SRS.
4. **Campaign interest** ("I plan to attend") and campaign notifications — use
   `createNotification()`; respect donor preferences and preferred language.
5. For **donor matching / responding (D-01, D-02)** — that is Sprint 2; leave the placeholders.

### Member 5 — Module 5 (hospital blood availability search)

1. **H-02 Search blood** is Sprint 1. It must query Member 3's inventory tables (only Approved,
   not reserved, not expired stock from Verified blood banks) and show per blood bank: name,
   verification badge, available quantity, earliest expiry, area, contact, last-updated time.
2. Use the existing guard pattern in `src/app/hospital/layout.tsx`
   (`requireRole(["hospital"])` + `requireVerifiedOrganization`) and reuse `PageHeader`, `Card`,
   `StatusBadge`, `VerifiedMark` so it looks like the rest of the app.
3. Show the SRS statement: availability is as reported by the blood bank and must be confirmed
   directly (FR-INV-09). The key `notice.availabilityDisclaimer` already has both languages.
4. Empty result → message + a button pointing at "create a request" (that screen is Sprint 2).
5. **H-03…H-07 (requests)** are Sprint 2. Agree with the team who takes the request module; the
   natural fit is you (it starts from the same screen), but it is the team's decision.

### Member 1 (you) — Sprint 2 support

Keep the shared platform healthy: review PRs that touch auth/guards/i18n, keep
`pnpm test` + `pnpm typecheck` green, add tests for new shared components, and handle the
integration work (headers, navigation, language strings) for the new modules.

---

## 4. Team rules (short version)

1. **The wireframes are the UI contract.** Keep the screen IDs (the placeholder shows them).
   If you must deviate, write why in `docs/`.
2. **The SRS is the behaviour contract.** Requirement IDs, statuses and thresholds are fixed.
3. **One area per person** → few merge conflicts. Files are grouped by area:
   `src/app/<area>/`, `src/lib/i18n/parts/<area>.ts`.
4. **Translations**: add your strings to *your* part file only, in **both** English and Urdu.
   The test suite fails if one language is missing a key or a key is defined twice.
5. **Database**: add a **new** migration entry with a new id; never edit an existing migration
   once it has been shared. Everyone's local database updates automatically on next start.
6. **Every API route**: `isSameOrigin(request)` → role/verification check → validation →
   database transaction → `recordAudit(...)`.
7. Before pushing: `pnpm typecheck` and `pnpm test` must pass. Do not commit `.data/`,
   `.next/`, `node_modules/` (already git-ignored).
8. **Branches**: one branch per module (`feature/inventory`), pull request into `main`, ask
   Member 1 to review anything touching shared code.
9. **Demo data**: `pnpm db:seed` gives everyone the same accounts. Member 3/4 add their demo
   rows there (or in their own seed file) so the team demo is not empty.

---

## 5. What I can say to the teacher (30 seconds)

> "I built the authentication and access foundation for Wasl. An organisation registers, uploads
> its licence, and stays Pending until an administrator approves, rejects or suspends it — until
> then it cannot use operational features. Donors register with an OTP-verified mobile number and
> record consent to share contact details only after they respond. The whole platform is
> role-based, so each user class only sees its own area, and it works fully in English and Urdu
> with right-to-left support and a language switch on every page. There is also a notification
> centre and an audit log, and the administrator account is seeded — there is no public
> administrator signup. The rest of the team's Sprint 1 modules build on this foundation; their
> screens are scaffolded with the correct wireframe structure and access rules."

---

## 6. What still needs doing before a real launch (honest list)

Documented in [`SECURITY.md`](SECURITY.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md):

- Rate limiting on login/OTP/reset; retention & cleanup jobs (DR-05); WhatsApp channel and SMS
  retries (FR-NOT-10); a native Urdu speaker reviewing the Urdu wording (NFR-LOC-07); a contrast
  audit; and real SMS credentials (Twilio) in production.
- These are release-hardening items, not Sprint 1 features.
