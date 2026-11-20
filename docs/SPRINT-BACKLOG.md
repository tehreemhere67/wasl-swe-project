# Wasl — Sprint 1 Backlog

**Sprint:** Sprint 1 (two-week sprint) · **Sprint 2:** the following two-week sprint · **Final demo:** end of Sprint 2

**Sprint goal:** deliver the verified account foundation and the first working version of every Sprint 1 module: organization verification, donor profiles, blood-bank inventory with expiry and low-stock alerts, hospital blood-availability search, and donation campaigns — usable in English and Urdu.

---

## 1. Team, modules and responsibilities

| Member | Modules | Responsibility |
| --- | --- | --- |
| **Member 1** | Module 1 + Module 9 | Login, signup, OTP, forgot password, role-based access, common layout, English/Urdu support. |
| **Member 2** | Module 2 + Module 8 | Organization registration, document submission, approval/rejection, verification status, account management. |
| **Member 3** | Module 4 + Module 7 | Add/update batches, inventory movements, expiry tracking, low-stock alerts. |
| **Member 4** | Module 3 + Module 6 | Donor registration, profiles, availability, donation history, preferences and reminders; create campaigns, campaign approval and donor interest. |
| **Member 5** | Module 5 | Search available blood across banks and display results. |

## 2. Scope: what belongs to Sprint 1 and what is reserved for Sprint 2

### Included in Sprint 1

1. Authentication and account management.
2. Organization registration and administrator verification.
3. Donor registration and profile management.
4. Blood bank inventory management.
5. Hospital blood availability search.
6. Donation campaign management.
7. Expiry and low-stock monitoring.
8. Basic language and interface support.
9. Basic administrator account and verification functionality.

### Reserved for Sprint 2

10. Hospital blood request creation and management.
11. Broadcasting blood requests to relevant blood banks.
12. Blood-bank offers and responses to requests.
13. Donor matching and request-response coordination.
14. Request-related notification workflows.
15. Consolidated administrator inventory dashboard.
16. Administrator reports and broader platform oversight.

**Note on campaign notifications:** campaign notifications and donor campaign interest are part of the campaign module and stay in Sprint 1, because the full campaign workflow is delivered in Sprint 1. Only **request-related** notifications and donor matching/response are reserved for Sprint 2.

### Group deliverable (all members)

**User Manual** for end users, covering the features delivered in the current sprint. It is written by the whole group after all Sprint 1 module work is complete, so it is not part of any single member's cards; it appears on the board as one card under All members.

---

## 3. Complete module breakdown

Every module below states its owner and its Sprint 1 scope. Items marked Sprint 2 are listed so the module boundary is clear — they are not part of this sprint.

### Module 1 — Authentication and Account Management (Member 1)

*Sprint 1 status: Sprint 1 — delivered*

- **1.1 Login.** Common login page; validate registered credentials; identify the user's role; redirect to the correct interface; prevent access to other roles' features.
- **1.2 Registration options.** Landing page offers Register as organization and Register as donor. Organization registration lets the user choose Hospital, Blood bank or Donation organization.
- **1.3 Password management.** Password creation during registration, password validation, forgot password, reset through a secure verification process, password confirmation when resetting.
- **1.4 OTP verification.** Generate and send an OTP to the donor's registered mobile number; OTP entry screen; validate the code; handle incorrect or expired codes; allow requesting another OTP.
- **1.5 Role-based access.** Hospital, blood bank, donor, campaign organizer and administrator each reach only their own features. Pending and rejected organizations cannot access operational features.
- **1.6 Administrator account.** One administrator account created by seeding, credentials stored securely, no public administrator registration, access to organization verification and administrative functions.

### Module 2 — Organization Registration and Verification (Member 2)

*Sprint 1 status: Sprint 1*

- **2.1 Registration form.** Type (Hospital / Blood bank / Donation organization), organization name, Karachi address, official phone, official email, licence/registration number, representative name, designation, and at least one supporting document.
- **2.2 Registration submission.** Validate all mandatory fields and documents; store the organization; create the organization account; status starts as Pending; operational access is blocked until verification.
- **2.3 Administrator verification interface.** View submitted registrations, organization information and uploaded documents; review pending registrations; approve; reject with a reason.
- **2.4 Verification statuses.** Pending (awaiting review), Verified (allowed to operate), Rejected (rejected by administrator), Suspended (previously verified, temporarily loses access).
- **2.5 Verification history.** Record every administrator decision with date/time and reason; display the current status; allow a rejected organization to apply again.
- **2.6 Verification restrictions.** Pending organizations cannot manage inventory or post requests; rejected organizations have no operational access; suspended organizations lose access; only Verified organizations can operate.
- **2.7 Registration outcome notifications.** Inform organizations when registration is approved or rejected; display the current verification status after login.

