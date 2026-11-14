# Member 3 — implementation notes (Modules 4 + 7)

Living note for the work in progress. Updated as each submodule lands; the formal
evidence lives in [`tests/member-3/TEST-RESULTS.md`](../../tests/member-3/TEST-RESULTS.md)
once the test card starts.

**Branch:** `feature/inventory` · **Migration:** `004_inventory` (+ `005`, `006`) · **Screens:** B-01 … B-05

**Also see:** [`USER-MANUAL-BLOOD-BANK.md`](USER-MANUAL-BLOOD-BANK.md) — the end-user
chapter for this module (English and Urdu).

---

## 1. Progress

| Submodule | Requirement | Status |
| --- | --- | --- |
| Step 0 — data foundation | — | **Done** — six tables + rules module |
| 4.1 Add inventory | FR-INV-01 | **Done** — B-03 form, `POST /api/inventory/batches` |
| 4.2 View inventory | FR-INV-02, FR-INV-04 (display) | **Done** — B-02 list with available / reserved |
| 4.3 Update inventory | FR-INV-03 | **Done** — B-04 detail + edit, `PATCH /api/inventory/batches/[id]` |
| 4.4 Remove / reduce | FR-INV-05, FR-MON-02 | **Done** — Issue / Discard / Mark expired / Correct, plus soft delete (`archive`) for empty batches |
| 4.5 Movement history | FR-INV-03/05/06, A-08 | **Done** — type, quantity, date/time, user, note, receiving blood bank. The related-request column waits for Sprint 2 requests |
| 4.6 Reservations | FR-INV-04, A-10 | **Done** — reserve / release, 6-hour default hold, auto-release |
| 4.7 Transfers | FR-INV-06, A-11 | **Done** — transfer out to another verified blood bank + receiving bank records its own batch |
| 4.7 Transfers | FR-INV-06, A-11 | Not started |
| 4.8 Availability rules | FR-INV-08 | Rule implemented, used by B-02; no screen of ours |
| 7.1 – 7.6 Monitoring | FR-MON-01 … 06 | **Done** — expiry + low-stock alerts, automatic expiry, B-05 settings, acknowledge, optional SMS, hourly guard |
| Tests card | 4.8 + all FRs above | **Done** — 43 unit tests, 38 API checks, 15 manual cases (see `tests/member-3/`) |
| Documentation | — | **Done** — backlog, wireframes, traceability, this note, and the blood-bank user manual (`USER-MANUAL-BLOOD-BANK.md`, English + Urdu) |

---

## 2. Files

**Added**

- `src/lib/inventory/rules.ts` — pure rules (validation, availability, warning windows, low stock, alert identity/dedupe, movement maths, hold + sweep timing, `diffBatch`).
- `src/lib/inventory/data.ts` — database access (`listBatches`, `createBatch`, `getBatch`, `getBatchExpiry`, `updateBatch`).
- `src/lib/inventory/labels.ts` — SRS controlled values → translation keys.
- `src/lib/inventory/form-labels.ts` — one translated label bundle shared by create and edit.
- `src/lib/inventory/monitoring.ts` — the monitoring sweep, per-bank settings, active alerts.
- `src/app/api/inventory/batches/route.ts` — `POST` create batch.
- `src/app/api/inventory/batches/[id]/route.ts` — `PATCH` edit batch.
- `src/app/api/inventory/batches/[id]/movements/route.ts` — `POST` issue / discard / expire / correct.
- `src/app/api/inventory/batches/[id]/reservations/route.ts` — `POST` reserve units.
- `src/app/api/inventory/reservations/[id]/release/route.ts` — `POST` release a hold.
- `src/app/api/inventory/batches/[id]/transfers/route.ts` — `POST` transfer out.
- `src/app/api/inventory/batches/[id]/archive/route.ts` — `POST` soft delete of an empty batch.
- `src/components/forms/archive-batch.tsx` — "Remove from list" control.
- `src/components/forms/inventory-settings-form.tsx` — B-05 settings form.
- `src/components/forms/acknowledge-alert.tsx` — 7.4 acknowledge control.
- `src/app/api/inventory/settings/route.ts` — `POST` thresholds + warning windows + SMS.
- `src/app/api/inventory/alerts/[id]/acknowledge/route.ts` — `POST` acknowledge.
- `src/components/forms/batch-form.tsx` — B-03 form (create **and** edit mode).
- `src/components/forms/batch-actions.tsx` — B-04 action bar.
- `src/components/forms/reservations-panel.tsx` — B-04 reservations.
- `src/app/bank/inventory/[id]/page.tsx` — B-04 batch detail + movement history.
- `src/app/bank/inventory/[id]/edit/page.tsx` — B-03 in edit mode.
- Migration entries `004_inventory` and `005_inventory_correction_zero` in `src/lib/db/migrations.ts`.

**Changed**

- `src/app/bank/inventory/page.tsx` — placeholder → real B-02 list.
- `src/app/bank/inventory/new/page.tsx` — placeholder → real B-03 form.
- `src/lib/i18n/parts/bloodbank.ts` — `inventory.*` keys in English and Urdu.
- `src/lib/audit.ts` — three additive `AuditAction` values for inventory events.

