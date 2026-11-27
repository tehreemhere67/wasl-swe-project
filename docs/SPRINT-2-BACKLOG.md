# Wasl — Sprint 2 Backlog

**Sprint:** Sprint 2 (two-week sprint) · **Project end:** end of Sprint 2
**Phase 1:** Member 1 works alone and finishes first · **Phase 2:** Members 2–5 work in parallel

**Sprint goal:** deliver the complete blood-request loop — a verified hospital raises a request, blood banks are
notified and offer or reserve units, matching donors are notified and respond, the hospital records outcomes —
plus request notifications, the administrator inventory dashboard, audit viewer, settings, flags and reports.
The new **delivery date** field is added to the hospital request screen, with the SRS, wireframes, tests and user
manual updated. Everything works in English and Urdu.

**Total: 71 cards — 14 per member + 1 group User Manual card.**

## 1. Team, responsibilities and working agreement

| Member | Sprint 1 modules | Sprint 2 package | Phase | Cards |
| --- | --- | --- | --- | ---: |
| Member 1 | 1 + 9 (foundation, auth, common UI) | Sprint 2 foundation, request creation/lifecycle, notifications, A-01/A-06/A-08, delivery date, SRS/wireframes/tests | 1 — first, alone | 14 |
| Member 2 | 2 + 8 (accounts, verification, admin) | A-05 flags, A-07 reports, FR-ADM-09 oversight | 2 | 14 |
| Member 3 | 4 + 7 (inventory, monitoring) | Modules 11+12 — broadcast to banks, offers and reservations | 2 | 14 |
| Member 4 | 3 + 6 (donors, campaigns) | Module 13 — donor matching and responses | 2 | 14 |
| Member 5 | 5 (hospital search) | H-05 request detail, offers/responses display, outcomes, end-to-end integration | 2 | 14 |
| All members | — | Sprint 2 User Manual update | end | 1 |

**Working agreement**

1. **Member 1 completes Phase 1 first** and merges it; no other member starts coding on top of an unmerged
   foundation. Member 1 remains the lead: owns the contract and shared files, reviews every pull request, keeps
   `main` green and runs the final regression.
2. One feature branch per member, pull request into `main`, tests/typecheck before merge, wireframes are the UI
   contract, every new screen is EN + UR (RTL), every new API route keeps same-origin checks, role and verification
   guards, validation and audit.
3. Migrations are **append-only** with reserved numbers: `008_requests` (M1), `009_notifications` (M1),
   `010_settings` (M1), `011_request_matches` (M4), `012_request_offers` (M3), `013_flags` (M2).
4. The new delivery-date requirement is **not divided**: Member 1 owns it end-to-end.

## 2. Scope included in Sprint 2

1. Hospital blood request creation and management (H-03, H-04, H-05, H-06, H-07).
2. Broadcasting open requests to verified blood banks (B-06, notifications).
3. Blood-bank offers and optional inventory reservations.
4. Donor matching (compatibility, distance, ranking) and donor responses (D-01, D-02).
5. Request-related notification workflows (lifecycle notices, channels, retries, escalation).
6. Consolidated administrator inventory dashboard (A-01).
7. Administrator flags, audit viewer, request/donation reports, oversight queue and settings (A-05…A-08).
8. **New requirement:** delivery date on the hospital raising-a-need screen.

**Group deliverable:** Sprint 2 User Manual update, covering every screen delivered in this sprint.

**Notes:** SMS uses the existing provider adapter or the development outbox (no paid provider is configured);
WhatsApp is best-effort and falls back to the in-platform notification. No patient names or medical details are
collected. Eligibility is always decided by medical staff, never by Wasl.

## 3. New requirement — delivery date on raising a need

**Definition:** when a verified hospital raises a need (H-03), it gives the **date on which it wants the units
delivered**. This is separate from the needed-by deadline: the deadline is the latest acceptable time; the delivery
date is the requested hand-over date.

**Rules:** date-only, required, today or later, and not after the needed-by date. Editable while the request is
Open or Partially Fulfilled; changes are recorded in the history and responders are notified. It does not change
urgency or matching; it is information for the hospital, banks and donors. Shown as a read-only field on H-05.

