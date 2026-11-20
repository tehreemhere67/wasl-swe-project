# Member 4 — API reference (Modules 3 and 6)

All routes return JSON `{ "ok": true, ... }` on success. Errors:
`400 { errors: [{ field, message }] }` (message is a dictionary key, e.g. `donor.error.dateFuture`),
`401` not signed in, `403` wrong role / unverified organization / cross-origin write / missing confirmation,
`404` not found **or not yours**, `409` not allowed in the campaign's current status.
Every write (POST / PATCH / DELETE) must come from the app's own origin (CSRF rule).

## Donor routes (role = donor)

| Method and path | Body / query | Success | Notes |
| --- | --- | --- | --- |
| `GET /api/donor/profile` | — | `{ profile }` | Own profile only |
| `PATCH /api/donor/profile` | `bloodGroup, area, availability, contactPlatform, contactSms, contactWhatsapp, notifyUrgent, notifyCampaigns, preferredLanguage` | `{ language }` | 400 for bad group/area/language, or no channel |
| `DELETE /api/donor/profile` | `{ "confirm": true }` | `{ redirect: "/" }` | Without `confirm:true` → 403. Anonymises the donor and ends the session |
| `GET /api/donor/history` | — | `{ total, entries[], lastDonationOn }` | Newest first; entries have `source` = `self_reported` or `recorded_by_org` |
| `POST /api/donor/history` | `donatedOn` (YYYY-MM-DD), `place` | `{ id }` | No future dates; place 2–120 characters |
| `PATCH /api/donor/reminder` | `remindDays` ("" = off, else 1–365) | `{ remindDays }` | |
| `GET /api/donor/campaigns` | `area, date, group, q` (all optional) | `{ count, campaigns[] }` | Only upcoming, Approved, verified organizers |
| `POST /api/donor/campaigns/[id]/interest` | `{ "interested": true\|false }` | `{ interested, interestedCount }` | 404 if the campaign is not visible to donors |

## Organizer routes (role = donation_org or blood_bank, organization Verified)

| Method and path | Body | Success | Notes |
| --- | --- | --- | --- |
| `GET /api/organizer/campaigns` | — | `{ campaigns[] }` | Own organization only, with `interestedCount` |
| `POST /api/organizer/campaigns` | form fields + `action` = `save_draft` or `submit` | `{ id, status }` | `status` = `draft` or `pending_approval` |
| `GET /api/organizer/campaigns/[id]` | — | `{ campaign, interested[], recordedDonors }` | 404 for another organization's campaign |
| `PATCH /api/organizer/campaigns/[id]` | same fields + `action` | `{ status, needsApproval }` | Draft or Approved only (else 409). A material change to an Approved campaign → `pending_approval` |
| `POST /api/organizer/campaigns/[id]/cancel` | `{}` | `{ notified }` | 409 if already cancelled/completed/rejected |
| `POST /api/organizer/campaigns/[id]/outcome` | `attendees, donations, donorPhone?` | `{ recorded: "donor" \| "none" }` | 409 `not_ready` before the drive has started |

Campaign form fields: `titleEn, titleUr, descriptionEn, descriptionUr, date (YYYY-MM-DD), time (HH:MM, Karachi), venue, area, targetGroups (list; empty = all groups), contactPhone, contactEmail`.

## Audit

`donor_profile_updated`, `donor_account_deleted`, `donor_donation_added`, `donor_reminder_changed`,
`campaign_created`, `campaign_updated`, `campaign_submitted`, `campaign_cancelled`, `campaign_outcome_recorded`.
(The existing `campaign_approved / rejected / returned` entries are Member 2's.)
