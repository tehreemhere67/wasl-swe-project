import "server-only";

import { query, transaction } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/messaging";
import { formatDate } from "@/lib/format";
import {
  anonymizedDonor,
  isReminderDue,
  summarizeHistory,
  todayInKarachi,
  type Availability,
  type AreaPoint,
  type DonorLanguage,
  type HistoryEntry,
  type HistorySource,
  type ProfileValues,
} from "./rules";

/**
 * Database access for donor profiles, donation history and reminders (Module 3).
 * The decisions themselves live in `./rules`.
 */

export interface DonorProfile {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  bloodGroup: string | null;
  area: string | null;
  availability: Availability;
  contactPlatform: boolean;
  contactSms: boolean;
  contactWhatsapp: boolean;
  notifyUrgent: boolean;
  notifyCampaigns: boolean;
  preferredLanguage: DonorLanguage;
  reminderDays: number | null;
}

interface DonorRow {
  id: string;
  user_id: string;
  name: string;
  mobile: string;
  blood_group: string | null;
  area: string | null;
  availability: Availability;
  contact_platform: boolean;
  contact_sms: boolean;
  contact_whatsapp: boolean;
  notify_urgent: boolean;
  notify_campaigns: boolean;
  preferred_language: DonorLanguage;
  reminder_days: number | null;
}

function toProfile(row: DonorRow): DonorProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    mobile: row.mobile,
    bloodGroup: row.blood_group,
    area: row.area,
    availability: row.availability,
    contactPlatform: row.contact_platform,
    contactSms: row.contact_sms,
    contactWhatsapp: row.contact_whatsapp,
    notifyUrgent: row.notify_urgent,
    notifyCampaigns: row.notify_campaigns,
    preferredLanguage: row.preferred_language,
    reminderDays: row.reminder_days,
  };
}

const DONOR_COLUMNS = `id, user_id, name, mobile, blood_group, area, availability, contact_platform,
  contact_sms, contact_whatsapp, notify_urgent, notify_campaigns, preferred_language, reminder_days`;

