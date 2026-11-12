# Member 3 — tests (Modules 4 + 7)

**Owner:** Member 3 · **Modules:** 4 Blood Bank Inventory Management · 7 Expiry and Low-Stock Monitoring
**Screens you own:** B-01, B-02, B-03, B-04, B-05, B-07
**Requirements:** FR-INV-01..09, FR-MON-01..06, FR-DON-04, A-05/A-07/A-08/A-09/A-10/A-31/A-32

## Put your tests here

```
tests/member-3/
├── unit/                     # pure inventory rules: quantity math, movement totals, alert windows
├── MANUAL-TEST-CASES.md      # TC-M3-001…
├── TEST-RESULTS.md
└── results/
```

`pnpm test` discovers `tests/member-3/**/*.test.ts` automatically.

## Suggested cases to write

1. **Batch validation (FR-INV-01):** negative units rejected; past expiry rejected; valid batch creates
   an `Added` movement and appears in inventory.
2. **Availability rules (FR-INV-02 / FR-INV-08):** only `Approved`, unexpired, unreserved units count;
   awaiting-testing/rejected/expired/reserved stock never appears in search.
3. **Movements (FR-INV-03/05/06):** correction, issue, transfer-out each record type, quantity, user,
   time and linked request/bank; historical records are never deleted.
4. **Expiry windows (FR-MON-01):** platelets alert at 2 days, whole blood/RBC at 7, plasma at 30;
   a red-cell batch 20 days out raises nothing.
5. **Automatic expiry (FR-MON-02):** a batch past its expiry gets an `Expired` movement and disappears
   from availability.
6. **Low stock (FR-MON-03/04):** default threshold 5; changing it to 10 triggers at 10; alert appears on
   B-01 + notification centre and does not repeat within 24 h (A-32).
7. **Evaluation timing (FR-MON-06):** alert appears within 1 minute of an inventory change.

Follow the format in `tests/member-1/` and extend `scripts/verify-api-lifecycle.mjs` (or add
`scripts/verify-inventory.mjs`) for database-backed cases.