| Artefact | Change | Owner |
| --- | --- | --- |
| SRS v1.2 | New **FR-REQ-10**; amend FR-REQ-01 (field list), FR-REQ-08 (editable), FR-NOT-08 (notification content), UC-04 step 1, DR-01, §4.1/§4.2; change log + PDF | Member 1 |
| Wireframes | H-03/H-06 add the field + inline error; H-05 shows it; docs/WIREFRAMES.md updated; revised H-03/H-06 sheets/PDF | Member 1 |
| Code/schema | `delivery_date date not null` with validation; H-03/H-06 forms; notifications; seed | Member 1 |
| Tests | Unit + API + manual cases for missing/past/today/after-needed-by/edit/final states; traceability | Member 1 |
| Display only | H-05 detail line (Member 5 card 5.1); optional line on B-06/D-01/D-02 (their cards) | M5 / M3 / M4 |

## 4. Delivery phases and dependency order

### Phase 1 — Member 1 alone

1. Contract + migration 008 + shared types (1.1).
2. Status machine + lifecycle APIs (1.2) and validation (1.3).
3. Hospital creation screens/APIs (1.4–1.8).
4. Notifications foundation (1.9–1.10) and admin foundation screens (1.11–1.12).
5. SRS/wireframes (1.13) and seed/tests/traceability (1.14).

Phase 1 ends when all 14 cards are merged and `pnpm test`, `pnpm typecheck` and `pnpm build` pass.

### Phase 2 — Members 2–5 in parallel

1. **Member 2, Member 3 and Member 4 start on the merged Phase 1 skeleton.**
2. **Member 5 starts with the H-05 page skeleton**, then fills in Member 3's offers and Member 4's responses.
3. **Member 5 finishes last** (integration), then Member 1 runs the final regression and submission checks.

### Dependencies

- Member 2's reports read the request data delivered in Phase 1 — no dependency on M3/M4/M5.
- Member 3 needs only Phase 1's request types and notification service.
- Member 4 needs only Phase 1's request types plus the existing donor profiles.
- Member 5 needs M3's offers data and M4's responses to finish H-05.
- Delivery date (M1) must be in Phase 1 so Phase 2 screens can display the field.

## 5. Complete card breakdown

### Member 1 — 14 cards

