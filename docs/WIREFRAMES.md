# Wasl — Wireframes to Routes

Maps every screen in the wireframe set (`.analysis/wireframes/page-01.png` … `page-15.png`) to the
route that implements it in the current `src/app` tree, with its status and owning module.

The wireframe sheets and their content:

| Sheet | Content |
| --- | --- |
| 1 | Legend (header bar, text input, dropdown, button, verified badge, tabs, toggle/list row) + G-01, G-02 |
| 2 | G-03, G-04 |
| 3 | G-05, G-06, G-07, H-01 … H-05 |
| 4 | B-01 … B-04 |
| 5 | B-05 … B-07 |
| 6 | D-01 … D-03 |
| 7 | D-04 … D-06 |
| 8 | O-01 … O-03 |
| 9 | A-01 … A-03 |
| 10 | A-04 … A-06 |
| 11 | A-07, A-08 |
| 12 | Donor and hospital navigation flows (introduces H-06, H-07) |
| 13 | Blood bank and campaign-organizer navigation flows |
| 14 | Administrator menu flow |
| 15 | Organization registration flow + note: *"Menus (language switch, alerts bell, profile) are on every screen"* |

**Total: 38 wireframe screens** — 8 delivered, 15 Sprint 1 targets owned by other modules (present as
placeholders), 13 reserved for Sprint 2, and 2 cross-cutting items (G-06, G-07) that are not separate
routes.

## Status legend

| Status | Meaning |
| --- | --- |
| **Delivered** | Implemented and demonstrable now; delivered by Member 1 (M1/M9). |
| **Sprint 1 target** | Scheduled for Sprint 1, owned by another module. The screen exists as a navigable, wireframe-faithful placeholder: the wireframe structure is rendered, actions are disabled, and the screen states its wireframe ID, owner module and sprint. |
| **Sprint 2 reserved** | Not started; the route exists as a placeholder naming the wireframe ID and owner. |
| **Cross-cutting** | A behaviour of the whole application rather than one route. |

A placeholder is never a blank page: it uses the real design system and shell, and it names what is
coming. That keeps the demo walkable and fixes the integration points for the owning module
(see [`HANDOFF.md`](HANDOFF.md)).

---

## Global screens (G)

| ID | Screen | Route | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| **G-01** | Landing / login | `/` | **Delivered** | M1 | Login form, lockout/deactivation messages, links to "Register as donor" and "Register organization", "Forgot password?" |
| **G-02** | Organization registration | `/register/organization` | **Delivered** | M1 | Type, name, address, official phone + email, licence, representative + designation, mandatory supporting document, password; FR-VER-01 |
| **G-03** | Donor signup + OTP | `/register/donor` | **Delivered** | M1 | Name, mobile, "Send code", 6-digit code, DR-03 consent box, password; FR-DON-01 |
| **G-04** | Pending / rejected / suspended / verified | `/status` | **Delivered** | M1 | Status + blocked-features message, decision history (administrator, date, time, reason), "Reapply (if rejected)"; FR-VER-02/03 |
| **G-05** | Notification centre | `/notifications` | **Delivered** | M9 | Unread count, categories, delivery status, mark one/all read; FR-NOT-04 |
| **G-06** | Urdu RTL donor response | — (cross-cutting) | **Delivered capability** | M9 | Not a separate route. `dir="rtl"` is set on `<html>` for the whole app and every string is in the Urdu dictionary, so the donor-response screen D-02 and all other screens mirror. The D-02 route itself is Sprint 2 reserved. |
| **G-07** | SMS / WhatsApp message | — (cross-cutting) | **Partial** | M1 (channel) + M3/M5 (content) | The channel exists: bilingual OTP and registration-decision SMS through the Twilio adapter or the Dev Outbox. The request-alert message format (FR-NOT-05/08) is Sprint 2; WhatsApp (IR-06) is not implemented. |

## Hospital area (H)

