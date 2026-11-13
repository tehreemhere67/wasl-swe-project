#!/usr/bin/env node
/**
 * Wasl — end-to-end API lifecycle verification (Member 1: account & verification flows).
 *
 * Starts nothing: it expects the app to be running. In one terminal:
 *     pnpm dev
 * In another:
 *     pnpm verify:api
 *
 * It exercises the real HTTP API with real cookies, so it covers the modules that
 * the plain-Node unit suite cannot (database, sessions, guards, OTP, notifications):
 *
 *   1. OTP issue -> donor signup -> login -> donor area
 *   2. consent required (DR-03) and wrong OTP rejected (FR-DON-01)
 *   3. forgot password -> reset -> old password invalid (secure reset)
 *   4. lockout on the 5th failed login, correct password refused while locked (NFR-SEC-02)
 *   5. organisation registration with a supporting document -> Pending (FR-VER-01)
 *   6. Pending organisation blocked from operational screens (FR-VER-03)
 *   7. registration without a document refused
 *   8. administrator approves -> organisation can operate (FR-VER-02)
 *   9. administrator suspends -> access lost (FR-VER-04)
 *  10. rejected organisation sees the reason and can re-apply (A-04)
 *  11. every signed-in standalone page (account status, notification centre) has the
 *      authenticated header with the profile menu and Log out
 *
 * WARNING: this script creates test accounts/organisations and re-applies the seeded
 * "rejected" organisation in the local development database. To get back to the clean
 * demo data afterwards:  pnpm db:reset && pnpm db:seed
 *
 * Usage:
 *   node scripts/verify-api-lifecycle.mjs [baseUrl]
 *   BASE_URL=http://localhost:3000 node scripts/verify-api-lifecycle.mjs
 *   node scripts/verify-api-lifecycle.mjs --json results/api-lifecycle.json
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const jsonFlagIndex = args.indexOf("--json");
const jsonPath = jsonFlagIndex >= 0 ? args[jsonFlagIndex + 1] : null;
const positional = args.filter((value, index) => !value.startsWith("--") && index !== jsonFlagIndex + 1);
const BASE_URL = (process.env.BASE_URL || positional[0] || "http://127.0.0.1:3000").replace(/\/$/, "");
const ORIGIN = { origin: BASE_URL };

const results = [];
const startedAt = new Date();

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  results.push({ name, ok, detail: detail === "" ? "" : String(detail).slice(0, 400) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? `  :: ${String(detail).slice(0, 240)}` : ""}`);
  return ok;
}

function randomDigits(length) {
  let out = "";
  for (let index = 0; index < length; index += 1) out += Math.floor(Math.random() * 10);
  return out;
}

const newMobile = () => `0300${randomDigits(7)}`; // 11 digits, valid Pakistani mobile
const newEmail = (prefix) => `${prefix}${randomDigits(6)}@e2e.wasl`;
const DEMO_PASSWORD = "WaslDemo#2026";
const NEW_PASSWORD = "NewPass#2026";
const RESET_PASSWORD = "ResetPass#2026";

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

  async postForm(path, fields) {
    const response = await this.request(path, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString(),
    });
    return { status: response.status, location: response.headers.get("location") };
  }

  async postMultipart(path, fields, file) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    form.set("document", new Blob([file.bytes], { type: file.type }), file.name);
    const response = await this.request(path, { method: "POST", body: form });
    const data = await response.json().catch(() => null);
    return { status: response.status, data };
  }

  async get(path) {
    const response = await this.request(path);
    const text = await response.text();
    return { status: response.status, location: response.headers.get("location"), text };
  }
}

/** A real 1x1 PNG, used as the supporting document. */
const PNG = {
  name: "licence.png",
  type: "image/png",
  bytes: Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
      "0000000d49444154789c63600000020001000500010d0a2db40000000049454e44ae426082",
    "hex",
  ),
};

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

