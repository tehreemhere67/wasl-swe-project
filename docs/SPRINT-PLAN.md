# Wasl — Sprint Plan and Module Ownership

Two sprints deliver the SRS. Sprint 1 builds the **trust and account foundation** plus the shared
interface and the first slice of each operational module; Sprint 2 completes the remaining
operational features. Every wireframe screen exists after Sprint 1 as either a delivered screen or a
navigable, wireframe-faithful placeholder, so the whole flow can be demonstrated and the integration
points are fixed.

Requirement IDs and thresholds are from SRS v1.0; do not restate them differently.

---

## 1. Module ownership

The nine modules follow the SRS feature groups (SRS §3) plus authentication and the shared UI.

| Module | Scope | SRS requirements | Owner | Sprint 1 | Sprint 2 |
| --- | --- | --- | --- | --- | --- |
| **M1** | **Authentication & Account Management** — login, sessions, lockout, organization registration, verification lifecycle, donor signup + OTP, password reset, admin verification baseline | FR-ADM-01, FR-VER-01/02/03/06, FR-DON-01, DR-03, NFR-SEC-01/02/04/05 | **Member 1** | **Delivered** | — |
| **M9** | **Common UI & Language Support** — shell, header, navigation, notification centre shell, EN/UR with RTL, formatting, design system, RBAC guards | NFR-LOC-01..05, NFR-USA-01/04/05, NFR-MAIN-02, IR-01/02/03, FR-NOT-04 | **Member 1** | **Delivered** | — |
| **M2** | **Verification & administrator oversight** — account management, campaign review, flags queue, audit viewer | FR-ADM-02..05, FR-VER-04/05 (extensions) | Member 2 | A-03 account management, A-04 campaign review (Sprint 1 targets) | A-05 flags, A-06 audit viewer, full review tooling |
| **M3** | **Donor profiles & matching** — profile, history, matching, responses | FR-DON-02..13 | Member 4 | D-03 profile, D-04 history, B-07 record donation (Sprint 1 targets) | D-01, D-02, matching + response rules |
| **M4** | **Blood inventory management** — batches, movements, reservations, issuance, transfers, search | FR-INV-01..09 | Member 3 | B-01, B-02, B-03, B-04 inventory (Sprint 1 targets) | FR-INV-04..09 (reservations, issuance, transfers, cross-bank search) |
| **M5** | **Hospital requisitions & availability search** — dashboard, search, request lifecycle | FR-REQ-01..09, FR-INV-07..09 | Member 5 | H-01 dashboard, H-02 availability search (Sprint 1 targets) | H-03..H-07 request create/track/close |
| **M6** | **Donation campaigns** — create, submit, browse, interest, complete | FR-CAM-01..09 | Member 4 | O-01, O-02, O-03, D-05, D-06 (Sprint 1 targets) | Campaign approval effects, notifications, completion records |
| **M7** | **Expiry & availability monitoring** — alerts, thresholds, evaluation | FR-MON-01..06 | Member 3 | B-01 alert surface, B-05 settings (Sprint 1 targets) | Full FR-MON-01..06 evaluation and alerts |
| **M8** | **Administration, dashboards & reporting** — inventory dashboard, reports, settings | FR-ADM-06..10 | Member 2 | — | A-01, A-07, A-08 |

Summary: **Member 1 → M1 + M9 · Member 2 → M2 + M8 · Member 3 → M4 + M7 · Member 4 → M3 + M6 ·
Member 5 → M5.**

The administrator verification queue (A-02) is the one M2 screen Member 1 delivers, because the
organization lifecycle (FR-VER-02/03/06) cannot be demonstrated without a way for an administrator
to approve or reject a registration. M2 extends it in Sprint 2 with flags, account management and
the audit viewer.

## 2. Sprint 1 scope

### 2.1 Delivered by Member 1 (Modules 1 and 9)

