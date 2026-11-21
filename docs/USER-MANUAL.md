# Wasl — User Manual (Sprint 1)

Wasl connects blood donors, hospitals, blood banks and campaign organizers in Karachi.
This manual explains every screen that is working in **Sprint 1**. Screens planned for Sprint 2
(hospital blood requests, donor matching and responses, the administrator dashboard and reports)
are not part of this manual.

> **Screenshots:** each section ends with a line like *[Screenshot: …]*. Paste the picture there
> (see the list in section 11).

## Contents
1. Getting started
2. Registering
3. Logging in, account status and password reset
4. Everyday features for every user
5. Donor
6. Campaign organizer
7. Hospital
8. Blood bank
9. Administrator
10. Troubleshooting
11. Screenshot checklist

---

## 1. Getting started

**Who uses Wasl**

| You are | You can |
| --- | --- |
| **Donor** | Keep a profile, record your donation history, set a reminder, browse and join campaigns |
| **Hospital** | Search which blood banks have blood available |
| **Blood bank** | Manage blood stock, see alerts, record donations |
| **Donation organization (campaign organizer)** | Create and manage blood-donation campaigns |
| **Administrator** | Verify organizations, manage accounts, review campaigns |

Organizations (hospitals, blood banks, organizers) must be **verified** by the administrator before they can
use any working feature. Donors can use Wasl straight after signing up.

**What you need:** a web browser and an internet connection. Open the Wasl website address your team gives you
(on a test computer: `http://localhost:3000`). Wasl works on a phone or a computer.

**Language:** the **EN ⇄ اردو** button in the top bar switches the whole app between English and Urdu. Urdu
pages read right-to-left. The app remembers your choice.

*[Screenshot: login page (G-01)]*

## 2. Registering

### Donor
1. On the login page choose **Register as donor**.
2. Enter your **Name** and **Mobile** number and press **Send code**.
3. A 6-digit code is sent to your phone. Type it in the code box.
4. Read the consent line (your contact details are shared with a hospital only after you say you are willing)
   and tick **I agree**.
5. Choose a **Password** (at least 8 characters), repeat it, and press **Create account**.
6. Open **Profile** and add your blood group and area (see section 5).

*[Screenshot: donor registration (G-03)]*

### Hospital, blood bank or donation organization
1. On the login page choose **Register organization**.
2. Choose the **Type**: Hospital, Blood bank, or Donation organization (Organiser).
3. Fill in the **Name**, **Address** (in Karachi), **Official mobile**, **Official email**, **Licence no.**,
   **Representative name** and **Designation**.
4. Under **Upload supporting doc** attach your licence or registration paper (PDF, PNG or JPG, up to 5 MB).
5. Choose a **Password**, repeat it, and press **Submit**.
6. You see the **account status** page showing **Pending**. You can use the working features after the
   administrator approves you.

*[Screenshot: organization registration (G-02)]*

## 3. Logging in, account status and password reset

**Log in:** enter your email (organizations) or mobile number (donors) and your password, then press **Log in**.
You land on the home screen of your role.

**Lock-out:** after 5 wrong passwords the account is locked for 15 minutes.

**Account status (organizations):** shown after login until you are verified.

| Status | Meaning | What to do |
| --- | --- | --- |
| Pending | Waiting for the administrator | Wait. You get a notification when decided |
| Rejected | The administrator gave a reason | Correct the details and press **Reapply** |
| Suspended | Temporarily blocked | Contact the Wasl team |
| Verified | Approved | Use your working screens |

The page also lists the **verification history** (decision, date, reason).

**Forgot password:** on the login page choose **Forgot password?**, enter your mobile or email, enter the code you
receive, then choose a new password.

**Log out:** click your circle avatar (top right) and choose **Log out**. Your session also ends after 30 minutes
of no activity.

*[Screenshot: account status (G-04); forgot password]*

## 4. Everyday features for every user

* **Notification bell:** shows the number of unread notices. Open it to read them (verification decisions, stock
  alerts, campaign notices, reminders). Notices are shown in your chosen language.
* **Menu bar:** only shows the screens for your role; you cannot open another role's screens.

*[Screenshot: notification centre (G-05)]*

## 5. Donor

Demo login: `+923009876543` / `WaslDemo#2026`. Full details: `docs/member-4/USER-MANUAL-DONOR.md`.

**Profile** — choose your blood group, area of Karachi and availability; tick how you want to be contacted (SMS,
WhatsApp, Platform; keep at least one) and which notices you want (urgent requests, campaign notices); choose your
language; press **Save**. **Delete account** removes your name and phone permanently after a confirmation.

**History** — shows *Donations (total N)*. Each row is labelled **Self reported** (you added it) or **Recorded by
org** (a blood bank or organizer recorded it). Press **+ Add past donation**, choose the date and place, and save.
Type a number in **Remind me after … days** (1–365) and save to get a reminder after your last donation; empty
turns it off.

