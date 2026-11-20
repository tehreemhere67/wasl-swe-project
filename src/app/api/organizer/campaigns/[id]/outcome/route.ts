import { badRequest, json, readJson, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { organizerGuard } from "@/lib/campaigns/guard";
import { getOwnCampaign, recordOutcome } from "@/lib/campaigns/data";
import { validateOutcomeInput } from "@/lib/campaigns/rules";
import { normalizeMobile } from "@/lib/validation";

/**
 * POST /api/organizer/campaigns/[id]/outcome - O-03 completion form (FR-CAM-09, FR-DON-04).
 * Body { attendees, donations, donorPhone? }. Saves the counts, marks the campaign Completed and, if a phone is
 * given, records a donation for that registered donor (labelled Recorded by organization). Repeat the request with
 * another phone to record another donor.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await organizerGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: { code: "not_found" } }, 404);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const existing = await getOwnCampaign(session.organizationId, id);
  if (!existing) return json({ ok: false, error: { code: "not_found" } }, 404);

  const result = validateOutcomeInput(body, normalizeMobile, existing.recordedDonors);
  if (!result.ok) return badRequest(result.errors);

  try {
    const saved = await recordOutcome(session.organizationId, id, result.values);
    if (!saved.ok) {
      if (saved.code === "not_found") return json({ ok: false, error: { code: "not_found" } }, 404);
      if (saved.code === "not_ready") return json({ ok: false, error: { code: "not_ready" } }, 409);
      const message = saved.code === "donor_not_found" ? "organizer.error.donorNotFound" : "organizer.error.donorAlreadyRecorded";
      return badRequest([{ field: "donorPhone", message }]);
    }
    await recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role,
      action: "campaign_outcome_recorded",
      entityType: "campaign",
      entityId: id,
      details: { attendees: result.values.attendees, donations: result.values.donations, donorRecorded: saved.recorded === "donor" },
    });
    return json({ ok: true, recorded: saved.recorded });
  } catch (error) {
    console.error("[organizer/campaigns outcome]", error);
    return serverError();
  }
}
