import "server-only";

import { query, transaction } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/messaging";
import { formatDate } from "@/lib/format";
import { findDonorByMobile, loadAreas } from "@/lib/donor/data";
import { shouldNotifyDonorOfCampaign, type DonorLanguage } from "@/lib/donor/rules";
import {
  approvedNotice,
  cancelledNotice,
  canCancel,
  changedMaterialFields,
  karachiDate,
  karachiTime,
  listVisibleUpcoming,
  statusAfterEdit,
  visibleVersion,
  type CampaignAction,
  type CampaignStatus,
  type CampaignValues,
  type DonorCampaignView,
  type PublicVersion,
  type StoredCampaign,
} from "./rules";

/**
 * Database access for donation campaigns (Module 6). Decisions live in `./rules`.
 * Administrator approval itself is Member 2's A-04 (`/api/admin/campaigns/decision`).
 */

interface CampaignRow {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_status: string;
  title_en: string;
  title_ur: string;
  description_en: string;
  description_ur: string;
  starts_at: Date | string;
  ends_at: Date | string | null;
  venue: string;
  area: string | null;
  target_groups: string[] | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: CampaignStatus;
  review_reason: string | null;
  approved_snapshot: unknown;
  attendees: number | null;
  donations_count: number | null;
}

const SELECT = `
  SELECT c.id, c.organization_id, o.name AS organization_name, o.verification_status AS organization_status,
         c.title_en, c.title_ur, c.description_en, c.description_ur, c.starts_at, c.ends_at, c.venue,
         c.area, c.target_groups, c.contact_phone, c.contact_email, c.status, c.review_reason,
         c.approved_snapshot, c.attendees, c.donations_count
    FROM campaigns c JOIN organizations o ON o.id = c.organization_id`;

function iso(value: Date | string): string {
  return new Date(value).toISOString();
}

function snapshotOf(raw: unknown): PublicVersion | null {
  if (!raw) return null;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as PublicVersion;
}

function toStored(row: CampaignRow): StoredCampaign & {
  reviewReason: string | null;
  attendees: number | null;
  donationsCount: number | null;
} {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationVerified: row.organization_status === "verified",
    status: row.status,
    titleEn: row.title_en,
    titleUr: row.title_ur,
    descriptionEn: row.description_en,
    descriptionUr: row.description_ur,
    startsAt: iso(row.starts_at),
    endsAt: row.ends_at ? iso(row.ends_at) : null,
    venue: row.venue,
    area: row.area,
    targetGroups: row.target_groups ?? [],
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    approvedSnapshot: snapshotOf(row.approved_snapshot),
    reviewReason: row.review_reason,
    attendees: row.attendees,
    donationsCount: row.donations_count,
  };
}

export type OwnCampaign = ReturnType<typeof toStored>;

/** Postgres array literal for a list of blood groups ("O+", "A-" ...). */
function groupsLiteral(groups: readonly string[]): string {
  return `{${groups.map((g) => `"${g}"`).join(",")}}`;
}

function currentVersion(c: StoredCampaign): PublicVersion {
  return {
    titleEn: c.titleEn,
    titleUr: c.titleUr,
    descriptionEn: c.descriptionEn,
    descriptionUr: c.descriptionUr,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    venue: c.venue,
    area: c.area,
    targetGroups: c.targetGroups,
    contactPhone: c.contactPhone,
    contactEmail: c.contactEmail,
  };
}

/**
 * FR-CAM-08: an Approved campaign becomes Completed after its end date. A campaign with no stated end
 * ends at the end of its Karachi day. Done when campaigns are read, so no background worker is needed.
 */
export async function completeFinishedCampaigns(): Promise<void> {
  await query(
    `UPDATE campaigns
        SET status = 'completed', updated_at = now()
      WHERE status = 'approved'
        AND COALESCE(
              ends_at,
              (date_trunc('day', (starts_at AT TIME ZONE 'UTC') + interval '5 hours') + interval '1 day' - interval '5 hours')
                AT TIME ZONE 'UTC'
            ) <= now()`,
  );
}

// ---------------------------------------------------------------------------
// Donors (D-05, D-06)
// ---------------------------------------------------------------------------

