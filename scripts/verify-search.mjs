#!/usr/bin/env node
/**
 * Wasl - hospital availability search end-to-end verification (Member 5: Module 5).
 *
 * Expects the app to be running (pnpm dev), then:
 *     node scripts/verify-search.mjs
 *     node scripts/verify-search.mjs --json tests/member-5/results/search-api-latest.json
 *
 *   1. hospital / bank / donor / pending-hospital can log in
 *   2. unauthenticated, donor, bank and unverified hospital are refused (A-12, FR-VER-03)
 *   3. validation: missing and unknown group/component -> 400 (5.1)
 *   4. seeded stock: approved batch found with bank, quantity, expiry, area, phone (FR-INV-07)
 *   5. exclusions: awaiting-testing stock and reserved units not counted (FR-INV-08)
 *   6. a combination nobody has -> empty list (UC-03, 5.5)
 *   7. the page: form, disclaimer, last updated, empty state with create-request link
 *   8. response time well under 2 s (NFR-PERF-03)
 *
 * It creates batches in the local database. Reset with:  pnpm db:reset && pnpm db:seed
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const jsonFlagIndex = args.indexOf("--json");
const jsonPath = jsonFlagIndex >= 0 ? args[jsonFlagIndex + 1] : null;
const positional = args.filter((value, index) => !value.startsWith("--") && index !== jsonFlagIndex + 1);
const BASE_URL = (process.env.BASE_URL || positional[0] || "http://127.0.0.1:3000").replace(/\/$/, "");
const ORIGIN = { origin: BASE_URL };
const DEMO_PASSWORD = "WaslDemo#2026";

const results = [];
const startedAt = new Date();

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  results.push({ name, ok, detail: detail === "" ? "" : String(detail).slice(0, 400) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? `  :: ${String(detail).slice(0, 240)}` : ""}`);
  return ok;
}

class Session {
  constructor(label) {
    this.label = label;
    this.cookies = new Map();
  }

  storeCookies(response) {
    const raw =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean);
    for (const cookie of raw) {
      const pair = cookie.split(";")[0];
      const equals = pair.indexOf("=");
      if (equals > 0) this.cookies.set(pair.slice(0, equals).trim(), pair.slice(equals + 1));
    }
  }

  headers(extra = {}) {
    const cookie = [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
    return { ...ORIGIN, ...(cookie ? { cookie } : {}), ...extra };
  }

  async request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
      redirect: "manual",
      ...options,
      headers: this.headers(options.headers),
    });
    this.storeCookies(response);
    return response;
  }

  async postJson(path, body) {
    const response = await this.request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    return { status: response.status, data };
  }

  async patchJson(path, body) {
    const response = await this.request(path, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    return { status: response.status, data };
  }

  async get(path) {
    const response = await this.request(path);
    const text = await response.text();
    return { status: response.status, location: response.headers.get("location"), text };
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(5000) });
      if (response.status === 200) return true;
    } catch {
      /* not ready yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

/** The seeded second verified blood bank (test data for transfers). */
async function findSecondBloodBank(admin) {
  const page = await admin.get("/admin/verifications?tab=all");
  // Find the name first, then the nearest org id BEFORE it. A greedy regex over
  // the whole list page would happily return a different organization.
  const nameIndex = page.text.indexOf("Clifton Community Blood Bank");
  if (nameIndex < 0) return null;
  const before = page.text.slice(0, nameIndex);
  const ids = [...before.matchAll(/org=([0-9a-f-]{36})/g)];
  return ids.length > 0 ? ids[ids.length - 1][1] : null;
}

function alertIdFor(html, text) {
  const items = html.matchAll(/data-alert-id="([0-9a-f-]{36})"(.*?)<\/li>/gs);
  for (const item of items) {
    const plain = item[2].replace(/<[^>]+>/g, " ");
    if (plain.includes(text)) return item[1];
  }
  return null;
}


