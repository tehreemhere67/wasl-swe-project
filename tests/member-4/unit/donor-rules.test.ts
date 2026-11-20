/**
 * Member 4 - Module 3 unit tests: donor profile, donation history, reminders, campaign-notice targeting.
 * Pure functions only (no database, no Next.js).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  anonymizedDonor,
  daysBetween,
  haversineKm,
  isIsoDate,
  isReminderDue,
  reminderDueDate,
  shouldNotifyDonorOfCampaign,
  summarizeHistory,
  todayInKarachi,
  validateDonationInput,
  validateProfileInput,
  validateReminderDays,
} from "../../../src/lib/donor/rules";

const AREAS = ["Saddar", "Clifton", "Gulshan-e-Iqbal"];
const GEO = [
  { name: "Saddar", lat: 24.86, lng: 67.01 },
  { name: "Clifton", lat: 24.82, lng: 67.03 },
  { name: "Far", lat: 25.5, lng: 68.4 },
];
const good = {
  bloodGroup: "O-",
  area: "Saddar",
  availability: "available",
  contactPlatform: true,
  contactSms: false,
  contactWhatsapp: false,
  notifyUrgent: true,
  notifyCampaigns: true,
  preferredLanguage: "en",
};
const fields = (r: { ok: boolean; errors?: { field: string; message: string }[] }) =>
  (r.errors ?? []).map((e) => `${e.field}:${e.message}`);

describe("D-03 profile validation (FR-DON-02, FR-DON-05, A-18)", () => {
  test("a complete profile is accepted", () => {
    assert.equal(validateProfileInput(good, AREAS).ok, true);
  });
  test("blood group is required and must be one of the eight", () => {
    assert.deepEqual(fields(validateProfileInput({ ...good, bloodGroup: "" }, AREAS)), ["bloodGroup:donor.error.bloodGroupRequired"]);
    assert.deepEqual(fields(validateProfileInput({ ...good, bloodGroup: "Z+" }, AREAS)), ["bloodGroup:donor.error.bloodGroupInvalid"]);
    for (const g of ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]) assert.equal(validateProfileInput({ ...good, bloodGroup: g }, AREAS).ok, true, g);
  });
  test("area must be on the administrator's Karachi list", () => {
    assert.deepEqual(fields(validateProfileInput({ ...good, area: "Atlantis" }, AREAS)), ["area:donor.error.areaInvalid"]);
    assert.deepEqual(fields(validateProfileInput({ ...good, area: "" }, AREAS)), ["area:donor.error.areaRequired"]);
  });
  test("at least one contact channel must stay on", () => {
    const r = validateProfileInput({ ...good, contactPlatform: false, contactSms: false, contactWhatsapp: false }, AREAS);
    assert.deepEqual(fields(r), ["channels:donor.error.channelRequired"]);
  });
  test("SMS or WhatsApp alone is enough", () => {
    assert.equal(validateProfileInput({ ...good, contactPlatform: false, contactSms: true }, AREAS).ok, true);
    assert.equal(validateProfileInput({ ...good, contactPlatform: false, contactWhatsapp: true }, AREAS).ok, true);
  });
  test("language must be English or Urdu", () => {
    assert.equal(validateProfileInput({ ...good, preferredLanguage: "ur" }, AREAS).ok, true);
    assert.deepEqual(fields(validateProfileInput({ ...good, preferredLanguage: "fr" }, AREAS)), ["preferredLanguage:donor.error.languageInvalid"]);
  });
  test("availability must be available or not available", () => {
    assert.equal(validateProfileInput({ ...good, availability: "not_available" }, AREAS).ok, true);
    assert.deepEqual(fields(validateProfileInput({ ...good, availability: "maybe" }, AREAS)), ["availability:donor.error.availabilityInvalid"]);
  });
  test("several problems are all reported at once", () => {
    assert.equal(fields(validateProfileInput({ ...good, bloodGroup: "", area: "", contactPlatform: false }, AREAS)).length, 3);
  });
  test("form-style values on/true/1 count as ticked, anything else does not", () => {
    for (const on of [true, "true", "on", 1, "1"]) assert.equal(validateProfileInput({ ...good, contactPlatform: false, contactSms: on }, AREAS).ok, true, String(on));
    for (const off of ["yes", 2, "", null, undefined, "false"]) assert.equal(validateProfileInput({ ...good, contactPlatform: off, contactSms: false, contactWhatsapp: false }, AREAS).ok, false, String(off));
  });
});

describe("D-04 past donation validation (FR-DON-03)", () => {
  const now = new Date("2026-11-20T07:00:00Z");
  test("a past date with a place is accepted", () => {
    assert.equal(validateDonationInput({ donatedOn: "2026-01-12", place: "Aga Khan" }, now).ok, true);
  });
  test("today is accepted, tomorrow is not", () => {
    assert.equal(validateDonationInput({ donatedOn: "2026-11-20", place: "X1" }, now).ok, true);
    assert.deepEqual(fields(validateDonationInput({ donatedOn: "2026-11-21", place: "X1" }, now)), ["donatedOn:donor.error.dateFuture"]);
  });
  test("the Karachi day decides, not UTC (19:30 UTC is already the next day in Karachi)", () => {
    const late = new Date("2026-11-20T19:30:00Z");
    assert.equal(todayInKarachi(late), "2026-11-21");
    assert.equal(validateDonationInput({ donatedOn: "2026-11-21", place: "X1" }, late).ok, true);
  });
  test("impossible or malformed dates are refused", () => {
    for (const bad of ["", "2026-02-30", "20-11-2026", "yesterday", "2026-13-01"])
      assert.deepEqual(fields(validateDonationInput({ donatedOn: bad, place: "Aga Khan" }, now)), ["donatedOn:donor.error.dateInvalid"], bad);
  });
  test("place is required and limited to 120 characters", () => {
    assert.deepEqual(fields(validateDonationInput({ donatedOn: "2026-01-12", place: "  " }, now)), ["place:donor.error.placeRequired"]);
    assert.deepEqual(fields(validateDonationInput({ donatedOn: "2026-01-12", place: "x".repeat(121) }, now)), ["place:donor.error.placeTooLong"]);
    assert.equal(validateDonationInput({ donatedOn: "2026-01-12", place: "x".repeat(120) }, now).ok, true);
  });
  test("isIsoDate checks real calendar days (leap years included)", () => {
    assert.equal(isIsoDate("2024-02-29"), true);
    assert.equal(isIsoDate("2026-02-29"), false);
  });
});

describe("D-04 history summary (FR-DON-03/04, A-19)", () => {
  const entries = [
    { id: "a", donatedOn: "2026-01-12", place: "P", source: "self_reported" as const },
    { id: "b", donatedOn: "2026-06-03", place: "Q", source: "recorded_by_org" as const },
    { id: "c", donatedOn: "2025-03-01", place: "R", source: "self_reported" as const },
  ];
  test("the total counts self reported and recorded-by-organization donations alike", () => {
    assert.equal(summarizeHistory(entries).total, 3);
  });
  test("newest first, and the last donation date is the newest", () => {
    const s = summarizeHistory(entries);
    assert.deepEqual(s.entries.map((e) => e.id), ["b", "a", "c"]);
    assert.equal(s.lastDonationOn, "2026-06-03");
  });
  test("an empty history has total 0 and no last date", () => {
    assert.deepEqual(summarizeHistory([]), { total: 0, entries: [], lastDonationOn: null });
  });
  test("same-day entries keep a stable order", () => {
    const s = summarizeHistory([
      { id: "z", donatedOn: "2026-01-01", place: "P", source: "self_reported" },
      { id: "m", donatedOn: "2026-01-01", place: "P", source: "self_reported" },
    ]);
    assert.deepEqual(s.entries.map((e) => e.id), ["m", "z"]);
  });
  test("the input list is not modified", () => {
    const copy = [...entries];
    summarizeHistory(entries);
    assert.deepEqual(entries, copy);
  });
});

describe("D-04 reminder (FR-DON-06)", () => {
  test("empty means off", () => {
    assert.deepEqual(validateReminderDays(""), { ok: true, days: null });
    assert.deepEqual(validateReminderDays(null), { ok: true, days: null });
    assert.deepEqual(validateReminderDays("   "), { ok: true, days: null });
  });
  test("1 to 365 whole days are accepted, as text or number", () => {
    assert.deepEqual(validateReminderDays("90"), { ok: true, days: 90 });
    assert.deepEqual(validateReminderDays(1), { ok: true, days: 1 });
    assert.deepEqual(validateReminderDays("365"), { ok: true, days: 365 });
  });
  test("0, 366, decimals, negatives and words are refused", () => {
    for (const bad of ["0", "366", "1.5", "-3", "abc", "9e2", "1 2"]) assert.equal(validateReminderDays(bad).ok, false, bad);
  });
  test("date arithmetic is whole calendar days", () => {
    assert.equal(daysBetween("2026-01-01", "2026-03-01"), 59);
    assert.equal(reminderDueDate("2026-06-03", 90), "2026-09-01");
    assert.equal(reminderDueDate("2026-12-30", 3), "2027-01-02");
  });
  test("due on the due date, not before", () => {
    const base = { lastDonationOn: "2026-06-03", reminderDays: 90, lastSentFor: null };
    assert.equal(isReminderDue({ ...base, today: "2026-08-31" }), false);
    assert.equal(isReminderDue({ ...base, today: "2026-09-01" }), true);
    assert.equal(isReminderDue({ ...base, today: "2027-01-01" }), true);
  });
  test("sent once per last donation, and again after a newer donation", () => {
    const base = { reminderDays: 30, today: "2026-12-31" };
    assert.equal(isReminderDue({ ...base, lastDonationOn: "2026-06-03", lastSentFor: "2026-06-03" }), false);
    assert.equal(isReminderDue({ ...base, lastDonationOn: "2026-10-01", lastSentFor: "2026-06-03" }), true);
  });
  test("never due without a donation or without a reminder setting", () => {
    assert.equal(isReminderDue({ lastDonationOn: null, reminderDays: 30, lastSentFor: null, today: "2030-01-01" }), false);
    assert.equal(isReminderDue({ lastDonationOn: "2026-01-01", reminderDays: null, lastSentFor: null, today: "2030-01-01" }), false);
  });
});

describe("FR-CAM-06 who is told about an approved campaign (A-21)", () => {
  const donor = { notifyCampaigns: true, area: "Saddar", bloodGroup: "O-", accountActive: true };
  const run = (over: Record<string, unknown> = {}, d: { notifyCampaigns: boolean; area: string | null; bloodGroup: string | null; accountActive: boolean } = donor) =>
    shouldNotifyDonorOfCampaign({ donor: d, campaignArea: "Clifton", targetGroups: [], areas: GEO, maxKm: 15, ...over });
  test("a nearby donor who wants campaign notices is told", () => assert.equal(run(), true));
  test("turning campaign notices off stops it", () => assert.equal(run({}, { ...donor, notifyCampaigns: false }), false));
  test("a donor of another blood group is not told when the drive targets specific groups", () => {
    assert.equal(run({ targetGroups: ["A+"] }), false);
    assert.equal(run({ targetGroups: ["A+", "O-"] }), true);
  });
  test("an empty target list means every group", () => assert.equal(run({ targetGroups: [] }), true));
  test("a donor farther than the limit is not told", () => assert.equal(run({ campaignArea: "Far" }), false));
  test("unknown or missing areas never notify", () => {
    assert.equal(run({ campaignArea: null }), false);
    assert.equal(run({ campaignArea: "Atlantis" }), false);
    assert.equal(run({}, { ...donor, area: null }), false);
  });
  test("a deleted or suspended account is never told", () => assert.equal(run({}, { ...donor, accountActive: false }), false));
  test("a donor with no blood group is skipped for targeted drives only", () => {
    assert.equal(run({ targetGroups: ["O-"] }, { ...donor, bloodGroup: null }), false);
    assert.equal(run({ targetGroups: [] }, { ...donor, bloodGroup: null }), true);
  });
  test("haversine: zero for the same point, about 111 km per degree of latitude", () => {
    assert.equal(haversineKm({ lat: 24.86, lng: 67.01 }, { lat: 24.86, lng: 67.01 }), 0);
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    assert.ok(d > 110 && d < 112, String(d));
  });
});

describe("FR-DON-05 account deletion", () => {
  test("a deleted donor keeps no name or phone", () => {
    const a = anonymizedDonor("u-1");
    assert.equal(a.name, "Deleted donor");
    assert.ok(a.phone.startsWith("deleted-"));
    assert.ok(!/\d{10}/.test(a.phone));
  });
  test("two different donors never collide on the anonymized phone", () => {
    assert.notEqual(anonymizedDonor("u-1").phone, anonymizedDonor("u-2").phone);
  });
});