| Area | Delivered |
| --- | --- |
| Database foundation | PostgreSQL schema for the M1/M9 tables, `schema_migrations` bookkeeping, default `settings` (matching distances, expiry windows, 26 Karachi areas in EN/UR) |
| Dual driver | PGlite for development, `pg` for production — one SQL dialect, automatic migrations |
| Accounts | `users`, `organizations`, `organization_documents`, `verification_history`, `donors`, `sessions`, `otp_codes`, `audit_log`, `notifications`, `dev_outbox` |
| Security | scrypt passwords, hashed session tokens, 30-minute idle timeout, 5-attempt/15-minute lockout, same-origin checks, parameterized SQL, document access control |
| Interface | Global header (language switch, notification bell, profile menu), role navigation, design system (`src/components/ui`), public and signed-in shells, 360 px + RTL layout rules |
| Language | Complete English and Urdu dictionaries with identical key sets, RTL direction on `<html>`, saved language preference, PKT formatting |
| Access | `requireUser`, `requireRole`, `requireVerifiedOrganization`, `requireAdmin`; unverified organizations land on G-04 |
| Screens | G-01 landing/login, G-02 organization registration, G-03 donor signup + OTP, G-04 account status + re-apply, G-05 notification centre, A-02 verification queue/review, `/forgot-password` |
| Data | Seeded demo accounts for every role (`scripts/seed.ts`) |
| Tests/docs | 157 unit tests, README + this docs set |

### 2.2 Sprint 1 targets of the other modules (present as wireframe-faithful placeholders)

These screens are the **other four members' Sprint 1 work**. At hand-off they exist as navigable
placeholder screens that reproduce the wireframe structure, label the screen with its wireframe ID
and owning module, and show what is reserved for Sprint 2. They are **not** Member 1's delivery.

| Screen | Route | Owning module (member) |
| --- | --- | --- |
| H-01 hospital dashboard | `/hospital` | M5 (Member 5) |
| H-02 inventory search | `/hospital/search` | M5 (Member 5) |
| B-01 blood bank dashboard + alerts | `/bank` | M4/M7 (Member 3) |
| B-02 inventory list | `/bank/inventory` | M4 (Member 3) |
| B-03 add / edit batch | `/bank/inventory/new` | M4 (Member 3) |
| B-04 batch detail + movements | `/bank/inventory/[id]` | M4 (Member 3) |
| B-05 settings | `/bank/settings` | M7 (Member 3) |
| B-07 record donation | `/bank/record-donation` | M3 (Member 4) |
| D-03 donor profile | `/donor/profile` | M3 (Member 4) |
| D-04 donor history + reminder | `/donor/history` | M3 (Member 4) |
| D-05 campaigns browse | `/donor/campaigns` | M6 (Member 4) |
| D-06 campaign detail | `/donor/campaigns/[id]` | M6 (Member 4) |
| O-01 create campaign | `/organizer/campaigns/new` | M6 (Member 4) |
| O-02 my campaigns | `/organizer/campaigns` | M6 (Member 4) |
| O-03 completion form | `/organizer/campaigns/[id]/complete` | M6 (Member 4) |
| A-03 account management | `/admin/accounts` | M2 (Member 2) |
| A-04 campaign review | `/admin/campaigns` | M2 (Member 2) |

The placeholders already enforce the correct access rules (each sits under its role layout, so the
right guard runs) and their actions are disabled rather than fake.

### 2.3 Sprint 1 foundation shared by every module

- Design system, shell, navigation per role, notification bell, profile menu, language switch.
- Role-based access and the verification gate (a placeholder cannot be opened by the wrong role or
  by an unverified organization).
- The notification centre, audit log, messaging adapter (with Dev Outbox) and the `settings` values
  every module reads (distances, expiry windows, Karachi areas).
- i18n parts per module so each owner can add their own strings without conflicts.

## 3. Sprint 2 scope (reserved)

| Module | Sprint 2 deliverable | Key requirements |
| --- | --- | --- |
| M2 | Flags queue, audit-log viewer, full verification review tooling, account management completion | FR-ADM-02/03/04/05 |
| M3 | Donor home, request response, matching, ranking, contact-detail privacy, donation recording | FR-DON-02..13 |
| M4 | Movements, reservations, issuance, transfers, cross-bank exclusion rules | FR-INV-04..09 |
| M5 | Create/track requests, statuses and history, matching blood banks, offers | FR-REQ-01..09 |
| M6 | Approval effects, donor notifications, interest, completion records | FR-CAM-02..09 |
| M7 | Expiry and low-stock evaluation, alerts, acknowledgement | FR-MON-01..06 |
| M8 | Inventory dashboard, request report, donation-activity report, settings editor | FR-ADM-06..10 |

