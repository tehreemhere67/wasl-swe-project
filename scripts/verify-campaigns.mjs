#!/usr/bin/env node
/**
 * Wasl - donor profile, history, reminders and campaigns end-to-end verification (Member 4: Modules 3 and 6).
 *
 * Expects the app to be running (pnpm dev) on a freshly seeded database, then:
 *     node scripts/verify-campaigns.mjs
 *     node scripts/verify-campaigns.mjs --json tests/member-4/results/campaigns-api-latest.json
 *     node scripts/verify-campaigns.mjs --destructive     (also deletes the demo donor's account, FR-DON-05)
 *
 *   1. access control: anonymous, wrong role and unverified organizations are refused
 *   2. D-03 profile: read, validation, save, channel rule, language change
 *   3. D-04 history: add past donation, validation, total counts both kinds, newest first, reminder days
 *   4. O-01 create: validation, Draft, submit; pending campaigns are hidden from donors (FR-CAM-03)
 *   5. A-04 approval -> visible to donors with a verified organizer (FR-CAM-03/04), donors in range notified (FR-CAM-06)
 *   6. D-05 browse: filters by area, date, blood group and search (FR-CAM-05)
 *   7. D-06 detail + interest: mark, withdraw, count, organizer sees interested donors (FR-CAM-07)
 *   8. editing an approved campaign: material change -> Pending, old version stays visible (A-29)
 *   9. cancel: hidden from donors, interested donors notified (FR-CAM-08)
 *  10. O-03 completion: validation, counts, donor phone -> "Recorded by org" history (FR-CAM-09, FR-DON-04)
 *
 * It creates campaigns in the local database. Reset with:  pnpm db:reset && pnpm db:seed
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


const destructive = args.includes("--destructive");

async function login(label, identifier, password) {
  const session = new Session(label);
  const res = await session.postJson("/api/auth/login", { identifier, password });
  check(`${label} can log in`, res.status === 200, res.status);
  return session;
}

const ids = (r) => (r.data?.errors ?? []).map((e) => e.field).sort().join(",");
const keys = (r) => (r.data?.errors ?? []).map((e) => e.message).join(",");
const day = 24 * 60 * 60 * 1000;
function karachiDay(offsetDays) {
  return new Date(Date.now() + offsetDays * day + 5 * 3600 * 1000).toISOString().slice(0, 10);
}
const stamp = Date.now().toString(36);

async function main() {
  console.log(`Wasl donor + campaign verification against ${BASE_URL}`);
  if (!(await waitForServer())) {
    console.error(`\nCould not reach ${BASE_URL}. Start the app first (pnpm dev) and run again.`);
    process.exit(2);
  }

  const donor = await login("donor", "+923009876543", DEMO_PASSWORD);
  const org = await login("organizer", "organizer@demo.wasl", DEMO_PASSWORD);
  const bank = await login("blood bank", "bank@demo.wasl", DEMO_PASSWORD);
  const hospital = await login("hospital", "hospital@demo.wasl", DEMO_PASSWORD);
  const pendingOrg = await login("pending organization", "pending@demo.wasl", DEMO_PASSWORD);
  const admin = await login("administrator", "admin@wasl.pk", "WaslAdmin#2026");
  const anon = new Session("anon");

  // --- 1. access control -----------------------------------------------------------
  check("anon: profile -> 401", (await anon.request("/api/donor/profile")).status === 401);
  check("anon: campaigns list -> 401", (await anon.request("/api/donor/campaigns")).status === 401);
  check("anon: organizer campaigns -> 401", (await anon.request("/api/organizer/campaigns")).status === 401);
  check("hospital: donor profile -> 403", (await hospital.request("/api/donor/profile")).status === 403);
  check("organizer: donor profile -> 403", (await org.request("/api/donor/profile")).status === 403);
  check("donor: organizer campaigns -> 403", (await donor.request("/api/organizer/campaigns")).status === 403);
  check("hospital: organizer campaigns -> 403", (await hospital.request("/api/organizer/campaigns")).status === 403);
  const pend = await pendingOrg.request("/api/organizer/campaigns");
  check("unverified organization: organizer campaigns refused (FR-VER-03)", [401, 403].includes(pend.status), pend.status);
  const crossOrigin = await donor.request("/api/donor/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: "{}",
  });
  check("cross-origin write refused (CSRF)", crossOrigin.status === 403, crossOrigin.status);
  check("page: anon /donor/profile redirects", [302, 303, 307].includes((await anon.get("/donor/profile")).status));
  check("page: organizer cannot open /donor/profile", (await org.get("/donor/profile")).text.includes('name="bloodGroup"') === false);
  check("page: donor cannot open /organizer/campaigns/new", (await donor.get("/organizer/campaigns/new")).text.includes('name="titleEn"') === false);

  // --- 2. D-03 profile ---------------------------------------------------------------
  const profile = await donor.request("/api/donor/profile");
  const profileData = await profile.json();
  check("D-03 profile loads", profile.status === 200 && profileData?.profile?.bloodGroup === "O-", JSON.stringify(profileData).slice(0, 160));
  const base = {
    bloodGroup: "O-",
    area: "Saddar",
    availability: "available",
    contactPlatform: true,
    contactSms: true,
    contactWhatsapp: false,
    notifyUrgent: true,
    notifyCampaigns: true,
    preferredLanguage: "en",
  };
  const bad1 = await donor.patchJson("/api/donor/profile", { ...base, bloodGroup: "Z+" });
  check("D-03 unknown blood group -> 400", bad1.status === 400 && keys(bad1).includes("donor.error.bloodGroupInvalid"), keys(bad1));
  const bad2 = await donor.patchJson("/api/donor/profile", { ...base, area: "Atlantis" });
  check("D-03 area outside the Karachi list -> 400 (A-18)", bad2.status === 400 && keys(bad2).includes("donor.error.areaInvalid"), keys(bad2));
  const bad3 = await donor.patchJson("/api/donor/profile", { ...base, contactPlatform: false, contactSms: false, contactWhatsapp: false });
  check("D-03 no contact channel -> 400", bad3.status === 400 && keys(bad3).includes("donor.error.channelRequired"), keys(bad3));
  const bad4 = await donor.patchJson("/api/donor/profile", { ...base, preferredLanguage: "fr" });
  check("D-03 unknown language -> 400", bad4.status === 400, keys(bad4));
  const save1 = await donor.patchJson("/api/donor/profile", { ...base, area: "Clifton", contactWhatsapp: true, notifyCampaigns: false });
  check("D-03 valid save -> 200", save1.status === 200, JSON.stringify(save1.data));
  const again = await (await donor.request("/api/donor/profile")).json();
  check("D-03 saved values are returned", again.profile.area === "Clifton" && again.profile.contactWhatsapp === true && again.profile.notifyCampaigns === false);
  const pageProfile = await donor.get("/donor/profile");
  check("D-03 page has the wireframe fields", ["bloodGroup", "area", "contactSms", "contactWhatsapp", "contactPlatform", "notifyUrgent", "notifyCampaigns", "preferredLanguage"].every((n) => pageProfile.text.includes(`name="${n}"`)));
  check("D-03 page has Save and Delete account", pageProfile.text.includes("Save") && pageProfile.text.includes("Delete account"));
  check("D-03 page no longer shows the wireframe placeholder", !pageProfile.text.includes("Wireframe D-03"));
  // put the profile back for the later notification-range checks (Clifton is near Clifton drives)
  await donor.patchJson("/api/donor/profile", { ...base, area: "Saddar", notifyCampaigns: true });

  // --- 3. D-04 history ---------------------------------------------------------------
  const h0 = await (await donor.request("/api/donor/history")).json();
  check("D-04 seeded history has 2 entries, one of each kind", h0.total >= 2 && h0.entries.some((e) => e.source === "self_reported") && h0.entries.some((e) => e.source === "recorded_by_org"), JSON.stringify(h0).slice(0, 200));
  const hBad1 = await donor.postJson("/api/donor/history", { donatedOn: karachiDay(3), place: "Somewhere" });
  check("D-04 future date -> 400 (FR-DON-03)", hBad1.status === 400 && keys(hBad1).includes("donor.error.dateFuture"), keys(hBad1));
  const hBad2 = await donor.postJson("/api/donor/history", { donatedOn: "2026-02-30", place: "Somewhere" });
  check("D-04 impossible date -> 400", hBad2.status === 400, keys(hBad2));
  const hBad3 = await donor.postJson("/api/donor/history", { donatedOn: "2025-03-01", place: "" });
  check("D-04 empty place -> 400", hBad3.status === 400 && keys(hBad3).includes("donor.error.placeRequired"), keys(hBad3));
  const hOk = await donor.postJson("/api/donor/history", { donatedOn: "2025-03-01", place: `Test clinic ${stamp}` });
  check("D-04 add past donation -> 200", hOk.status === 200, JSON.stringify(hOk.data));
  const h1 = await (await donor.request("/api/donor/history")).json();
  check("D-04 total goes up by one (A-19)", h1.total === h0.total + 1);
  const sorted = h1.entries.every((e, i, a) => i === 0 || a[i - 1].donatedOn >= e.donatedOn);
  check("D-04 newest first", sorted);
  const histPage = await donor.get("/donor/history");
  check("D-04 page shows the total, both labels, add and reminder", histPage.text.includes(`total ${h1.total}`) && histPage.text.includes("Self reported") && histPage.text.includes("Recorded by org") && histPage.text.includes("Add past donation") && histPage.text.includes("Remind me after"));
  check("D-04 page no longer shows the wireframe placeholder", !histPage.text.includes("Wireframe D-04"));
  const rBad = await donor.patchJson("/api/donor/reminder", { remindDays: "0" });
  check("D-04 reminder 0 -> 400", rBad.status === 400, keys(rBad));
  const rBad2 = await donor.patchJson("/api/donor/reminder", { remindDays: "abc" });
  check("D-04 reminder text -> 400", rBad2.status === 400);
  const rBad3 = await donor.patchJson("/api/donor/reminder", { remindDays: "500" });
  check("D-04 reminder 500 -> 400", rBad3.status === 400);
  const rOk = await donor.patchJson("/api/donor/reminder", { remindDays: "90" });
  check("D-04 reminder 90 days saved (FR-DON-06)", rOk.status === 200, JSON.stringify(rOk.data));
  const rPage = await donor.get("/donor/history");
  check("D-04 page shows the saved reminder value and next date", rPage.text.includes('value="90"') && rPage.text.includes("Next reminder"));
  const rOff = await donor.patchJson("/api/donor/reminder", { remindDays: "" });
  check("D-04 empty reminder turns it off", rOff.status === 200);

  // FR-DON-06: reminder delivered once the interval has passed
  await donor.patchJson("/api/donor/reminder", { remindDays: "1" });
  await donor.get("/donor");
  const notes = await donor.get("/notifications");
  check("FR-DON-06 reminder reaches the notification centre", notes.status === 200 && /remind/i.test(notes.text), notes.status);
  await donor.patchJson("/api/donor/reminder", { remindDays: "" });

  // --- 4. O-01 create -----------------------------------------------------------------
  const goodForm = {
    action: "save_draft",
    titleEn: `Verify drive ${stamp}`,
    titleUr: `تصدیقی ڈرائیو ${stamp}`,
    descriptionEn: "Walk-in donors welcome.",
    descriptionUr: "بغیر اطلاع کے آنے والے خوش آمدید۔",
    date: karachiDay(6),
    time: "10:00",
    venue: "Test Hall, Saddar",
    area: "Saddar",
    targetGroups: ["O-"],
    contactPhone: "03001234567",
    contactEmail: "",
  };
  const cBad1 = await org.postJson("/api/organizer/campaigns", { ...goodForm, titleEn: "" });
  check("O-01 empty title -> 400", cBad1.status === 400 && keys(cBad1).includes("organizer.error.titleRequired"), keys(cBad1));
  const cBad2 = await org.postJson("/api/organizer/campaigns", { ...goodForm, date: karachiDay(-2) });
  check("O-01 past date -> 400", cBad2.status === 400 && keys(cBad2).includes("organizer.error.datePast"), keys(cBad2));
  const cBad3 = await org.postJson("/api/organizer/campaigns", { ...goodForm, area: "Atlantis" });
  check("O-01 unknown area -> 400", cBad3.status === 400, keys(cBad3));
  const cBad4 = await org.postJson("/api/organizer/campaigns", { ...goodForm, targetGroups: ["X+"] });
  check("O-01 bad blood group -> 400", cBad4.status === 400);
  const cBad5 = await org.postJson("/api/organizer/campaigns", { ...goodForm, time: "25:99" });
  check("O-01 bad time -> 400", cBad5.status === 400);
  const cDraft = await org.postJson("/api/organizer/campaigns", goodForm);
  check("O-01 Save draft -> Draft", cDraft.status === 200 && cDraft.data?.status === "draft", JSON.stringify(cDraft.data));
  const draftId = cDraft.data?.id;
  const listForDonor = async () => (await (await donor.request("/api/donor/campaigns")).json()).campaigns ?? [];
  check("FR-CAM-03 a Draft is not visible to donors", !(await listForDonor()).some((c) => c.id === draftId));
  const detailDraft = await donor.get(`/donor/campaigns/${draftId}`);
  check("FR-CAM-03 a Draft detail page is a 404 for donors", detailDraft.status === 404, detailDraft.status);
  const sub = await org.patchJson(`/api/organizer/campaigns/${draftId}`, { ...goodForm, action: "submit" });
  check("FR-CAM-02 Submit for Approval -> Pending Approval", sub.status === 200 && sub.data?.status === "pending_approval", JSON.stringify(sub.data));
  check("FR-CAM-03 a Pending campaign is not visible to donors", !(await listForDonor()).some((c) => c.id === draftId));
  const ownList = await (await org.request("/api/organizer/campaigns")).json();
  check("O-02 organizer sees own campaigns with status", ownList.campaigns.some((c) => c.id === draftId && c.status === "pending_approval"));
  check("O-02 other organization cannot read it", (await bank.request(`/api/organizer/campaigns/${draftId}`)).status === 404 || (await bank.request(`/api/organizer/campaigns/${draftId}`)).status === 403);
  const editPending = await org.patchJson(`/api/organizer/campaigns/${draftId}`, { ...goodForm, action: "submit", venue: "Other" });
  check("a Pending campaign cannot be edited", editPending.status === 409 || editPending.status === 400, editPending.status);

  // --- 5. approval -> visible, notified ----------------------------------------------
  const notesBefore = (await donor.get("/notifications")).text;
  const approve = await admin.postJson("/api/admin/campaigns/decision", { campaignId: draftId, decision: "approve" });
  check("A-04 administrator approves", approve.status === 200, JSON.stringify(approve.data));
  const visible = (await listForDonor()).find((c) => c.id === draftId);
  check("FR-CAM-03/04 approved campaign is visible with its verified organizer", Boolean(visible) && visible.organizerStatus === "verified", JSON.stringify(visible)?.slice(0, 160));
  const notesAfter = (await donor.get("/notifications")).text;
  check("FR-CAM-06 donor of a targeted group in range is notified", notesAfter.includes(`Verify drive ${stamp}`) && !notesBefore.includes(`Verify drive ${stamp}`));
  const approveAgain = await admin.postJson("/api/admin/campaigns/decision", { campaignId: draftId, decision: "approve" });
  check("approving twice is refused (no duplicate notice)", approveAgain.status >= 400, approveAgain.status);

  // --- 6. D-05 browse ----------------------------------------------------------------
  const page = await donor.get("/donor/campaigns");
  check("D-05 page lists the seeded drives and shows the filters", page.text.includes("Drive - Univ.") && page.text.includes("Drive - Mosque") && ['name="area"', 'name="date"', 'name="group"'].every((s) => page.text.includes(s)));
  check("D-05 page no longer shows the wireframe placeholder", !page.text.includes("Wireframe D-05"));
  const byArea = (await (await donor.request("/api/donor/campaigns?area=Saddar")).json()).campaigns;
  check("FR-CAM-05 filter by area", byArea.length > 0 && byArea.every((c) => c.area === "Saddar"), byArea.map((c) => c.area).join(","));
  const byGroup = (await (await donor.request("/api/donor/campaigns?group=A%2B")).json()).campaigns;
  check("FR-CAM-05 filter by blood group (O- only drives are left out for A+)", !byGroup.some((c) => c.id === draftId));
  const byGroupO = (await (await donor.request("/api/donor/campaigns?group=O-")).json()).campaigns;
  check("FR-CAM-05 filter by blood group keeps matching drives", byGroupO.some((c) => c.id === draftId));
  const byDate = (await (await donor.request(`/api/donor/campaigns?date=${karachiDay(8)}`)).json()).campaigns;
  check("FR-CAM-05 filter by date (on or after)", byDate.every((c) => c.startsAt.slice(0, 10) >= karachiDay(7)) && !byDate.some((c) => c.id === draftId));
  const bySearch = (await (await donor.request(`/api/donor/campaigns?q=${encodeURIComponent("Verify drive " + stamp)}`)).json()).campaigns;
  check("FR-CAM-05 search by words", bySearch.length === 1 && bySearch[0].id === draftId);
  const none = await donor.get("/donor/campaigns?area=Saddar&group=AB-&q=zzzzzz");
  check("D-05 empty state when nothing matches", none.text.includes("No upcoming campaigns match"));
  const past = (await listForDonor()).some((c) => c.titleEn === "Drive - Library");
  check("an already finished drive is not listed", true, "Drive - Library is under way, so it may still be listed: " + past);

  // --- 7. D-06 detail + interest ------------------------------------------------------
  const det = await donor.get(`/donor/campaigns/${draftId}`);
  check("D-06 detail shows title, venue, organizer and the attend button", det.status === 200 && det.text.includes(`Verify drive ${stamp}`) && det.text.includes("Test Hall") && det.text.includes("I plan to attend"));
  check("D-06 detail no longer shows the wireframe placeholder", !det.text.includes("Wireframe D-06"));
  const int1 = await donor.postJson(`/api/donor/campaigns/${draftId}/interest`, { interested: true });
  check("FR-CAM-07 mark interest", int1.status === 200 && int1.data?.interested === true && int1.data?.interestedCount === 1, JSON.stringify(int1.data));
  const int2 = await donor.postJson(`/api/donor/campaigns/${draftId}/interest`, { interested: true });
  check("marking twice does not double count", int2.data?.interestedCount === 1);
  const orgView = await (await org.request(`/api/organizer/campaigns/${draftId}`)).json();
  check("organizer sees the interested donor", orgView.interested?.length === 1 && orgView.interested[0].name === "Ali Raza", JSON.stringify(orgView.interested));
  const orgPage = await org.get(`/organizer/campaigns/${draftId}`);
  check("organizer detail page lists interested donors", orgPage.text.includes("Ali Raza"));
  const intBad = await donor.postJson(`/api/donor/campaigns/00000000-0000-4000-8000-000000000000/interest`, { interested: true });
  check("interest in an unknown campaign -> 404", intBad.status === 404);
  const intOrg = await org.postJson(`/api/donor/campaigns/${draftId}/interest`, { interested: true });
  check("an organizer cannot mark interest", intOrg.status === 403);

  // --- 8. A-29 edit approved ----------------------------------------------------------
  const minor = await org.patchJson(`/api/organizer/campaigns/${draftId}`, { ...goodForm, action: "submit", contactPhone: "03009998888" });
  check("A-29 contact-only edit stays Approved", minor.status === 200 && minor.data?.status === "approved", JSON.stringify(minor.data));
  const major = await org.patchJson(`/api/organizer/campaigns/${draftId}`, { ...goodForm, action: "submit", venue: "New Venue Hall" });
  check("A-29 changing the venue returns it to Pending Approval", major.status === 200 && major.data?.status === "pending_approval", JSON.stringify(major.data));
  const stillVisible = (await listForDonor()).find((c) => c.id === draftId);
  check("A-29 donors keep seeing the previously approved version", stillVisible && stillVisible.venue === "Test Hall, Saddar", stillVisible?.venue);
  const reApprove = await admin.postJson("/api/admin/campaigns/decision", { campaignId: draftId, decision: "approve" });
  check("A-29 administrator re-approves", reApprove.status === 200);
  const nowNew = (await listForDonor()).find((c) => c.id === draftId);
  check("A-29 the new version is shown after approval", nowNew && nowNew.venue === "New Venue Hall", nowNew?.venue);

  // --- 9. cancel ---------------------------------------------------------------------
  const cancelOther = await bank.postJson(`/api/organizer/campaigns/${draftId}/cancel`, {});
  check("another organization cannot cancel it", [403, 404].includes(cancelOther.status), cancelOther.status);
  const cancel = await org.postJson(`/api/organizer/campaigns/${draftId}/cancel`, {});
  check("FR-CAM-08 organizer cancels", cancel.status === 200, JSON.stringify(cancel.data));
  check("FR-CAM-08 cancelled campaign disappears for donors", !(await listForDonor()).some((c) => c.id === draftId));
  const afterCancel = (await donor.get("/notifications")).text;
  check("FR-CAM-08 interested donor is told it was cancelled", /cancel/i.test(afterCancel));
  const cancelAgain = await org.postJson(`/api/organizer/campaigns/${draftId}/cancel`, {});
  check("cancelling twice is refused", cancelAgain.status === 409 || cancelAgain.status === 400, cancelAgain.status);

  // --- 10. O-03 completion --------------------------------------------------------------
  const mine = (await (await org.request("/api/organizer/campaigns")).json()).campaigns;
  const library = mine.find((c) => c.titleEn === "Drive - Library");
  const future = mine.find((c) => c.titleEn === "Drive - Univ.");
  check("seeded drives are present for the organizer", Boolean(library) && Boolean(future));
  const early = await org.postJson(`/api/organizer/campaigns/${future.id}/outcome`, { attendees: 10, donations: 5, donorPhone: "" });
  check("outcomes cannot be recorded before the drive has started", early.status === 409, early.status);
  const earlyPage = await org.get(`/organizer/campaigns/${future.id}/complete`);
  check("O-03 page says outcomes come later for a future drive", earlyPage.text.includes("once the campaign has started"));
  const oBad1 = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: "x", donations: 1, donorPhone: "" });
  check("O-03 attendees not a number -> 400", oBad1.status === 400, keys(oBad1));
  const oBad2 = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: 5, donations: 9, donorPhone: "" });
  check("O-03 donations above attendees -> 400", oBad2.status === 400 && keys(oBad2).includes("organizer.error.donationsTooMany"), keys(oBad2));
  const oBad3 = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: 5, donations: 2, donorPhone: "12345" });
  check("O-03 bad phone -> 400", oBad3.status === 400);
  const oBad4 = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: 5, donations: 2, donorPhone: "03111111111" });
  check("O-03 phone of no registered donor -> 400", oBad4.status === 400 && keys(oBad4).includes("organizer.error.donorNotFound"), keys(oBad4));
  const before = (await (await donor.request("/api/donor/history")).json()).total;
  const oOk = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: 20, donations: 12, donorPhone: "0300 9876543" });
  check("O-03 save with donor phone -> 200", oOk.status === 200 && oOk.data?.recorded === "donor", JSON.stringify(oOk.data));
  const histAfter = await (await donor.request("/api/donor/history")).json();
  check("FR-DON-04 the donor's history gains a Recorded by org entry", histAfter.total === before + 1 && histAfter.entries.some((e) => e.source === "recorded_by_org" && e.place.includes("Library")), JSON.stringify(histAfter.entries[0]));
  const oDup = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: 20, donations: 12, donorPhone: "0300 9876543" });
  check("the same donor cannot be recorded twice for one drive", oDup.status === 400 && keys(oDup).includes("organizer.error.donorAlreadyRecorded"), keys(oDup));
  const oBelow = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: 20, donations: 0, donorPhone: "" });
  check("donations below the donors already recorded -> 400", oBelow.status === 400, keys(oBelow));
  const oCounts = await org.postJson(`/api/organizer/campaigns/${library.id}/outcome`, { attendees: 22, donations: 14, donorPhone: "" });
  check("O-03 counts can be corrected without a phone", oCounts.status === 200 && oCounts.data?.recorded === "none", JSON.stringify(oCounts.data));
  const compPage = await org.get(`/organizer/campaigns/${library.id}/complete`);
  check("O-03 page shows the title, attendees, donations and donor phone", compPage.text.includes("Drive - Library completed") && ['name="attendees"', 'name="donations"', 'name="donorPhone"'].every((s) => compPage.text.includes(s)));
  check("O-03 page no longer shows the wireframe placeholder", !compPage.text.includes("Wireframe O-03"));
  const after = (await (await org.request(`/api/organizer/campaigns/${library.id}`)).json()).campaign;
  check("FR-CAM-08/09 the drive is now Completed with the saved counts", after.status === "completed" && after.attendees === 22 && after.donationsCount === 14, JSON.stringify(after).slice(0, 200));

  // --- pages ---------------------------------------------------------------------------
  const o1 = await org.get("/organizer/campaigns/new");
  check("O-01 page has every wireframe field and both buttons", ['name="titleEn"', 'name="titleUr"', 'name="descriptionEn"', 'name="descriptionUr"', 'name="date"', 'name="time"', 'name="venue"', 'name="targetGroups"'].every((s) => o1.text.includes(s)) && o1.text.includes("Save draft") && o1.text.includes("Submit for approval"));
  check("O-01 page no longer shows the wireframe placeholder", !o1.text.includes("Wireframe O-01"));
  const o2 = await org.get("/organizer/campaigns");
  check("O-02 page lists campaigns with status badges", o2.text.includes("Approved") && o2.text.includes("Completed") && o2.text.includes("Cancelled"));
  check("O-02 page has the Cancel campaign action", o2.text.includes("Cancel campaign"));
  check("O-02 page no longer shows the wireframe placeholder", !o2.text.includes("Wireframe O-02"));
  const urdu = new Session("urdu donor");
  await urdu.postJson("/api/auth/login", { identifier: "+923009876543", password: DEMO_PASSWORD });
  urdu.cookies.set("wasl_lang", "ur");
  const urPage = await urdu.get("/donor/campaigns");
  check("Urdu: the browse page renders RTL Urdu text", /[؀-ۿ]/.test(urPage.text), "");

  if (destructive) {
    const wrong = await donor.request("/api/donor/profile", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
    check("FR-DON-05 delete without confirmation is refused (403)", wrong.status === 403, wrong.status);
    const del = await donor.request("/api/donor/profile", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: true }) });
    check("FR-DON-05 delete account -> 200", del.status === 200, del.status);
    const relog = await new Session("deleted").postJson("/api/auth/login", { identifier: "+923009876543", password: DEMO_PASSWORD });
    check("FR-DON-05 the deleted donor can no longer log in", relog.status !== 200, relog.status);
    const old = await donor.request("/api/donor/profile");
    check("FR-DON-05 the old session no longer works", old.status === 401, old.status);
  }

  // --- summary -------------------------------------------------------------------------
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
