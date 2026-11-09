# Wasl — Handoff: adding a module without breaking the foundation

This is the recipe for the other team members (Members 2–5) to add their module to the Sprint 1
foundation. Follow the steps in order. Each step names the exact file and shows the shape the code
should take.

The sprint-1 foundation is **frozen**. Treat these as read-only unless the Lead asks you to change
them: `src/lib/auth/**`, `src/lib/validation.ts`, `src/lib/csrf.ts`, `src/lib/format.ts`,
`src/lib/db/index.ts`, `src/lib/i18n/index.ts`, `src/components/ui/**`, `src/components/shell/**`,
`src/app/layout.tsx`, `scripts/connect.ts`, and existing migrations. Add new files next to them.

---

## 1. Database migration

New tables go in a **new** `Migration` entry in `src/lib/db/migrations.ts`. Never edit
`001_initial_schema` or `002_default_settings` once shared — other members' local databases have
already recorded them as applied, so edits are silently ignored and your schema never appears.

```ts
// src/lib/db/migrations.ts — append inside the MIGRATIONS array

const inventorySchema = `
-- M4: inventory batches (FR-INV-01..). Owner: Member 3.
CREATE TABLE IF NOT EXISTS inventory_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  blood_group     TEXT NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  component       TEXT NOT NULL CHECK (component IN ('Whole blood','Red blood cells','Platelets','Plasma')),
  units           INTEGER NOT NULL CHECK (units >= 0),           -- DR-01: never negative
  status          TEXT NOT NULL DEFAULT 'awaiting_testing'
                  CHECK (status IN ('awaiting_testing','approved','rejected')),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory_batches (organization_id, blood_group, component);
`;

// and in the array:
export const MIGRATIONS: Migration[] = [
  /* ... existing 001, 002 ... */
  { id: "003_inventory", name: "Inventory batches and movements (M4)", sql: inventorySchema },
];
```

Rules:

- One migration per module (or a few, numbered in increasing order: `003_…`, `004_…`). The `id` is
  the applied-migration key forever; renaming it re-runs the SQL.
- Plain PostgreSQL only. It runs on both PGlite and a real server, so no driver-specific syntax.
- Enforce SRS §4.2 controlled values with `CHECK` constraints, exactly as the SRS spells them.
- `TIMESTAMPTZ` in UTC, `UUID` primary keys with `gen_random_uuid()`, `created_at/updated_at`.
- Additive only. Do not drop or rename a table or column another module owns.
- Do not import `server-only` or any React code into `migrations.ts` — the CLI scripts import it.
- Migrations run automatically on the first database call and via `pnpm db:migrate`; they do not run
  when the app is already running, so restart `pnpm dev` after adding one.

New columns on an **existing** table need their own migration (`ALTER TABLE … ADD COLUMN …`).
Coordinate with the Lead first if the table belongs to another module.

## 2. Localization part

Create `src/lib/i18n/parts/<area>.ts` (the stub files for `hospital`, `bloodbank`, `donor`,
`organizer`, `admin` already exist — fill them in):

```ts
import type { DictionaryPart } from "../types";

/** M4 - Blood bank inventory strings. Owner: Member 3. */
export const bloodbank: DictionaryPart = {
  en: {
    "inventory.title": "Inventory",
    "inventory.units": "{count} units",
    "inventory.errorNegative": "Enter zero or more units.",
  },
  ur: {
    "inventory.title": "انوینٹری",
    "inventory.units": "{count} یونٹس",
    "inventory.errorNegative": "صفر یا اس سے زیادہ یونٹ درج کریں۔",
  },
};
```

Then register it in `src/lib/i18n/index.ts` (it already imports every part; if you added a new
file, add both the import and the `PARTS` entry):

```ts
const PARTS: DictionaryPart[] = [common, nav, auth, notifications, stub, hospital, bloodbank, donor, organizer, admin];
```

Rules:

- **Both languages, exactly the same keys.** `node tests/i18n.test.ts` fails if a key or a
  `{placeholder}` is missing in either language, or if two parts define the same key.
- Keep keys module-prefixed (`inventory.*`, `requests.*`, `campaigns.*`, `admin.*`) to avoid
  collisions. Do not reuse a key another module owns, and do not edit another part's file.
- Interpolate with `{name}` style and call `t("key", { name })`; both languages must use the same
  placeholders.