- **[Member 1] Sprint 2 1.1 — Contract + request schema** — Sprint 2 contract (request types, statuses, notification events, settings keys, API shapes, migration numbers); migration 008_requests with requests + request_status_history + request-number sequence + hidden/audit columns; shared TypeScript types.
- **[Member 1] Sprint 2 1.2 — Request status machine + lifecycle APIs** — Status machine (Open → Partially Fulfilled → Fulfilled/Cancelled/Expired; final states immutable; A-14), status APIs (partial units, fulfilled, cancel with reason), status history + audit, expiry sweep when needed-by passes, hidden-request filtering (FR-REQ-02…05; FR-ADM-03 hospital side).
- **[Member 1] Sprint 2 1.3 — Request validation incl. delivery date + unit tests** — Units, urgency, needed-by in the future, delivery date (FR-REQ-10: date-only, required, today or later, not after needed-by), contact person + phone, optional verified collection bank (FR-REQ-01); unit tests.
- **[Member 1] Sprint 2 1.4 — H-03 Create request page** — H-03 /hospital/requests/new: every wireframe field including delivery date, urgency helper text, no-patient-names note, validation errors and mobile layout.
- **[Member 1] Sprint 2 1.5 — Create-request API** — POST create-request API: verified-hospital RBAC + CSRF + audit → request number, status Open, status history; triggers the notification hooks (FR-REQ-01/02).
- **[Member 1] Sprint 2 1.6 — H-04 Confirmation + matching banks** — H-04 /hospital/requests/[id]/match: request number, matching verified banks with available units (FR-REQ-06, reuses Sprint 1 inventory), links to detail and list.
- **[Member 1] Sprint 2 1.7 — H-07 My requests + status filters** — H-07 /hospital/requests: active vs history, status filter pills; rows show group, component, units, status, needed-by and delivery date (FR-REQ-09).
- **[Member 1] Sprint 2 1.8 — H-06 Edit request incl. delivery date** — H-06 /hospital/requests/[id]/edit: quantity, urgency, needed-by and delivery date editable for Open/Partially Fulfilled; records the change and notifies responders (FR-REQ-08).
- **[Member 1] Sprint 2 1.9 — Notification templates + channel policy** — Notification schema extension + EN/UR request templates including delivery date, hospital + verified badge, urgency, needed-by, area and respond link; channel policy by urgency, opt-outs and dev-outbox fallback (FR-NOT-05…08).
- **[Member 1] Sprint 2 1.10 — Notification delivery + lifecycle notices** — Delivery status + retry (3×/5 min) + dedupe; edited/partially fulfilled/fulfilled/cancelled/expired notices; notification-centre links and categories (FR-NOT-09/10).
- **[Member 1] Sprint 2 1.11 — A-01 Admin inventory dashboard** — A-01 /admin dashboard: inventory totals across verified banks by group/component (available + expiring), filters, bank drill-down and last-updated line (FR-ADM-06).
- **[Member 1] Sprint 2 1.12 — A-06 Audit viewer + A-08 Settings** — A-06 audit log viewer with filters (FR-ADM-05); A-08 settings screen + config storage/validation/audit for compatibility table, matching distances, ranking weights, minimum interval, hold period, low-stock/expiry defaults, escalation timings and Karachi areas EN/UR (FR-ADM-10).
- **[Member 1] Sprint 2 1.13 — SRS v1.2 + wireframe amendment** — SRS v1.2: new FR-REQ-10 plus amendments to FR-REQ-01/08, FR-NOT-08, UC-04, DR-01, §4.1/§4.2; change log; export PDF; revised H-03/H-06 wireframe sheets + docs/WIREFRAMES.md update.
- **[Member 1] Sprint 2 1.14 — Request seed + tests + traceability** — Request demo seed; unit + API tests; scripts/verify-requests.mjs; delivery-date manual cases; docs/TRACEABILITY.md + HANDOFF/README updates.

### Member 2 — 14 cards

- **[Member 2] Sprint 2 2.1 — Flags schema + flag API** — Flags schema + flag API for requests, campaigns and organizations (with reason) + unit tests (FR-ADM-04).
- **[Member 2] Sprint 2 2.2 — Flag buttons on campaign/organization screens** — Flag-as-suspicious buttons on campaign screens and organization profiles.
- **[Member 2] Sprint 2 2.3 — A-05 Admin flags queue** — A-05 /admin/flags: review queue, Hide/cancel with reason, Dismiss, notify the affected organization or hospital (FR-ADM-03/04).
- **[Member 2] Sprint 2 2.4 — Admin hide/cancel request action** — Admin hide/cancel action for requests using Member 1's hidden flag + hospital notification (FR-ADM-03).
- **[Member 2] Sprint 2 2.5 — A-07 Request report** — A-07 request report: date range, counts created, by status, urgency and hospital, average creation→Fulfilled time (FR-ADM-07).
- **[Member 2] Sprint 2 2.6 — A-07 Donation-activity report** — A-07 donation-activity report: registered donors total/by group, responses, recorded donations, campaigns by status; aggregate only, no donor details (FR-ADM-08).
- **[Member 2] Sprint 2 2.7 — FR-ADM-09 oversight queue** — FR-ADM-09 oversight queue on the admin landing: registrations and campaigns awaiting review with waiting time + unreviewed flags.
- **[Member 2] Sprint 2 2.8 — Aggregation helpers + unit tests** — Pure aggregation helpers for report figures and flag counts + unit tests.
- **[Member 2] Sprint 2 2.9 — Report pages UI** — Report pages UI: date-range control, tabs, empty states and the aggregate-only privacy note.
- **[Member 2] Sprint 2 2.10 — Admin action audit + access control** — Audit records for admin actions + access-control tests (FR-ADM-05).
- **[Member 2] Sprint 2 2.11 — Admin demo seed** — Admin demo seed: flags, closed requests, donations and campaigns so reports have data.
- **[Member 2] Sprint 2 2.12 — Admin verification script + manual cases** — scripts/verify-admin.mjs + manual cases TC-M2-… .
- **[Member 2] Sprint 2 2.13 — Admin walkthrough + docs** — End-to-end admin walkthrough on Member 1's request data + docs/traceability.
- **[Member 2] Sprint 2 2.14 — Admin RBAC/CSRF regression** — RBAC/CSRF regression for all admin routes.