/** FR-CAM-03 / FR-CAM-05: the upcoming campaigns a donor may see (before filtering). */
export async function listDonorCampaigns(now: Date = new Date()): Promise<DonorCampaignView[]> {
  await completeFinishedCampaigns();
  const { rows } = await query<CampaignRow>(`${SELECT} WHERE c.status IN ('approved', 'pending_approval')`);
  return listVisibleUpcoming(rows.map(toStored), now);
}

export interface DonorCampaignDetail {
  campaign: DonorCampaignView;
  interestedCount: number;
  interested: boolean;
}

/** FR-CAM-03: null when the campaign does not exist or may not be seen by donors. */
export async function getDonorCampaign(id: string, donorId: string): Promise<DonorCampaignDetail | null> {
  await completeFinishedCampaigns();
  const { rows } = await query<CampaignRow>(`${SELECT} WHERE c.id = $1`, [id]);
  if (!rows[0]) return null;
  const stored = toStored(rows[0]);
  const version = visibleVersion(stored);
  if (!version) return null;
  const counts = await query<{ total: string; mine: string }>(
    `SELECT count(*)::text AS total,
            count(*) FILTER (WHERE donor_id = $2)::text AS mine
       FROM campaign_interests WHERE campaign_id = $1`,
    [id, donorId],
  );
  return {
    campaign: {
      ...version,
      id: stored.id,
      organizationId: stored.organizationId,
      organizationName: stored.organizationName,
      organizerStatus: "verified",
    },
    interestedCount: Number(counts.rows[0]?.total ?? 0),
    interested: Number(counts.rows[0]?.mine ?? 0) > 0,
  };
}

/** FR-CAM-07: marks or withdraws interest. Returns null when the campaign is not visible to donors. */
export async function setInterest(
  id: string,
  donorId: string,
  interested: boolean,
): Promise<{ interestedCount: number; interested: boolean } | null> {
  const detail = await getDonorCampaign(id, donorId);
  if (!detail) return null;
  if (interested) {
    await query(
      "INSERT INTO campaign_interests (campaign_id, donor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [id, donorId],
    );
  } else {
    await query("DELETE FROM campaign_interests WHERE campaign_id = $1 AND donor_id = $2", [id, donorId]);
  }
  const counts = await query<{ total: string }>(
    "SELECT count(*)::text AS total FROM campaign_interests WHERE campaign_id = $1",
    [id],
  );
  return { interestedCount: Number(counts.rows[0]?.total ?? 0), interested };
}

// ---------------------------------------------------------------------------
// Organizers (O-01, O-02, O-03)
// ---------------------------------------------------------------------------

export async function listOwnCampaigns(organizationId: string): Promise<(OwnCampaign & { interestedCount: number })[]> {
  await completeFinishedCampaigns();
  const { rows } = await query<CampaignRow & { interested: string }>(
    `${SELECT.replace("c.donations_count", "c.donations_count, (SELECT count(*) FROM campaign_interests i WHERE i.campaign_id = c.id)::text AS interested")}
      WHERE c.organization_id = $1
      ORDER BY c.starts_at DESC, c.id`,
    [organizationId],
  );
  return rows.map((row) => ({ ...toStored(row), interestedCount: Number(row.interested) }));
}

export interface InterestedDonor {
  name: string;
  bloodGroup: string | null;
  area: string | null;
  markedAt: string;
}

export async function getOwnCampaign(
  organizationId: string,
  id: string,
): Promise<{ campaign: OwnCampaign; interested: InterestedDonor[]; recordedDonors: number } | null> {
  await completeFinishedCampaigns();
  const { rows } = await query<CampaignRow>(`${SELECT} WHERE c.id = $1 AND c.organization_id = $2`, [id, organizationId]);
  if (!rows[0]) return null;
  const interested = await query<{ name: string; blood_group: string | null; area: string | null; created_at: Date | string }>(
    `SELECT d.name, d.blood_group, d.area, i.created_at
       FROM campaign_interests i JOIN donors d ON d.id = i.donor_id
      WHERE i.campaign_id = $1 ORDER BY i.created_at, d.name`,
    [id],
  );
  const recorded = await query<{ total: string }>(
    "SELECT count(*)::text AS total FROM donation_history WHERE campaign_id = $1",
    [id],
  );
  return {
    campaign: toStored(rows[0]),
    interested: interested.rows.map((r) => ({
      name: r.name,
      bloodGroup: r.blood_group,
      area: r.area,
      markedAt: iso(r.created_at),
    })),
    recordedDonors: Number(recorded.rows[0]?.total ?? 0),
  };
}

