/**
 * Donation campaign rules (Module 6, screens O-01, O-02, O-03, D-05 and D-06).
 *
 * Framework-free and database-free so every rule is unit-tested directly with `node:test`
 * (see `tests/member-4/unit`). Pages, API routes and the data layer call these functions.
 *
 * SRS references:
 *  - FR-CAM-01  create a campaign: title, description, date and time, Karachi venue, target
 *               blood groups (or all), contact details; saved as Draft              [A-01, A-28]
 *  - FR-CAM-02  submit a Draft for approval -> Pending Approval                      [A-28]
 *  - FR-CAM-03  donors see (and are told about) a campaign only once it is Approved  (BR-2)
 *  - FR-CAM-04  every campaign shows its organizer's name and verification status
 *  - FR-CAM-05  browse and search upcoming Approved campaigns; filter by area, date, group
 *  - FR-CAM-07  "I plan to attend": non-binding interest, count and list for the organizer [A-30]
 *  - FR-CAM-08  cancel (interested donors are told); Completed after the end date; changing the
 *               date, time, venue or description of an Approved campaign needs approval again and
 *               the previously approved version stays visible until the decision      [A-29]
 *  - FR-CAM-09  after a campaign is Completed: attendees, donations, donations recorded for
 *               registered donors
 */

import { BLOOD_GROUPS } from "../inventory/rules";

export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "cancelled",
  "completed",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const VENUE_MIN = 5;
export const VENUE_MAX = 200;
export const DESCRIPTION_MAX = 2000;

