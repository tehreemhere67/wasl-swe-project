# Member 5 — Implementation notes (Module 5: Hospital blood availability search)

**Screen:** H-02 `/hospital/search` · **API:** `GET /api/hospital/search`
**Requirements:** FR-INV-07, FR-INV-08, FR-INV-09, FR-VER-03, A-12, NFR-PERF-03, UC-03

## 1. Does Member 5 depend on Member 4?

**No.** Module 5 only *reads* Member 3's inventory tables (`inventory_batches`,
`inventory_reservations`, `inventory_movements`) and the verification status of
organizations (Member 1/2 foundation). Member 4's work (donor requests/campaign
modules) is not touched, so nothing of Member 4 had to be built first.
H-03…H-07 (hospital requests) are Sprint 2.

## 2. What was built

| Piece | File | Purpose |
| --- | --- | --- |
| Rules (pure) | `src/lib/search/rules.ts` | Form validation, exclusion logic via Member 3's `countsAsAvailable`, grouping per bank, ordering, `tel:` link, create-request link |
| Data layer | `src/lib/search/data.ts` | One SQL query: verified blood banks only, matching group/component, non-archived batches, active reservations summed, last-updated time |
| JSON route | `src/app/api/hospital/search/route.ts` | `GET`, 401 no session, 403 not a verified hospital, 400 invalid input |
| Page | `src/app/hospital/search/page.tsx` | H-02 following the wireframe |
| Text | `src/lib/i18n/parts/hospital.ts` | New `hospital.search.*` keys, English + Urdu, same keys/placeholders |

No frozen foundation file was edited. No new layout was created; the page sits under the existing hospital layout.

## 3. Rules (one place, no copies)

* **FR-INV-07** both fields required, only the controlled values of SRS 4.2.
* **FR-INV-08** a batch counts only if `countsAsAvailable` says so: bank *Verified*,
  batch *Approved*, not expired, and at least one unit left after active reservations.
  Reserved units are subtracted, never listed. Archived batches are ignored.
* **Grouping:** one card per blood bank; quantities of its batches are added; the
  earliest expiry of the counted batches is shown.
* **Order:** most units first, then sooner expiry, then bank name (stable).
* **FR-INV-09:** last updated = latest of the bank's batch updates and inventory
  movements; the "as reported by the blood bank" statement appears on every card
  and under the list.
* **Access (5.3 / A-12):** the page and the API both check role = hospital and
  organization = verified. Donors, blood banks, organizers, administrators,
  pending/rejected hospitals and anonymous visitors cannot see any inventory.
* **5.5 / UC-03:** no match → "No matching blood is currently reported available"
  plus a **Create a blood request** button (`/hospital/requests/new?bloodGroup=…&component=…`).
  The request form itself is Sprint 2.

Because the bank's own inventory page (B-02) and this search use the same rule,
the two screens cannot disagree.

## 4. Wireframe match (H-02)

Blood group dropdown → Component dropdown → **Search** button → one row per bank:
bank name with the verified mark, "Exp date · Area · Phone", the
"as reported by blood bank" statement, then the empty state. Added because the SRS
requires them: available quantity, e-mail, last-updated time, validation messages.
The form is a normal GET form, so it works without JavaScript and results can be
bookmarked.

## 5. Performance (NFR-PERF-03)

One indexed-join query per search. Measured locally: ~21 ms (target 2000 ms).

## 6. Known limits

* "Suspended / unverified bank" exclusion is enforced in SQL (`verification_status = 'verified'`)
  and in `countsAsAvailable`; it is covered by unit tests. The live check uses seeded
  data, which has no suspended bank with stock.
* Expired stock cannot be created through the API (past expiry is refused), so the
  expiry exclusion is proven by unit tests with fixed clocks rather than live data.
* Create-request target page is a Sprint 2 screen; the link is in place.