/** FR-CAM-01 / FR-CAM-02: creates the campaign as a Draft, or submits it for approval straight away. */
export async function createCampaign(
  organizationId: string,
  values: CampaignValues,
  action: CampaignAction,
): Promise<string> {
  const status: CampaignStatus = action === "submit" ? "pending_approval" : "draft";
  const { rows } = await query<{ id: string }>(
    `INSERT INTO campaigns
       (organization_id, title_en, title_ur, description_en, description_ur, starts_at, venue, area,
        target_groups, contact_phone, contact_email, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10, $11, $12)
     RETURNING id`,
    [
      organizationId,
      values.titleEn,
      values.titleUr,
      values.descriptionEn,
      values.descriptionUr,
      values.startsAt.toISOString(),
      values.venue,
      values.area,
      groupsLiteral(values.targetGroups),
      values.contactPhone || null,
      values.contactEmail || null,
      status,
    ],
  );
  return rows[0]!.id;
}

export type UpdateResult =
  | { ok: true; status: CampaignStatus; needsApproval: boolean }
  | { ok: false; code: "not_found" | "not_editable" };

/**
 * FR-CAM-02 / FR-CAM-08 / A-29: saves the form.
 *  - A Draft stays a Draft, or becomes Pending Approval when submitted.
 *  - An Approved campaign whose date, time, venue or description changed returns to Pending Approval
 *    and its last approved version is stored, so donors keep seeing it until the administrator decides.
 *  - Any other change to an Approved campaign (contact details, target groups, titles) is saved as is.
 */
export async function updateCampaign(
  organizationId: string,
  id: string,
  values: CampaignValues,
  action: CampaignAction,
): Promise<UpdateResult> {
  return transaction(async (tx) => {
    const found = await tx.query<CampaignRow>(
      `${SELECT} WHERE c.id = $1 AND c.organization_id = $2 FOR UPDATE OF c`,
      [id, organizationId],
    );
    if (!found.rows[0]) return { ok: false, code: "not_found" } as const;
    const current = toStored(found.rows[0]);
    if (current.status !== "draft" && current.status !== "approved") return { ok: false, code: "not_editable" } as const;

    let nextStatus: CampaignStatus = current.status;
    let snapshot: PublicVersion | null = null;
    let needsApproval = false;

    if (current.status === "draft") {
      nextStatus = action === "submit" ? "pending_approval" : "draft";
    } else {
      const changed = changedMaterialFields(
        {
          date: karachiDate(current.startsAt),
          time: karachiTime(current.startsAt),
          venue: current.venue,
          area: current.area ?? "",
          descriptionEn: current.descriptionEn,
          descriptionUr: current.descriptionUr,
        },
        {
          date: values.date,
          time: values.time,
          venue: values.venue,
          area: values.area,
          descriptionEn: values.descriptionEn,
          descriptionUr: values.descriptionUr,
        },
      );
      const after = statusAfterEdit("approved", changed);
      nextStatus = after.status;
      needsApproval = after.needsApproval;
      if (needsApproval) snapshot = currentVersion(current);
    }

    await tx.query(
      `UPDATE campaigns
          SET title_en = $2, title_ur = $3, description_en = $4, description_ur = $5, starts_at = $6,
              venue = $7, area = $8, target_groups = $9::text[], contact_phone = $10, contact_email = $11,
              status = $12, approved_snapshot = $13::jsonb, review_reason = NULL, updated_at = now()
        WHERE id = $1`,
      [
        id,
        values.titleEn,
        values.titleUr,
        values.descriptionEn,
        values.descriptionUr,
        values.startsAt.toISOString(),
        values.venue,
        values.area,
        groupsLiteral(values.targetGroups),
        values.contactPhone || null,
        values.contactEmail || null,
        nextStatus,
        // Keep the stored approved version while a change waits; clear it for a Draft.
        needsApproval
          ? JSON.stringify(snapshot)
          : current.status === "approved" && current.approvedSnapshot
            ? JSON.stringify(current.approvedSnapshot)
            : null,
      ],
    );
    return { ok: true, status: nextStatus, needsApproval } as const;
  });
}

