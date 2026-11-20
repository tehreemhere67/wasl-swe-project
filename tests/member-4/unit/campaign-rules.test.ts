/**
 * Member 4 - Module 6 unit tests: campaign validation, status rules, what donors see, filters,
 * outcome validation, notice wording. Pure functions only.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  approvedNotice,
  cancelledNotice,
  canCancel,
  canEdit,
  canRecordOutcome,
  canSubmit,
  changedMaterialFields,
  filterCampaigns,
  hasEnded,
  karachiDate,
  karachiTime,
  listVisibleUpcoming,
  parseKarachiDateTime,
  parseTargetGroups,
  statusAfterEdit,
  validateCampaignInput,
  validateOutcomeInput,
  visibleVersion,
  type PublicVersion,
  type StoredCampaign,
} from "../../../src/lib/campaigns/rules";

const NOW = new Date("2026-11-20T06:00:00Z"); // 11:00 in Karachi
const AREAS = ["Saddar", "Clifton"];
const form = {
  titleEn: "Drive - Univ.",
  titleUr: "ڈرائیو - یونیورسٹی",
  descriptionEn: "Walk-ins welcome",
  descriptionUr: "خوش آمدید",
  date: "2026-11-25",
  time: "10:00",
  venue: "Main Hall",
  area: "Saddar",
  targetGroups: ["O-"],
  contactPhone: "03001234567",
  contactEmail: "",
};
const errs = (r: { ok: boolean; errors?: { field: string; message: string }[] }) => (r.errors ?? []).map((e) => `${e.field}:${e.message}`);

describe("Karachi time helpers", () => {
  test("10:00 Karachi is 05:00 UTC", () => {
    assert.equal(parseKarachiDateTime("2026-11-25", "10:00")?.toISOString(), "2026-11-25T05:00:00.000Z");
  });
  test("round trip back to the Karachi date and time", () => {
    const d = parseKarachiDateTime("2026-11-25", "23:30")!;
    assert.equal(karachiDate(d), "2026-11-25");
    assert.equal(karachiTime(d), "23:30");
  });
  test("bad input gives null", () => {
    assert.equal(parseKarachiDateTime("2026-02-30", "10:00"), null);
    assert.equal(parseKarachiDateTime("2026-11-25", "25:00"), null);
    assert.equal(parseKarachiDateTime("", ""), null);
  });
  test("a campaign with no end time lasts until the end of its Karachi day", () => {
    const start = parseKarachiDateTime("2026-11-20", "09:00")!;
    assert.equal(hasEnded(start, null, new Date("2026-11-20T18:00:00Z")), false); // 23:00 Karachi
    assert.equal(hasEnded(start, null, new Date("2026-11-20T19:01:00Z")), true); // 00:01 next day
  });
  test("a stated end time wins", () => {
    const start = parseKarachiDateTime("2026-11-20", "09:00")!;
    const end = parseKarachiDateTime("2026-11-20", "12:00")!;
    assert.equal(hasEnded(start, end, new Date("2026-11-20T08:00:00Z")), true); // 13:00 Karachi
  });
});

describe("O-01 create / submit validation (FR-CAM-01, FR-CAM-02)", () => {
  test("a complete form is accepted for draft and for submit", () => {
    assert.equal(validateCampaignInput(form, "save_draft", AREAS, NOW).ok, true);
    assert.equal(validateCampaignInput(form, "submit", AREAS, NOW).ok, true);
  });
  test("the start time is stored as the Karachi instant", () => {
    const r = validateCampaignInput(form, "submit", AREAS, NOW);
    assert.ok(r.ok && r.values.startsAt.toISOString() === "2026-11-25T05:00:00.000Z");
  });
  test("English title is always required", () => {
    assert.deepEqual(errs(validateCampaignInput({ ...form, titleEn: "" }, "save_draft", AREAS, NOW)), ["titleEn:organizer.error.titleRequired"]);
  });
  test("a draft needs the title, date, time, venue and area; a submission also needs the Urdu title, a description and a contact phone", () => {
    const draftOnly = { titleEn: "Drive", date: "2026-11-25", time: "10:00", venue: "Main Hall", area: "Saddar" };
    assert.equal(validateCampaignInput(draftOnly, "save_draft", AREAS, NOW).ok, true);
    const r = validateCampaignInput(draftOnly, "submit", AREAS, NOW);
    assert.equal(r.ok, false);
    const e = errs(r).join(" ");
    for (const key of ["titleUr", "descriptionEn", "contactPhone"]) assert.ok(e.includes(key), key);
    assert.equal(errs(validateCampaignInput({ titleEn: "Only a title" }, "save_draft", AREAS, NOW)).length >= 4, true);
  });
  test("title needs 3 characters and venue 5", () => {
    assert.ok(errs(validateCampaignInput({ ...form, titleEn: "ab" }, "save_draft", AREAS, NOW)).includes("titleEn:organizer.error.titleRequired"));
    assert.ok(errs(validateCampaignInput({ ...form, venue: "Hall" }, "save_draft", AREAS, NOW)).includes("venue:organizer.error.venueRequired"));
  });
  test("title and venue have length limits", () => {
    assert.ok(errs(validateCampaignInput({ ...form, titleEn: "x".repeat(121) }, "submit", AREAS, NOW)).includes("titleEn:organizer.error.titleTooLong"));
    assert.ok(errs(validateCampaignInput({ ...form, venue: "x".repeat(201) }, "submit", AREAS, NOW)).includes("venue:organizer.error.venueTooLong"));
    assert.ok(errs(validateCampaignInput({ ...form, descriptionEn: "x".repeat(2001) }, "submit", AREAS, NOW)).includes("descriptionEn:organizer.error.descriptionTooLong"));
  });
  test("a past date or a time already gone today is refused", () => {
    assert.ok(errs(validateCampaignInput({ ...form, date: "2026-11-19" }, "submit", AREAS, NOW)).includes("date:organizer.error.datePast"));
    assert.ok(errs(validateCampaignInput({ ...form, date: "2026-11-20", time: "09:00" }, "submit", AREAS, NOW)).includes("date:organizer.error.datePast"));
    assert.equal(validateCampaignInput({ ...form, date: "2026-11-20", time: "15:00" }, "submit", AREAS, NOW).ok, true);
  });
  test("bad date and bad time are named separately", () => {
    assert.ok(errs(validateCampaignInput({ ...form, date: "2026-02-30" }, "submit", AREAS, NOW)).includes("date:organizer.error.dateInvalid"));
    assert.ok(errs(validateCampaignInput({ ...form, time: "25:99" }, "submit", AREAS, NOW)).includes("time:organizer.error.timeInvalid"));
  });
  test("area must be on the Karachi list", () => {
    assert.ok(errs(validateCampaignInput({ ...form, area: "Atlantis" }, "submit", AREAS, NOW)).includes("area:organizer.error.areaInvalid"));
  });
  test("contact phone must be a Pakistani number; email must look like one", () => {
    assert.ok(errs(validateCampaignInput({ ...form, contactPhone: "123" }, "submit", AREAS, NOW)).includes("contactPhone:organizer.error.phoneInvalid"));
    assert.ok(errs(validateCampaignInput({ ...form, contactEmail: "nope" }, "submit", AREAS, NOW)).includes("contactEmail:organizer.error.emailInvalid"));
    assert.equal(validateCampaignInput({ ...form, contactEmail: "a@b.pk" }, "submit", AREAS, NOW).ok, true);
  });
  test("target groups: empty or 'all' means every group; one or many valid groups; junk refused", () => {
    assert.deepEqual(parseTargetGroups([]), { groups: [], valid: true });
    assert.deepEqual(parseTargetGroups(""), { groups: [], valid: true });
    assert.deepEqual(parseTargetGroups("all"), { groups: [], valid: true });
    assert.deepEqual(parseTargetGroups("O-"), { groups: ["O-"], valid: true });
    assert.deepEqual(parseTargetGroups(["O-", "A+", "O-"]), { groups: ["O-", "A+"], valid: true });
    assert.equal(parseTargetGroups(["X+"]).valid, false);
    assert.ok(errs(validateCampaignInput({ ...form, targetGroups: ["X+"] }, "submit", AREAS, NOW)).includes("targetGroups:organizer.error.groupsInvalid"));
  });
});

describe("status rules (FR-CAM-02, FR-CAM-08, A-29)", () => {
  test("only a Draft can be submitted", () => {
    assert.equal(canSubmit("draft"), true);
    for (const s of ["pending_approval", "approved", "rejected", "cancelled", "completed"]) assert.equal(canSubmit(s), false, s);
  });
  test("Draft and Approved can be edited; nothing else", () => {
    assert.equal(canEdit("draft"), true);
    assert.equal(canEdit("approved"), true);
    for (const s of ["pending_approval", "rejected", "cancelled", "completed"]) assert.equal(canEdit(s), false, s);
  });
  test("Draft, Pending and Approved can be cancelled", () => {
    for (const s of ["draft", "pending_approval", "approved"]) assert.equal(canCancel(s), true, s);
    for (const s of ["rejected", "cancelled", "completed"]) assert.equal(canCancel(s), false, s);
  });
  test("outcomes: Completed always; Approved only once started; never Draft or Pending", () => {
    assert.equal(canRecordOutcome("completed", "2026-01-01T00:00:00Z", NOW), true);
    assert.equal(canRecordOutcome("approved", "2026-11-20T05:00:00Z", NOW), true);
    assert.equal(canRecordOutcome("approved", "2026-11-21T05:00:00Z", NOW), false);
    for (const s of ["draft", "pending_approval", "rejected", "cancelled"]) assert.equal(canRecordOutcome(s, "2026-01-01T00:00:00Z", NOW), false, s);
  });
  const before = { date: "2026-11-25", time: "10:00", venue: "Hall", area: "Saddar", descriptionEn: "d", descriptionUr: "u" };
  test("changing date, time, venue, area or description counts as material", () => {
    assert.deepEqual(changedMaterialFields(before, { ...before, venue: "Other" }), ["venue"]);
    assert.deepEqual(changedMaterialFields(before, { ...before, date: "2026-11-26", time: "11:00" }), ["date", "time"]);
    assert.deepEqual(changedMaterialFields(before, { ...before, descriptionUr: "v" }), ["descriptionUr"]);
  });
  test("whitespace-only differences and the same values are not material", () => {
    assert.deepEqual(changedMaterialFields(before, { ...before, venue: "Hall " }), []);
    assert.deepEqual(changedMaterialFields(before, before), []);
  });
  test("a material edit of an Approved campaign goes back to Pending Approval", () => {
    assert.deepEqual(statusAfterEdit("approved", ["venue"]), { status: "pending_approval", needsApproval: true });
  });
  test("a minor edit of an Approved campaign stays Approved; a Draft stays a Draft", () => {
    assert.deepEqual(statusAfterEdit("approved", []), { status: "approved", needsApproval: false });
    assert.deepEqual(statusAfterEdit("draft", ["venue"]), { status: "draft", needsApproval: false });
  });
});

describe("what donors see (FR-CAM-03, FR-CAM-04, A-29, FR-VER-03)", () => {
  const pub: PublicVersion = {
    titleEn: "T",
    titleUr: "ٹ",
    descriptionEn: "d",
    descriptionUr: "ڈ",
    startsAt: "2026-11-25T05:00:00.000Z",
    endsAt: null,
    venue: "Hall",
    area: "Saddar",
    targetGroups: [],
    contactPhone: null,
    contactEmail: null,
  };
  const make = (over: Partial<StoredCampaign> = {}): StoredCampaign => ({
    ...pub,
    id: "c1",
    organizationId: "o1",
    organizationName: "Org",
    organizationVerified: true,
    status: "approved",
    approvedSnapshot: null,
    ...over,
  });
  test("an Approved campaign of a verified organization is visible", () => assert.ok(visibleVersion(make())));
  test("Draft, first-time Pending, Rejected, Cancelled and Completed are hidden", () => {
    for (const status of ["draft", "pending_approval", "rejected", "cancelled", "completed"] as const)
      assert.equal(visibleVersion(make({ status })), null, status);
  });
  test("an edited campaign shows its last approved version while it waits", () => {
    const v = visibleVersion(make({ status: "pending_approval", venue: "New", approvedSnapshot: { ...pub, venue: "Old" } }));
    assert.equal(v?.venue, "Old");
  });
  test("an organization that is no longer verified disappears from donors' view", () => {
    assert.equal(visibleVersion(make({ organizationVerified: false })), null);
    assert.equal(visibleVersion(make({ organizationVerified: false, status: "pending_approval", approvedSnapshot: pub })), null);
  });
  test("the upcoming list drops finished campaigns and sorts soonest first", () => {
    const list = listVisibleUpcoming(
      [
        make({ id: "late", startsAt: "2026-12-01T05:00:00.000Z" }),
        make({ id: "soon", startsAt: "2026-11-22T05:00:00.000Z" }),
        make({ id: "over", startsAt: "2026-11-01T05:00:00.000Z" }),
        make({ id: "hidden", status: "draft" }),
      ],
      NOW,
    );
    assert.deepEqual(list.map((c) => c.id), ["soon", "late"]);
    assert.ok(list.every((c) => c.organizerStatus === "verified"));
  });
  test("a campaign under way now is still listed", () => {
    const list = listVisibleUpcoming([make({ id: "now", startsAt: "2026-11-20T04:00:00.000Z", endsAt: "2026-11-20T12:00:00.000Z" })], NOW);
    assert.equal(list.length, 1);
  });
});

describe("D-05 filters (FR-CAM-05)", () => {
  const base: PublicVersion & { organizationName: string; id: string } = {
    id: "1",
    organizationName: "Helping Hands",
    titleEn: "Drive - Univ.",
    titleUr: "ڈرائیو",
    descriptionEn: "",
    descriptionUr: "",
    startsAt: "2026-11-25T05:00:00.000Z",
    endsAt: null,
    venue: "Main Hall",
    area: "Saddar",
    targetGroups: ["O-"],
    contactPhone: null,
    contactEmail: null,
  };
  const list = [
    base,
    { ...base, id: "2", titleEn: "Drive - Mosque", venue: "Jamia Courtyard", area: "Clifton", targetGroups: [], startsAt: "2026-12-05T05:00:00.000Z" },
  ];
  test("blank filters keep everything", () => assert.equal(filterCampaigns(list, {}).length, 2));
  test("area", () => assert.deepEqual(filterCampaigns(list, { area: "Clifton" }).map((c) => c.id), ["2"]));
  test("blood group: a drive for all groups matches everyone, a targeted one only its groups", () => {
    assert.deepEqual(filterCampaigns(list, { group: "A+" }).map((c) => c.id), ["2"]);
    assert.deepEqual(filterCampaigns(list, { group: "O-" }).map((c) => c.id), ["1", "2"]);
  });
  test("date means on or after, by Karachi day", () => {
    assert.deepEqual(filterCampaigns(list, { date: "2026-12-01" }).map((c) => c.id), ["2"]);
    assert.deepEqual(filterCampaigns(list, { date: "2026-11-25" }).map((c) => c.id), ["1", "2"]);
  });
  test("a nonsense date is ignored, not an error", () => assert.equal(filterCampaigns(list, { date: "soon" }).length, 2));
  test("search looks at title, venue, area and organizer, ignoring case", () => {
    assert.deepEqual(filterCampaigns(list, { q: "MOSQUE" }).map((c) => c.id), ["2"]);
    assert.deepEqual(filterCampaigns(list, { q: "main hall" }).map((c) => c.id), ["1"]);
    assert.equal(filterCampaigns(list, { q: "helping" }).length, 2);
    assert.equal(filterCampaigns(list, { q: "zzz" }).length, 0);
  });
  test("filters combine", () => assert.equal(filterCampaigns(list, { area: "Saddar", group: "A+" }).length, 0));
});

describe("O-03 outcome validation (FR-CAM-09, FR-DON-04)", () => {
  const norm = (raw: string) => (/^0?3\d{9}$/.test(raw.replace(/\s/g, "")) ? `+92${raw.replace(/\s/g, "").replace(/^0/, "")}` : null);
  test("valid counts with no phone", () => {
    const r = validateOutcomeInput({ attendees: "20", donations: "12", donorPhone: "" }, norm);
    assert.ok(r.ok && r.values.attendees === 20 && r.values.donations === 12 && r.values.donorPhone === null);
  });
  test("valid counts with a phone are normalised", () => {
    const r = validateOutcomeInput({ attendees: 20, donations: 12, donorPhone: "0300 1234567" }, norm);
    assert.ok(r.ok && r.values.donorPhone === "+923001234567");
  });
  test("both counts must be whole numbers, zero allowed", () => {
    assert.equal(validateOutcomeInput({ attendees: 0, donations: 0 }, norm).ok, true);
    for (const bad of ["", "x", "-1", "1.5"]) assert.equal(validateOutcomeInput({ attendees: bad, donations: 0 }, norm).ok, false, bad);
  });
  test("donations cannot exceed attendees", () => {
    assert.deepEqual(errs(validateOutcomeInput({ attendees: 5, donations: 6 }, norm)), ["donations:organizer.error.donationsTooMany"]);
  });
  test("donations cannot fall below the donors already recorded", () => {
    assert.deepEqual(errs(validateOutcomeInput({ attendees: 10, donations: 1 }, norm, 3)), ["donations:organizer.error.donationsBelowRecorded"]);
    assert.equal(validateOutcomeInput({ attendees: 10, donations: 3 }, norm, 3).ok, true);
  });
  test("a phone that is not a Pakistani mobile is refused", () => {
    assert.deepEqual(errs(validateOutcomeInput({ attendees: 5, donations: 1, donorPhone: "12345" }, norm)), ["donorPhone:organizer.error.donorPhoneInvalid"]);
  });
});

describe("notification wording is stored in both languages (NFR-LOC-01)", () => {
  test("approved notice", () => {
    const n = approvedNotice({ titleEn: "Drive", titleUr: "ڈرائیو", venue: "Hall", dateEn: "25 Nov", dateUr: "25 نومبر" });
    assert.ok(n.bodyEn.includes("Drive") && n.bodyEn.includes("Hall"));
    assert.ok(/[؀-ۿ]/.test(n.titleUr) && /[؀-ۿ]/.test(n.bodyUr));
  });
  test("cancelled notice", () => {
    const n = cancelledNotice({ titleEn: "Drive", titleUr: "", dateEn: "25 Nov", dateUr: "25 نومبر" });
    assert.ok(n.bodyEn.includes("cancelled"));
    assert.ok(n.bodyUr.includes("Drive")); // falls back to the English title when no Urdu title exists
  });
});
