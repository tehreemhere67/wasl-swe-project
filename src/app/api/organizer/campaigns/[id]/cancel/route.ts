import { json, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { organizerGuard } from "@/lib/campaigns/guard";
import { cancelCampaign } from "@/lib/campaigns/data";

/**
 * POST /api/organizer/campaigns/[id]/cancel - O-02 "Cancel campaign" (FR-CAM-08).
 * A Draft, Pending or Approved campaign of the caller's own organization is cancelled and the donors who marked
 * interest are told. A finished, rejected or already cancelled campaign answers 409.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await organizerGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: { code: "not_found" } }, 404);

  try {
    const result = await cancelCampaign(session.organizationId, id);
    if (!result.ok) {
      return json({ ok: false, error: { code: result.code } }, result.code === "not_found" ? 404 : 409);
    }
    await recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role,
      action: "campaign_cancelled",
      entityType: "campaign",
      entityId: id,
      details: { notified: result.notified },
    });
    return json({ ok: true, notified: result.notified, redirect: "/organizer/campaigns" });
  } catch (error) {
    console.error("[organizer/campaigns cancel]", error);
    return serverError();
  }
}