| ID | Screen | Route | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| **H-01** | Dashboard | `/hospital` | Sprint 1 target | M5 | Organization name + verified badge, "Search blood", "New request", active request rows, notifications button |
| **H-02** | Inventory search | `/hospital/search` | Sprint 1 target | M5 | Blood group + component form, example result with verified mark, expiry/area/phone, "as reported by blood bank" statement, empty state |
| **H-03** | Create request | `/hospital/requests/new` | Sprint 2 reserved | M5 | Group, component, units, urgency, needed-by, contact person, collection bank, "no patient names" note; submit disabled |
| **H-04** | Confirmation + matching banks | `/hospital/requests/[id]/match` | Sprint 2 reserved | M5 | Request number, matching banks with verified marks, potential-match count, "View request" |
| **H-05** | Request detail | `/hospital/requests/[id]` | Sprint 2 reserved | M5 | Status, mark partial / fulfilled / cancel, willing donors with outcome buttons, bank offers |
| **H-06** | Edit / cancel request | `/hospital/requests/[id]/edit` | Sprint 2 reserved | M5 | Not drawn as a screen; defined in the hospital navigation flow (sheet 12). Repeats H-03 fields and adds cancel-with-reason |
| **H-07** | My requests | `/hospital/requests` | Sprint 2 reserved | M5 | Not drawn as a screen; defined in the hospital navigation flow (sheet 12). Request list with status filter pills |

## Blood bank area (B)

| ID | Screen | Route | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| **B-01** | Dashboard + alerts | `/bank` | **Delivered** | M4/M7 | Bank name + verified badge, real alert count, live expiry and low-stock rows with Acknowledge + batch link, Add batch / Inventory / Open req / Settings, last-updated line (Member 3) |
| **B-02** | Inventory list | `/bank/inventory` | **Delivered** | M4 | Group / **Batch** / Component / **Available / Reserved** / status / expiry table, "+ Add Batch" as a full-width row, desktop table + mobile cards at 360 px (Member 3) |
| **B-03** | Add / edit batch | `/bank/inventory/new` and `/bank/inventory/[id]/edit` | **Delivered** | M4 | Group, component, units, status, expiry with the inline expiry error line, Save; the same form edits and approves an existing batch (Member 3) |
| **B-04** | Batch detail + movements | `/bank/inventory/[id]` | **Delivered** | M4 | Summary line (Added/Reserved/Issued totals), full movement history with who-and-when, Issue / Discard / Mark expired / Transfer / Correct actions, reservations card, "Remove from list" when empty (Member 3) |
| **B-05** | Settings | `/bank/settings` | **Delivered** | M7 | Low-stock thresholds per blood group **and** component (default 5), expiry warning windows (platelets 2 d, whole blood/RBC 7 d, plasma 30 d — A-31), SMS alerts checkbox, Save (Member 3) |
| **B-06** | Open requests + offer | `/bank/requests` | Sprint 2 reserved | M5 | Request row with hospital verified mark and urgency, "Offers Units (+ reserve)", "Matches my stock" |
| **B-07** | Record donation | `/bank/record-donation` | Sprint 1 target | M3 | Donor phone, date, "only that a donation took place" note, Save |

## Donor area (D)

| ID | Screen | Route | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| **D-01** | Home — relevant requests | `/donor` | Sprint 2 reserved | M3 | "Available" toggle, matching requests with distance, Campaigns button, Profile/History links |
| **D-02** | Request detail + respond | `/donor/requests/[id]` | Sprint 2 reserved | M3 | Request summary, eligibility statement, "I'm willing" / "Decline". This is the screen shown in G-06 (Urdu RTL); its layout already mirrors under `dir="rtl"` |
| **D-03** | Profile | `/donor/profile` | Sprint 1 target | M3 | Blood group, area, SMS/WhatsApp/Platform channels, urgent/campaign notices, language, Save, Delete account |
| **D-04** | History + reminder | `/donor/history` | Sprint 1 target | M3 | Donations total, self-reported and organization-recorded rows, "+ Add past donation", "Remind me after N days" |
| **D-05** | Campaigns browse | `/donor/campaigns` | Sprint 1 target | M6 | Area / Date / Group filters, verified campaign cards with dates |
| **D-06** | Campaign detail | `/donor/campaigns/[id]` | Sprint 1 target | M6 | Title/date/venue/target, verified organizer, "I plan to attend" |

