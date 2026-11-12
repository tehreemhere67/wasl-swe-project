# Member 4 — tests (Modules 3 + 6)

**Owner:** Member 4 · **Modules:** 3 Donor Registration & Profile Management · 6 Donation Campaign Management
**Screens you own:** D-03, D-04, D-05, D-06, O-01, O-02, O-03 (donor signup itself is already delivered by Member 1)
**Requirements:** FR-DON-02..06, FR-DON-04 (with Member 3), FR-CAM-01..09, A-19/A-28/A-29/A-30

## Put your tests here

```
tests/member-4/
├── unit/                     # pure rules: profile validation, campaign status transitions, reminder math
├── MANUAL-TEST-CASES.md      # TC-M4-001…
├── TEST-RESULTS.md
└── results/
```

`pnpm test` discovers `tests/member-4/**/*.test.ts` automatically.

## Suggested cases to write

1. **Profile (FR-DON-02/05):** every field saves and reopens correctly; availability toggles; delete
   account removes access and matching eligibility.
2. **History (FR-DON-03/04/06):** self-reported entries labelled *Self-reported*, organisation entries
   *Recorded by organization*; total count correct; reminder days validates 1–365.
3. **Campaign creation (FR-CAM-01):** every field incl. both language title/description; saved as Draft.
4. **Approval flow (FR-CAM-02/03):** submit → Pending Approval; approve/reject/return recorded; a
   Pending campaign is never visible to donors.
5. **Discovery (FR-CAM-05):** only Approved upcoming campaigns; filters by area, date and blood group.
6. **Interest (FR-CAM-07):** "I plan to attend" increases the organiser's count; non-binding.
7. **Changes and cancellation (FR-CAM-08):** editing date/time/venue/description of an approved campaign
   returns it to Pending Approval while the old version stays visible; cancel notifies interested donors;
   Completed is automatic after the end date.
8. **Outcomes (FR-CAM-09):** attendees/donations saved; a recorded donation appears in that donor's
   history.

Follow the format in `tests/member-1/`; put database-backed checks in `scripts/verify-campaigns.mjs`
using the same `check(...)` + `Session` pattern as `scripts/verify-api-lifecycle.mjs`.