Reserved Sprint 2 screens, all currently placeholders:
H-03 create request, H-04 matching banks, H-05 request detail, H-06 edit/cancel, H-07 my requests,
B-06 open requests + offer, D-01 donor home, D-02 request respond, A-01 inventory dashboard,
A-05 flags + hide content, A-06 audit log, A-07 reports, A-08 settings + areas.

Each Sprint 2 module adds its tables as a **new** migration, its i18n keys, its pages inside the
existing role area, its API handlers with `isSameOrigin` + `recordAudit`, and its tests.
[`HANDOFF.md`](HANDOFF.md) is the step-by-step recipe.

## 4. Member 1 delivery checklist

| Deliverable | Status | Where |
| --- | --- | --- |
| Login + lockout + deactivated handling | Done | `src/lib/auth/login.ts`, `src/app/api/auth/login/route.ts`, `tests/rules.test.ts` |
| Sessions (30-min idle, hashed tokens) | Done | `src/lib/auth/session.ts` |
| Organization registration + document upload | Done | `src/app/api/auth/org/register/route.ts`, `src/components/forms/org-registration-form.tsx`, `tests/validation.test.ts` |
| Verification lifecycle + history + re-apply | Done | `/status`, `/api/admin/verify`, `/api/organization/reapply` |
| Administrator verification queue baseline (A-02) | Done | `/admin/verifications` |
| Donor signup + OTP + DR-03 consent | Done | `/api/auth/donor/signup`, `/api/auth/otp/send`, `tests/validation.test.ts` |
| Forgot/reset password | Done | `/forgot-password`, `src/app/api/auth/password/*` |
| Notification centre shell + bell + decision notices | Done | `/notifications`, `src/lib/notifications.ts` |
| EN/UR + RTL + language switch + saved preference | Done | `src/lib/i18n/**`, `src/app/api/language`, `tests/i18n.test.ts` |
| RBAC guards + landing paths | Done | `src/lib/auth/guards.ts`, `src/lib/auth/rules.ts`, `tests/rules.test.ts` |
| Audit logging of significant actions | Done (data + calls) | `src/lib/audit.ts` |
| Seeded accounts for every role | Done | `scripts/seed.ts` |
| Unit tests (157 passing) | Done | `tests/**` |
| Documentation | Done | `README.md`, `docs/**` |

What Member 1 did **not** deliver: the operational screens listed in §2.2 and §3. Those belong to
Modules 2–8 and are placeholders at hand-off.

## 5. Definition of done used for Sprint 1

A Sprint 1 item is complete when:

1. the screen or endpoint exists at a stable route and is reachable by the intended role only;
2. its rules are in `src/lib` and have a unit test where the module is framework-free;
3. user-visible text is in both dictionaries, with no missing keys (`tests/i18n.test.ts`);
4. it writes an audit entry if it is a significant action;
5. it is listed in [`WIREFRAMES.md`](WIREFRAMES.md) and [`TRACEABILITY.md`](TRACEABILITY.md).

## 6. Dependencies and risks

| Risk / dependency | Impact | Mitigation in the delivered code |
| --- | --- | --- |
| No SMS/WhatsApp provider configured | OTP and SMS notifications cannot be delivered in a demo | Dev Outbox + `devCode` in development; Twilio adapter ready (IR-05, A-27) |
| Verification gate blocks other modules | Other members cannot see their screens with unverified seed data | Seed includes verified hospital/blood bank/organization accounts |
| Sprint 1 targets of Modules 2–8 not implemented yet | Screens are demonstrative, not functional | Placeholders name the wireframe ID, owner and sprint; guards already correct |
| Database tables for Sprint 2 modules | Operational modules have no tables yet in Sprint 1 | New migration per module, never edit existing migrations — see [`HANDOFF.md`](HANDOFF.md) |
| Urdu wording quality | NFR-LOC-07 requires a native speaker review | All strings isolated per module part; review is a release task |