### Module 3 — Donor Registration and Profile Management (Member 4)

*Sprint 1 status: Delivered (signup + OTP by Member 1; profile, history and reminders by Member 4)*

- **3.1 Donor registration.** Donor registration form; collect donor name and mobile number; verify the mobile number through OTP; obtain consent for sharing contact information after the donor responds Willing; create the account after verification. Delivered as part of the authentication foundation.
- **3.2 Donor profile.** Name, mobile number, blood group (A+, A-, B+, B-, AB+, AB-, O+, O-), area of Karachi, donation history, availability (Available / Not Available), contact preferences (platform, SMS, WhatsApp), notification preferences (urgent requests, campaigns), preferred language (English / Urdu). View and edit the profile.
- **3.3 Profile management.** View the profile; edit donor information; update blood group and area; change availability; update notification preferences; update preferred language; delete the donor account.
- **3.4 Donation history.** Allow donors to add previous donations; record donation date and place; label these entries Self-reported; display the donation history and the total number of recorded donations.
- **3.5 Personal donation reminders.** Allow donors to set an optional reminder for a chosen number of days after their last donation.

### Module 4 — Blood Bank Inventory Management (Member 3)

*Sprint 1 status: Sprint 1 (full reservation workflow follows with Sprint 2 request offers)*

- **4.1 Add inventory.** Add inventory batches with blood group, blood component (whole blood, red blood cells, platelets, plasma), quantity in units, testing status (awaiting testing, approved, rejected) and expiry date.
- **4.2 View inventory.** Display all batches belonging to the blood bank with blood group, component, available quantity, reserved quantity, testing/approval status and expiry dates.
- **4.3 Update inventory.** Edit batch information, correct quantities, update testing status and approval status, and record the change in the inventory movement history.
- **4.4 Remove or reduce inventory.** Record units issued to hospitals, discarded units, expired units and corrections to incorrect entries. Keep the history of all changes rather than permanently deleting records.
- **4.5 Inventory movement history.** Every movement records type, quantity, date and time, the user responsible, and the related request or receiving blood bank. Types: Added, Reserved, Reservation released, Issued, Transferred out, Expired, Discarded, Correction.
- **4.6 Inventory reservations.** The inventory system must support reservations. The full reservation workflow is implemented with Sprint 2 request offers; the default reservation hold period is six hours. Sprint 1 delivers the data model and rules; Sprint 2 completes the workflow.
- **4.7 Inventory transfers.** Allow a blood bank to record units transferred out to another verified blood bank and reduce its inventory; the receiving blood bank records its own incoming batch. Wasl never moves stock automatically.
- **4.8 Inventory availability rules.** Only inventory that is Approved, not reserved, not expired and belonging to a Verified blood bank counts as available.

### Module 5 — Hospital Blood Availability Search (Member 5)

*Sprint 1 status: Sprint 1 (creating a request from the empty state is Sprint 2)*

- **5.1 Search blood availability.** Allow hospital staff to search using blood group and blood component.
- **5.2 Search results.** For each matching blood bank show bank name, verification status, available quantity, earliest expiry date, area, contact information and last inventory update time.
- **5.3 Search restrictions.** Only verified hospitals can search; only verified blood banks appear; expired, unapproved and reserved stock is excluded; donors and the general public cannot view blood-bank inventory.
- **5.4 Availability disclaimer.** Display the statement that availability is reported by the blood bank and must be confirmed directly with it.
- **5.5 No results.** When no matching stock is found, display an appropriate message and offer the option to create a blood request (request creation itself is Sprint 2).

### Module 6 — Donation Campaign Management (Member 4)

*Sprint 1 status: Delivered*

- **6.1 Create campaigns.** Campaign title, description, date, time, Karachi venue address, target blood groups (or all) and contact details.
- **6.2 Campaign submission.** Save campaigns as Draft; allow the organizer to submit a campaign for approval, which changes the status to Pending Approval.
- **6.3 Administrator campaign approval.** Administrator views submitted campaigns, reviews details, approves, rejects with a reason, or returns the campaign for changes.
- **6.4 Campaign visibility.** Only approved campaigns are visible to donors; show the organizer name and verification status; pending or rejected campaigns never appear in public listings.
- **6.5 Campaign discovery.** Donors browse upcoming campaigns, search them, and filter by area, date and blood group.
- **6.6 Donor campaign interest.** Allow donors to select I plan to attend; display the number of interested donors and show the list to the campaign organizer. Interest is non-binding.
- **6.7 Campaign management.** Organizers can cancel campaigns and interested donors are notified; campaigns are automatically marked Completed after their end date; changing the date, time, venue or description of an approved campaign requires administrator re-approval.
- **6.8 Campaign outcomes.** Allow organizers to record attendance numbers, total donations and donations made by registered donors, and update the donor's donation history.
- **6.9 Campaign notifications.** Notify relevant donors when a campaign is approved, respecting donor notification preferences, preferred language, and the documented area and target blood-group matching rules. Campaign notifications stay in Sprint 1.