async function main() {
  console.log(`Wasl API lifecycle verification against ${BASE_URL}`);
  if (!(await waitForServer())) {
    console.error(`\nCould not reach ${BASE_URL}. Start the app first (pnpm dev) and run again.`);
    process.exit(2);
  }

  // ---------------------------------------------------------------- donor signup
  const mobile = newMobile();
  const anonymous = new Session("anonymous");
  const otp = await anonymous.postJson("/api/auth/otp/send", { phone: mobile, purpose: "donor_signup" });
  check("OTP send returns a development code (IR-07)", otp.data?.ok && otp.data?.devCode, JSON.stringify(otp.data));

  const signup = await anonymous.postJson("/api/auth/donor/signup", {
    name: "E2E Donor",
    mobile,
    code: otp.data?.devCode,
    password: NEW_PASSWORD,
    confirmPassword: NEW_PASSWORD,
    consent: true,
  });
  check("donor signup creates an account and a session", signup.data?.ok && signup.data?.redirect === "/donor", JSON.stringify(signup.data));

  const donor = new Session("donor");
  const donorLogin = await donor.postJson("/api/auth/login", { identifier: mobile, password: NEW_PASSWORD });
  check("donor can log in with the signup password", donorLogin.data?.ok, JSON.stringify(donorLogin.data));
  const donorPage = await donor.get("/donor");
  check("donor area renders for the new donor", donorPage.status === 200, donorPage.status);

  // ------------------------------------------------------- validation refusals
  const noConsent = await anonymous.postJson("/api/auth/donor/signup", {
    name: "No Consent",
    mobile: newMobile(),
    code: "123456",
    password: NEW_PASSWORD,
    confirmPassword: NEW_PASSWORD,
  });
  check("signup without consent is refused (DR-03)", !noConsent.data?.ok, JSON.stringify(noConsent.data));

  const mobileWrong = newMobile();
  const otpWrong = await anonymous.postJson("/api/auth/otp/send", { phone: mobileWrong, purpose: "donor_signup" });
  const wrongCode = otpWrong.data?.devCode === "000000" ? "111111" : "000000";
  const wrongOtp = await anonymous.postJson("/api/auth/donor/signup", {
    name: "Wrong Code",
    mobile: mobileWrong,
    code: wrongCode,
    password: NEW_PASSWORD,
    confirmPassword: NEW_PASSWORD,
    consent: true,
  });
  check("wrong OTP is rejected", wrongOtp.data?.error?.code === "otp", JSON.stringify(wrongOtp.data));

  // ----------------------------------------------------------- password reset
  const forgot = await anonymous.postJson("/api/auth/password/forgot", { mobile });
  check("forgot password returns a development code", forgot.data?.ok && forgot.data?.devCode, JSON.stringify(forgot.data));

  const reset = await anonymous.postJson("/api/auth/password/reset", {
    mobile,
    code: forgot.data?.devCode,
    password: RESET_PASSWORD,
    confirmPassword: RESET_PASSWORD,
  });
  check("password reset succeeds", reset.data?.ok, JSON.stringify(reset.data));

  const oldLogin = await new Session("old").postJson("/api/auth/login", { identifier: mobile, password: NEW_PASSWORD });
  check("old password no longer works", oldLogin.data?.error?.code === "invalid", JSON.stringify(oldLogin.data));
  const newLogin = await new Session("new").postJson("/api/auth/login", { identifier: mobile, password: RESET_PASSWORD });
  check("new password works", newLogin.data?.ok, JSON.stringify(newLogin.data));

  // ----------------------------------------------------------------- lockout
  const attempts = [];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await new Session("lock").postJson("/api/auth/login", {
      identifier: mobile,
      password: "WrongPass#1",
    });
    attempts.push(response.status);
  }
  check("account locks on the 5th failed login (NFR-SEC-02)", attempts[4] === 429, JSON.stringify(attempts));

  const lockedCorrect = await new Session("lock").postJson("/api/auth/login", { identifier: mobile, password: RESET_PASSWORD });
  check("even the correct password is refused while locked", lockedCorrect.status === 429, lockedCorrect.status);

  // ------------------------------------------------- organisation registration
  const email = newEmail("e2e-hospital");
  const phone = newMobile();
  const orgSession = new Session("org");
  const orgRegistration = await orgSession.postMultipart(
    "/api/auth/org/register",
    {
      type: "hospital",
      name: "E2E Test Hospital",
      address: "Testing Road, Karachi",
      officialPhone: phone,
      officialEmail: email,
      licenceNumber: "E2E-KHI-9001",
      representativeName: "Dr. E2E",
      representativeDesignation: "Medical Superintendent",
      password: DEMO_PASSWORD,
      confirmPassword: DEMO_PASSWORD,
    },
    PNG,
  );
  check(
    "organisation registration with a document succeeds",
    orgRegistration.data?.ok && orgRegistration.data?.redirect === "/status",
    JSON.stringify(orgRegistration.data),
  );

  const pendingStatus = await orgSession.get("/status");
  check("new organisation sees the Pending status screen (G-04)", pendingStatus.status === 200 && pendingStatus.text.includes("Pending"), pendingStatus.status);
  check(
    "signed-in status page shows the authenticated header with a logout control",
    pendingStatus.text.includes("Log out") && pendingStatus.text.includes("Pending"),
    pendingStatus.status,
  );

  const blocked = await orgSession.get("/hospital");
  check("Pending organisation is blocked from operational screens (FR-VER-03)", blocked.status === 307 && (blocked.location ?? "").endsWith("/status"), `${blocked.status} ${blocked.location}`);

  const missingDocument = await new Session("nodoc").postForm("/api/auth/org/register", {
    type: "hospital",
    name: "No Doc Hospital",
    address: "Testing Road, Karachi",
    officialPhone: newMobile(),
    officialEmail: newEmail("nodoc"),
    licenceNumber: "E2E-9002",
    representativeName: "Dr. NoDoc",
    representativeDesignation: "Manager",
    password: DEMO_PASSWORD,
    confirmPassword: DEMO_PASSWORD,
  });
  check("registration without a supporting document is refused (FR-VER-01)", missingDocument.status === 400, missingDocument.status);

  // ------------------------------------------------------- administrator flow
  const admin = new Session("admin");
  const adminLogin = await admin.postJson("/api/auth/login", { identifier: "admin@wasl.pk", password: "WaslAdmin#2026" });
  check("seeded administrator logs in and lands on /admin", adminLogin.data?.ok && adminLogin.data?.redirect === "/admin", JSON.stringify(adminLogin.data));

  const adminNotifications = await admin.get("/notifications");
  check(
    "signed-in notification centre shows the authenticated header with a logout control",
    adminNotifications.status === 200 && adminNotifications.text.includes("Log out"),
    adminNotifications.status,
  );

  const queue = await admin.get("/admin/verifications?tab=all");
  const namePosition = queue.text.indexOf("E2E Test Hospital");
  const nearby = namePosition > 0 ? queue.text.slice(Math.max(0, namePosition - 5000), namePosition) : "";
  const organizationIds = [...nearby.matchAll(/org=([0-9a-f-]{36})/g)].map((match) => match[1]);
  const organizationId = organizationIds.at(-1) ?? null;
  check("new registration appears in the administrator queue (A-02)", Boolean(organizationId), organizationId ?? "not found");

  if (organizationId) {
    const approved = await admin.postJson("/api/admin/verify", { organizationId, decision: "approved", reason: "" });
    check("administrator approves the registration (FR-VER-02)", approved.data?.ok, JSON.stringify(approved.data));

    const approvedOrg = new Session("approved-org");
    const approvedLogin = await approvedOrg.postJson("/api/auth/login", { identifier: email, password: DEMO_PASSWORD });
    check("approved organisation is routed to its area", approvedLogin.data?.ok && approvedLogin.data?.redirect === "/hospital", JSON.stringify(approvedLogin.data));
    const hospitalPage = await approvedOrg.get("/hospital");
    check("approved organisation can open its operational area", hospitalPage.status === 200, hospitalPage.status);

    const suspended = await admin.postJson("/api/admin/verify", { organizationId, decision: "suspended", reason: "E2E suspension check" });
    check("administrator suspends the organisation (FR-VER-04)", suspended.data?.ok, JSON.stringify(suspended.data));
    const suspendedPage = await approvedOrg.get("/hospital");
    check("suspended organisation loses operational access (FR-VER-04)", suspendedPage.status === 307 && (suspendedPage.location ?? "").endsWith("/status"), `${suspendedPage.status} ${suspendedPage.location}`);
  }

  // ------------------------------------------------ rejected organisation flow
  const rejected = new Session("rejected-org");
  const rejectedLogin = await rejected.postJson("/api/auth/login", { identifier: "rejected@demo.wasl", password: DEMO_PASSWORD });
  check("seeded rejected organisation sees the status screen", rejectedLogin.data?.ok && rejectedLogin.data?.redirect === "/status", JSON.stringify(rejectedLogin.data));

  const rejectedStatus = await rejected.get("/status");
  check("status screen shows the rejection", rejectedStatus.text.includes("Rejected"), rejectedStatus.status);

  const reapply = await rejected.postForm("/api/organization/reapply", {});
  check("rejected organisation can re-apply (A-04)", reapply.status === 303, reapply.status);
  const afterReapply = await rejected.get("/status");
  check("after re-applying the status returns to Pending", afterReapply.text.includes("Pending"), afterReapply.status);

  // ------------------------------------------------------------------ summary
  const failed = results.filter((result) => !result.ok);
  const summary = {
    baseUrl: BASE_URL,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    checks: results,
  };

  console.log(`\nRESULT: ${summary.total} checks, ${summary.passed} passed, ${summary.failed} failed`);

  if (jsonPath) {
    await mkdir(dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`Results written to ${jsonPath}`);
  }

  if (failed.length > 0) {
    console.log("\nFailed checks:");
    for (const failure of failed) console.log(` - ${failure.name} :: ${failure.detail}`);
  } else {
    console.log("\nTip: this run changed the local database. For clean demo data run: pnpm db:reset && pnpm db:seed");
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
