# Member 4 — Data model changes (migration `007_donor_campaign_m4`)

Existing tables used unchanged: `users`, `donors`, `organizations`, `campaigns`, `notifications`, `settings`, `sessions`, `audit_log`.
The migration only **adds**; nothing is dropped or renamed, so earlier members' data keeps working.

## New tables

**`donation_history`** (FR-DON-03, FR-DON-04, A-19)

| Column | Meaning |
| --- | --- |
| `id` | primary key |
| `donor_id` | the donor; `NULL` after the donor deletes their account (row kept, link removed) |
| `donated_on` | the date of the donation |
| `place` | free text, 2–120 characters |
| `source` | `self_reported` (shown as "Self reported") or `recorded_by_org` (shown as "Recorded by org") |
| `recorded_by_organization_id` | organizer who recorded it (`NULL` for self reported) |
| `campaign_id` | the campaign it came from (for O-03 entries) |
| unique index | one entry per (campaign, donor) so a donor cannot be recorded twice for a drive |

**`campaign_interests`** (FR-CAM-07): `campaign_id`, `donor_id`, `created_at`; primary key on the pair, so a donor counts once.

## New columns

`campaigns`: `contact_phone`, `contact_email`, `attendees`, `donations_count`, `outcome_recorded_at`,
`approved_snapshot` (JSON of the last approved version, used by A-29), `cancelled_at`.
`donors`: `reminder_last_sent_for` (the last-donation date the reminder was already sent for), `deleted_at`.

## Settings used

`karachi_areas` (A-18, names + coordinates) and `matching.campaign_notice_distance_km` (15 km, A-21) — both already existed.

To start again from nothing: `pnpm db:reset && pnpm db:seed`.
