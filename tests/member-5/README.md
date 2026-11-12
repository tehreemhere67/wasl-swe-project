# Member 5 — tests (Module 5)

**Owner:** Member 5 · **Module:** 5 Hospital Blood Availability Search
**Screens you own:** H-02 (and H-01 search entry point). H-03…H-07 are Sprint 2.
**Requirements:** FR-INV-07, FR-INV-08, FR-INV-09, FR-VER-03, A-12

## Put your tests here

```
tests/member-5/
├── unit/                     # pure logic: result filtering/formatting, distance/area helpers if any
├── MANUAL-TEST-CASES.md      # TC-M5-001…
├── TEST-RESULTS.md
└── results/
```

`pnpm test` discovers `tests/member-5/**/*.test.ts` automatically.

## Suggested cases to write

1. **Search input (FR-INV-07):** choose blood group + component; results show only verified blood banks.
2. **Result fields (FR-INV-07):** each row shows bank name, verification badge, available quantity,
   earliest expiry, area, contact details and last-updated time.
3. **Exclusions (FR-INV-08):** expired, not-Approved, reserved units and suspended/unverified banks
   never appear. Seed one of each with Member 3's module and confirm.
4. **Hospital-only access (FR-VER-03, A-12):** a donor, blood bank or admin cannot open `/hospital/search`;
   a Pending hospital is sent to `/status`.
5. **Disclaimer (FR-INV-09):** the confirmation statement is visible on every result set; the empty state
   message appears when nothing matches.
6. **Performance (NFR-PERF-03):** results appear within 2 s for a typical search on the seeded dataset.

Database-backed checks belong in `scripts/verify-search.mjs`, following the `check(...)` + `Session`
pattern in `scripts/verify-api-lifecycle.mjs`. Coordinate with Member 3 for the inventory tables.
