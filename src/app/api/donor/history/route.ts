import { badRequest, json, readJson, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { donorGuard } from "@/lib/campaigns/guard";
import { addSelfReportedDonation, getDonorByUserId, listHistory } from "@/lib/donor/data";
import { validateDonationInput } from "@/lib/donor/rules";

/**
 * /api/donor/history - D-04 (FR-DON-03, FR-DON-04, FR-DON-06).
 *
 *  GET   the donor's history and total (both kinds of entry count - A-19)
 *  POST  add a past donation: date and place, labelled Self-reported
 */

export async function GET(request: Request) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const donor = await getDonorByUserId(guard.session.user.id);
  if (!donor) return json({ ok: false, error: { code: "not_found" } }, 404);
  const history = await listHistory(donor.id);
  return json({ ok: true, ...history });
}

export async function POST(request: Request) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const donor = await getDonorByUserId(session.user.id);
  if (!donor) return json({ ok: false, error: { code: "not_found" } }, 404);

  const result = validateDonationInput(body);
  if (!result.ok) return badRequest(result.errors);

  let id: string;
  try {
    id = await addSelfReportedDonation(donor.id, result.values);
  } catch (error) {
    console.error("[donor/history POST]", error);
    return serverError();
  }
  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "donor",
    action: "donor_donation_added",
    entityType: "donation_history",
    entityId: id,
    details: { donatedOn: result.values.donatedOn, source: "self_reported" },
  });
  return json({ ok: true, id });
}