export type CancelResult =
  | { ok: true; notified: number }
  | { ok: false; code: "not_found" | "not_cancellable" };

/** FR-CAM-08: cancels the campaign and tells the donors who marked interest. */
export async function cancelCampaign(organizationId: string, id: string): Promise<CancelResult> {
  const found = await query<CampaignRow>(`${SELECT} WHERE c.id = $1 AND c.organization_id = $2`, [id, organizationId]);
  if (!found.rows[0]) return { ok: false, code: "not_found" };
  const campaign = toStored(found.rows[0]);
  if (!canCancel(campaign.status)) return { ok: false, code: "not_cancellable" };

  const updated = await query<{ id: string }>(
    `UPDATE campaigns SET status = 'cancelled', cancelled_at = now(), updated_at = now()
      WHERE id = $1 AND status IN ('draft', 'pending_approval', 'approved') RETURNING id`,
    [id],
  );
  if (updated.rows.length === 0) return { ok: false, code: "not_cancellable" };

  const donors = await query<{
    user_id: string;
    mobile: string;
    contact_sms: boolean;
    preferred_language: DonorLanguage;
  }>(
    `SELECT d.user_id, d.mobile, d.contact_sms, d.preferred_language
       FROM campaign_interests i JOIN donors d ON d.id = i.donor_id JOIN users u ON u.id = d.user_id
      WHERE i.campaign_id = $1 AND u.status = 'active' AND d.deleted_at IS NULL`,
    [id],
  );
  const notice = cancelledNotice({
    titleEn: campaign.titleEn,
    titleUr: campaign.titleUr,
    dateEn: formatDate(campaign.startsAt, "en"),
    dateUr: formatDate(campaign.startsAt, "ur"),
  });
  for (const donor of donors.rows) {
    await createNotification({
      userId: donor.user_id,
      category: "campaign",
      titleEn: notice.titleEn,
      titleUr: notice.titleUr,
      bodyEn: notice.bodyEn,
      bodyUr: notice.bodyUr,
      link: "/donor/campaigns",
    });
    if (donor.contact_sms) {
      await sendSms(donor.mobile, donor.preferred_language === "ur" ? notice.bodyUr : notice.bodyEn);
    }
  }
  return { ok: true, notified: donors.rows.length };
}

export type OutcomeResult =
  | { ok: true; recorded: "none" | "donor" }
  | { ok: false; code: "not_found" | "not_ready" | "donor_not_found" | "already_recorded" };

/**
 * FR-CAM-09 / FR-DON-04: saves the attendee and donation counts, marks the campaign Completed, and, when
 * a donor phone is given, records a donation for that registered donor, labelled Recorded by organization,
 * so it appears in the donor's history.
 */
export async function recordOutcome(
  organizationId: string,
  id: string,
  values: { attendees: number; donations: number; donorPhone: string | null },
  now: Date = new Date(),
): Promise<OutcomeResult> {
  const found = await query<CampaignRow>(`${SELECT} WHERE c.id = $1 AND c.organization_id = $2`, [id, organizationId]);
  if (!found.rows[0]) return { ok: false, code: "not_found" };
  const campaign = toStored(found.rows[0]);
  const ready =
    campaign.status === "completed" ||
    (campaign.status === "approved" && new Date(campaign.startsAt).getTime() <= now.getTime());
  if (!ready) return { ok: false, code: "not_ready" };

  let donorId: string | null = null;
  if (values.donorPhone) {
    const donor = await findDonorByMobile(values.donorPhone);
    if (!donor) return { ok: false, code: "donor_not_found" };
    donorId = donor.id;
  }

  return transaction(async (tx) => {
    if (donorId) {
      const place = `${campaign.organizationName} - ${campaign.titleEn}`;
      const inserted = await tx.query<{ id: string }>(
        `INSERT INTO donation_history (donor_id, donated_on, place, source, recorded_by_organization_id, campaign_id)
         VALUES ($1, $2::date, $3, 'recorded_by_org', $4, $5)
         ON CONFLICT DO NOTHING RETURNING id`,
        [donorId, karachiDate(campaign.startsAt), place, organizationId, id],
      );
      if (inserted.rows.length === 0) return { ok: false, code: "already_recorded" } as const;
    }
    await tx.query(
      `UPDATE campaigns
          SET attendees = $2, donations_count = $3, outcome_recorded_at = now(), status = 'completed', updated_at = now()
        WHERE id = $1`,
      [id, values.attendees, values.donations],
    );
    return { ok: true, recorded: donorId ? "donor" : "none" } as const;
  });
}

