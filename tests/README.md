# Wasl test suite

This folder holds **all** tests for the project, grouped by team member. Every member adds tests for
the module(s) they own; `pnpm test` automatically picks up every `*.test.ts` file below `tests/`.

```
tests/
├── run-all.ts                  # discovers and runs every *.test.ts under tests/
├── ts-loader.mjs               # lets plain Node resolve extensionless imports inside src/
├── README.md                   # this file
│
├── member-1/                   # Member 1 — Modules 1 (auth) + 9 (common UI & language)
│   ├── unit/                   # node:test unit tests (no database, no Next.js runtime)
│   │   ├── validation.test.ts
│   │   ├── password.test.ts
│   │   ├── rules.test.ts
│   │   ├── i18n.test.ts
│   │   ├── format.test.ts
│   │   └── csrf.test.ts
│   ├── MANUAL-TEST-CASES.md    # browser/administrator test cases with evidence
│   ├── TEST-RESULTS.md         # execution results + defects found and fixed
│   └── results/                # captured raw output (unit, API lifecycle, typecheck, build)
│
├── member-2/  …  member-5/
```

## Commands

| Command | What it does | Needs the app running? |
| --- | --- | --- |
| `pnpm test` | runs **every** `tests/**/*.test.ts` in one process | no |
| `pnpm typecheck` | TypeScript check of the whole project | no |
| `pnpm verify:api` | 29-check end-to-end HTTP lifecycle (accounts, OTP, verification, RBAC, authenticated header) | **yes** (`pnpm dev` first) |
| `pnpm build` | production build must compile | no |

`pnpm test` prints the list of files it loaded, then the node:test summary
(`ℹ tests … ℹ pass … ℹ fail …`). A non-zero exit code means something failed.

> Why not `node --test tests/`? That spawns one child process per test file. Some sandboxed/CI
> environments block child-process spawning (EPERM). `run-all.ts` imports the same test files in a
> single process, so the tests and the results are identical.

## Adding tests for your module (Members 2–5)

1. Create `tests/member-N/unit/<your-module>.test.ts` (or any name ending in `.test.ts`).
2. Write normal `node:test` tests and import your source with **explicit `.ts` extensions** and a
   relative path:

   ```ts
   import { test } from "node:test";
   import assert from "node:assert/strict";
   import { something } from "../../../src/lib/your-module.ts";

   test("does the expected thing (FR-XXX-01)", () => {
     assert.equal(something(), "expected");
   });
   ```

3. Run `pnpm test` — your file is discovered automatically. No registration needed.

### Rules

- **Unit tests only for framework-free code.** If your module imports `server-only`, `next/headers`
  or the database, plain Node cannot load it. Test the pure logic (validation, calculations, status
  transitions) here, and test the rest through `scripts/verify-api-lifecycle.mjs` or manual cases.
- **Never weaken or delete another member's tests.** If your change breaks an existing test, fix the
  code or discuss it with the owner (Member 1 owns `tests/member-1/`).
- **Name the requirement** in the test name or comment (`FR-REQ-01`, `NFR-SEC-02`, …) so the
  traceability matrix stays valid.
- **Keep tests deterministic.** No network, no "wait 5 minutes", no dependency on data created by
  other tests. Create unique data (e.g. random phone numbers) when you must touch a shared database.
- **Before pushing:** `pnpm test`, `pnpm typecheck`, and `pnpm build` must all pass.

### If your module has an HTTP API

Extend `scripts/verify-api-lifecycle.mjs` with a new section (or add
`scripts/verify-<your-module>.mjs`) following the same `check(name, condition, detail)` pattern and
the small `Session` cookie helper. Capture the output to `tests/member-N/results/` exactly like
`tests/member-1/results/` does, so results are reproducible.

### Document your results

Copy the structure of `tests/member-1/`:

```
tests/member-N/
├── unit/                       # your *.test.ts files
├── MANUAL-TEST-CASES.md        # ID | requirement | steps | expected | status | evidence
├── TEST-RESULTS.md             # what ran, when, how many passed, defects found
└── results/                    # captured terminal output / JSON
```

Use the ID prefix `TC-M<N>-…` for your manual cases (e.g. `TC-M3-001`) so the team can reference
them unambiguously. Add a row to `docs/TRACEABILITY.md` for each requirement you test.