## Campaign organizer area (O)

| ID | Screen | Route | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| **O-01** | Create campaign | `/organizer/campaigns/new` | Sprint 1 target | M6 | Bilingual title/description, date/time/venue, target groups, Save draft, Submit for approval |
| **O-02** | My campaigns | `/organizer/campaigns` | Sprint 1 target | M6 | Draft / Pending / Approved rows, approved row links to the completion form, Cancel campaign |
| **O-03** | Completion form | `/organizer/campaigns/[id]/complete` | Sprint 1 target | M6 | Attendees, donations, donor phone recorded at the drive, Save |

## Administrator area (A)

| ID | Screen | Route | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| **A-01** | Inventory dashboard (all banks) | `/admin` | Sprint 2 reserved | M8 | Group / component / available / expiring table, "click row → bank drill-down" |
| **A-02** | Verification queue + review | `/admin/verifications` | **Delivered** (baseline) | M1 (M2 extends) | Pending queue with waiting time and document count, details + documents, history, Approve / Reject + reason / Suspend / Reinstate; `?tab=all`, `?org=<id>` |
| **A-03** | Account management | `/admin/accounts` | **Delivered** | M2 | Search, account/status rows, Deactivate / Reactivate |
| **A-04** | Campaign review | `/admin/campaigns` | **Delivered** | M2 | Campaign details, Approve / Reject + reason / Return for changes; organizer notified |
| **A-05** | Flags + hide content | `/admin/flags` | Sprint 2 reserved | M2 | Flag queue with reason, Hide/cancel + reason, Dismiss, "org notified" |
| **A-06** | Audit log | `/admin/audit` | Sprint 2 reserved | M2 | Time / user / action / details table with filter. The audit **data** is already recorded by M1; only the viewer is pending |
| **A-07** | Reports | `/admin/reports` | Sprint 2 reserved | M8 | Date range, Requests / Donation activity / Inventory tabs, aggregate-only privacy note |
| **A-08** | Settings + areas | `/admin/settings` | Sprint 2 reserved | M8 | Compatibility table, distances 30/15 km, weights 60/40, hold period, escalation timings, Karachi areas (EN/UR), Save |

---

## Routes that are not wireframe screens

| Route | Purpose | Status |
| --- | --- | --- |
| `/forgot-password` | Complete password reset: registered mobile → 6-digit code → new password. Linked from G-01 ("Forgot password?") | **Delivered** (M1) |
| `/dev/outbox` | Development-only viewer of the SMS outbox (no provider configured). No navigation link; refuses to render in production | Delivered development aid |
| `/api/**` | Route handlers (auth, documents, language, notifications). Not screens | — |
| `/?next=…`, `/admin/verifications?tab=all&org=…` | Query-string states of the routes above, used for post-login return and queue selection | — |

## Notes for the module owners

1. Keep the route paths in this table. The role navigation and the wireframe flow sheets already
   link to them; renaming a route breaks the demo and this document.
2. When you replace a placeholder, keep the same wireframe ID in the page comment and update this
   file (status → Delivered) together with [`TRACEABILITY.md`](TRACEABILITY.md).
3. The wireframe's "menus on every screen" note is already satisfied by the shared header in both
   shells: language switch, notification bell and profile menu appear on every route.
4. Two screens are intentionally not in the wireframe drawing: H-06 (edit/cancel) and H-07 (my
   requests) come from the hospital navigation flow (sheet 12); they are still part of the required
   screen set.