---

## 3. Data model decisions

- **`inventory_batches.units` is the physical quantity held.** Reserved units are
  *not* subtracted from it; they live in `inventory_reservations`.
- **Available = `units` − active reservations.** Active means `status = 'active'`
  **and** `hold_until > now()`. The subtraction exists once, in
  `rules.availableFromCounts`.
- **Movements store a signed `quantity`** so the rows always explain the units
  (`added +6`, `issued −2`, `correction ±n`). Reserved / released movements do
  not change `units`; they change availability only.
- **A batch is never deleted.** Reaching 0 units keeps the row and its history
  (FR-INV-03, DR-05).
- **Date-only expiry** (`2026-11-25`) means the end of that day in Pakistan time
  (23:59 PKT), so a batch does not expire on the previous evening in UTC.
- **A zero-unit batch records no `Added` movement** because the CHECK constraint
  forbids a movement of quantity 0.
- **Every edit is one `Correction` movement** whose quantity is the signed change
  in units. A status-only edit therefore records quantity `0`; migration
  `005_inventory_correction_zero` allows that for corrections only, and the
  movement's note holds the before/after values as JSON so B-04 can say
  "Status: Awaiting testing → Approved" in either language.
- **Editing tolerates an unchanged past expiry.** A batch that already expired
  can still be corrected (for example its status), but a newly typed past date is
  rejected exactly as it is on create (FR-INV-01).
- **4.4 movements work on absolute quantities, not deltas.** Issue and Discard
  remove the number the user typed (never more than the batch holds); Mark
  expired clears whatever is left; Correct sets the total. The stored movement
  quantity is always the signed difference (`Issued −3`, `Correction +2`), and a
  correction requires a reason. Nothing is ever deleted: a batch that reaches 0
  remains with its full history.
- **Issued units are not linked to a hospital request yet.** `related_request_id`
  stays empty until the Sprint 2 request offers exist; the free-text note records
  where the units went in the meantime.
- **Reservations reduce availability, never `units`.** A hold writes a `Reserved`
  movement and leaves the physical quantity alone, so `available = units − active
  holds` stays true. A hold counts only while `status = 'active'` **and**
  `hold_until > now()`.
- **Expired holds release on read.** `releaseExpiredHolds` runs before a batch or
  the list is read: it marks the hold released and writes the
  `Reservation released` movement. This is how A-10's automatic release works
  without a background worker; Module 7's hourly sweep will also call it
  (FR-MON-06), so the two never conflict.
- **A hold can be released early** by the bank, which is the only way it ends
  before `hold_until`.
- **Transfers are recorded twice, once by each bank.** The sender uses
  "Transfer out" (movement `Transferred out`, `related_organization_id` = the
  receiver, quantity `−n`); the receiver records its own incoming batch with the
  normal **Add batch** form. Wasl never moves stock itself (A-11, BR-4), and the
  movement history shows "To Clifton Community Blood Bank".
- **Only a different, verified blood bank can be a transfer target.** Transferring
  to yourself or to a Pending/Rejected/Suspended bank is refused by a check in the
  same transaction that moves the units.
- **The monitoring sweep is the single clock for Module 7.** `runMonitoringSweep`
  runs when B-01 loads and after every inventory change (create / edit / movement /
  reserve / release / transfer). That is how FR-MON-06's "within 1 minute of a
  change" is met without a background worker. It is idempotent, so calling it
  repeatedly changes nothing.
- **Automatic expiry (FR-MON-02)** locks the batch, writes one `Expired` movement
  for the remaining units, sets `units = 0`, and resolves that batch's open expiry
  alert. The batch row and its history stay.
- **Alerts are rows, not messages.** `stock_alerts` holds one *active* row per
  condition (unique partial index); the same condition is not notified again for
  24 hours (A-32). Alert notifications are stored in the notification centre with
  `category = 'general'`, because adding an `inventory_alert` category means
  editing two of Member 1's shared files - flagged for the team.
- **Alert lifecycle:** `active` → `acknowledged` (the bank pressed Acknowledge) or
  `resolved` (the condition stopped being true: batch emptied, archived, expired,
  or stock refilled above the threshold). Acknowledging silences that condition
  for 24 hours; a changed condition (different batch, different quantity) is a
  different alert.
- **Low stock is computed per blood group + component** over approved, unexpired,
  non-archived batches, minus active holds. A combination the bank set a threshold
  for is watched even when it holds no batches at all.
- **B-05 stores the SMS preference now; sending is 7.5.** The checkbox is saved to
  `bank_monitoring_settings.sms_alerts`; when it is on, every raised alert also
  sends one SMS per active staff member through `sendSms()` (Dev Outbox with no
  provider). The message uses that member's preferred language (NFR-LOC-04).
- **FR-MON-06 has two triggers.** Every inventory change calls
  `runMonitoringSweep` directly (seconds). Independently, any page in the bank area
  calls `ensureMonitoringFresh`, which runs the sweep only when an hour has passed
  since `last_sweep_at` - that is the "at least hourly" half, without a background
  worker. The dashboard always sweeps.