### Member 3 — 14 cards

- **[Member 3] Sprint 2 3.1 — Broadcast selection rules + tests** — All verified banks see Open requests; banks with matching available stock are notified (FR-REQ-07, A-17) + unit tests.
- **[Member 3] Sprint 2 3.2 — Broadcast notifications** — Broadcast notifications via Member 1's service, respecting the bank SMS setting + dedupe (FR-NOT-08/10).
- **[Member 3] Sprint 2 3.3 — B-06 Bank open-requests page** — B-06 /bank/requests: hospital verified badge, urgency, needed-by, delivery-date display, stock-match badge, filters and empty state.
- **[Member 3] Sprint 2 3.4 — Request status notices to banks** — Edited/closed/expired/hidden request notices to notified banks (FR-NOT-09).
- **[Member 3] Sprint 2 3.5 — Offers schema + offer rules + tests** — request_offers migration + pure offer rules (units ≤ available, open request, verified bank) + unit tests.
- **[Member 3] Sprint 2 3.6 — Offer API + optional reservation** — Offer API: offer units, optionally reserve stock (hold; A-10) and audit (FR-REQ-07).
- **[Member 3] Sprint 2 3.7 — Reservation release + availability** — Reservation release on withdraw/closure/expiry; availability excludes reserved units (FR-INV-04/08).
- **[Member 3] Sprint 2 3.8 — B-06 offer form + withdraw UI** — B-06 offer form, offer state and 'Withdraw offer' UI.
- **[Member 3] Sprint 2 3.9 — New-offer notification to hospital** — Hospital notified when a new offer arrives (FR-NOT-02 integration).
- **[Member 3] Sprint 2 3.10 — Offer/reservation demo seed** — Demo seed: offers + reservations.
- **[Member 3] Sprint 2 3.11 — Broadcast/offers verification script** — scripts/verify-broadcast-offers.mjs (broadcast, offer, hold, release).
- **[Member 3] Sprint 2 3.12 — Bank manual cases + docs** — Manual cases TC-M3-… + docs/traceability.
- **[Member 3] Sprint 2 3.13 — Bank RBAC/CSRF tests** — Bank RBAC + CSRF tests.
- **[Member 3] Sprint 2 3.14 — Bank walkthrough + integration** — Demo walkthrough + integration with Member 1's request data.

### Member 4 — 14 cards

- **[Member 4] Sprint 2 4.1 — Area centres + distance helper** — Karachi-area centres + distance helper (A-18/A-21) + unit tests.
- **[Member 4] Sprint 2 4.2 — Compatibility helper + tests** — Component-aware compatibility helper (ABO/Rh for whole blood and red cells; same group for platelets and plasma; A-20) + unit tests.
- **[Member 4] Sprint 2 4.3 — Eligibility + ranking + tests** — Matching eligibility and ranking: Available, compatible, within distance, urgent notices on, not already responded; 60/40 proximity/recency (180-day cap); 90-day auto-notify interval (FR-DON-07…10; A-22/23) + unit tests.
- **[Member 4] Sprint 2 4.4 — matches migration + matching run** — request_matches migration + matching run on request creation/urgency change; persisted rank/score/notified; potential-match count API.
- **[Member 4] Sprint 2 4.5 — D-01 Donor home** — D-01 /donor: Available toggle + relevant Open requests (compatible, within distance) with distance, delivery date and hospital verification; campaigns/profile links (FR-DON-13).
- **[Member 4] Sprint 2 4.6 — D-02 Request detail + respond** — D-02 /donor/requests/[id]: summary, eligibility statement, Willing / Decline / Withdraw, closed and already-responded states (FR-NOT-01; FR-DON-11).
- **[Member 4] Sprint 2 4.7 — Responses API + contact reveal** — Response API: timestamps, notify hospital, reveal donor contact only after Willing (FR-DON-12).
- **[Member 4] Sprint 2 4.8 — Privacy/consent states** — Privacy/consent states across matching screens and notifications (DR-03; FR-DON-11/12).
- **[Member 4] Sprint 2 4.9 — Availability toggle API** — Availability toggle API + effect on matching.
- **[Member 4] Sprint 2 4.10 — Escalation sweep** — Escalation sweep: Urgent next 50 after 2 h; Critical extend distance +10 km after 30 min (FR-NOT-11).
- **[Member 4] Sprint 2 4.11 — Donor demo seed** — Donor demo seed: areas, availability and donation history.
- **[Member 4] Sprint 2 4.12 — Matching verification script + manual cases** — scripts/verify-matching.mjs + manual cases TC-M4-… .
- **[Member 4] Sprint 2 4.13 — Donor RBAC/privacy tests** — Donor RBAC and privacy tests.
- **[Member 4] Sprint 2 4.14 — Donor walkthrough + docs** — Docs/traceability + integration walkthrough.