- Never hard-code a user-visible string in a component. Take labels from `createTranslator(locale)`
  on the server, or pass a `labels` object into a client form (see
  `src/components/forms/org-registration-form.tsx`).
- Urdu is RTL: use logical Tailwind classes (`ms-*`, `me-*`, `start-*`, `end-*`, `text-start`) rather
  than `ml-*`/`left-*` so the layout mirrors automatically.

## 3. Pages under the existing role layout

Role areas already exist and already enforce the right guard and navigation:

| Area | Layout | Guard |
| --- | --- | --- |
| Hospital (Member 5) | `src/app/hospital/layout.tsx` | `requireRole(["hospital"])` + `requireVerifiedOrganization` |
| Blood bank (Member 3) | `src/app/bank/layout.tsx` | `requireRole(["blood_bank"])` + `requireVerifiedOrganization` |
| Donor (Member 4) | `src/app/donor/layout.tsx` | `requireRole(["donor"])` |
| Organizer (Member 4) | `src/app/organizer/layout.tsx` | `requireRole(["donation_org","blood_bank"])` + `requireVerifiedOrganization` |
| Administrator (Member 2) | `src/app/admin/layout.tsx` | `requireAdmin()` |

**An area layout must check BOTH the role and the verification status.** `requireVerifiedOrganization`
alone only proves the organization is Verified, so a verified hospital would otherwise be able to open
the blood-bank area (this was a real bug found in browser testing and fixed in the layouts).

**Do not create another layout** — you would bypass the guard and the shared header/navigation. Add
`page.tsx` files below the existing layout, at the route the navigation already links to:

```text
src/app/hospital/page.tsx                  H-01 dashboard
src/app/hospital/search/page.tsx           H-02 availability search
src/app/hospital/requests/new/page.tsx     H-03 create request
src/app/hospital/requests/page.tsx         H-07 my requests
src/app/hospital/requests/[id]/page.tsx    H-05 detail (+H-04 confirmation is a query state)
```

A page is a **server component** by default:

```tsx
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { Card, PageHeader } from "@/components/ui";

export default async function InventoryPage() {
  const session = await requireVerifiedOrganization("/bank/inventory"); // defence in depth
  const locale = await getLocale();
  const t = createTranslator(locale);
  // ... query your own tables with `query()` from "@/lib/db" ...
  return <div>{/* PageHeader, Card, ... from @/components/ui */}</div>;
}
```

Rules:

- Do not call `requireUser`-style guards on public screens; every role page is already behind its
  layout guard.
- Do not import `server-only` modules into a `"use client"` file. Client components receive data and
  **translated labels** as props; they must not import `@/lib/db`, `@/lib/auth/session`,
  `@/lib/notifications` or `@/lib/i18n/server`.
- Use the wireframe IDs in a short comment at the top of each page, matching
  [`WIREFRAMES.md`](WIREFRAMES.md).

## 4. Access rules

Use the existing guards; do not write role checks inline:

| Need | Function |
| --- | --- |
| Signed in | `requireUser(nextPath?)` |
| One of several roles | `requireRole(["hospital"], nextPath)` |
| Organization must be Verified (FR-VER-03) | `requireVerifiedOrganization(nextPath)` |
| Administrator only | `requireAdmin()` |
| Signed in **or** null, without redirecting | `getOptionalSession()` |
| Where to send a user after login | `landingPath(role, organizationStatus)` from `@/lib/auth/rules` |

Route handlers cannot rely on a layout guard, so re-check there:

```ts
const session = await getSession();
if (!session) return unauthorized();
if (session.user.role !== "blood_bank") return forbidden();
if (session.user.organization?.verificationStatus !== "verified") return forbidden(); // FR-VER-03
```

Remember to record refused actions when you add one (`recordAudit({ action: "access_refused", … })`).

## 5. API route handlers

