# Member 3 — Manual test cases (Modules 4 + 7)

Browser-level cases for the blood-bank inventory and monitoring screens.
Automated coverage for the same behaviour lives in `tests/member-3/unit/` and is
repeated end-to-end by `scripts/verify-inventory.mjs`; this document covers what a
person must confirm in the running app (layout, wording, Urdu, phone width).

**Total: 15 cases — 15 Pass, 0 Fail, 3 items deferred** (time-based checks that a
person cannot wait for; each is covered by a unit test instead — see the bottom of
this file).

> Status values: **Pass** = executed and observed on 14 Nov 2026 against the local
> app; **Deferred** = requires hours of waiting or clock manipulation. Nothing is
> claimed as passing without evidence.

## How to reproduce

```powershell
npm run db:migrate      # schema incl. 004/005/006
npm run db:seed         # demo accounts incl. the second (test) blood bank
npm run dev             # http://localhost:3000
```

Log in as `bank@demo.wasl` / `WaslDemo#2026` (Karachi Blood Bank).

| ID | Requirement | Steps | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M3-001 | FR-INV-02, FR-INV-04 | Open **Inventory**. | Columns are Blood group / **Batch** / Component / Available / Reserved / Status / Expiry; every row shows `#XXXXXXXX`; identical A+ Platelets rows are distinguishable. | Pass | Manual run, 14 Nov 2026 |
| TC-M3-002 | FR-INV-01 | **+ Add batch** → AB+ / Whole blood / 8 / Awaiting testing / future date → Save. | Returns to Inventory with the new row; the detail page shows "Units held 8" and `Added +8`. | Pass | Manual run + `verify-inventory.mjs` |
| TC-M3-003 | FR-INV-01, DR-01 | Add a batch with units `-5`, then one with a past expiry. | "Enter a whole number of units…" and "The expiry date must be in the future."; nothing is stored. | Pass | Manual run + API check |
| TC-M3-004 | FR-INV-03 | **Edit batch** → change status Awaiting → Approved and units 8 → 6 → Save. | Detail shows Approved; history has `Correction −2` and "Status: Awaiting testing → Approved". | Pass | Manual run + API check |
| TC-M3-005 | FR-INV-05 | **Issue units** → 2 → note "Aga Khan" → Confirm. | Units fall by 2; history shows `Issued −2` with the note. | Pass | Manual run + API check |
| TC-M3-006 | FR-INV-03, FR-INV-05, A-08 | **Discard units** → 1, then **Correct quantity** → 5 with reason "Recount". | `Discarded −1` then `Correction +2`; a correction without a reason is refused. | Pass | Manual run |
| TC-M3-007 | FR-INV-04, A-10 | **Reserve** 2 units for 6 hours, then **Release**. | Available drops by 2 and Reserved shows 2; the hold lists its end time; Release restores availability and records `Reservation released`. | Pass | Manual run + API check |
| TC-M3-008 | FR-INV-06, A-11 | **Transfer out** → Clifton Community Blood Bank → 1 → Confirm. | Units fall by 1; history shows `Transferred out −1` and "To Clifton Community Blood Bank"; the receiving bank cannot open this batch (404). | Pass | Manual run + API check |
| TC-M3-009 | FR-MON-02, 4.4, DR-05 | **Mark expired** on a batch, then **Remove from list**. | Units become 0 with `Expired −N`; the batch leaves Inventory; the direct link still shows the history with "Removed from the list on …". | Pass | Manual run + API check |
| TC-M3-010 | FR-MON-01, FR-MON-03/04 | **Settings** → grid of thresholds, windows 2/7/7/30; set a threshold and Save. | "Settings saved."; the dashboard raises "Low stock: …" for that group and component. | Pass | Manual run + API check |
| TC-M3-011 | FR-MON-05, A-32 | **Acknowledge** an alert on the dashboard, then reload. | The alert disappears and does not return on reload (24-hour silence). | Pass | Manual run + API check |
| TC-M3-012 | FR-MON-05, IR-05 | Settings → SMS alerts ticked → Save; add a batch expiring tomorrow; open `/dev/outbox`. | The message appears in the development outbox for the bank's phone number. Unticking SMS stops new messages. | Pass | Manual run; outbox `/dev/outbox` |
| TC-M3-013 | NFR-LOC-01/03 | Switch the header language to **اردو** on Inventory. | Labels are Urdu, layout is right-to-left, `#REF` codes stay readable. | Pass | Manual run |
| TC-M3-014 | IR-01, NFR-USA-01 | Narrow the browser to ~400 px. | The table becomes cards; available / reserved / expiry / `#REF` remain visible. | Pass | Manual run |
| TC-M3-015 | FR-ADM-01, FR-VER-03, A-12 | Log in as `hospital@demo.wasl` and open `/bank/inventory`. | Redirected to the hospital area (307 → `/hospital`); a hospital cannot create or edit bank stock (403). | Pass | Manual run + API check |

## Deferred (cannot be observed by waiting)

| ID | Requirement | Why deferred | Covered instead by |
| --- | --- | --- | --- |
| TC-M3-D01 | FR-MON-05 / A-32 | The 24-hour repeat window cannot be waited out during a test session. | `monitoring-rules.test.ts` — "does not repeat within 24 hours" / "repeats after 25 hours" |
| TC-M3-D02 | FR-MON-02 | Requires the clock to pass a batch's expiry moment. | Verified by ageing `expires_at` in the database, then `verify-inventory.mjs` (Expired movement, units 0) |
| TC-M3-D03 | FR-MON-06 | The hourly sweep interval needs an hour. | `monitoring-rules.test.ts` — `sweepDue` at 30 and 61 minutes, plus the sweep call on every inventory change |