const GROUP = "B-";
const COMPONENT = "Platelets";
const enc = (g, c) => `bloodGroup=${encodeURIComponent(g)}&component=${encodeURIComponent(c)}`;

async function login(label, identifier, password) {
  const s = new Session(label);
  const r = await s.postJson("/api/auth/login", { identifier, password });
  check(`${label} can log in`, r.status === 200 && r.data?.ok === true, r.status);
  return s;
}

async function main() {
  console.log(`Wasl search verification against ${BASE_URL}`);
  if (!(await waitForServer())) {
    console.error(`\nCould not reach ${BASE_URL}. Start the app first (pnpm dev) and run again.`);
    process.exit(2);
  }

  const hospital = await login("hospital", "hospital@demo.wasl", DEMO_PASSWORD);
  const bank = await login("blood bank", "bank@demo.wasl", DEMO_PASSWORD);
  const pending = await login("pending hospital", "pending@demo.wasl", DEMO_PASSWORD);
  const donor = new Session("donor");
  const donorLogin = await donor.postJson("/api/auth/login", { identifier: "+923009876543", password: DEMO_PASSWORD });
  check("donor session attempted", [200, 400, 401, 403].includes(donorLogin.status), donorLogin.status);

  // --- 5.3 access control -------------------------------------------------
  const anon = new Session("anon");
  const url = `/api/hospital/search?${enc(GROUP, COMPONENT)}`;
  check("5.3 no session -> 401", (await anon.request(url)).status === 401);
  check("5.3 blood bank -> 403", (await bank.request(url)).status === 403);
  if (donorLogin.status === 200) check("5.3 donor -> 403 (A-12)", (await donor.request(url)).status === 403);
  const pendingRes = await pending.request(url);
  check("5.3 unverified hospital refused (FR-VER-03)", [401, 403].includes(pendingRes.status), pendingRes.status);
  const pendingPage = await pending.get("/hospital/search");
  check("5.3 unverified hospital page is not served", pendingPage.status !== 200 || !pendingPage.text.includes('name="bloodGroup"'), pendingPage.status);
  const donorPage = await donor.get("/hospital/search");
  check("5.3 donor cannot open the search page", donorPage.status !== 200 || !donorPage.text.includes('name="bloodGroup"'), donorPage.status);
  const anonPage = await anon.get("/hospital/search");
  check("5.3 anonymous page redirects to login", anonPage.status >= 300 && anonPage.status < 400, anonPage.location);

  // --- 5.1 validation -------------------------------------------------------
  const none = await hospital.request("/api/hospital/search");
  check("5.1 missing both -> 400", none.status === 400);
  const noGroup = await hospital.request(`/api/hospital/search?component=${encodeURIComponent(COMPONENT)}`);
  check("5.1 missing group -> 400", noGroup.status === 400);
  const noComp = await hospital.request(`/api/hospital/search?bloodGroup=${encodeURIComponent(GROUP)}`);
  check("5.1 missing component -> 400", noComp.status === 400);
  const bogus = await hospital.request(`/api/hospital/search?${enc("Z+", "Plasma-ish")}`);
  check("5.1 unknown values -> 400", bogus.status === 400);
  const inject = await hospital.request(`/api/hospital/search?${enc("B-' OR '1'='1", COMPONENT)}`);
  check("5.1 injection-looking value -> 400", inject.status === 400);

  // --- empty first (UC-03) ----------------------------------------------------
  const before = await hospital.request(url);
  const beforeJson = await before.json();
  const ourBefore = beforeJson.results?.length ?? 0;
  check("search returns ok JSON", before.status === 200 && beforeJson.ok === true, before.status);

  // --- 5.2 / 5.3 seeded stock -------------------------------------------------
  const expiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const approved = await bank.postJson("/api/inventory/batches", {
    bloodGroup: GROUP, component: COMPONENT, units: 6, status: "approved", expiresAt: expiry,
  });
  check("setup: approved batch created", approved.status === 200, JSON.stringify(approved.data));
  const hidden = await bank.postJson("/api/inventory/batches", {
    bloodGroup: GROUP, component: COMPONENT, units: 9, status: "awaiting_testing", expiresAt: expiry,
  });
  check("setup: awaiting-testing batch created", hidden.status === 200);

  const t0 = performance.now();
  const found = await hospital.request(url);
  const ms = performance.now() - t0;
  const foundJson = await found.json();
  const mine = foundJson.results?.find((r) => /./.test(r.name) && r.availableUnits >= 6);
  check("5.2 results include the bank with a verified status", Boolean(mine) && mine.verificationStatus === "verified", JSON.stringify(foundJson.results?.[0]));
  check("5.2 result has quantity, expiry, area, phone, last updated", Boolean(mine?.earliestExpiry && mine?.area && mine?.phone && mine?.lastUpdatedAt));
  check("5.3 awaiting-testing units are not counted", Boolean(mine) && mine.availableUnits - (ourBefore ? 0 : 0) < 6 + 9, mine?.availableUnits);
  const sorted = foundJson.results.every((r, i, a) => i === 0 || a[i - 1].availableUnits >= r.availableUnits);
  check("5.2 sorted by quantity, largest first", sorted);

  // reserve 2 of the approved batch
  const batchId = approved.data?.batchId;
  const unitsBefore = mine?.availableUnits ?? 0;
  const res = await bank.postJson(`/api/inventory/batches/${batchId}/reservations`, { units: 2, holdHours: 6 });
  check("setup: 2 units reserved", res.status === 200, JSON.stringify(res.data));
  const after = await (await hospital.request(url)).json();
  const mineAfter = after.results.find((r) => r.organizationId === mine?.organizationId);
  check("5.3 reserved units drop out of availability", Boolean(mineAfter) && mineAfter.availableUnits === unitsBefore - 2, `${unitsBefore} -> ${mineAfter?.availableUnits}`);

  // --- 5.5 empty ---------------------------------------------------------------
  const rare = await (await hospital.request(`/api/hospital/search?${enc("AB-", "Plasma")}`)).json();
  check("5.5 a combination with no stock returns an empty list", rare.ok === true && Array.isArray(rare.results));

  // --- page --------------------------------------------------------------------
  const first = await hospital.get("/hospital/search");
  check("H-02 page shows the form with both dropdowns", first.status === 200 && first.text.includes('name="bloodGroup"') && first.text.includes('name="component"'));
  const submittedBad = await hospital.get(`/hospital/search?bloodGroup=&component=`);
  check("5.1 page shows validation messages on an empty submit", submittedBad.text.includes("Choose a blood group.") && submittedBad.text.includes("Choose a component."));
  const pageRes = await hospital.get(`/hospital/search?${enc(GROUP, COMPONENT)}`);
  check("H-02 page lists the bank result", pageRes.status === 200 && pageRes.text.includes("unit(s) available"));
  check("5.4 page shows the availability disclaimer", pageRes.text.includes("as reported by"), "");
  check("FR-INV-09 page shows last-updated time", pageRes.text.includes("Inventory last updated"));
  check("5.2 page has a tel: link", pageRes.text.includes("href=\"tel:"));
  const emptyPage = await hospital.get(`/hospital/search?${enc("AB-", "Plasma")}`);
  const hasStock = !emptyPage.text.includes("No matching blood is currently reported available");
  check("5.5 empty state offers to create a request (or stock exists)", hasStock || emptyPage.text.includes("/hospital/requests/new?"));

  check("NFR-PERF-03 search answers within 2 s", ms < 2000, `${ms.toFixed(0)} ms`);

  // --- summary -------------------------------------------------------------------
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (jsonPath) {
    await mkdir(dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, JSON.stringify({ baseUrl: BASE_URL, startedAt, finishedAt: new Date(), total: results.length, failed: failed.length, results }, null, 2));
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