export interface RuleError {
  field: string;
  /** A dictionary key the form translates. */
  message: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// ---------------------------------------------------------------------------
// Dates: the organizer types a date and a time in Karachi (UTC+5, no daylight saving)
// ---------------------------------------------------------------------------

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isRealDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/** A Karachi date and time as the exact instant they name. Returns null if either is invalid. */
export function parseKarachiDateTime(date: string, time: string): Date | null {
  if (!isRealDate(date) || !TIME_RE.test(time)) return null;
  return new Date(`${date}T${time}:00+05:00`);
}

/** The Karachi calendar date (YYYY-MM-DD) of an instant. */
export function karachiDate(instant: Date | string): string {
  const d = typeof instant === "string" ? new Date(instant) : instant;
  return new Date(d.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The Karachi clock time (HH:MM) of an instant. */
export function karachiTime(instant: Date | string): string {
  const d = typeof instant === "string" ? new Date(instant) : instant;
  return new Date(d.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(11, 16);
}

/**
 * When a campaign counts as over. A campaign with no stated end time ends at the end of its
 * Karachi day, so it is only marked Completed the day after (FR-CAM-08).
 */
export function effectiveEnd(startsAt: Date | string, endsAt: Date | string | null): Date {
  if (endsAt) return new Date(endsAt);
  const start = new Date(startsAt);
  const day = karachiDate(start);
  return new Date(new Date(`${day}T00:00:00+05:00`).getTime() + 24 * 60 * 60 * 1000);
}

export function hasEnded(startsAt: Date | string, endsAt: Date | string | null, now: Date = new Date()): boolean {
  return effectiveEnd(startsAt, endsAt).getTime() <= now.getTime();
}

// ---------------------------------------------------------------------------
// FR-CAM-01 / FR-CAM-02: validating the O-01 form
// ---------------------------------------------------------------------------

export type CampaignAction = "save_draft" | "submit";

export interface CampaignValues {
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  date: string;
  time: string;
  startsAt: Date;
  venue: string;
  area: string;
  /** Empty means "all blood groups". */
  targetGroups: string[];
  contactPhone: string;
  contactEmail: string;
}

export type CampaignValidation =
  | { ok: true; values: CampaignValues }
  | { ok: false; errors: RuleError[] };

/** The target-groups field may arrive as one value, a list, or "all". Anything unknown is refused. */
export function parseTargetGroups(raw: unknown): { groups: string[]; valid: boolean } {
  const list = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
  const groups: string[] = [];
  for (const item of list) {
    const value = text(item);
    if (value === "" || value === "all") continue;
    if (!(BLOOD_GROUPS as readonly string[]).includes(value)) return { groups: [], valid: false };
    if (!groups.includes(value)) groups.push(value);
  }
  return { groups, valid: true };
}

const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates the form. Saving a Draft needs the essentials a draft row stores (English title,
 * date and time in the future, venue, area). Submitting for approval also needs the Urdu title,
 * an English description and contact details, because an administrator reviews the complete
 * campaign and donors read it in either language (FR-CAM-02, NFR-LOC-01).
 */
export function validateCampaignInput(
  input: Record<string, unknown>,
  action: CampaignAction,
  areas: readonly string[],
  now: Date = new Date(),
): CampaignValidation {
  const errors: RuleError[] = [];
  const submit = action === "submit";

  const titleEn = text(input.titleEn);
  const titleUr = text(input.titleUr);
  const descriptionEn = text(input.descriptionEn);
  const descriptionUr = text(input.descriptionUr);
  const date = text(input.date);
  const time = text(input.time);
  const venue = text(input.venue);
  const area = text(input.area);
  const contactPhone = text(input.contactPhone);
  const contactEmail = text(input.contactEmail);

  if (titleEn.length < TITLE_MIN) errors.push({ field: "titleEn", message: "organizer.error.titleRequired" });
  else if (titleEn.length > TITLE_MAX) errors.push({ field: "titleEn", message: "organizer.error.titleTooLong" });

  if (titleUr.length > TITLE_MAX) errors.push({ field: "titleUr", message: "organizer.error.titleTooLong" });
  else if (submit && titleUr.length < TITLE_MIN) errors.push({ field: "titleUr", message: "organizer.error.titleUrRequired" });

  if (descriptionEn.length > DESCRIPTION_MAX) errors.push({ field: "descriptionEn", message: "organizer.error.descriptionTooLong" });
  else if (submit && descriptionEn.length < 10) errors.push({ field: "descriptionEn", message: "organizer.error.descriptionRequired" });
  if (descriptionUr.length > DESCRIPTION_MAX) errors.push({ field: "descriptionUr", message: "organizer.error.descriptionTooLong" });

  let startsAt: Date | null = null;
  if (!isRealDate(date)) errors.push({ field: "date", message: "organizer.error.dateInvalid" });
  if (!TIME_RE.test(time)) errors.push({ field: "time", message: "organizer.error.timeInvalid" });
  if (isRealDate(date) && TIME_RE.test(time)) {
    startsAt = parseKarachiDateTime(date, time);
    if (startsAt && startsAt.getTime() <= now.getTime()) {
      errors.push({ field: "date", message: "organizer.error.datePast" });
    }
  }

  if (venue.length < VENUE_MIN) errors.push({ field: "venue", message: "organizer.error.venueRequired" });
  else if (venue.length > VENUE_MAX) errors.push({ field: "venue", message: "organizer.error.venueTooLong" });

  if (area === "") errors.push({ field: "area", message: "organizer.error.areaRequired" });
  else if (!areas.includes(area)) errors.push({ field: "area", message: "organizer.error.areaInvalid" });

  const parsed = parseTargetGroups(input.targetGroups);
  if (!parsed.valid) errors.push({ field: "targetGroups", message: "organizer.error.groupsInvalid" });

  if (contactPhone !== "" && !PHONE_RE.test(contactPhone))
    errors.push({ field: "contactPhone", message: "organizer.error.phoneInvalid" });
  else if (submit && contactPhone === "") errors.push({ field: "contactPhone", message: "organizer.error.phoneRequired" });
  if (contactEmail !== "" && (!EMAIL_RE.test(contactEmail) || contactEmail.length > 254))
    errors.push({ field: "contactEmail", message: "organizer.error.emailInvalid" });

  if (errors.length > 0 || !startsAt) return { ok: false, errors };
  return {
    ok: true,
    values: {
      titleEn,
      titleUr,
      descriptionEn,
      descriptionUr,
      date,
      time,
      startsAt,
      venue,
      area,
      targetGroups: parsed.groups,
      contactPhone,
      contactEmail,
    },
  };
}

// ---------------------------------------------------------------------------
// Status rules (A-28, A-29)
// ---------------------------------------------------------------------------

/** FR-CAM-02: only a Draft can be submitted. */
export function canSubmit(status: string): boolean {
  return status === "draft";
}

/**
 * Who can edit the form: a Draft (including one returned for changes), and an Approved campaign
 * (A-29: edits to it go back to the administrator). A campaign waiting for review, rejected,
 * cancelled or completed is not edited.
 */
export function canEdit(status: string): boolean {
  return status === "draft" || status === "approved";
}

/** FR-CAM-08: a campaign that has not finished can be cancelled by its organizer. */
export function canCancel(status: string): boolean {
  return status === "draft" || status === "pending_approval" || status === "approved";
}

/**
 * FR-CAM-09: outcomes are entered for a Completed campaign. An Approved campaign that has already
 * started can also be completed from the wireframe's O-03 link, which then marks it Completed.
 */
export function canRecordOutcome(
  status: string,
  startsAt: Date | string,
  now: Date = new Date(),
): boolean {
  if (status === "completed") return true;
  return status === "approved" && new Date(startsAt).getTime() <= now.getTime();
}

/** The fields that, when changed on an Approved campaign, require approval again (A-29). */
export const MATERIAL_FIELDS = [
  "date",
  "time",
  "venue",
  "area",
  "descriptionEn",
  "descriptionUr",
] as const;
export type MaterialField = (typeof MATERIAL_FIELDS)[number];

export interface ComparableCampaign {
  date: string;
  time: string;
  venue: string;
  area: string;
  descriptionEn: string;
  descriptionUr: string;
}

export function changedMaterialFields(before: ComparableCampaign, after: ComparableCampaign): MaterialField[] {
  return MATERIAL_FIELDS.filter((field) => before[field].trim() !== after[field].trim());
}

/** FR-CAM-08 / A-29: what happens to an Approved campaign when its organizer saves the form. */
export function statusAfterEdit(
  status: CampaignStatus,
  changed: readonly MaterialField[],
): { status: CampaignStatus; needsApproval: boolean } {
  if (status === "approved" && changed.length > 0) return { status: "pending_approval", needsApproval: true };
  return { status, needsApproval: false };
}

// ---------------------------------------------------------------------------
// FR-CAM-03 / FR-CAM-04 / FR-CAM-08: what donors see
// ---------------------------------------------------------------------------

/** The fields a donor reads. The same shape is used for the live row and for the stored snapshot. */
export interface PublicVersion {
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  startsAt: string;
  endsAt: string | null;
  venue: string;
  area: string | null;
  targetGroups: string[];
  contactPhone: string | null;
  contactEmail: string | null;
}

export interface StoredCampaign extends PublicVersion {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationVerified: boolean;
  status: CampaignStatus;
  /** The last approved version, kept while an edited campaign waits for approval (A-29). */
  approvedSnapshot: PublicVersion | null;
}

/**
 * FR-CAM-03 + A-29: the version a donor may see, or null when the campaign is hidden.
 *  - Approved: the current version.
 *  - Pending Approval with an earlier approved version: that earlier version stays visible.
 *  - Anything else (Draft, a first submission still Pending, Rejected, Cancelled, Completed): hidden.
 * An organization that is no longer Verified is hidden too (FR-VER-03).
 */
export function visibleVersion(campaign: StoredCampaign): PublicVersion | null {
  if (!campaign.organizationVerified) return null;
  if (campaign.status === "approved") return campaign;
  if (campaign.status === "pending_approval" && campaign.approvedSnapshot) return campaign.approvedSnapshot;
  return null;
}

export interface DonorCampaignView extends PublicVersion {
  id: string;
  organizationId: string;
  organizationName: string;
  /** FR-CAM-04: always "verified" - an unverified organizer's campaign is never listed. */
  organizerStatus: "verified";
}

/** FR-CAM-03 / FR-CAM-05: the upcoming campaigns donors may see, as donors see them, soonest first. */
export function listVisibleUpcoming(
  campaigns: readonly StoredCampaign[],
  now: Date = new Date(),
): DonorCampaignView[] {
  const out: DonorCampaignView[] = [];
  for (const campaign of campaigns) {
    const version = visibleVersion(campaign);
    if (!version) continue;
    if (hasEnded(version.startsAt, version.endsAt, now)) continue;
    out.push({
      ...version,
      id: campaign.id,
      organizationId: campaign.organizationId,
      organizationName: campaign.organizationName,
      organizerStatus: "verified",
    });
  }
  return out.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() || a.id.localeCompare(b.id),
  );
}

export interface CampaignFilters {
  area?: string;
  /** YYYY-MM-DD: campaigns on or after this Karachi date. */
  date?: string;
  group?: string;
  q?: string;
}

/** True when the campaign is for this blood group (an empty target list means all groups). */
export function targetsGroup(targetGroups: readonly string[], group: string): boolean {
  return targetGroups.length === 0 || targetGroups.includes(group);
}

/** FR-CAM-05: search and filter by area, date and blood group. A blank filter does nothing. */
export function filterCampaigns<T extends PublicVersion & { organizationName: string }>(
  campaigns: readonly T[],
  filters: CampaignFilters,
): T[] {
  const area = text(filters.area);
  const date = text(filters.date);
  const group = text(filters.group);
  const q = text(filters.q).toLowerCase();
  return campaigns.filter((campaign) => {
    if (area && campaign.area !== area) return false;
    if (date && isRealDate(date) && karachiDate(campaign.startsAt) < date) return false;
    if (group && !targetsGroup(campaign.targetGroups, group)) return false;
    if (q) {
      const haystack = [
        campaign.titleEn,
        campaign.titleUr,
        campaign.venue,
        campaign.area ?? "",
        campaign.organizationName,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// FR-CAM-09: completion form
// ---------------------------------------------------------------------------

export interface OutcomeValues {
  attendees: number;
  donations: number;
  /** A donor's phone, normalised, to record a donation for; null when left empty. */
  donorPhone: string | null;
}

export type OutcomeValidation =
  | { ok: true; values: OutcomeValues }
  | { ok: false; errors: RuleError[] };

function wholeNumber(value: unknown): number | null {
  const raw = typeof value === "number" ? String(value) : text(value);
  if (!/^\d{1,6}$/.test(raw)) return null;
  return Number(raw);
}

/**
 * Validates the O-03 form. `normalizePhone` is the platform's mobile normaliser (it returns null
 * for a number that is not a Pakistani mobile), passed in so this module stays dependency-free.
 */
export function validateOutcomeInput(
  input: Record<string, unknown>,
  normalizePhone: (raw: string) => string | null,
  recordedDonorCount = 0,
): OutcomeValidation {
  const errors: RuleError[] = [];
  const attendees = wholeNumber(input.attendees);
  const donations = wholeNumber(input.donations);

  if (attendees === null) errors.push({ field: "attendees", message: "organizer.error.attendeesInvalid" });
  if (donations === null) errors.push({ field: "donations", message: "organizer.error.donationsInvalid" });
  if (attendees !== null && donations !== null) {
    if (donations > attendees) errors.push({ field: "donations", message: "organizer.error.donationsTooMany" });
    else if (donations < recordedDonorCount)
      errors.push({ field: "donations", message: "organizer.error.donationsBelowRecorded" });
  }

  const phoneRaw = text(input.donorPhone);
  let donorPhone: string | null = null;
  if (phoneRaw !== "") {
    donorPhone = normalizePhone(phoneRaw);
    if (!donorPhone) errors.push({ field: "donorPhone", message: "organizer.error.donorPhoneInvalid" });
  }

  if (errors.length > 0 || attendees === null || donations === null) return { ok: false, errors };
  return { ok: true, values: { attendees, donations, donorPhone } };
}

// ---------------------------------------------------------------------------
// FR-CAM-06 / FR-CAM-08: notification wording (both languages are stored with every notice)
// ---------------------------------------------------------------------------

export interface NoticeText {
  titleEn: string;
  titleUr: string;
  bodyEn: string;
  bodyUr: string;
}

export function approvedNotice(input: {
  titleEn: string;
  titleUr: string;
  venue: string;
  dateEn: string;
  dateUr: string;
}): NoticeText {
  return {
    titleEn: "New donation campaign",
    titleUr: "عطیے کی نئی مہم",
    bodyEn: `${input.titleEn} - ${input.dateEn} at ${input.venue}. Open Campaigns to see details.`,
    bodyUr: `${input.titleUr || input.titleEn} - ${input.dateUr}، ${input.venue}۔ تفصیل کے لیے مہمیں کھولیں۔`,
  };
}

export function cancelledNotice(input: {
  titleEn: string;
  titleUr: string;
  dateEn: string;
  dateUr: string;
}): NoticeText {
  return {
    titleEn: "Campaign cancelled",
    titleUr: "مہم منسوخ",
    bodyEn: `The campaign "${input.titleEn}" on ${input.dateEn} was cancelled by its organizer.`,
    bodyUr: `مہم "${input.titleUr || input.titleEn}" (${input.dateUr}) منتظم نے منسوخ کر دی ہے۔`,
  };
}
