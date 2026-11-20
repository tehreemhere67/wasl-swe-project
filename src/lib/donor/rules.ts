/**
 * Donor profile, donation history and reminder rules (Module 3, screens D-03 and D-04).
 *
 * Framework-free and database-free, like `src/lib/inventory/rules.ts`, so every rule is unit-tested
 * directly with `node:test` (see `tests/member-4/unit`). Pages, API routes and the data layer
 * call these functions; none of them re-implements a rule.
 *
 * SRS references:
 *  - FR-DON-02  profile: blood group, area of Karachi, availability, contact channels
 *               (platform, SMS, WhatsApp), notice types (urgent, campaigns), preferred language
 *  - FR-DON-03  donors add past donations (date and place), labelled Self-reported      [A-19]
 *  - FR-DON-04  organizations record donations, labelled Recorded by organization       [A-19]
 *  - FR-DON-05  edit the profile, set Not available at any time, delete the account
 *  - FR-DON-06  history with the total number of donations; optional reminder after N days
 *  - FR-CAM-06  campaign notices go to donors within 15 km whose group is targeted       [A-21]
 *  - DR-02      location is an area of Karachi only, never a live position              [A-18]
 */

import { BLOOD_GROUPS, type BloodGroup } from "../inventory/rules";

export { BLOOD_GROUPS };
export type { BloodGroup };

export const AVAILABILITY_VALUES = ["available", "not_available"] as const;
export type Availability = (typeof AVAILABILITY_VALUES)[number];

export const LANGUAGES = ["en", "ur"] as const;
export type DonorLanguage = (typeof LANGUAGES)[number];

export const HISTORY_SOURCES = ["self_reported", "recorded_by_org"] as const;
export type HistorySource = (typeof HISTORY_SOURCES)[number];

/** FR-DON-06: the reminder interval is 1 to 365 days (matches the database CHECK). */
export const REMINDER_MIN_DAYS = 1;
export const REMINDER_MAX_DAYS = 365;

export const PLACE_MIN = 2;
export const PLACE_MAX = 120;

/** An error the form shows under one field. `message` is a dictionary key. */
export interface RuleError {
  field: string;
  message: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function flag(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

// ---------------------------------------------------------------------------
// FR-DON-02 / FR-DON-05: profile
// ---------------------------------------------------------------------------

export interface ProfileValues {
  bloodGroup: BloodGroup;
  area: string;
  availability: Availability;
  contactPlatform: boolean;
  contactSms: boolean;
  contactWhatsapp: boolean;
  notifyUrgent: boolean;
  notifyCampaigns: boolean;
  preferredLanguage: DonorLanguage;
}

export type ProfileValidation =
  | { ok: true; values: ProfileValues }
  | { ok: false; errors: RuleError[] };

/**
 * Validates the D-03 form. `areas` is the administrator-maintained list of Karachi areas
 * (A-18): an area outside it is refused so matching distance can always be worked out.
 * Availability is optional in the form; when it is left out the donor stays as they were
 * (`current`), so saving the profile never silently flips availability.
 */
export function validateProfileInput(
  input: Record<string, unknown>,
  areas: readonly string[],
  current: Availability = "available",
): ProfileValidation {
  const errors: RuleError[] = [];

  const bloodGroup = text(input.bloodGroup);
  if (bloodGroup === "") errors.push({ field: "bloodGroup", message: "donor.error.bloodGroupRequired" });
  else if (!(BLOOD_GROUPS as readonly string[]).includes(bloodGroup))
    errors.push({ field: "bloodGroup", message: "donor.error.bloodGroupInvalid" });

  const area = text(input.area);
  if (area === "") errors.push({ field: "area", message: "donor.error.areaRequired" });
  else if (!areas.includes(area)) errors.push({ field: "area", message: "donor.error.areaInvalid" });

  const availabilityRaw = text(input.availability);
  let availability: Availability = current;
  if (availabilityRaw !== "") {
    if ((AVAILABILITY_VALUES as readonly string[]).includes(availabilityRaw))
      availability = availabilityRaw as Availability;
    else errors.push({ field: "availability", message: "donor.error.availabilityInvalid" });
  }

  const languageRaw = text(input.preferredLanguage);
  let preferredLanguage: DonorLanguage = "en";
  if (languageRaw === "") errors.push({ field: "preferredLanguage", message: "donor.error.languageInvalid" });
  else if ((LANGUAGES as readonly string[]).includes(languageRaw)) preferredLanguage = languageRaw as DonorLanguage;
  else errors.push({ field: "preferredLanguage", message: "donor.error.languageInvalid" });

  const contactPlatform = flag(input.contactPlatform);
  const contactSms = flag(input.contactSms);
  const contactWhatsapp = flag(input.contactWhatsapp);
  // FR-NOT-04: the platform notification centre always receives every notice, but a donor
  // must keep at least one way of being reached chosen.
  if (!contactPlatform && !contactSms && !contactWhatsapp)
    errors.push({ field: "channels", message: "donor.error.channelRequired" });

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    values: {
      bloodGroup: bloodGroup as BloodGroup,
      area,
      availability,
      contactPlatform,
      contactSms,
      contactWhatsapp,
      notifyUrgent: flag(input.notifyUrgent),
      notifyCampaigns: flag(input.notifyCampaigns),
      preferredLanguage,
    },
  };
}

// ---------------------------------------------------------------------------
// FR-DON-03: adding a past donation
// ---------------------------------------------------------------------------

export interface DonationValues {
  donatedOn: string; // YYYY-MM-DD
  place: string;
}

export type DonationValidation =
  | { ok: true; values: DonationValues }
  | { ok: false; errors: RuleError[] };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-31). */
