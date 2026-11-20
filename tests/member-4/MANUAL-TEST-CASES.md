# Member 4 — Test cases (Modules 3 and 6)

Automated coverage: `tests/member-4/unit/*.test.ts` (83 tests) and `scripts/verify-campaigns.mjs` (113 live HTTP checks).
Status **Pass** = executed on 20 Nov 2026 against the local app (HTTP/HTML responses and database). Cases marked
**To confirm in browser** need a person to look at the screen (layout, Urdu, phone width, taps).

Setup: `pnpm db:reset && pnpm db:seed && pnpm dev`
Accounts (password `WaslDemo#2026`): donor `+923009876543` · organizer `organizer@demo.wasl` · administrator `admin@wasl.pk` / `WaslAdmin#2026`.

## D-03 Profile

| ID | Requirement | Steps | Expected | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M4-001 | FR-DON-02 | Donor opens Profile | Blood group, area, availability, SMS / WhatsApp / Platform, Urgent / Campaign notices, language, Save, Delete account; no grey wireframe box | Pass | verify-campaigns |
| TC-M4-002 | FR-DON-02 | Choose blood group "—"/ send an unknown group | "Choose your blood group." / 400 | Pass | verify, unit |
| TC-M4-003 | A-18 | Send an area not on the Karachi list | 400, not saved | Pass | verify, unit |
| TC-M4-004 | FR-DON-02 | Untick all three channels, Save | "Keep at least one way of being contacted selected." | Pass | verify, unit |
| TC-M4-005 | FR-DON-05 | Change area, WhatsApp and campaign notices, Save, reload | New values shown | Pass | verify |
| TC-M4-006 | FR-DON-05 | Change language to اردو, Save | Page reloads in Urdu, right-to-left | To confirm in browser | key parity unit tests |
| TC-M4-007 | FR-DON-05, DR-05 | Delete account → confirm | Logged out; login refused; old session returns 401 (history rows are kept without a donor link, by the database rule) | Pass | verify `--destructive` |
| TC-M4-008 | FR-DON-05 | Delete request without confirmation | Refused (403) | Pass | verify `--destructive` |

## D-04 History and reminder

| ID | Requirement | Steps | Expected | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M4-009 | FR-DON-03 | Open History (seeded donor) | "Donations (total 2)", one Self reported and one Recorded by org row, newest first | Pass | verify |
| TC-M4-010 | FR-DON-03 | + Add past donation, a past date and a place, Save | Row labelled Self reported; total +1 | Pass | verify |
| TC-M4-011 | FR-DON-03 | Add with tomorrow's date | "The date cannot be in the future." | Pass | verify, unit |
| TC-M4-012 | FR-DON-03 | Add with a missing place / impossible date (30 Feb) | Validation messages | Pass | verify, unit |
| TC-M4-013 | FR-DON-06 | Enter 90 and Save | Saved; "Next reminder: <date>" shown | Pass | verify |
| TC-M4-014 | FR-DON-06 | Enter 0, 500, "abc" | Rejected | Pass | verify, unit |
| TC-M4-015 | FR-DON-06 | Clear the box and Save | Reminder off | Pass | verify |
| TC-M4-016 | FR-DON-06 | Set 1 day when the last donation is older, open the donor home | A reminder appears once in Notifications | Pass | verify, unit (due/once rules) |
| TC-M4-017 | A-19 | Compare totals before/after an organizer records a donation | Total counts both kinds | Pass | verify |

## O-01 / O-02 Create and manage campaigns

| ID | Requirement | Steps | Expected | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M4-018 | FR-CAM-01 | Organizer opens Create campaign | Bilingual title and description, date, time, venue, target groups, Save draft, Submit for approval | Pass | verify |
| TC-M4-019 | FR-CAM-01 | Submit with empty title / past date / unknown area / bad time | Messages under the fields; nothing saved | Pass | verify, unit |
| TC-M4-020 | FR-CAM-02 | Save draft | Status Draft; donors cannot see it (list and direct link → 404) | Pass | verify |
| TC-M4-021 | FR-CAM-02 | Submit for approval | Status Pending approval; donors still cannot see it | Pass | verify |
| TC-M4-022 | FR-CAM-02 | Edit a Pending campaign | Refused | Pass | verify |
| TC-M4-023 | FR-CAM-03/04 | Administrator approves | Campaign appears for donors, organizer shown with Verified mark | Pass | verify |
| TC-M4-024 | FR-CAM-06 | After approval, check the nearby donor of a targeted group | Notification "New donation campaign" (once) | Pass | verify, unit |
| TC-M4-025 | FR-CAM-06 | Donor turns off campaign notices / is another group / is far away | No notice | Pass | unit |
| TC-M4-026 | A-29 | Edit an Approved campaign's venue | Becomes Pending approval; donors still see the old venue | Pass | verify |
| TC-M4-027 | A-29 | Administrator re-approves | New venue shown | Pass | verify |
| TC-M4-028 | A-29 | Edit only the contact phone | Stays Approved | Pass | verify |
| TC-M4-029 | FR-CAM-08 | Cancel campaign (two-step) | Status Cancelled; hidden from donors | Pass | verify |
| TC-M4-030 | FR-CAM-08 | Interested donor checks Notifications | "Campaign cancelled" notice | Pass | verify |
| TC-M4-031 | FR-CAM-08 | Cancel again | Refused | Pass | verify |
| TC-M4-032 | O-02 | Open My campaigns | One row per campaign with a status badge, Cancel campaign where allowed | Pass | verify |
| TC-M4-033 | FR-CAM-08 | Wait past the drive's end time | Approved becomes Completed | Pass | unit (end-of-day / end-time rules) |

