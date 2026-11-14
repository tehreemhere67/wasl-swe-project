#!/usr/bin/env node
/**
 * Wasl - inventory + monitoring end-to-end verification (Member 3: Modules 4 + 7).
 *
 * Expects the app to be running:
 *     npm run dev
 * then, in another terminal:
 *     node scripts/verify-inventory.mjs
 *     node scripts/verify-inventory.mjs --json tests/member-3/results/inventory-api-latest.json
 *
 * It exercises the real HTTP API with real cookies, so it covers what the pure
 * unit tests cannot: the database, guards, transactions, movements, alerts.
 *
 *   1.  verified blood bank can log in
 *   2.  create a batch (FR-INV-01); negative units and past expiry rejected
 *   3.  the batch appears in the list with its batch reference
 *   4.  edit + approve records a Correction movement (FR-INV-03)
 *   5.  issue units reduces stock and records Issued (FR-INV-05)
 *   6.  reserve/release changes availability only (FR-INV-04)
 *   7.  transfer out to another verified bank (FR-INV-06)
 *   8.  a non-empty batch cannot be archived; an empty one can (4.4 soft delete)
 *   9.  thresholds drive low-stock alerts; acknowledge silences them (7.3/7.4)
 *  10.  a hospital is refused (FR-ADM-01, FR-VER-03)
 *
 * This script creates and archives test batches in the local database. To get
 * back to clean demo data afterwards:  npm run db:reset && npm run db:seed
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

async function main() {
  console.log(`Wasl inventory verification against ${BASE_URL}`);
  if (!(await waitForServer())) {
    console.error(`\nCould not reach ${BASE_URL}. Start the app first (npm run dev) and run again.`);
    process.exit(2);
  }

  // --- sessions -------------------------------------------------------------
  const admin = new Session("admin");
  const adminLogin = await admin.postJson("/api/auth/login", {
    identifier: "admin@wasl.pk",
    password: "WaslAdmin#2026",
  });
  check("administrator can log in", adminLogin.status === 200 && adminLogin.data?.ok === true);

  const bank = new Session("bank");
  const bankLogin = await bank.postJson("/api/auth/login", {
    identifier: "bank@demo.wasl",
    password: DEMO_PASSWORD,
  });
  check("verified blood bank can log in", bankLogin.status === 200 && bankLogin.data?.ok === true);

  const hospital = new Session("hospital");
  const hospitalLogin = await hospital.postJson("/api/auth/login", {
    identifier: "hospital@demo.wasl",
    password: DEMO_PASSWORD,
  });
  check("hospital can log in", hospitalLogin.status === 200 && hospitalLogin.data?.ok === true);

  const secondBankId = await findSecondBloodBank(admin);
  check("second verified blood bank is available for transfers", Boolean(secondBankId), secondBankId ?? "not found");

  // --- 4.1 create -----------------------------------------------------------
  const expiry = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const created = await bank.postJson("/api/inventory/batches", {
    bloodGroup: "AB+",
    component: "Whole blood",
    units: 8,
    status: "awaiting_testing",
    expiresAt: expiry,
  });
  const batchId = created.data?.batchId;
  check("4.1 creates a batch", created.status === 200 && created.data?.ok === true && Boolean(batchId), batchId);

  const negative = await bank.postJson("/api/inventory/batches", {
    bloodGroup: "AB+",
    component: "Whole blood",
    units: -5,
    status: "approved",
    expiresAt: expiry,
  });
  check(
    "4.1 rejects negative units (DR-01)",
    negative.status === 400 && negative.data?.errors?.[0]?.message === "inventory.error.units",
    JSON.stringify(negative.data),
  );

  const past = await bank.postJson("/api/inventory/batches", {
    bloodGroup: "AB+",
    component: "Whole blood",
    units: 1,
    status: "approved",
    expiresAt: "2026-01-01",
  });
  check(
    "4.1 rejects a past expiry",
    past.status === 400 && past.data?.errors?.[0]?.message === "inventory.error.expiryPast",
    JSON.stringify(past.data),
  );

  const badGroup = await bank.postJson("/api/inventory/batches", {
    bloodGroup: "C+",
    component: "Whole blood",
    units: 1,
    status: "approved",
    expiresAt: expiry,
  });
  check("4.1 rejects an unknown blood group (SRS 4.2)", badGroup.status === 400);

  // --- 4.2 list -------------------------------------------------------------
  const list = await bank.get("/bank/inventory");
  check("4.2 inventory page loads", list.status === 200);
  check("4.2 list shows the new batch", list.text.includes(batchId ?? "missing"));
  check("4.2 list has the Batch reference column", list.text.includes(">Batch</th>"));

  // --- 4.3 edit + approve ---------------------------------------------------
  const edited = await bank.patchJson(`/api/inventory/batches/${batchId}`, {
    bloodGroup: "AB+",
    component: "Whole blood",
    units: 6,
    status: "approved",
    expiresAt: expiry,
  });
  check("4.3 edits a batch", edited.status === 200 && edited.data?.changed === true, JSON.stringify(edited.data));

  const detail = await bank.get(`/bank/inventory/${batchId}`);
  check("4.3 records a Correction movement", detail.text.includes("Correction"));
  check("4.3 records the status change", detail.text.includes("Status: Awaiting testing"));
  check("4.3 shows the corrected quantity", detail.text.includes("Units held") && detail.text.includes(">6<"));

  // --- 4.4 issue ------------------------------------------------------------
  const issued = await bank.postJson(`/api/inventory/batches/${batchId}/movements`, {
    type: "issued",
    units: 2,
    note: "Issued to Aga Khan University Hospital",
  });
  check("4.4 issues units to a hospital", issued.status === 200 && issued.data?.ok === true);

  const overIssue = await bank.postJson(`/api/inventory/batches/${batchId}/movements`, {
    type: "issued",
    units: 99,
  });
  check(
    "4.4 refuses to issue more than the batch holds",
    overIssue.status === 400 && overIssue.data?.errors?.[0]?.message === "inventory.error.unitsTooMany",
  );

  const afterIssue = await bank.get(`/bank/inventory/${batchId}`);
  check("4.4 records Issued and reduces stock", afterIssue.text.includes("Issued") && afterIssue.text.includes("\u22122"));

  // --- 4.6 reserve / release ------------------------------------------------
  const reserved = await bank.postJson(`/api/inventory/batches/${batchId}/reservations`, {
    units: 2,
    holdHours: 6,
  });
  check("4.6 reserves units", reserved.status === 200 && reserved.data?.ok === true);

  const withHold = await bank.get(`/bank/inventory/${batchId}`);
  const reservationId = withHold.text.match(/data-reservation-id="([0-9a-f-]{36})"/)?.[1];
  check("4.6 shows the active hold with its end time", Boolean(reservationId) && withHold.text.includes("held until"));

  const released = await bank.postJson(`/api/inventory/reservations/${reservationId}/release`, {});
  check("4.6 releases the hold", released.status === 200 && released.data?.ok === true);

  const afterRelease = await bank.get(`/bank/inventory/${batchId}`);
  check("4.6 records Reservation released", afterRelease.text.includes("Reservation released"));

  // --- 4.7 transfer ---------------------------------------------------------
  const transferred = await bank.postJson(`/api/inventory/batches/${batchId}/transfers`, {
    units: 1,
    receivingOrganizationId: secondBankId,
    note: "Sent with driver",
  });
  check("4.7 transfers units out", transferred.status === 200 && transferred.data?.ok === true, JSON.stringify(transferred.data));

  const selfTransfer = await bank.postJson(`/api/inventory/batches/${batchId}/transfers`, {
    units: 1,
    receivingOrganizationId: "00000000-0000-0000-0000-000000000000",
  });
  check(
    "4.7 refuses an unknown receiving bank",
    selfTransfer.status === 400 &&
      selfTransfer.data?.errors?.[0]?.message === "inventory.error.receivingBank",
  );

  const afterTransfer = await bank.get(`/bank/inventory/${batchId}`);
  check("4.7 shows where the units went", afterTransfer.text.includes("To Clifton Community Blood Bank"));

  // --- 4.4 archive (soft delete) --------------------------------------------
  const archiveFull = await bank.postJson(`/api/inventory/batches/${batchId}/archive`, {});
  check(
    "4.4 refuses to archive a batch that still holds units",
    archiveFull.status === 400 &&
      archiveFull.data?.errors?.[0]?.message === "inventory.error.batchNotEmpty",
  );

  const expired = await bank.postJson(`/api/inventory/batches/${batchId}/movements`, {
    type: "expired",
    note: "Reached expiry",
  });
  check("4.4 marks the batch expired", expired.status === 200 && expired.data?.ok === true);

  const emptied = await bank.get(`/bank/inventory/${batchId}`);
  check("4.4 writes an Expired movement", emptied.text.includes("Expired"));

  const archived = await bank.postJson(`/api/inventory/batches/${batchId}/archive`, {});
  check("4.4 archives an empty batch", archived.status === 200 && archived.data?.ok === true);

  const listAfter = await bank.get("/bank/inventory");
  check("4.4 archived batch leaves the list", !listAfter.text.includes(batchId ?? "missing"));

  const archivedDetail = await bank.get(`/bank/inventory/${batchId}`);
  check(
    "4.4 archived history stays reachable",
    archivedDetail.status === 200 && archivedDetail.text.includes("Removed from the list on"),
  );

  // --- 7.3 / 7.4 thresholds, low-stock alert, acknowledge -------------------
  const savedSettings = await bank.postJson("/api/inventory/settings", {
    thresholds: [{ bloodGroup: "B-", component: "Plasma", thresholdUnits: 10 }],
    warningDays: { Platelets: 2, "Whole blood": 7, "Red blood cells": 7, Plasma: 30 },
    smsAlerts: false,
  });
  check("7.3 saves the threshold and windows", savedSettings.status === 200 && savedSettings.data?.ok === true);

  const dashboard = await bank.get("/bank");
  check("7.3 low-stock alert appears on the dashboard", dashboard.text.includes("Low stock: B- Plasma"));

  const alertId = alertIdFor(dashboard.text, "Low stock: B- Plasma");
  check("7.4 alert has an id", Boolean(alertId), alertId ?? "not found");

  const acknowledged = await bank.postJson(`/api/inventory/alerts/${alertId}/acknowledge`, {});
  check("7.4 acknowledge succeeds", acknowledged.status === 200 && acknowledged.data?.ok === true);

  const afterAck = await bank.get("/bank");
  check("7.4 acknowledged alert leaves the dashboard", !afterAck.text.includes("Low stock: B- Plasma"));

  // --- access control -------------------------------------------------------
  const hospitalCreate = await hospital.postJson("/api/inventory/batches", {
    bloodGroup: "A+",
    component: "Whole blood",
    units: 1,
    status: "approved",
    expiresAt: expiry,
  });
  check("hospital cannot change blood-bank inventory (FR-ADM-01)", hospitalCreate.status === 403);

  const hospitalBankPage = await hospital.get("/bank/inventory");
  check(
    "hospital is redirected away from the blood-bank area (FR-VER-03)",
    hospitalBankPage.status === 307 || hospitalBankPage.status === 302,
    `status ${hospitalBankPage.status} -> ${hospitalBankPage.location ?? ""}`,
  );

  // --- summary --------------------------------------------------------------
  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (jsonPath) {
    await mkdir(dirname(jsonPath), { recursive: true });
    await writeFile(
      jsonPath,
      JSON.stringify({ startedAt, baseUrl: BASE_URL, results, failed: failed.length }, null, 2),
      "utf8",
    );
    console.log(`Results written to ${jsonPath}`);
  }
  process.exit(failed.length === 0 ? 0 : 1);
}

await main();