export async function getDonorByUserId(userId: string): Promise<DonorProfile | null> {
  const { rows } = await query<DonorRow>(
    `SELECT ${DONOR_COLUMNS} FROM donors WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  return rows[0] ? toProfile(rows[0]) : null;
}

/** A registered, active donor by mobile number (FR-DON-04: the organization identifies the donor by phone). */
export async function findDonorByMobile(mobile: string): Promise<DonorProfile | null> {
  const { rows } = await query<DonorRow>(
    `SELECT d.id, d.user_id, d.name, d.mobile, d.blood_group, d.area, d.availability, d.contact_platform,
            d.contact_sms, d.contact_whatsapp, d.notify_urgent, d.notify_campaigns, d.preferred_language, d.reminder_days
       FROM donors d JOIN users u ON u.id = d.user_id
      WHERE u.phone = $1 AND u.status = 'active' AND d.deleted_at IS NULL`,
    [mobile],
  );
  return rows[0] ? toProfile(rows[0]) : null;
}

/** A-18: the administrator-maintained list of Karachi areas. */
export async function loadAreas(): Promise<(AreaPoint & { nameUr: string })[]> {
  const { rows } = await query<{ value: unknown }>("SELECT value FROM settings WHERE key = 'karachi_areas'");
  const raw = rows[0]?.value;
  const list = (typeof raw === "string" ? JSON.parse(raw) : raw) as
    | { name_en: string; name_ur: string; lat: number; lng: number }[]
    | undefined;
  return (list ?? []).map((a) => ({ name: a.name_en, nameUr: a.name_ur, lat: a.lat, lng: a.lng }));
}

/** FR-DON-02 / FR-DON-05: saves the profile. The language is kept on the account and the profile. */
export async function saveProfile(userId: string, values: ProfileValues): Promise<void> {
  await transaction(async (tx) => {
    await tx.query(
      `UPDATE donors
          SET blood_group = $2, area = $3, availability = $4,
              contact_platform = $5, contact_sms = $6, contact_whatsapp = $7,
              notify_urgent = $8, notify_campaigns = $9, preferred_language = $10,
              updated_at = now()
        WHERE user_id = $1 AND deleted_at IS NULL`,
      [
        userId,
        values.bloodGroup,
        values.area,
        values.availability,
        values.contactPlatform,
        values.contactSms,
        values.contactWhatsapp,
        values.notifyUrgent,
        values.notifyCampaigns,
        values.preferredLanguage,
      ],
    );
    await tx.query("UPDATE users SET preferred_language = $2, updated_at = now() WHERE id = $1", [
      userId,
      values.preferredLanguage,
    ]);
  });
}

/**
 * FR-DON-05 / DR-05: deletes the account. The name, phone number and profile are removed at once
 * (the SRS allows up to 30 days); the person can no longer log in or be matched, and only anonymous
 * donation entries remain, no longer linked to anyone.
 */
export async function deleteDonorAccount(userId: string): Promise<boolean> {
  const donor = await getDonorByUserId(userId);
  if (!donor) return false;
  const anon = anonymizedDonor(userId);
  await transaction(async (tx) => {
    await tx.query("UPDATE donation_history SET donor_id = NULL WHERE donor_id = $1", [donor.id]);
    await tx.query("DELETE FROM campaign_interests WHERE donor_id = $1", [donor.id]);
    await tx.query("DELETE FROM notifications WHERE user_id = $1", [userId]);
    await tx.query(
      `UPDATE donors
          SET name = $2, mobile = $3, blood_group = NULL, area = NULL, availability = 'not_available',
              contact_platform = false, contact_sms = false, contact_whatsapp = false,
              notify_urgent = false, notify_campaigns = false, reminder_days = NULL,
              reminder_last_sent_for = NULL, consent_share_contact_at = NULL,
              deleted_at = now(), updated_at = now()
        WHERE id = $1`,
      [donor.id, anon.name, anon.phone],
    );
    await tx.query(
      `UPDATE users
          SET status = 'deactivated', full_name = $2, phone = $3, password_hash = 'deleted',
              updated_at = now()
        WHERE id = $1`,
      [userId, anon.name, anon.phone],
    );
    await tx.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  });
  return true;
}

// ---------------------------------------------------------------------------
// History (FR-DON-03 / FR-DON-04 / FR-DON-06)
// ---------------------------------------------------------------------------

export async function listHistory(donorId: string): Promise<ReturnType<typeof summarizeHistory>> {
  const { rows } = await query<{ id: string; donated_on: string; place: string; source: HistorySource }>(
    `SELECT id, to_char(donated_on, 'YYYY-MM-DD') AS donated_on, place, source
       FROM donation_history WHERE donor_id = $1`,
    [donorId],
  );
  const entries: HistoryEntry[] = rows.map((r) => ({
    id: r.id,
    donatedOn: r.donated_on,
    place: r.place,
    source: r.source,
  }));
  return summarizeHistory(entries);
}

export async function addSelfReportedDonation(
  donorId: string,
  values: { donatedOn: string; place: string },
): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `INSERT INTO donation_history (donor_id, donated_on, place, source)
     VALUES ($1, $2, $3, 'self_reported') RETURNING id`,
    [donorId, values.donatedOn, values.place],
  );
  return rows[0]!.id;
}

/** FR-DON-06: stores the reminder interval (null turns it off). */
export async function saveReminderDays(donorId: string, days: number | null): Promise<void> {
  await query(
    "UPDATE donors SET reminder_days = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [donorId, days],
  );
}

/**
 * FR-DON-06: delivers the personal reminder once it falls due. Called when a donor opens their
 * screens, so no background worker is needed. The reminder always lands in the notification
 * centre (FR-NOT-04) and also goes by SMS when the donor chose SMS. It is sent once per last
 * donation. Returns true when a reminder was created.
 */
export async function deliverDueReminder(userId: string, now: Date = new Date()): Promise<boolean> {
  const { rows } = await query<{
    id: string;
    mobile: string;
    reminder_days: number | null;
    contact_sms: boolean;
    preferred_language: DonorLanguage;
    last_sent: string | null;
    last_donation: string | null;
  }>(
    `SELECT d.id, d.mobile, d.reminder_days, d.contact_sms, d.preferred_language,
            to_char(d.reminder_last_sent_for, 'YYYY-MM-DD') AS last_sent,
            (SELECT to_char(MAX(h.donated_on), 'YYYY-MM-DD') FROM donation_history h WHERE h.donor_id = d.id) AS last_donation
       FROM donors d
      WHERE d.user_id = $1 AND d.deleted_at IS NULL AND d.reminder_days IS NOT NULL`,
    [userId],
  );
  const donor = rows[0];
  if (!donor || donor.reminder_days === null) return false;
  if (
    !isReminderDue({
      lastDonationOn: donor.last_donation,
      reminderDays: donor.reminder_days,
      lastSentFor: donor.last_sent,
      today: todayInKarachi(now),
    })
  )
    return false;

  // Claim the reminder first so two page loads at once cannot send it twice.
  const claimed = await query<{ id: string }>(
    `UPDATE donors SET reminder_last_sent_for = $2::date
      WHERE id = $1 AND (reminder_last_sent_for IS NULL OR reminder_last_sent_for < $2::date)
      RETURNING id`,
    [donor.id, donor.last_donation],
  );
  if (claimed.rows.length === 0) return false;

  await createNotification({
    userId,
    category: "general",
    titleEn: "Time to think about donating again",
    titleUr: "دوبارہ عطیہ دینے کا وقت",
    bodyEn: `You asked to be reminded ${donor.reminder_days} days after your last donation (${formatDate(donor.last_donation!, "en")}). Only a blood bank can confirm you are fit to donate.`,
    bodyUr: `آپ نے آخری عطیے (${formatDate(donor.last_donation!, "ur")}) کے ${donor.reminder_days} دن بعد یاد دہانی مانگی تھی۔ عطیہ دینے کی اہلیت صرف بلڈ بینک طے کر سکتا ہے۔`,
    link: "/donor/history",
  });
  if (donor.contact_sms) {
    await sendSms(
      donor.mobile,
      donor.preferred_language === "ur"
        ? "واصل: آپ کی عطیے کی یاد دہانی کا وقت ہو گیا ہے۔"
        : "Wasl: your donation reminder is due.",
    );
  }
  return true;
}
