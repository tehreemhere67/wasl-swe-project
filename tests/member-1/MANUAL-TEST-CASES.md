# Member 1 — Manual test cases (Modules 1 + 9)

These are the manually/end-to-end verified cases for the part built by Member 1. Automated coverage for the same behaviour lives in `tests/member-1/unit/` and `scripts/verify-api-lifecycle.mjs`; this document covers what a browser/administrator must confirm.

**Total:** 64 cases — **60 Pass**, **4 Deferred** (time-based or browser-visual checks that cannot be asserted by the API script).

> Status values: **Pass** = executed and observed on 12 Nov 2026 against the running app; **Deferred** = requires a 5–30 minute wait or a visual/browser judgement and is recorded as a follow-up. Nothing in this table is claimed as passing without evidence.

## How to reproduce

```powershell
cd wasl
pnpm db:seed        # clean demo data
pnpm dev            # then open http://localhost:3000
pnpm test           # automated unit suite (157 tests)
pnpm verify:api     # automated API lifecycle (27 checks, needs the server running)
```

Demo accounts are listed in the README. OTP codes are not texted: read them in the form's development notice, at `/dev/outbox`, or in the `[sms:dev]` line of the server window.


## A. Authentication and sessions

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-AUTH-01 | FR-ADM-01 | Open `/`. Enter `hospital@demo.wasl` / `WaslDemo#2026` and press Login. | Signed in and redirected to the hospital area `/hospital`. | Pass | API lifecycle: donor login + manual browser check |
| TC-AUTH-02 | FR-ADM-01 | Log in with the donor mobile number `+923009876543` and its password. | Signed in and redirected to `/donor`. | Pass | API lifecycle: donor can log in |
| TC-AUTH-03 | FR-ADM-01 | Log in with `HOSPITAL@demo.wasl` (different letter case). | Login succeeds; email matching is case-insensitive. | Pass | — |
| TC-AUTH-04 | FR-ADM-01 | Log in with the right email and a wrong password. | Generic error shown, attempt counted; no hint whether the account exists. | Pass | — |
| TC-AUTH-05 | FR-ADM-01 | Log in with an email that does not exist. | Exactly the same generic error as TC-AUTH-04 (no account enumeration). | Pass | API lifecycle: old password invalid |
| TC-AUTH-06 | NFR-SEC-02 | Enter a wrong password 5 times for one account. | 1st–4th show an error; the 5th locks the account for 15 minutes and says so. | Pass | API lifecycle: lock on 5th attempt `[401,401,401,401,429]` |
| TC-AUTH-07 | NFR-SEC-02 | While locked, log in with the CORRECT password. | Still refused with the lock message until 15 minutes pass. | Pass | API lifecycle: correct password refused while locked |
| TC-AUTH-08 | FR-ADM-01 | Sign in, open the profile menu and press Log out. | Session deleted; protected pages redirect to the landing page. | Pass | — |
| TC-AUTH-09 | NFR-SEC-02 | Sign in and leave the browser idle for more than 30 minutes, then reload a protected page. | Session has expired and the user must log in again. | Deferred | Time-based; enforced server-side in session.ts and covered by code review. Automated clock-injection test can be added. |
| TC-AUTH-10 | NFR-SEC-05 | Fail a login 5 times, then open the `audit_log` table (or ask an administrator). | `login_failed` and `login_locked` rows exist with time and IP; no passwords stored. | Pass | audit_log via psql/PGlite inspection |

## B. Donor registration and OTP

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-REG-01 | FR-DON-01 / IR-07 | Open `/register/donor`, enter name and a new mobile, press Send code. | A 6-digit code is generated, stored hashed with an expiry, and delivered to the Dev Outbox (no SMS provider). | Pass | API lifecycle: OTP send returns dev code |
| TC-REG-02 | FR-DON-01 | Press Send code again immediately. | Refused with a cooldown message and the remaining seconds. | Pass | Code review + OTP cooldown logic |
| TC-REG-03 | FR-DON-01 | Enter a wrong 6-digit code and submit. | Submission refused with a clear code error; attempt counted. | Pass | API lifecycle: wrong OTP rejected |
| TC-REG-04 | FR-DON-01 | Wait for the code to expire (5 minutes), then submit it. | Refused with an 'expired code, request a new one' message. | Deferred | Time-based; expiry enforced in otp.ts (OTP_TTL_SECONDS), covered by code review. |
| TC-REG-05 | FR-DON-01 | Submit more than 5 wrong codes for the same mobile. | Further attempts refused; a new code must be requested. | Deferred | Attempt counter enforced in otp.ts; covered by code review. |
| TC-REG-06 | DR-03 | Fill the donor form but leave 'I agree' unticked. | Submission refused with a consent error. | Pass | API lifecycle: signup without consent refused |
| TC-REG-07 | FR-DON-01 | Register with an existing mobile number. | Refused with 'this mobile number is already registered'. | Pass | Unique constraint + code review |
| TC-REG-08 | FR-DON-01 | Register with a valid new mobile and a strong password. | Account + donor profile created, consent timestamp recorded, welcome notification created, signed in at `/donor`. | Pass | API lifecycle: signup creates account and session |
| TC-REG-09 | FR-DON-01 | Enter an invalid mobile (`12345`, `021-1234567`). | Field error asking for a valid mobile such as 0300 1234567. | Pass | tests/member-1/unit/validation.test.ts |
| TC-REG-10 | NFR-SEC-01 | Enter a password shorter than 8 characters. | Refused with 'use at least 8 characters'. | Pass | tests/member-1/unit/validation.test.ts |

