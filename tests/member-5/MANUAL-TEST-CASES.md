# Member 5 — Test cases (Module 5)

Automated coverage: `tests/member-5/unit/search-rules.test.ts` (30 tests) and
`scripts/verify-search.mjs` (34 live HTTP checks). Status **Pass** = executed on
19 Nov 2026 against the local app (HTTP/HTML responses). Cases marked **To confirm
in browser** need a person to look at the screen (layout, Urdu, phone width).

Setup: `pnpm db:seed && pnpm dev`; hospital login `hospital@demo.wasl` / `WaslDemo#2026`.

| ID | Requirement | Steps | Expected | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| TC-M5-001 | FR-INV-07 | Open `/hospital/search` | Two required dropdowns and a Search button, no results yet | Pass | verify-search |
| TC-M5-002 | 5.1 | Press Search with nothing chosen | "Choose a blood group." and "Choose a component." | Pass | verify-search |
| TC-M5-003 | 5.1 | API with an unknown group / SQL-like text | 400, nothing searched | Pass | verify-search, unit |
| TC-M5-004 | FR-INV-07 | Bank adds approved B- Platelets, hospital searches B- Platelets | Bank card with name, Verified, units, Exp·Area·Phone, e-mail | Pass | verify-search |
| TC-M5-005 | 5.2 | Several banks with stock | Largest quantity first; ties by expiry then name | Pass | unit |
| TC-M5-006 | FR-INV-08 | Bank also adds awaiting-testing units | Those units are not counted | Pass | verify-search |
| TC-M5-007 | FR-INV-08 | Bank reserves 2 of 6 units | Available shows 4 | Pass | verify-search |
| TC-M5-008 | FR-INV-08 | Expired batch / suspended or unverified bank | Never shown | Pass | unit (fixed clock) |
| TC-M5-009 | FR-INV-09, 5.4 | Look at any result | "Inventory last updated …" and the "as reported by the blood bank" statement on the card and under the list | Pass | verify-search |
| TC-M5-010 | A-12, 5.3 | Anonymous / donor / blood bank / pending hospital open the page or API | Redirect or 401/403; no inventory | Pass | verify-search |
| TC-M5-011 | UC-03, 5.5 | Search a combination nobody holds | "No matching blood is currently reported available" + Create a blood request button | Pass | verify-search |
| TC-M5-012 | NFR-PERF-03 | Time a search | < 2 s (measured ~21 ms) | Pass | verify-search |
| TC-M5-013 | NFR-LOC-01/03 | Switch to اردو, search | Urdu labels, right-to-left | To confirm in browser | key parity checked by unit tests |
| TC-M5-014 | NFR-USE | Open on a phone-width window | Cards stack, button full width | To confirm in browser | — |
| TC-M5-015 | Regression | `pnpm test`, `pnpm typecheck`, `pnpm build`, `verify-inventory.mjs` | All previous tests still pass | Pass | results/ |