### Member 5 — 14 cards

- **[Member 5] Sprint 2 5.1 — H-05 Request detail base** — H-05 /hospital/requests/[id]: header, status timeline, all fields including delivery date, links (FR-REQ-05).
- **[Member 5] Sprint 2 5.2 — H-05 Bank offers section** — H-05 bank-offers section: bank, units, reserved flag and time (Member 3 data).
- **[Member 5] Sprint 2 5.3 — H-05 Willing donors section** — H-05 willing-donors section: only after Willing, contact rules (Member 4 data; FR-NOT-02).
- **[Member 5] Sprint 2 5.4 — H-05 Status actions UI** — Status actions UI: mark Partially Fulfilled (units received), Fulfilled, Cancel with reason (calls Member 1 APIs; FR-REQ-03).
- **[Member 5] Sprint 2 5.5 — Outcomes + donor history** — Outcome buttons per responder: Contacted / Donation completed / Did not donate; Donation completed writes donor history (FR-NOT-03).
- **[Member 5] Sprint 2 5.6 — Collection bank donor view** — Designated collection blood bank sees the willing-donor list (FR-NOT-02, A-26).
- **[Member 5] Sprint 2 5.7 — H-04 potential-match count** — Potential-match count on H-04 from Member 4's API (FR-DON-12).
- **[Member 5] Sprint 2 5.8 — Request flag button on H-05** — Request flag button on H-05 calling Member 2's flag API (FR-ADM-04).
- **[Member 5] Sprint 2 5.9 — Notification deep-link/status integration** — Notification deep-link and status integration between H-05 and the notification centre.
- **[Member 5] Sprint 2 5.10 — Offers/responses demo seed** — Demo seed: offers, responses and outcomes.
- **[Member 5] Sprint 2 5.11 — Full request-flow verification script** — scripts/verify-request-flow.mjs (H-03 → B-06 offer → D-02 response → H-05 outcome).
- **[Member 5] Sprint 2 5.12 — Hospital manual cases + docs** — Manual cases TC-M5-… + docs/traceability.
- **[Member 5] Sprint 2 5.13 — Hospital/collection-bank RBAC + privacy tests** — Hospital and collection-bank RBAC + privacy tests.
- **[Member 5] Sprint 2 5.14 — Full request-loop regression** — Full request-loop regression + docs.

### All members — group deliverable

- **[All members] Sprint 2 — User Manual update for Sprint 2** — Update docs/USER-MANUAL.md and the screenshots with the request loop, bank offers, donor responses, admin flags, reports and settings; each member contributes their own screens.

## 6. Cards per member

| Member | To Do | In Progress | Done | Total |
| --- | ---: | ---: | ---: | ---: |
| Member 1 | 14 | 0 | 0 | 14 |
| Member 2 | 14 | 0 | 0 | 14 |
| Member 3 | 14 | 0 | 0 | 14 |
| Member 4 | 14 | 0 | 0 | 14 |
| Member 5 | 14 | 0 | 0 | 14 |
| All members | 1 | 0 | 0 | 1 |
| **Total** | **71** | **0** | **0** | **71** |

> All Sprint 2 cards start in **To Do**. Member 1's 14 cards are worked first; Members 2–5 follow in parallel;
> the group User Manual card is completed at the end of the sprint.