Put handlers under `src/app/api/<area>/<action>/route.ts`. Every state-changing handler follows the
same order:

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/csrf";
import { transaction } from "@/lib/db";
import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { validateMyInput } from "@/lib/validation"; // add pure validation to validation.ts

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();          // NFR-SEC-04
  const session = await getSession();
  if (!session) return unauthorized();
  // ... role + Verified checks ...

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateMyInput(body);                 // pure, unit-testable
  if (!validation.ok) return badRequest(validation.errors);

  await transaction(async (tx) => { /* writes; all-or-nothing */ });

  await recordAudit({                                       // FR-ADM-05 / NFR-SEC-05
    actorUserId: session.user.id,
    actorRole: session.user.role,
    action: "request_created",
    entityType: "request",
    entityId: id,
  });
  await createNotification({ /* FR-NOT-04: store in the platform too */ });

  return json({ ok: true });
}
```

Rules:

- `isSameOrigin(request)` first, in every POST — including form-post endpoints.
- All SQL uses `$1` placeholders; never interpolate user input into SQL.
- Put the rule in a pure function in `src/lib/validation.ts` (or a new `src/lib/<area>/rules.ts`) and
  unit-test it; the route stays thin.
- Multi-row writes go through `transaction()`.
- For a plain HTML form submission, finish with `return redirectTo(request, refererPath(request))`
  so the flow works without JavaScript (see `api/notifications/read/route.ts`).
- Never redirect to a raw user value: use `safeRedirectPath`.

## 6. Notifications

Other modules produce notifications by calling `createNotification` from `@/lib/notifications`;
the shell (bell + G-05 page) already displays them. Content is stored in **both** languages, so you
must supply `titleEn`/`titleUr` (and ideally `bodyEn`/`bodyUr`) plus the right `category`:
`verification`, `account`, `urgent_request`, `campaign`, `request_closed`, `general`.

Do not write to `notifications` with raw SQL and do not edit `src/lib/notifications.ts` to add a
category the union does not have — add the category there **and** a `notif.category.<name>` key in
`src/lib/i18n/parts/notifications.ts`, then tell the Lead (both files are shared).

## 7. Tests

- Pure rules go in `src/lib/<area>/rules.ts` (no `server-only`, no database import) and get a
  `tests/<area>.test.ts` using `node:test` + `node:assert/strict`, importing with a relative `.ts`
  path: `import { … } from "../src/lib/<area>/rules.ts";`.
- Add the new file to `tests/run-all.ts` so `node tests/run-all.ts` covers it.
- Do not test modules that import `server-only` or `@/lib/db` — they cannot load outside Next.js.
- Run: `node tests/run-all.ts` (or `pnpm test`, which runs the same file).

## 8. Seed data

`scripts/seed.ts` is shared and idempotent. If your module needs demo rows, add one `ensure…`
function and call it from `main()`, following the existing pattern (check-then-insert, no hard
deletes). Announce the change to the team: everyone runs the same `pnpm db:seed` and duplicate
inserts will break their demo.

## 9. Before you open a pull request

- [ ] New migration appended, `id` unique, existing migrations untouched, `pnpm db:migrate` succeeds
- [ ] Tables created and validated locally; `CHECK` constraints for SRS §4.2 values
- [ ] Pages added only under your existing role layout; no new layout, no guard bypass
- [ ] Every string in your i18n part in **both** English and Urdu, same keys/placeholders
- [ ] Every API handler: `isSameOrigin`, role/verification check, validation, transaction,
      `recordAudit`
- [ ] `requireVerifiedOrganization` / `requireRole` used, not hand-written role checks
- [ ] `pnpm typecheck` passes
- [ ] `node tests/run-all.ts` passes; new pure modules have tests and are in `run-all.ts`
- [ ] New/updated screens listed in `docs/WIREFRAMES.md`; requirements in `docs/TRACEABILITY.md`
- [ ] Urdu checked with `?lang` switch, layout mirrors, no horizontal scroll at 360 px

## 10. Things that will bite you

| Symptom | Cause | Fix |
| --- | --- | --- |
| Table missing after restart | Edited an existing migration that was already applied | Add a new migration; never edit applied SQL |
| `Module not found: server-only` in a client component | Importing `@/lib/db`/`session` from `"use client"` | Move the read to the server page and pass data as props |
| `requireVerifiedOrganization` loops to `/status` | Your demo organization is Pending/Rejected | Use a verified seeded account or approve it as administrator |
| i18n test fails on a missing key/placeholder | Only one language filled in | Add the key to both `en` and `ur` with identical `{placeholders}` |
| i18n test fails on a duplicated key | You reused a key from `common`/`auth` | Rename to your module prefix |
| `pnpm db:seed` fails after changing seed | Duplicate seed rows / non-idempotent insert | Follow the check-then-insert pattern |
| Form posts return 403 | Missing `Origin` mismatch in a proxy setup | Send the request same-origin; `isSameOrigin` compares `Origin` and `X-Forwarded-Host` |