## D-05 / D-06 Browse, detail, interest

| ID | Requirement | Steps | Expected | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M4-034 | FR-CAM-03 | Donor opens Campaigns | "Drive - Univ." and "Drive - Mosque" cards with dates and Verified mark | Pass | verify |
| TC-M4-035 | FR-CAM-05 | Filter by Area | Only that area | Pass | verify |
| TC-M4-036 | FR-CAM-05 | Filter by Group (A+ / O-) | A drive for all groups matches everyone; a drive for O- only matches O- | Pass | verify, unit |
| TC-M4-037 | FR-CAM-05 | Filter by From date | Only on/after | Pass | verify |
| TC-M4-038 | FR-CAM-05 | Search for a word of the title | One result | Pass | verify |
| TC-M4-039 | FR-CAM-05 | Search for nonsense | "No upcoming campaigns match." with a hint | Pass | verify |
| TC-M4-040 | FR-CAM-03 | Open a campaign card | Title, date/time, venue, target, organizer, description, contact, "I plan to attend" | Pass | verify |
| TC-M4-041 | FR-CAM-07 | Press I plan to attend | Button changes, count 1; pressing again withdraws | Pass | verify |
| TC-M4-042 | FR-CAM-07 | Organizer opens the campaign detail | Interested donors listed (name, blood group, area) | Pass | verify |
| TC-M4-043 | FR-CAM-07 | Organizer account calls the interest route | Refused (403) | Pass | verify |

## O-03 Outcomes

| ID | Requirement | Steps | Expected | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M4-044 | FR-CAM-09 | Open the form of a drive that has not started | "Outcomes can be entered once the campaign has started." | Pass | verify |
| TC-M4-045 | FR-CAM-09 | Open the form of a running drive ("Drive - Library") | Title "… completed", Attendees, Donations, donor phone, Save | Pass | verify |
| TC-M4-046 | FR-CAM-09 | Attendees "x" / donations > attendees / bad phone / unregistered phone | Validation messages | Pass | verify, unit |
| TC-M4-047 | FR-DON-04 | Save with the demo donor's phone | Saved; donor's history gets a Recorded by org entry | Pass | verify |
| TC-M4-048 | FR-DON-04 | Record the same donor again | Refused | Pass | verify |
| TC-M4-049 | FR-CAM-09 | Save counts only | Campaign Completed with the counts | Pass | verify |

## Access, security, language, regression

| ID | Requirement | Steps | Expected | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M4-050 | A-12 / roles | Anonymous, hospital, organizer or bank call donor routes; donor/hospital call organizer routes | 401 / 403 | Pass | verify |
| TC-M4-051 | FR-VER-03 | Pending organization opens organizer pages or routes | Refused / sent to status | Pass | verify |
| TC-M4-052 | NFR-SEC | Write from another origin | 403 | Pass | verify |
| TC-M4-053 | Isolation | Another organization requests or cancels my campaign | 404 / 403 | Pass | verify |
| TC-M4-054 | NFR-LOC-01 | Switch to اردو and open Campaigns, Profile, History, Create campaign | Urdu text, right-to-left; titles use the Urdu title | To confirm in browser | unit (key parity), verify (Urdu text present) |
| TC-M4-055 | NFR-USE | Open every screen at phone width (F12 → device toolbar) | Fields stack, buttons full width, nothing cut off | To confirm in browser | — |
| TC-M4-056 | No placeholders | Open all seven screens | No grey "Wireframe D-0x / O-0x" box | Pass | verify |
| TC-M4-057 | Regression | `pnpm test`, `pnpm typecheck`, `pnpm build`, `verify-inventory.mjs`, `verify-search.mjs`, `verify-api-lifecycle.mjs` | All earlier tests still pass | Pass | results/ |
