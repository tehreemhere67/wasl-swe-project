import { badRequest, json, readJson, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { organizerGuard } from "@/lib/campaigns/guard";
import { getOwnCampaign, updateCampaign } from "@/lib/campaigns/data";
import { validateCampaignInput, type CampaignAction } from "@/lib/campaigns/rules";
import { loadAreas } from "@/lib/donor/data";

/**
 * /api/organizer/campaigns/[id] - edit one of the organization's own campaigns.
 *
 *  GET    the campaign with its interested donors (FR-CAM-07: number and list for the organizer)
 *  PATCH  { action: "save_draft" | "submit", ...fields } - save a Draft or submit it; saving an Approved campaign
 *         with a changed date, time, venue or description sends it back to Pending Approval while the previously
 *         approved version stays visible to donors (FR-CAM-08, A-29)
 *
 * Another organization's campaign answers 404, as if it did not exist.
 */

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await organizerGuard(request);
  if ("response" in guard) return guard.response;
  const { id } = await context.params;
  if (!UUID.test(id)) return json({ ok: false, error: { code: "not_found" } }, 404);
  const found = await getOwnCampaign(guard.session.organizationId, id);
  if (!found) return json({ ok: false, error: { code: "not_found" } }, 404);
  return json({
    ok: true,
    campaign: found.campaign,
    interestedCount: found.interested.length,
    interested: found.interested,
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await organizerGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;
  const { id } = await context.params;
  if (!UUID.test(id)) return json({ ok: false, error: { code: "not_found" } }, 404);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });
  const action: CampaignAction | null =
    body.action === "submit" ? "submit" : body.action === "save_draft" ? "save_draft" : null;
  if (!action) return badRequest({ code: "invalid_action" });

  const existing = await getOwnCampaign(session.organizationId, id);
  if (!existing) return json({ ok: false, error: { code: "not_found" } }, 404);

  // An Approved campaign is a complete one: its edits are held to the submit rules.
  const strictness: CampaignAction =
    action === "submit" || existing.campaign.status === "approved" ? "submit" : "save_draft";
  const areas = (await loadAreas()).map((a) => a.name);
  const result = validateCampaignInput(body, strictness, areas);
  if (!result.ok) return badRequest(result.errors);

  try {
    const updated = await updateCampaign(session.organizationId, id, result.values, action);
    if (!updated.ok) {
      return json({ ok: false, error: { code: updated.code } }, updated.code === "not_found" ? 404 : 409);
    }
    await recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role,
      action: updated.needsApproval || action === "submit" ? "campaign_submitted" : "campaign_updated",
      entityType: "campaign",
      entityId: id,
      details: { title: result.values.titleEn, status: updated.status, needsApproval: updated.needsApproval },
    });
    return json({ ok: true, status: updated.status, needsApproval: updated.needsApproval, redirect: "/organizer/campaigns" });
  } catch (error) {
    console.error("[organizer/campaigns PATCH]", error);
    return serverError();
  }
}
