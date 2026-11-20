# Member 4 — tests (Modules 3 and 6)

**Owner:** Member 4 · **Screens:** D-03, D-04, D-05, D-06, O-01, O-02, O-03
**Requirements:** FR-DON-02…06, FR-CAM-01…09, DR-02/03/05, A-18/19/21/28/29/30

```
tests/member-4/
├── unit/
│   ├── donor-rules.test.ts      # profile, history, reminder, notice targeting, account deletion (pure logic)
│   └── campaign-rules.test.ts   # validation, statuses, visibility, filters, outcomes, notices (pure logic)
├── MANUAL-TEST-CASES.md         # TC-M4-001 … with expected results
├── TEST-RESULTS.md              # what was run and the numbers
└── results/                     # raw output of each run
```

`pnpm test` finds these automatically (`tests/member-N/**/*.test.ts`).

## Live check (needs the app running)

```
pnpm db:reset && pnpm db:seed
pnpm dev                                   # in one window
node scripts/verify-campaigns.mjs          # in another window  -> 109 checks
node scripts/verify-campaigns.mjs --destructive   # also deletes the demo donor's account (113 checks)
node scripts/verify-campaigns.mjs --json tests/member-4/results/campaigns-api-latest.json
```

The script logs in as the demo donor, organizers, hospital, pending organization and administrator and walks through
access control, validation, the whole campaign life cycle (draft → pending → approved → edit → cancel / complete),
filters, interest, notifications and the donor's history. It creates campaigns in the local database; reset with
`pnpm db:reset && pnpm db:seed`.
