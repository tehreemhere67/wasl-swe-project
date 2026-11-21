# Member 2 — Manual test cases (Modules 2 + 8)

Manual/end-to-end verification for the administrator features delivered by Member 2: the verification
queue (A-02), account management (A-03), campaign review (A-04) and their access rules. Automated
coverage for the pure rules lives in [`admin.test.ts`](admin.test.ts).

**Total:** 16 cases — **16 Pass**. Executed against the running app on 21 November 2026.

## How to reproduce

```powershell
pnpm db:seed
pnpm dev                 # leave running, open http://localhost:3000
pnpm test                # includes Member 2's 32 admin tests
```

Log in as `admin@wasl.pk` / `WaslAdmin#2026` for A-02/A-03/A-04. Screenshots: `docs/screenshots/07-A-02-admin-verification-queue.png`, `08-A-03-admin-accounts.png`, `09-A-04-campaign-review.png`.

## A. Verification queue (A-02)

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M2-001 | FR-VER-02 | Open `/admin/verifications` as the administrator. | Pending registrations are listed with type, waiting time and document count; selecting one shows its details, documents and history. | Pass | Screenshot 07; page `src/app/admin/verifications/page.tsx` |
| TC-M2-002 | FR-VER-02 | Search/filter the queue by organisation name or type. | The list narrows to matching registrations; clearing the search restores all. | Pass | Screenshot 07; `normalizeQuery` / `matchesAccountQuery` tests |
| TC-M2-003 | FR-VER-02, FR-VER-06 | Approve a pending organisation. | Status becomes Verified; a decision row (admin, date, time) is written; the applicant is notified and can use its operational features. | Pass | Screenshot 07; `src/app/api/admin/verify/route.ts` |
| TC-M2-004 | FR-VER-02 | Reject an organisation with a reason; then try rejecting without one. | Rejection requires a reason, stores it and shows it to the applicant; an empty reason is refused. | Pass | Screenshot 07; verification route validation |
| TC-M2-005 | FR-VER-04 | Suspend a verified organisation with a reason, then reinstate it. | Suspension blocks the organisation's operational screens immediately; reinstating restores access; both decisions are in the history. | Pass | Screenshot 07; verification history |
| TC-M2-006 | DR-04 | As the administrator open a supporting document, then try the same URL as another organisation. | Administrator and the submitting organisation can open it; anyone else is refused (403). | Pass | `src/app/api/documents/[id]/route.ts` |

## B. Account management (A-03)

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M2-007 | FR-ADM-02 | Open `/admin/accounts` and search by name, email, phone or organisation. | Matching user and organisation accounts are listed with role and status. | Pass | Screenshot 08; `matchesAccountQuery` tests |
| TC-M2-008 | FR-ADM-02 | Deactivate a user account, then try to log in with it. | Status becomes Deactivated and login is refused for that account. | Pass | `canChangeAccountStatus` tests; login route |
| TC-M2-009 | FR-ADM-02 | Reactivate a deactivated user and log in. | The account becomes Active and can log in again. | Pass | `canChangeAccountStatus` tests |
| TC-M2-010 | FR-ADM-02 | Try to deactivate your own account, then the last active administrator. | Both are refused; the platform always keeps an active administrator. | Pass | `canChangeAccountStatus` tests |
| TC-M2-011 | FR-ADM-05 | Perform deactivate/reactivate actions and inspect the audit log. | Every change is recorded with actor, action, target and time. | Pass | `src/lib/audit.ts`; admin account route |

## C. Campaign review (A-04)

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M2-012 | FR-CAM-02 | Open `/admin/campaigns`. | Campaigns awaiting approval are listed with title, organiser, date/venue and target groups. | Pass | Screenshot 09; campaign review page |
| TC-M2-013 | FR-CAM-02 | Approve a submitted campaign. | Status becomes Approved; the organiser is notified and donors can see the campaign. | Pass | `campaign decision mapping` tests |
| TC-M2-014 | FR-CAM-02 | Return a campaign for changes, then reject another with a reason. | Return sets the campaign back to Draft; rejection requires and stores a reason; both notify the organiser. | Pass | `validateCampaignDecision` tests |
| TC-M2-015 | FR-CAM-02 | Try to review a campaign that is not Pending Approval. | Refused (409); only Pending Approval campaigns are reviewable. | Pass | `validateCampaignDecision` / mapping tests |

## D. Access control

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M2-016 | FR-ADM-01 | As a hospital, blood bank or donor, open `/admin/accounts`, `/admin/verifications`, `/admin/campaigns` and call their APIs. | Every page redirects to the user's own area and every API returns 403. | Pass | Route guards; `requireAdmin`; screenshots of role areas |

## Not covered here

- Time-based states and notifications delivery (SMS) follow the shared auth/notification modules.
- Members 1, 3, 4 and 5 own the manual cases for authentication, inventory, donors/campaigns and search.
