import { badRequest, json, readJson, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { donorGuard } from "@/lib/campaigns/guard";
import { getDonorByUserId, saveReminderDays } from "@/lib/donor/data";
import { validateReminderDays } from "@/lib/donor/rules";

/** PATCH /api/donor/reminder - D-04 "Remind me after N days" (FR-DON-06). An empty value turns it off. */
export async function PATCH(request: Request) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const donor = await getDonorByUserId(session.user.id);
  if (!donor) return json({ ok: false, error: { code: "not_found" } }, 404);

  const result = validateReminderDays(body.remindDays);
  if (!result.ok) return badRequest(result.errors);

  try {
    await saveReminderDays(donor.id, result.days);
  } catch (error) {
    console.error("[donor/reminder PATCH]", error);
    return serverError();
  }
  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "donor",
    action: "donor_reminder_changed",
    entityType: "donor",
    entityId: donor.id,
    details: { days: result.days },
  });
  return json({ ok: true, remindDays: result.days });
}