### Module 7 — Expiry and Low-Stock Monitoring (Member 3)

*Sprint 1 status: Sprint 1*

- **7.1 Expiry monitoring.** Monitor inventory expiry dates, identify batches approaching expiry and alert blood-bank staff. Warning periods: platelets 2 days, whole blood 7 days, red blood cells 7 days, plasma 30 days.
- **7.2 Expired inventory.** Automatically mark batches as Expired when their expiry date and time pass; record an Expired movement; remove expired units from available stock and from hospital searches.
- **7.3 Low-stock monitoring.** Allow blood banks to set low-stock thresholds for each blood group and component; default threshold is 5 units; alert when stock reaches or falls below the threshold.
- **7.4 Alert display.** Show alerts on the blood-bank dashboard and in the notification centre with blood group, component, quantity, expiry date and batch link; allow staff to acknowledge alerts and prevent repeated alerts.
- **7.5 Optional SMS alerts.** Send SMS alerts if the blood bank enables this option and the messaging integration is available.
- **7.6 Monitoring frequency.** Evaluate expiry and low-stock conditions at least once every hour and re-evaluate within one minute of an inventory change.

### Module 8 — Basic Administrator Functionality (Member 2)

*Sprint 1 status: Sprint 1 foundation (consolidated dashboard and reports are Sprint 2)*

- **8.1 Organization management.** View organization registrations, search organizations, view details, approve and reject registrations, suspend and reinstate organizations, view verification history.
- **8.2 Campaign management.** View submitted campaigns, approve campaigns, reject campaigns, return campaigns for changes.
- **8.3 Basic inventory visibility.** Allow the administrator to view recorded inventory information, identify which blood bank owns each batch, and view inventory status and quantities. This is a basic view, not the consolidated inventory dashboard (Sprint 2).
- **8.4 Account management.** View registered users, view organization accounts, deactivate and reactivate accounts.
- **8.5 Access restrictions.** Administrators can view and manage platform information according to their permissions, but must not arbitrarily modify another blood bank's inventory.

### Module 9 — Common Interface and Language Support (Member 1)

*Sprint 1 status: Sprint 1 foundation delivered; translation/integration support continues while other modules land*

- **9.1 English and Urdu.** Provide the English interface and the Urdu interface, with right-to-left text direction for Urdu; labels, buttons, messages and navigation change with the selected language.
- **9.2 Role-specific interfaces.** Interfaces for hospitals, blood banks, donors, campaign organizers and administrators.
- **9.3 Navigation.** Role-specific navigation, logout, account information, organization verification status where relevant, and notification access where implemented.
- **9.4 Responsive design.** Support desktop browsers, mobile browsers and tablet screens.
- **9.5 Common validation and error handling.** Required-field validation, invalid input messages, authentication errors, upload errors, OTP errors, unauthorized access messages and success confirmations.

---

## 4. Cards per member

Every card comes from the module breakdown in section 3: **one card per numbered sub-item** of the modules a member owns, **plus one tests card and one documentation card** per member. Member 1 also has the donor-registration card (3.1), which was delivered with the authentication foundation. There is one **group-level card** for the User Manual, which the whole group writes after all Sprint 1 work is complete.

| Member | To Do | In Progress | Done | Total |
| --- | ---: | ---: | ---: | ---: |
| Member 1 | 0 | 0 | 14 | 14 |
| Member 2 | 14 | 0 | 0 | 14 |
| Member 3 | 16 | 0 | 0 | 16 |
| Member 4 | 0 | 0 | 15 | 15 |
| Member 5 | 0 | 0 | 13 | 13 |
| All members | 1 | 0 | 0 | 1 |
| **Total** | **31** | **0** | **42** | **73** |

> Member 1's part is complete: all of their cards are in the **Done** list and they have no remaining To Do or In Progress work.

## 5. Board: To Do

The remaining Sprint 1 work, grouped by member, plus the group-level User Manual card.

### Member 2

- [ ] Module 2 — 2.1 Registration form
- [ ] Module 2 — 2.2 Registration submission
- [ ] Module 2 — 2.3 Administrator verification interface
- [ ] Module 2 — 2.4 Verification statuses
- [ ] Module 2 — 2.5 Verification history
- [ ] Module 2 — 2.6 Verification restrictions
- [ ] Module 2 — 2.7 Registration outcome notifications
- [ ] Module 8 — 8.1 Organization management
- [ ] Module 8 — 8.2 Campaign management
- [ ] Module 8 — 8.3 Basic inventory visibility
- [ ] Module 8 — 8.4 Account management
- [ ] Module 8 — 8.5 Access restrictions
- [ ] Tests and results for Modules 2 and 8
- [ ] Documentation update for Modules 2 and 8