export function isIsoDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

/** Today's date in Karachi (UTC+5, no daylight saving) as YYYY-MM-DD. */
export function todayInKarachi(now: Date = new Date()): string {
  return new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** FR-DON-03: a past donation has a real date that is not in the future, and a place. */
export function validateDonationInput(
  input: Record<string, unknown>,
  now: Date = new Date(),
): DonationValidation {
  const errors: RuleError[] = [];
  const donatedOn = text(input.donatedOn);
  const place = text(input.place);

  if (donatedOn === "" || !isIsoDate(donatedOn)) errors.push({ field: "donatedOn", message: "donor.error.dateInvalid" });
  else if (donatedOn > todayInKarachi(now)) errors.push({ field: "donatedOn", message: "donor.error.dateFuture" });

  if (place.length < PLACE_MIN) errors.push({ field: "place", message: "donor.error.placeRequired" });
  else if (place.length > PLACE_MAX) errors.push({ field: "place", message: "donor.error.placeTooLong" });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, values: { donatedOn, place } };
}

// ---------------------------------------------------------------------------
// FR-DON-06: history total, order and reminder
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  id: string;
  donatedOn: string; // YYYY-MM-DD
  place: string;
  source: HistorySource;
}

/** The history screen's data: newest first, plus the total (A-19: both kinds count). */
export function summarizeHistory(entries: readonly HistoryEntry[]): {
  total: number;
  entries: HistoryEntry[];
  lastDonationOn: string | null;
} {
  const sorted = [...entries].sort(
    (a, b) => b.donatedOn.localeCompare(a.donatedOn) || a.id.localeCompare(b.id),
  );
  return { total: sorted.length, entries: sorted, lastDonationOn: sorted[0]?.donatedOn ?? null };
}

export type ReminderValidation =
  | { ok: true; days: number | null }
  | { ok: false; errors: RuleError[] };

/**
 * The reminder is optional: an empty value turns it off. Otherwise it is a whole number of
 * days from 1 to 365.
 */
export function validateReminderDays(raw: unknown): ReminderValidation {
  if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === ""))
    return { ok: true, days: null };
  const asText = typeof raw === "number" ? String(raw) : text(raw);
  if (!/^\d+$/.test(asText)) return { ok: false, errors: [{ field: "remindDays", message: "donor.error.reminderInvalid" }] };
  const days = Number(asText);
  if (days < REMINDER_MIN_DAYS || days > REMINDER_MAX_DAYS)
    return { ok: false, errors: [{ field: "remindDays", message: "donor.error.reminderInvalid" }] };
  return { ok: true, days };
}

/** Whole days from one YYYY-MM-DD date to another (UTC calendar arithmetic, no clock drift). */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** The date a reminder falls due: last donation plus N days. */
export function reminderDueDate(lastDonationOn: string, reminderDays: number): string {
  return new Date(Date.parse(`${lastDonationOn}T00:00:00Z`) + reminderDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * FR-DON-06: is a personal reminder due? It is due once, on or after (last donation + N days),
 * and is not sent again for the same last donation (`lastSentFor`).
 */
export function isReminderDue(input: {
  lastDonationOn: string | null;
  reminderDays: number | null;
  lastSentFor: string | null;
  today: string;
}): boolean {
  const { lastDonationOn, reminderDays, lastSentFor, today } = input;
  if (!lastDonationOn || reminderDays === null) return false;
  if (lastSentFor && lastSentFor >= lastDonationOn) return false;
  return today >= reminderDueDate(lastDonationOn, reminderDays);
}

// ---------------------------------------------------------------------------
// FR-CAM-06: who is told about an approved campaign
// ---------------------------------------------------------------------------

export interface AreaPoint {
  name: string;
  lat: number;
  lng: number;
}

/** Great-circle distance in km between two area centres (A-18: area centres, not live positions). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface CampaignNoticeDonor {
  notifyCampaigns: boolean;
  area: string | null;
  bloodGroup: string | null;
  accountActive: boolean;
}

/**
 * FR-CAM-06 [A-21]: a donor is told about an approved campaign only if they turned campaign
 * notices on, their area is within `maxKm` of the venue, and their blood group is among the
 * target groups (an empty list means all groups). A donor with no area, or an area that is
 * not on the list, cannot be placed, so is not told.
 */
export function shouldNotifyDonorOfCampaign(input: {
  donor: CampaignNoticeDonor;
  campaignArea: string | null;
  targetGroups: readonly string[];
  areas: readonly AreaPoint[];
  maxKm: number;
}): boolean {
  const { donor, campaignArea, targetGroups, areas, maxKm } = input;
  if (!donor.accountActive || !donor.notifyCampaigns) return false;
  if (targetGroups.length > 0 && (!donor.bloodGroup || !targetGroups.includes(donor.bloodGroup))) return false;
  if (!donor.area || !campaignArea) return false;
  const from = areas.find((a) => a.name === donor.area);
  const to = areas.find((a) => a.name === campaignArea);
  if (!from || !to) return false;
  return haversineKm(from, to) <= maxKm;
}

// ---------------------------------------------------------------------------
// DR-05: what remains after an account is deleted
// ---------------------------------------------------------------------------

/**
 * The values written over a deleted donor. The name, phone number and profile are removed at
 * once (DR-05 allows up to 30 days); only anonymous totals remain.
 */
export function anonymizedDonor(userId: string): { name: string; phone: string } {
  return { name: "Deleted donor", phone: `deleted-${userId}` };
}
