# Member 2 — tests (Modules 2 + 8)

**Owner:** Member 2 · **Modules:** 2 Organization Registration & Verification · 8 Basic Administrator Functionality
**Screens you own:** A-01, A-02 (finish), A-03, A-04, A-05, A-06, A-07, A-08
**Requirements:** FR-VER-01..06 (with Member 1's baseline), FR-ADM-01..06, FR-CAM-02 (approval side), DR-04

## Put your tests here

```
tests/member-2/
├── unit/                     # pure logic only, e.g. decision/status transition helpers
├── MANUAL-TEST-CASES.md      # TC-M2-001… (copy the format from tests/member-1/)
├── TEST-RESULTS.md           # what you ran, when, results
└── results/                  # captured terminal output
```

`pnpm test` discovers `tests/member-2/**/*.test.ts` automatically — no registration needed.

## Suggested cases to write

1. **A-02 verification:** approve → status Verified + history row + applicant notified; reject requires
   a reason and stores it; suspend → operational access lost; reinstate → restored; waiting time shown.
2. **A-03 accounts:** search, deactivate → the user cannot log in; reactivate → can log in; every action
   has an `audit_log` row.
3. **A-04 campaigns:** approve / reject + reason / return for changes; only Approved campaigns visible
   to donors.
4. **A-06 audit log:** every verification, campaign and account action appears with user and time.
5. **DR-04:** verification documents visible only to administrators and the submitting organisation.

Start from `tests/member-1/MANUAL-TEST-CASES.md` for the table format and
`tests/member-1/unit/rules.test.ts` for the `node:test` style. If your logic needs the database or
`server-only`, extend `scripts/verify-api-lifecycle.mjs` or write
`scripts/verify-admin.mjs` following its `check(...)` + `Session` pattern.