**Campaigns** — lists upcoming blood drives by verified organizers. Narrow the list with **Area**, **From date**,
**Group** or the search box. Open a campaign to see its date, venue, target blood group, organizer and contact.
Press **I plan to attend** to show interest (it is not a promise; you can withdraw any time).

*[Screenshots: donor profile (D-03); history (D-04); campaigns (D-05); campaign detail (D-06)]*

## 6. Campaign organizer

Demo login: `organizer@demo.wasl` / `WaslDemo#2026`. Full details: `docs/member-4/USER-MANUAL-ORGANIZER.md`.
Your organization must be Verified.

**Create campaign** — enter the English and Urdu title and description, date, time (Karachi), venue, area, target
blood group (or all) and contact phone. **Save draft** keeps it for later; **Submit for approval** sends it to the
administrator.

**My campaigns** — shows each campaign with its status (Draft, Pending approval, Approved, Rejected, Cancelled,
Completed). Open one to edit it, see the donors who plan to attend, or press **Cancel campaign** (donors who showed
interest are told). Changing the date, time, venue, area or description of an approved campaign sends it back to the
administrator; donors keep seeing the old version until it is approved again.

**Completion form** — after the drive starts, enter **Attendees** and **Donations**, and optionally a **donor's
phone** to add a "Recorded by org" entry to that donor's history. Press **Save**; the campaign becomes Completed.

*[Screenshots: create campaign (O-01); my campaigns (O-02); completion form (O-03)]*

## 7. Hospital

Demo login: `hospital@demo.wasl` / `WaslDemo#2026`. Full details: `docs/member-5/USER-MANUAL-HOSPITAL-SEARCH.md`.

**Search blood** — choose a **Blood group** and a **Component** (Whole blood, Red blood cells, Platelets, Plasma)
and press **Search**. Each blood bank with matching blood shows its name with a Verified mark, the units available,
the earliest expiry, area, phone (tap to call), email and when its stock was last updated. Blood on hold, expired or
still awaiting testing is never counted. **Always confirm availability directly with the blood bank.** If nothing
matches, a message offers to create a blood request (the request screens arrive in Sprint 2).

*[Screenshot: hospital search with results (H-02)]*

## 8. Blood bank

Demo login: `bank@demo.wasl` / `WaslDemo#2026`. Full details: `docs/member-3/USER-MANUAL-BLOOD-BANK.md`.

* **Dashboard** — expiry and low-stock alerts; **Open batch** to act, **Acknowledge** to dismiss for 24 hours.
* **Inventory** — one row per batch with group, component, available and reserved units, status and expiry.
* **Add batch / edit** — group, component, units, testing status (Awaiting testing, Approved, Rejected), expiry date.
* **Record a change** — issued, discarded, expired, transferred to another verified blood bank, or a correction.
* **Settings** — low-stock thresholds and expiry warning periods.
* **Record donation** — enter a donor's phone to add a donation to their history.

*[Screenshots: dashboard (B-01); inventory (B-02); add batch (B-03); batch detail (B-04)]*

## 9. Administrator

Demo login: `admin@wasl.pk` / `WaslAdmin#2026`.

* **Verify organizations** — the queue of registrations, with search, type filter and waiting time. Open one to read
  the details and the uploaded document, then **Approve**, **Reject** (a reason is required), **Suspend** or
  **Reinstate**. The organization is notified and the decision is stored in its history.
* **Accounts** — search donors and organizations; **Deactivate** or **Reactivate** an account (a deactivated person
  cannot log in). You cannot deactivate yourself or the last active administrator.
* **Campaign review** — see submitted campaigns; **Approve**, **Reject** with a reason, or **Return for changes**.
  An approved campaign becomes visible to donors, and nearby donors of the targeted blood groups are notified.

*[Screenshots: verification queue (A-02); accounts (A-03); campaign review (A-04)]*

## 10. Troubleshooting

| Problem | What to do |
| --- | --- |
| "Too many failed attempts" | Wait 15 minutes, then try again |
| I only see the account-status page | Your organization is not Verified yet |
| I cannot see a campaign | It is not approved, was cancelled, has ended, or its organizer is no longer verified |
| The code never arrives | Check the mobile number and press **Resend code** |
| A page says "not found" | The item was removed or you do not own it |
| Text looks wrong in Urdu | Press **EN ⇄ اردو** twice to reload the language |

## 11. Screenshot checklist

Log in as each demo account, switch to English, and take these (add an Urdu one for any two screens):

| Section | Screens |
| --- | --- |
| 1–3 | G-01 login, G-02 organization registration, G-03 donor registration, G-04 account status |
| 4 | G-05 notification centre |
| 5 | D-03 profile, D-04 history, D-05 campaigns, D-06 campaign detail |
| 6 | O-01 create campaign, O-02 my campaigns, O-03 completion form |
| 7 | H-02 search with results |
| 8 | B-01 dashboard, B-02 inventory, B-03 add batch, B-04 batch detail |
| 9 | A-02 verification queue, A-03 accounts, A-04 campaign review |

Tip: on Windows press **Windows + Shift + S**, drag over the screen, and paste into the manual.
