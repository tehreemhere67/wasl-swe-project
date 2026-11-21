# Wasl — Sprint 1 Daily Scrum Minutes

**Project:** Wasl — Blood Donation and Coordination Platform for Karachi
**Sprint:** Sprint 1 · **Dates:** 10 – 21 November 2026
**Team:** Member 1 — Tehreem (Modules 1 + 9), Member 2 (Modules 2 + 8), Member 3 (Modules 4 + 7),
Member 4 (Modules 3 + 6), Member 5 (Module 5)
**Format:** short daily stand-ups of 20–25 minutes. Most days used a quick update on the team chat;
the five meetings below are the ones that were minuted. Durations are approximate.

**Attendance:** all five members attended all five meetings.

| # | Date | Time (PKT) | Duration | Focus |
| --- | --- | --- | --- | --- |
| 1 | Tue, 10 Nov 2026 | 11:00 | ~25 min | Sprint planning and backlog finalisation |
| 2 | Thu, 12 Nov 2026 | 15:00 | ~20 min | Foundation walkthrough and module handover |
| 3 | Mon, 16 Nov 2026 | 12:30 | ~20 min | Progress sync and blockers |
| 4 | Thu, 19 Nov 2026 | 16:00 | ~25 min | Integration review and defect triage |
| 5 | Fri, 21 Nov 2026 | 10:00 | ~20 min | Sprint review and submission preparation |

---

## Meeting 1 — Sprint planning and backlog finalisation

**Tue, 10 Nov 2026 · 11:00 · ~25 min · all five members**

- Reviewed the SRS, proposal and wireframes, and agreed the Sprint 1 scope.
- Member 1 (Tehreem) presented the final backlog: Modules 1–9 broken into numbered sub-items, with
  one card per sub-item and an owner on each card.
- Agreed module ownership: Member 1 — Modules 1 and 9; Member 2 — 2 and 8; Member 3 — 4 and 7;
  Member 4 — 3 and 6; Member 5 — Module 5.
- Agreed the working rules: one feature branch per member, pull request into `main`, shared code
  reviewed by Member 1, and `pnpm test` + `pnpm typecheck` passing before a merge. Wireframes are
  the UI contract.

**Decisions:** the backlog is frozen for the sprint; each member edits only their own module area,
their own translation file and their own tests; the definition of done covers wireframe, English
and Urdu text, guards, validation, tests and evidence.
**Actions:** everyone reviews their cards and starts; Member 1 builds the shared foundation first.
**Blockers:** none.

## Meeting 2 — Foundation walkthrough and module handover

**Thu, 12 Nov 2026 · 15:00 · ~20 min · all five members**

- Member 1 reported the shared foundation complete and demonstrated it running: login, sessions,
  lockout and role-based access; organisation registration with document upload and administrator
  verification; donor signup with OTP and consent; password reset; English/Urdu with RTL; shared
  header, navigation and design system; notification centre; audit log; database migrations, demo
  data and the test suite.
- Explained where each member builds: their role area under `src/app/<area>/`, their keys in
  `src/lib/i18n/parts/<area>.ts`, one new migration entry for their tables, and tests under
  `tests/member-N/`.
- Agreed the migration order: Member 3's inventory tables first (Member 5's search depends on them),
  then Member 4's tables, then Member 2's campaign work.

**Decisions:** shared files are owned by Member 1 and only extended, never rewritten; migrations are
append-only with unique ids; demo data is extended centrally in `scripts/seed.ts`.
**Actions:** Member 1 publishes the handoff notes; Members 3 and 4 start their migrations; Member 5
builds the search page against the agreed columns; Member 2 starts the admin gaps.
**Blockers:** Member 5's live search waits on Member 3's inventory migration.

## Meeting 3 — Progress sync

**Mon, 16 Nov 2026 · 12:30 · ~20 min · all five members**

- Status: Member 2 — account management and campaign review in progress; Member 3 — inventory
  tables added, batch screens and movement history in progress; Member 4 — donor profile/history and
  campaign draft flow in progress; Member 5 — search page and exclusion rules done, waiting for
  inventory data; Member 1 — shared build green and reviewing pull requests.
- Resolved two blockers: merge conflicts in the shared migrations file (append-only entries with
  unique ids) and thin demo data (seed extended with a second blood bank, campaigns and donor
  history).
- Reminded everyone that each new API route keeps the same-origin check, role/verification guard,
  validation and audit record.

**Decisions:** feature branches are rebased on `main` before a pull request; integration day is
19–20 November.
**Actions:** each member finishes their screens and tests; Member 1 keeps `main` building.
**Blockers:** none after the migration and seed decisions.

## Meeting 4 — Integration review and defect triage

**Thu, 19 Nov 2026 · 16:00 · ~25 min · all five members**

- Member branches were merged and the integrated app was run from a clean database.
- Demoed the new flows: inventory (batches, movements, reservations, transfers, archive), expiry and
  low-stock alerts, hospital availability search, donor profile/history/reminders, campaigns
  (draft, approval, discovery, interest, outcomes), and administrator verification, accounts and
  campaign review.
- Fixed defects found in integration: a hospital could open the blood-bank area; translation keys
  colliding on verification-status labels; missing same-origin checks on two POST routes; no profile
  menu/logout on the account-status and notification pages.

**Decisions:** feature freeze — only fixes, tests and documentation from this point; every member
completes their manual cases and saved results.
**Actions:** Member 1 fixes shared code and runs regression; each member finishes test evidence.
**Blockers:** none.

## Meeting 5 — Sprint review and submission preparation

**Fri, 21 Nov 2026 · 10:00 · ~20 min · all five members**

- Confirmed all members' work is merged on `main`, the repository is up to date and the working tree
  is clean.
- Full verification from a clean database: **345 unit tests** (all members), **210 end-to-end API
  checks** (Member 1: 29, Member 3: 38, Member 4: 109, Member 5: 34), `typecheck` clean and the
  production build compiled.
- Confirmed the submission items: sprint backlog, Trello board, these minutes, test cases/scripts,
  test results, Git repository link and the user manual.
- Agreed the demo order: login and language switch → organisation registration and administrator
  verification → donor signup/OTP → inventory and alerts → hospital search → campaigns → admin
  screens.

**Decisions:** the sprint is complete; the backlog and Trello board are moved to all-Done as part of
submission preparation.
**Actions:** Member 1 finalises the board, backlog, README and screenshots and pushes the submission
commit; everyone checks their test evidence and prepares to present their module.
**Blockers:** none.

---

## Blockers and resolutions

| Meeting | Blocker | Resolution |
| --- | --- | --- |
| 2 | Member 5 could not query inventory before Member 3's tables existed | Table/column contract agreed up front; Member 5 built the page and rules first |
| 3 | Merge conflicts in the shared migrations file | Append-only migration entries with unique ids |
| 3 | Demo data too thin for the new screens | Extended `scripts/seed.ts` |
| 4 | Cross-role access and header defects found in integration | Fixed in the shared guards/shell; regression re-run |

*Minutes recorded by Member 1 (Tehreem) and confirmed by the team.*
