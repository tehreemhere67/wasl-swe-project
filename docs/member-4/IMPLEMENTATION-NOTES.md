# Member 4 — Implementation notes (Modules 3 and 6)

**Module 3 — Donor profile, history and reminders:** D-03 `/donor/profile`, D-04 `/donor/history`
**Module 6 — Donation campaigns:** D-05 `/donor/campaigns`, D-06 `/donor/campaigns/[id]`,
O-01 `/organizer/campaigns/new`, O-02 `/organizer/campaigns`, O-03 `/organizer/campaigns/[id]/complete`
(plus one extra screen, `/organizer/campaigns/[id]`, described in section 6)

**Requirements:** FR-DON-02, 03, 04, 05, 06 · FR-CAM-01 … FR-CAM-09 · DR-02, DR-03, DR-05 ·
A-18, A-19, A-21, A-28, A-29, A-30 · FR-VER-03 · NFR-LOC-01/03

Donor sign-up with the one-time passcode (FR-DON-01) is Member 1's work and is untouched.
Donor matching, ranking and the request screens D-01 / D-02 (FR-DON-07 … 13) are Sprint 2 and were not changed.
The administrator's campaign review screen (A-04) is Member 2's; Member 4 only added one line to it (section 7).

## 1. Where the code lives

| Piece | File | What it does |
| --- | --- | --- |
| Donor rules (pure) | `src/lib/donor/rules.ts` | Profile validation, past-donation validation, history summary, reminder maths, who is told about a campaign |
| Campaign rules (pure) | `src/lib/campaigns/rules.ts` | Karachi time helpers, campaign validation, status rules, what donors may see, filters, outcome validation, notice wording |
| Donor data | `src/lib/donor/data.ts` | Reads and writes the donor profile, history, reminder; account deletion |
| Campaign data | `src/lib/campaigns/data.ts` | Lists, create, edit, cancel, outcomes, interest, approval notices, auto-complete |
| Route guards | `src/lib/campaigns/guard.ts` | Same-origin check, then role check (donor, or verified organizer) |
| Display helpers | `src/lib/campaigns/display.ts`, `src/lib/campaigns/labels.ts`, `src/lib/i18n/labels.ts` | Titles by language, status label/colour, label bundles for client forms |
| API routes | `src/app/api/donor/**`, `src/app/api/organizer/**` | See `API.md` |
| Pages | `src/app/donor/{profile,history,campaigns}`, `src/app/organizer/campaigns/**` | The seven wireframe screens plus the organizer detail page |
| Forms | `src/components/forms/*.tsx` | Client forms: profile, history/reminder, campaign, cancel, outcome, interest button |
| Text | `src/lib/i18n/parts/donor.ts`, `organizer.ts` | New English + Urdu keys (same keys and placeholders in both) |
| Database | migration `007_donor_campaign_m4` in `src/lib/db/migrations.ts` | New tables and columns (see `DATA-MODEL.md`) |
| Demo data | `scripts/seed.ts` (`ensureMember4Demo`) | Three demo drives and two history rows; safe to run again |
| Audit | `src/lib/audit.ts` | New action names (see `API.md`, "Audit") |

The decisions (what is allowed, what donors see) are in the two `rules.ts` files and have **no database or
framework code**, so they are covered by fast unit tests. The data files only run SQL.

## 2. Does Member 4 depend on anyone?

* Uses Member 1's foundation: login, sessions, CSRF check, notification centre, SMS adapter, audit log,
  Karachi area list (`settings.karachi_areas`).
* Uses Member 2's administrator approval (`/api/admin/campaigns/decision`). Approval already existed; Member 4
  only calls `notifyDonorsOfApproval` after it (section 7).
* Nobody else depends on Member 4 in Sprint 1.

## 3. Module 3 — rules

* **Profile (FR-DON-02, FR-DON-05, A-18).** Blood group must be one of the eight. Area must be on the
  administrator's Karachi list. At least one contact channel (Platform, SMS or WhatsApp) must stay ticked.
  Language is English or Urdu. Availability is Available / Not available. Saving the language also changes the
  language of the account, so the next page is already in that language.
* **History (FR-DON-03, FR-DON-04, A-19).** A donor adds a past donation with a date and a place. The date
  cannot be in the future (judged by the Karachi calendar day, not UTC) and the place is 2–120 characters. These
  rows are labelled **Self reported**. Rows created by an organizer on the completion form (O-03) are labelled
  **Recorded by org**. The total counts both kinds, newest first.
* **Reminder (FR-DON-06).** "Remind me after N days", N from 1 to 365; leaving it empty turns the reminder
  off. The reminder falls due on *last donation + N days*. It is delivered once for each last donation — when the
  donor next opens the donor area it arrives in the notification centre, and also by SMS if the donor ticked SMS.
  The delivery first "claims" the reminder in the database so two page loads at the same moment cannot send it twice.
  No background job is needed.
* **Delete account (FR-DON-05, DR-05).** Two-step button. The profile and login are anonymised ("Deleted donor",
  a phone value that cannot be used to log in), sessions, notifications and campaign interest are removed. Past
  donation rows stay (they are records of the blood banks and organizers) but lose their link to the donor.
  The deleted person cannot log in again and a signed-in session stops working at once.

## 4. Module 6 — rules

* **Create and save (FR-CAM-01, FR-CAM-02).** The form has the bilingual title and description, date, time,
  venue, target blood group, and — because the SRS requires them — the Karachi area and a contact phone (e-mail
  optional). *Save draft* needs only a title (3+ characters), a real future date and time, a venue (5+ characters)
  and an area. *Submit for approval* additionally needs the Urdu title, an English description (10+ characters) and
  a contact phone. A submitted campaign becomes **Pending Approval**.
