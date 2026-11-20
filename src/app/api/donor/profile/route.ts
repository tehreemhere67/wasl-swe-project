import { badRequest, forbidden, json, readJson, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { savePreferredLanguage } from "@/lib/auth/session";
import { donorGuard } from "@/lib/campaigns/guard";
import { deleteDonorAccount, getDonorByUserId, loadAreas, saveProfile } from "@/lib/donor/data";
import { validateProfileInput } from "@/lib/donor/rules";

/**
 * /api/donor/profile - D-03 (FR-DON-02, FR-DON-05, DR-05).
 *
 *  GET    the donor's own profile
 *  PATCH  save blood group, area, availability, channels, notices and language
 *  DELETE delete the account
 *
 * Donors only. A donor can only ever read or change their own row - the row is found from the session,
 * never from an id in the request.
 */

export async function GET(request: Request) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const profile = await getDonorByUserId(guard.session.user.id);
  if (!profile) return json({ ok: false, error: { code: "not_found" } }, 404);
  return json({ ok: true, profile });
}

export async function PATCH(request: Request) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const current = await getDonorByUserId(session.user.id);
  if (!current) return json({ ok: false, error: { code: "not_found" } }, 404);

  const areas = (await loadAreas()).map((a) => a.name);
  const result = validateProfileInput(body, areas, current.availability);
  if (!result.ok) return badRequest(result.errors);

  try {
    await saveProfile(session.user.id, result.values);
    await savePreferredLanguage(session.user.id, result.values.preferredLanguage);
  } catch (error) {
    console.error("[donor/profile PATCH]", error);
    return serverError();
  }
  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "donor",
    action: "donor_profile_updated",
    entityType: "donor",
    entityId: current.id,
    details: { bloodGroup: result.values.bloodGroup, area: result.values.area, availability: result.values.availability },
  });
  return json({ ok: true, language: result.values.preferredLanguage, redirect: "/donor/profile" });
}

export async function DELETE(request: Request) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;

  // The explicit confirmation word stops an accidental or scripted one-click deletion.
  const body = await readJson<{ confirm?: unknown }>(request);
  if (!body || body.confirm !== true) return forbidden();

  let deleted = false;
  try {
    deleted = await deleteDonorAccount(session.user.id);
  } catch (error) {
    console.error("[donor/profile DELETE]", error);
    return serverError();
  }
  if (!deleted) return json({ ok: false, error: { code: "not_found" } }, 404);
  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "donor",
    action: "donor_account_deleted",
    entityType: "user",
    entityId: session.user.id,
  });
  return json({ ok: true, redirect: "/" });
}