// ---------------------------------------------------------------------------
// FR-CAM-06: telling donors about an approved campaign
// ---------------------------------------------------------------------------

/**
 * Called by the administrator's approval (A-04). Notifies donors who turned campaign notices on, whose area
 * is within the configured distance (default 15 km) of the venue and whose blood group is targeted. Each
 * notice is stored in both languages (FR-NOT-04) and also sent by SMS when the donor chose SMS, in the
 * donor's own language. A donor already told about this campaign is not told twice.
 */
export async function notifyDonorsOfApproval(campaignId: string): Promise<number> {
  const found = await query<CampaignRow>(`${SELECT} WHERE c.id = $1`, [campaignId]);
  if (!found.rows[0]) return 0;
  const campaign = toStored(found.rows[0]);
  if (campaign.status !== "approved" || !campaign.organizationVerified) return 0;

  const areas = await loadAreas();
  const setting = await query<{ value: unknown }>("SELECT value FROM settings WHERE key = 'matching'");
  const raw = setting.rows[0]?.value;
  const matching = (typeof raw === "string" ? JSON.parse(raw) : raw) as { campaign_notice_distance_km?: number } | undefined;
  const maxKm = Number(matching?.campaign_notice_distance_km ?? 15);

  const donors = await query<{
    user_id: string;
    mobile: string;
    area: string | null;
    blood_group: string | null;
    notify_campaigns: boolean;
    contact_sms: boolean;
    preferred_language: DonorLanguage;
    status: string;
  }>(
    `SELECT d.user_id, d.mobile, d.area, d.blood_group, d.notify_campaigns, d.contact_sms, d.preferred_language, u.status
       FROM donors d JOIN users u ON u.id = d.user_id
      WHERE d.deleted_at IS NULL AND u.status = 'active' AND d.notify_campaigns = true`,
  );
  const link = `/donor/campaigns/${campaignId}`;
  const already = await query<{ user_id: string }>(
    "SELECT user_id FROM notifications WHERE category = 'campaign' AND link = $1",
    [link],
  );
  const told = new Set(already.rows.map((r) => r.user_id));

  const notice = approvedNotice({
    titleEn: campaign.titleEn,
    titleUr: campaign.titleUr,
    venue: campaign.venue,
    dateEn: formatDate(campaign.startsAt, "en"),
    dateUr: formatDate(campaign.startsAt, "ur"),
  });

  let sent = 0;
  for (const donor of donors.rows) {
    if (told.has(donor.user_id)) continue;
    const eligible = shouldNotifyDonorOfCampaign({
      donor: {
        notifyCampaigns: donor.notify_campaigns,
        area: donor.area,
        bloodGroup: donor.blood_group,
        accountActive: donor.status === "active",
      },
      campaignArea: campaign.area,
      targetGroups: campaign.targetGroups,
      areas,
      maxKm,
    });
    if (!eligible) continue;
    await createNotification({
      userId: donor.user_id,
      category: "campaign",
      titleEn: notice.titleEn,
      titleUr: notice.titleUr,
      bodyEn: notice.bodyEn,
      bodyUr: notice.bodyUr,
      link,
    });
    if (donor.contact_sms) {
      await sendSms(donor.mobile, donor.preferred_language === "ur" ? notice.bodyUr : notice.bodyEn);
    }
    sent += 1;
  }
  return sent;
}