* **Time zone.** Dates and times are entered as Karachi time and stored as exact instants.
* **Visibility (FR-CAM-03, FR-CAM-04, FR-VER-03).** Donors see only **Approved** campaigns of **Verified**
  organizers, and only upcoming ones. Draft, Pending (first time), Rejected, Cancelled and Completed campaigns —
  and every campaign of an organization that is no longer Verified — are invisible, including by direct link (404).
* **Discovery (FR-CAM-05).** Filters: Area, From date (on or after), blood Group (a drive for "all groups"
  matches everyone) and a search box (title, venue, area, organizer). The filter form is a plain GET form, so it
  works without JavaScript and the filtered page can be bookmarked.
* **Interest (FR-CAM-07, A-30).** "I plan to attend" can be switched on and off, is not binding, and is counted
  once per donor. The donor sees the number; the organizer sees the list of interested donors.
* **Editing an Approved campaign (FR-CAM-08, A-29).** Changing the date, time, venue, area or either description
  sends the campaign back to **Pending Approval**. The last approved version is saved and **donors keep seeing it**
  until the administrator decides. Changing only the title, contact details or target group is saved immediately.
  A Pending, Rejected, Cancelled or Completed campaign cannot be edited.
* **Cancel (FR-CAM-08).** Draft, Pending and Approved campaigns can be cancelled (two-step button). Interested donors
  receive a notice in both languages. A cancelled campaign disappears from donors.
* **Auto-complete (FR-CAM-08).** An Approved campaign becomes **Completed** after its end time (or the end of its
  Karachi day if no end time was given). This is checked whenever campaigns are read, so no scheduler is needed.
* **Outcomes (FR-CAM-09, FR-DON-04).** Attendees and donations (whole numbers, donations ≤ attendees, and not fewer
  than the donors already recorded). Optionally a donor phone: the donor must be registered; one entry "Recorded by
  org" is added to that donor's history; the same donor cannot be recorded twice for one drive. Available once the
  drive has started; saving marks it Completed.
* **Approval notices (FR-CAM-06, A-21).** When the administrator approves a campaign, each donor is told if: the
  donor is active, has campaign notices on, the blood group is targeted (or the drive is for all groups), and the
  donor's area is within the administrator's distance setting of the venue area (`matching.campaign_notice_distance_km`,
  15 km). The notice is stored in both languages, shows in the donor's language, and is sent only once per campaign.

## 5. Security

* Every route handler: same-origin check (not for GET) → role check → input validation → action → audit entry.
* Donor routes find the donor from the **session**, never from an id in the request: a donor cannot read or change
  another donor.
* Organizer routes always include the **organization id of the session** in the query: an organization cannot read,
  edit, cancel or record outcomes for another organization's campaign (they get 404).
* Unverified organizations are refused (403) and their pages redirect to the status screen.
* Validation error messages are dictionary keys, so they appear in the user's language.
* All SQL uses parameters. Blood-group lists are passed as a parameter and cast, never joined into the SQL text.
* No contact details of donors are shown to organizers (only name, blood group and area of interested donors).

## 6. Judgment calls (things the wireframes do not say)

1. **Target groups** is a single dropdown, as drawn: "All blood groups" or one group. The database and the donor
   filter support several groups, and a campaign that already has several keeps them unless the dropdown is changed.
2. **Cancel campaign** appears on every row of O-02 that can still be cancelled (the wireframe shows one button).
3. **Area, contact phone and availability** were added to the forms because the SRS lists them (FR-CAM-01, FR-DON-02).
4. **Organizer detail page** `/organizer/campaigns/[id]` — the wireframes go from O-02 straight to O-03, but
   editing (FR-CAM-08) and "the list of interested donors" (FR-CAM-07) need a place. It is reached by clicking a
   campaign that is not yet running; a running or completed Approved campaign opens O-03 as in the wireframe, with a
   link back to the detail page.
5. **Reminders and auto-complete are "lazy"** — done when a screen is opened — so the app needs no background job.
6. **Wireframe labels** are kept exactly ("Self reported", "Recorded by org", "I plan to attend", "Remind me after N days").
7. **Delete without confirmation returns 403** (not 400) to keep it consistent with other forbidden actions.

## 7. Files outside Member 4's area that were touched

| File | Change | Why |
| --- | --- | --- |
| `src/app/api/admin/campaigns/decision/route.ts` | +1 import, +6 lines after approval | Tell the right donors (FR-CAM-06). Wrapped in try/catch: a failure never blocks the decision |
| `src/lib/db/migrations.ts` | One new migration appended | New tables/columns. Existing migrations untouched |
| `src/lib/audit.ts` | Nine new action names | Audit entries |
| `src/app/donor/layout.tsx` | Calls the reminder delivery in try/catch | FR-DON-06 |
| `scripts/seed.ts` | New idempotent function | Demo data |
| `src/lib/i18n/parts/donor.ts`, `organizer.ts` | Placeholder/sample keys removed, real keys added | Same module-owned files |

No foundation file (`auth/**`, `validation.ts`, `csrf.ts`, `format.ts`, `db/index.ts`, `i18n/index.ts`,
`components/ui/**`, `components/shell/**`, `app/layout.tsx`) was edited.

## 8. Known limits

* WhatsApp is stored as a preference only; no WhatsApp provider exists in Sprint 1 (SMS uses the existing adapter / dev outbox).
* The 12-month retention clean-up in DR-05 is a release task.
* Visual checks of the Urdu (right-to-left) layout and the phone-width layout need a person with a browser
  (see `tests/member-4/MANUAL-TEST-CASES.md`).