## 7. Board: To Do

The complete Sprint 2 board — Member 1 first, then Members 2–5, then the group card.

### Member 1

- [ ] [Member 1] Sprint 2 1.1 — Contract + request schema
- [ ] [Member 1] Sprint 2 1.2 — Request status machine + lifecycle APIs
- [ ] [Member 1] Sprint 2 1.3 — Request validation incl. delivery date + unit tests
- [ ] [Member 1] Sprint 2 1.4 — H-03 Create request page
- [ ] [Member 1] Sprint 2 1.5 — Create-request API
- [ ] [Member 1] Sprint 2 1.6 — H-04 Confirmation + matching banks
- [ ] [Member 1] Sprint 2 1.7 — H-07 My requests + status filters
- [ ] [Member 1] Sprint 2 1.8 — H-06 Edit request incl. delivery date
- [ ] [Member 1] Sprint 2 1.9 — Notification templates + channel policy
- [ ] [Member 1] Sprint 2 1.10 — Notification delivery + lifecycle notices
- [ ] [Member 1] Sprint 2 1.11 — A-01 Admin inventory dashboard
- [ ] [Member 1] Sprint 2 1.12 — A-06 Audit viewer + A-08 Settings
- [ ] [Member 1] Sprint 2 1.13 — SRS v1.2 + wireframe amendment
- [ ] [Member 1] Sprint 2 1.14 — Request seed + tests + traceability

### Member 2

- [ ] [Member 2] Sprint 2 2.1 — Flags schema + flag API
- [ ] [Member 2] Sprint 2 2.2 — Flag buttons on campaign/organization screens
- [ ] [Member 2] Sprint 2 2.3 — A-05 Admin flags queue
- [ ] [Member 2] Sprint 2 2.4 — Admin hide/cancel request action
- [ ] [Member 2] Sprint 2 2.5 — A-07 Request report
- [ ] [Member 2] Sprint 2 2.6 — A-07 Donation-activity report
- [ ] [Member 2] Sprint 2 2.7 — FR-ADM-09 oversight queue
- [ ] [Member 2] Sprint 2 2.8 — Aggregation helpers + unit tests
- [ ] [Member 2] Sprint 2 2.9 — Report pages UI
- [ ] [Member 2] Sprint 2 2.10 — Admin action audit + access control
- [ ] [Member 2] Sprint 2 2.11 — Admin demo seed
- [ ] [Member 2] Sprint 2 2.12 — Admin verification script + manual cases
- [ ] [Member 2] Sprint 2 2.13 — Admin walkthrough + docs
- [ ] [Member 2] Sprint 2 2.14 — Admin RBAC/CSRF regression

### Member 3

- [ ] [Member 3] Sprint 2 3.1 — Broadcast selection rules + tests
- [ ] [Member 3] Sprint 2 3.2 — Broadcast notifications
- [ ] [Member 3] Sprint 2 3.3 — B-06 Bank open-requests page
- [ ] [Member 3] Sprint 2 3.4 — Request status notices to banks
- [ ] [Member 3] Sprint 2 3.5 — Offers schema + offer rules + tests
- [ ] [Member 3] Sprint 2 3.6 — Offer API + optional reservation
- [ ] [Member 3] Sprint 2 3.7 — Reservation release + availability
- [ ] [Member 3] Sprint 2 3.8 — B-06 offer form + withdraw UI
- [ ] [Member 3] Sprint 2 3.9 — New-offer notification to hospital
- [ ] [Member 3] Sprint 2 3.10 — Offer/reservation demo seed
- [ ] [Member 3] Sprint 2 3.11 — Broadcast/offers verification script
- [ ] [Member 3] Sprint 2 3.12 — Bank manual cases + docs
- [ ] [Member 3] Sprint 2 3.13 — Bank RBAC/CSRF tests
- [ ] [Member 3] Sprint 2 3.14 — Bank walkthrough + integration

### Member 4