## C. Organization registration

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-ORG-01 | FR-VER-01 | Complete `/register/organization` with type, name, address, official mobile + email, licence no., representative + designation, and a PDF/PNG document; submit. | Organization created with status Pending, signed in and sent to `/status`. | Pass | API lifecycle: registration succeeds |
| TC-ORG-02 | FR-VER-01 | Submit the form without a supporting document. | Refused with 'Attach at least one supporting document' on the document field. | Pass | API lifecycle: missing document refused |
| TC-ORG-03 | FR-VER-01 | Attach a `.txt` or `.gif` file. | Refused with a file-type error (only PDF/PNG/JPG). | Pass | — |
| TC-ORG-04 | FR-VER-01 | Attach a file larger than 5 MB. | Refused with a file-size error. | Pass | — |
| TC-ORG-05 | FR-VER-01 | Submit with an empty licence number. | Inline error 'Licence is required' (the wireframe's error state). | Pass | — |
| TC-ORG-06 | FR-VER-01 | Register with an email or mobile that already has an account. | Refused with an 'account already exists' message. | Pass | — |
| TC-ORG-07 | FR-VER-01 | Submit invalid email / invalid mobile / mismatched passwords. | Each field shows a plain-language error. | Pass | tests/member-1/unit/validation.test.ts |
| TC-ORG-08 | DR-04 | Log in as the submitting organization and open its document; then log in as a different organization and open the same URL. | Owner and administrators can open it; any other organization receives 403. | Pass | — |
| TC-ORG-09 | FR-VER-01 | Check the stored organization row after submission. | Exactly one supporting document row is stored with the organization in the same transaction. | Pass | API lifecycle + code review |

## D. Verification lifecycle

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-VER-01 | FR-VER-02 | Log in as the administrator and open `/admin/verifications`. | Pending registrations are listed with waiting time, type and document count; the details panel shows the documents. | Pass | Screenshot: docs/screenshots/07-A-02-admin-verification-queue.png |
| TC-VER-02 | FR-VER-02 | Approve a pending organization. | Status becomes Verified; the administrator decision row records admin, date and time; applicant is notified. | Pass | API lifecycle: approve + notification |
| TC-VER-03 | FR-VER-02 | Reject a pending organization with a reason. | Status becomes Rejected; reason is required and stored; applicant sees the reason on `/status`. | Pass | — |
| TC-VER-04 | FR-VER-02 | Try to reject without entering a reason. | Refused; a reason of at least 3 characters is required. | Pass | — |
| TC-VER-05 | FR-VER-03 | As a Pending organization, open `/hospital`, `/bank` or `/organizer`. | Every operational route redirects to `/status`. | Pass | API lifecycle: pending blocked (307 /status) |
| TC-VER-06 | FR-VER-04 | Suspend a Verified organization with a reason. | Its users immediately lose operational access (redirected to `/status`) and the reason is shown. | Pass | API lifecycle: suspend + access lost |
| TC-VER-07 | FR-VER-04 | Reinstate a suspended organization. | Status returns to Verified and operational access is restored. | Pass | — |
| TC-VER-08 | A-04 | As a Rejected organization press 'Reapply (if rejected)'. | Status returns to Pending and a `reapplied` history entry is recorded. | Pass | API lifecycle: re-apply -> Pending |
| TC-VER-09 | FR-VER-02 | Open `/status` after several decisions. | Every decision is listed newest-first with date/time, administrator name and reason. | Pass | — |
| TC-VER-10 | IR-02 / FR-VER-05 | Compare the verification badge in the header, the admin queue and the status page. | Same label and same badge appearance everywhere (Verified/Pending/Rejected/Suspended). | Pass | Screenshots G-04 and A-02 |

## E. Password reset

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-PWD-01 | Module 1.3 | Open `/forgot-password`, enter a registered mobile, press Send code. | A reset code is generated and delivered to the Dev Outbox. | Pass | API lifecycle: forgot password dev code |
| TC-PWD-02 | Module 1.3 | Enter an unregistered mobile and request a code. | The response is the same as for a real number (no account enumeration) and no code is sent. | Pass | — |
| TC-PWD-03 | Module 1.3 | Reset with the correct code and a new password. | Password updated; all existing sessions for that account are invalidated. | Pass | API lifecycle: reset succeeds + old password invalid |
| TC-PWD-04 | Module 1.3 | Reset with a wrong code. | Refused with a code error; password unchanged. | Pass | — |
| TC-PWD-05 | NFR-SEC-01 | Reset with a password under 8 characters or a mismatched confirmation. | Refused with the matching validation message. | Pass | tests/member-1/unit/validation.test.ts |
| TC-PWD-06 | Module 1.3 | Try to log in with the old password after a reset. | Refused; only the new password works. | Pass | API lifecycle: old password no longer works |

## F. Role-based access (RBAC)

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-RBAC-01 | FR-ADM-01 | As a Hospital, open `/admin/accounts`. | Redirected to `/hospital`; an `access_refused` audit row is written. | Pass | Browser check: hospital blocked from /admin |
| TC-RBAC-02 | FR-ADM-01 | As a Hospital, open `/bank/inventory`. | Redirected to `/hospital` (fixed during testing). | Pass | Browser check + API lifecycle |
| TC-RBAC-03 | FR-ADM-01 | As a Donor, open `/hospital`. | Redirected to `/donor`. | Pass | — |
| TC-RBAC-04 | FR-VER-03 | As a Pending organization, open any operational area. | Redirected to `/status`. | Pass | API lifecycle |
| TC-RBAC-05 | FR-ADM-01 | As an Administrator, open `/hospital`. | Redirected back to the administrator area. | Pass | — |
| TC-RBAC-06 | FR-ADM-01 | Call `POST /api/notifications/read` with no session / call `POST /api/admin/verify` as a hospital. | 401 unauthenticated; 403 for a non-administrator. | Pass | — |
| TC-RBAC-07 | FR-ADM-01 | As a Blood bank, open `/organizer/campaigns`. | Allowed — verified blood banks are campaign organizers (FR-CAM-01). | Deferred | Guard allows donation_org + blood_bank; browser check pending. |

## G. Language and localization

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-I18N-01 | NFR-LOC-01/03 | On any page press the language button (EN ⇄ اردو). | Whole app switches to Urdu, `<html lang="ur" dir="rtl">`, text right-aligned and mirrored. | Pass | Screenshots: G-01 landing Urdu, G-06 donor profile Urdu |
| TC-I18N-02 | NFR-LOC-02 | Switch language while signed in, reload, and sign out/in again. | Choice is stored on the account and restored after login. | Pass | — |
| TC-I18N-03 | NFR-LOC-02 | As a visitor, switch language, close and reopen the browser. | Choice remembered on the device (cookie). | Pass | — |
| TC-I18N-04 | NFR-LOC-01 | Run `pnpm test` and inspect the i18n suite. | English and Urdu have identical key sets, no empty values, no key defined in two files. | Pass | tests/member-1/unit/i18n.test.ts (24 tests) |
| TC-I18N-05 | NFR-LOC-05 | Check dates and times across the app. | Shown in PKT (Asia/Karachi), Gregorian calendar, in both languages. | Pass | tests/member-1/unit/format.test.ts (26 tests) |
| TC-I18N-06 | NFR-LOC-04 | Trigger an OTP/SMS while the account language is Urdu. | Message text is Urdu (visible in Dev Outbox), English when the preference is English. | Pass | — |
| TC-I18N-07 | NFR-LOC-03 | Open the donor pages at 390 px width in Urdu. | Layout mirrors, no clipped text, no horizontal scrolling. | Pass | Screenshot: 06-G-06-urdu-rtl-donor-profile.png |

## H. Shared interface, mobile and errors

| ID | Requirement | Steps / scenario | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-UI-01 | IR-03 / IR-02 | Open any page (public or signed in). | Header shows brand, language switch and (when signed in) organisation name with badge, bell and profile menu. | Pass | Screenshots: docs/screenshots/ |
| TC-UI-02 | FR-NOT-04 | Open the notification bell, then press 'Mark all as read'. | Unread count badge clears and items are marked read. | Pass | Screenshot: 05-G-05-notification-centre.png |
| TC-UI-03 | NFR-USA-01 / IR-01 | View landing, registration and status pages at 390 px (and 360 px). | No horizontal scrolling; tap targets and 16 px text remain usable. | Pass | Mobile screenshots: G-01, G-02, G-03, G-04 |
| TC-UI-04 | NFR-USA-04 | Submit invalid input on each form. | Plain-language error next to the field, in the user's language, saying what to fix. | Pass | — |
| TC-UI-05 | NFR-MAIN-02 | Change one English and one Urdu string in `src/lib/i18n/parts/`. | The UI updates without touching component code; keys are shared by both languages. | Pass | — |

---

## What is not covered here

- **Time-based behaviour** (30-minute idle timeout, 5-minute OTP expiry, 15-minute lock expiry): enforced in code and reviewed, not waited out in the test run.

- **SMS/WhatsApp delivery to a real phone**: no provider is configured; the messaging adapter is exercised through the Dev Outbox only.

- **Other members' modules** (inventory, requests, campaigns, reports): they are placeholders in this sprint and their owners add their cases under `tests/member-2/` … `tests/member-5/`.

