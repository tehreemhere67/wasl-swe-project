import { badRequest, json, readJson, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { organizerGuard } from "@/lib/campaigns/guard";
import { createCampaign, listOwnCampaigns } from "@/lib/campaigns/data";
import { validateCampaignInput, type CampaignAction } from "@/lib/campaigns/rules";
import { loadAreas } from "@/lib/donor/data";

/**
 * /api/organizer/campaigns - O-01 / O-02 (FR-CAM-01, FR-CAM-02).
 *
 *  GET   the signed-in organization's own campaigns
 *  POST  create a campaign. { action: "save_draft" | "submit", ...fields }
 *        save_draft -> Draft; submit -> Pending Approval (the administrator decides, A-04)
 *
 * Verified blood banks and donation organizations only; a campaign always belongs to the caller's
 * organization, never to one named in the request.
 */

export async function GET(request: Request) {
  const guard = await organizerGuard(request);
  if ("response" in guard) return guard.response;
  const campaigns = await listOwnCampaigns(guard.session.organizationId);
  return json({ ok: true, count: campaigns.length, campaigns });
}

export async function POST(request: Request) {
  const guard = await organizerGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });
  const action: CampaignAction | null =
    body.action === "submit" ? "submit" : body.action === "save_draft" ? "save_draft" : null;
  if (!action) return badRequest({ code: "invalid_action" });

  const areas = (await loadAreas()).map((a) => a.name);
  const result = validateCampaignInput(body, action, areas);
  if (!result.ok) return badRequest(result.errors);

  let id: string;
  try {
    id = await createCampaign(session.organizationId, result.values, action);
  } catch (error) {
    console.error("[organizer/campaigns POST]", error);
    return serverError();
  }
  await recordAudit({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    action: action === "submit" ? "campaign_submitted" : "campaign_created",
    entityType: "campaign",
    entityId: id,
    details: { title: result.values.titleEn, action },
  });
  return json({ ok: true, id, status: action === "submit" ? "pending_approval" : "draft", redirect: "/organizer/campaigns" });
}