- [ ] [Member 4] Sprint 2 4.1 — Area centres + distance helper
- [ ] [Member 4] Sprint 2 4.2 — Compatibility helper + tests
- [ ] [Member 4] Sprint 2 4.3 — Eligibility + ranking + tests
- [ ] [Member 4] Sprint 2 4.4 — matches migration + matching run
- [ ] [Member 4] Sprint 2 4.5 — D-01 Donor home
- [ ] [Member 4] Sprint 2 4.6 — D-02 Request detail + respond
- [ ] [Member 4] Sprint 2 4.7 — Responses API + contact reveal
- [ ] [Member 4] Sprint 2 4.8 — Privacy/consent states
- [ ] [Member 4] Sprint 2 4.9 — Availability toggle API
- [ ] [Member 4] Sprint 2 4.10 — Escalation sweep
- [ ] [Member 4] Sprint 2 4.11 — Donor demo seed
- [ ] [Member 4] Sprint 2 4.12 — Matching verification script + manual cases
- [ ] [Member 4] Sprint 2 4.13 — Donor RBAC/privacy tests
- [ ] [Member 4] Sprint 2 4.14 — Donor walkthrough + docs

### Member 5

- [ ] [Member 5] Sprint 2 5.1 — H-05 Request detail base
- [ ] [Member 5] Sprint 2 5.2 — H-05 Bank offers section
- [ ] [Member 5] Sprint 2 5.3 — H-05 Willing donors section
- [ ] [Member 5] Sprint 2 5.4 — H-05 Status actions UI
- [ ] [Member 5] Sprint 2 5.5 — Outcomes + donor history
- [ ] [Member 5] Sprint 2 5.6 — Collection bank donor view
- [ ] [Member 5] Sprint 2 5.7 — H-04 potential-match count
- [ ] [Member 5] Sprint 2 5.8 — Request flag button on H-05
- [ ] [Member 5] Sprint 2 5.9 — Notification deep-link/status integration
- [ ] [Member 5] Sprint 2 5.10 — Offers/responses demo seed
- [ ] [Member 5] Sprint 2 5.11 — Full request-flow verification script
- [ ] [Member 5] Sprint 2 5.12 — Hospital manual cases + docs
- [ ] [Member 5] Sprint 2 5.13 — Hospital/collection-bank RBAC + privacy tests
- [ ] [Member 5] Sprint 2 5.14 — Full request-loop regression

### All members

- [ ] [All members] Sprint 2 — User Manual update for Sprint 2

## 8. Board: In Progress

No cards are in progress. Move a card here when work starts.

## 9. Board: Done

No cards are done yet. Move a card here when it is merged with evidence.

## 10. Trello board

Import **`docs/trello-board-sprint-2.json`** into Trello to create the matching board. It contains the three lists
(To Do, In Progress, Done) and the **71 cards in order**: Member 1's 14 first, then Members 2–5, then the group
User Manual card. Do not add, rename or delete cards along the way; move them between lists as work progresses.

## 11. Definition of done and evidence

Every card is done only when:

1. The screen follows its wireframe (including the new delivery-date field where applicable).
2. English and Urdu text both exist and Urdu renders RTL.
3. Role/verification guards, same-origin checks, validation and audit are in place.
4. Tests are added and pass (`pnpm test`, the member's `scripts/verify-*.mjs`, `pnpm typecheck`, `pnpm build`).
5. Manual cases and saved results are added under `tests/member-N/`.
6. `docs/TRACEABILITY.md` and the relevant member docs are updated.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Phase 1 becomes a bottleneck because everyone waits | Member 1 starts immediately and keeps the 14 cards tightly scoped; the contract and schema land first |
| Cross-module merge conflicts | Append-only migrations with reserved numbers; shared files owned by Member 1; PR review |
| Delivery date added late breaks existing flows | It is inside Phase 1 (single owner), so Phase 2 builds on a stable request shape; full regression at the end |
| No SMS/WhatsApp provider | In-platform notification is always written; SMS/WhatsApp use the dev outbox or fall back |
| Member 5 needs M3/M4 output | M5 builds the H-05 skeleton first and integrates as M3/M4 merge; M5 finishes last |
| Time-based tests (expiry, escalation) | Pure rules are unit-tested with a fake clock; live scripts use short windows |

*Sprint 2 board and backlog created from the approved Sprint 2 plan.*