### Member 3

- [x] Module 4 — 4.1 Add inventory
- [x] Module 4 — 4.2 View inventory
- [x] Module 4 — 4.3 Update inventory
- [x] Module 4 — 4.4 Remove or reduce inventory
- [x] Module 4 — 4.5 Inventory movement history
- [x] Module 4 — 4.6 Inventory reservations
- [x] Module 4 — 4.7 Inventory transfers
- [x] Module 4 — 4.8 Inventory availability rules
- [x] Module 7 — 7.1 Expiry monitoring
- [x] Module 7 — 7.2 Expired inventory
- [x] Module 7 — 7.3 Low-stock monitoring
- [x] Module 7 — 7.4 Alert display
- [x] Module 7 — 7.5 Optional SMS alerts
- [x] Module 7 — 7.6 Monitoring frequency
- [x] Tests and results for Modules 4 and 7
- [x] Documentation update for Modules 4 and 7

### Member 4

- [x] Module 3 — 3.2 Donor profile
- [x] Module 3 — 3.3 Profile management
- [x] Module 3 — 3.4 Donation history
- [x] Module 3 — 3.5 Personal donation reminders
- [x] Module 6 — 6.1 Create campaigns
- [x] Module 6 — 6.2 Campaign submission
- [x] Module 6 — 6.3 Administrator campaign approval
- [x] Module 6 — 6.4 Campaign visibility
- [x] Module 6 — 6.5 Campaign discovery
- [x] Module 6 — 6.6 Donor campaign interest
- [x] Module 6 — 6.7 Campaign management
- [x] Module 6 — 6.8 Campaign outcomes
- [x] Module 6 — 6.9 Campaign notifications
- [x] Tests and results for Modules 3 and 6
- [x] Documentation update for Modules 3 and 6

### Member 5

- [x] Module 5 — 5.1 Form validation and hospital-only access guard
- [x] Module 5 — 5.1 Hospital availability search form (blood group and component)
- [x] Module 5 — 5.2 Results grouped per blood bank and sorted by quantity
- [x] Module 5 — 5.2 Results: available quantity, earliest expiry and last updated time
- [x] Module 5 — 5.2 Results: bank name, verification badge, area and contact details
- [x] Module 5 — 5.3 Donors and the general public cannot view inventory
- [x] Module 5 — 5.3 Exclusions: expired and unapproved stock
- [x] Module 5 — 5.3 Exclusions: reserved stock and suspended/unverified banks
- [x] Module 5 — 5.4 Availability disclaimer
- [x] Module 5 — 5.5 No-results message and create-request option
- [x] Module 5 — Availability query against Member 3's inventory tables
- [ ] Tests and results for Module 5
- [ ] Documentation update for Module 5

### All members

- [ ] User Manual for end users covering the Sprint 1 features (write after all Sprint 1 work is complete)

## 6. Board: In Progress

No cards are in progress at this point. Member 1's delivery is complete; the remaining Sprint 1 work is in the To Do list above.

## 7. Board: Done

Member 1's complete Sprint 1 delivery.

- [x] **Member 1** — Module 1 — 1.1 Login
- [x] **Member 1** — Module 1 — 1.2 Registration options
- [x] **Member 1** — Module 1 — 1.3 Password management
- [x] **Member 1** — Module 1 — 1.4 OTP verification
- [x] **Member 1** — Module 1 — 1.5 Role-based access
- [x] **Member 1** — Module 1 — 1.6 Administrator account
- [x] **Member 1** — Module 3 — 3.1 Donor registration (delivered with the authentication foundation)
- [x] **Member 1** — Module 9 — 9.1 English and Urdu
- [x] **Member 1** — Module 9 — 9.2 Role-specific interfaces
- [x] **Member 1** — Module 9 — 9.3 Navigation
- [x] **Member 1** — Module 9 — 9.4 Responsive design
- [x] **Member 1** — Module 9 — 9.5 Common validation and error handling
- [x] **Member 1** — Tests and results for Modules 1 and 9 (157 unit tests, 29 API lifecycle checks, 65 manual cases)
- [x] **Member 1** — Documentation for Modules 1 and 9 (README, architecture, traceability, wireframe map, handoff)

---

## 8. Trello board

The board is generated from sections 5–7 and lives in **`docs/trello-board.json`**: three lists — **To Do**, **In Progress** (empty) and **Done** — with one card per task above, prefixed with the responsible member. Import that single file into Trello; no other setup is required.

