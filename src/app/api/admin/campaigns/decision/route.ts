import { getSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/csrf";
import { query, transaction } from "@/lib/db";
import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import {
  campaignStatusFor,
  isReviewableCampaignStatus,
  validateCampaignDecision,
  type CampaignDecision,
} from "@/lib/admin/rules";

/**
 * POST /api/admin/campaigns/decision - A-04 campaign review.
 *
 * approve -> approved, reject -> rejected, return -> draft ("return for
 * changes"). Only a campaign in pending_approval can be reviewed. The decision,
 * the audit entry and the organizer notification follow one after the other.
 */

const AUDIT_ACTION: Record<CampaignDecision, "campaign_approved" | "campaign_rejected" | "campaign_returned"> = {
  approve: "campaign_approved",
  reject: "campaign_rejected",
  return: "campaign_returned",
};

interface Copy {
  titleEn: string;
  titleUr: string;
  bodyEn: (title: string, reason: string) => string;
  bodyUr: (title: string, reason: string) => string;
}

const COPY: Record<CampaignDecision, Copy> = {
  approve: {
    titleEn: "Campaign approved",
    titleUr: "مہم منظور ہو گئی",
    bodyEn: (title) => `Your campaign "${title}" is approved and now visible to donors.`,
    bodyUr: (title) => `آپ کی مہم "${title}" منظور ہو گئی اور اب عطیہ دہندگان کو نظر آتی ہے۔`,
  },
  reject: {
    titleEn: "Campaign rejected",
    titleUr: "مہم مسترد ہو گئی",
    bodyEn: (title, reason) => `Your campaign "${title}" was rejected. Reason: ${reason}`,
    bodyUr: (title, reason) => `آپ کی مہم "${title}" مسترد کر دی گئی۔ وجہ: ${reason}`,
  },
  return: {
    titleEn: "Campaign returned for changes",
    titleUr: "مہم ترمیم کے لیے واپس کر دی گئی",
    bodyEn: (title, reason) => `Your campaign "${title}" needs changes. Reason: ${reason}`,
    bodyUr: (title, reason) => `آپ کی مہم "${title}" میں تبدیلیاں درکار ہیں۔ وجہ: ${reason}`,
  },
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const session = await getSession();
  if (!session) return unauthorized();
  if (session.user.role !== "admin") return forbidden();

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateCampaignDecision(body);
  if (!validation.ok) return badRequest(validation.errors);

  const campaignId = validation.values.campaignId;
  const decision = validation.values.decision as CampaignDecision;
  const reason = validation.values.reason;

  const found = await query<{
    id: string;
    organization_id: string;
    status: string;
    title_en: string;
    title_ur: string;
  }>(
    `SELECT id, organization_id, status, title_en, title_ur
       FROM campaigns WHERE id = $1`,
    [campaignId],
  );
  const campaign = found.rows[0];
  if (!campaign) return json({ ok: false, error: { code: "not_found" } }, 404);

  if (!isReviewableCampaignStatus(campaign.status)) {
    return json({ ok: false, error: { code: "not_pending" } }, 409);
  }

  const nextStatus = campaignStatusFor(decision);

  try {
    await transaction(async (tx) => {
      const updated = await tx.query<{ id: string }>(
        `UPDATE campaigns
            SET status = $2,
                review_reason = $3,
                reviewed_by = $4,
                reviewed_at = now(),
                updated_at = now()
          WHERE id = $1 AND status = 'pending_approval'
          RETURNING id`,
        [campaignId, nextStatus, decision === "approve" ? null : reason, session.user.id],
      );
      if (updated.rows.length === 0) throw new Error("not_pending");
    });
  } catch (error) {
    if ((error as Error).message === "not_pending") {
      return json({ ok: false, error: { code: "not_pending" } }, 409);
    }
    console.error("[admin/campaigns/decision]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }

  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "admin",
    action: AUDIT_ACTION[decision],
    entityType: "campaign",
    entityId: campaignId,
    details: { decision, reason: reason || null, campaignTitle: campaign.title_en },
  });

  try {
    const recipients = await query<{ id: string }>(
      "SELECT id FROM users WHERE organization_id = $1 AND status = 'active'",
      [campaign.organization_id],
    );
    const copy = COPY[decision];
    for (const user of recipients.rows) {
      await createNotification({
        userId: user.id,
        category: "campaign",
        titleEn: copy.titleEn,
        titleUr: copy.titleUr,
        bodyEn: copy.bodyEn(campaign.title_en, reason),
        bodyUr: copy.bodyUr(campaign.title_ur || campaign.title_en, reason),
        link: "/organizer/campaigns",
      });
    }
  } catch (error) {
    // A notification failure must not undo a recorded decision.
    console.error("[admin/campaigns/decision] notification failed", error);
  }

  return json({ ok: true, status: nextStatus });
}