- **Expired stock leaves availability automatically**: the list and any search
  exclude `expires_at <= now()` and now also see `units = 0` (FR-MON-02).
- **"Removing" a batch is a soft delete.** 4.4 forbids deleting records, so an
  EMPTY batch can be archived (`archived_at`): B-02 hides it, the detail page still
  opens and shows "Removed from the list on …", and every movement remains. A batch
  that still holds units cannot be archived - reduce it first.
- **No active alert may point at an empty or archived batch.** Both `archiveBatch`
  and the sweep resolve such alerts, which is what stops "5 units expire" lingering
  on a batch with no units.
- **Double submits are ignored.** `BatchForm`, `BatchActions` and the reservations
  panel hold a submit lock in a ref, so a fast double click cannot create two
  batches (this actually happened while testing).

### For Member 5 (hospital search)

```sql
FROM inventory_batches b
JOIN organizations o ON o.id = b.organization_id
WHERE o.type = 'blood_bank'
  AND o.verification_status = 'verified'          -- FR-INV-08
  AND b.status = 'approved'                       -- A-09
  AND b.expires_at > now()                        -- FR-MON-02
```

Available quantity per bank / group / component:

```sql
b.units - COALESCE((
  SELECT SUM(r.units) FROM inventory_reservations r
   WHERE r.batch_id = b.id AND r.status = 'active' AND r.hold_until > now()
), 0)
```

Earliest expiry: `MIN(b.expires_at)` over the qualifying rows.
Last inventory update: `MAX(b.updated_at)` (also `inventory_movements.created_at`).

---

## 4. Deviations from the wireframe (deliberate, documented)

| Screen | Wireframe | Built | Why |
| --- | --- | --- | --- |
| B-02 | columns: Group / Component / Units / Status / Expiry | Group / Component / **Available** / **Reserved** / Status / Expiry | Module 4.2 explicitly requires the reserved quantity to be displayed |
| B-02 | "+ Add Batch" full-width row under the table | matches, after alignment | done for wireframe fidelity |
| B-03 | "Units" field | same, labelled from the shared `field.units` key | no visual change |
| B-04 | summary line "Added +10 Reserved −2 Issued −2" | matches: the history card opens with the same per-type totals | done for wireframe fidelity |
| B-04 | Reserve button sits with Issue / Transfer / Correct | Reserve has its own card (units + hold period + release list) | the hold needs three inputs and lists active holds; a modal-less card is clearer and the action is still on the same screen |
| B-02 | no batch identifier - three A+ Platelets rows are hard to tell apart | extra **Batch** column with a short reference, e.g. `#1C61B494` | usability: the wireframe predates real batches; 4.2/4.3 need a way to name a specific batch in the list |

---

## 5. Running it locally

```powershell
npm install            # pnpm is the team default; npm is used in this environment
npm run db:migrate     # applies 004_inventory
npm run db:seed        # demo accounts
npm run dev            # http://localhost:3000
npm run typecheck
npm test
```

Demo blood banks: `bank@demo.wasl` (Karachi Blood Bank) and `bank2@demo.wasl`
(Clifton Community Blood Bank — **test data for transfers**), both `WaslDemo#2026`.

> Environment note: this machine's sandbox runs commands at a lower Windows
> integrity level than the git checkout, so package installs, migrations and the
> dev server are run with wider file access. That is a local quirk, not a project
> requirement.

> **The local database currently contains development/test data only.** The
> batches, reservations, transfers and alerts in `.data/wasl-pg` were created while
> building and testing Modules 4 and 7 (including a deliberately expired batch and
> archived duplicates). None of it is part of the code or the seed. Reset to clean
> demo data at any time with:
>
> ```powershell
> npm run db:reset
> npm run db:seed
> ```
>
> `db:reset` refuses if `DATABASE_URL` is set. The seed recreates every demo
> account, the campaign awaiting review, and the second (test) blood bank.

---

## 6. Team coordination

1. **Member 5** — use the query above; do not re-implement the availability rule.
2. **Member 1** — `src/lib/audit.ts` gained additive action names only; no
   behaviour changed.
3. **Member 4** — B-07 `record-donation` writes to donor history, so it is Module 3
   (Member 4); not built here (it is not one of Member 3's backlog cards).
4. **Migration ids** — `004_inventory` and `005_inventory_correction_zero` are
   taken; the next module should use `006_…`.
5. **Tests** — Member 2's `admin.test.ts` was moved from `tests/` to
   `tests/member-2/` (its import path was fixed to match). Content unchanged.
6. **Second demo blood bank — TEST DATA.** `scripts/seed.ts` now also creates
   **"Clifton Community Blood Bank"** (`bank2@demo.wasl` / `WaslDemo#2026`),
   verified. It exists **only as demo/test data** so Module 4.7 transfers have a
   receiver (a transfer needs two verified banks). It is not a real Karachi blood
   bank. Later sprints may reuse it for request offers and for multi-bank search
   results. `npm run db:seed` adds it and leaves existing rows untouched.
