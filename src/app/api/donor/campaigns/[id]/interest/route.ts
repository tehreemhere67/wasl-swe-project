import { badRequest, json, readJson, serverError } from "@/lib/api";
import { donorGuard } from "@/lib/campaigns/guard";
import { setInterest } from "@/lib/campaigns/data";
import { getDonorByUserId } from "@/lib/donor/data";

/**
 * POST /api/donor/campaigns/[id]/interest - D-06 "I plan to attend" (FR-CAM-07, A-30).
 * Body { interested: true | false }. Interest is not binding and can be withdrawn.
 * A campaign that donors may not see (Draft, Pending first submission, Rejected...) answers 404.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: { code: "not_found" } }, 404);

  const body = await readJson<{ interested?: unknown }>(request);
  if (!body || typeof body.interested !== "boolean") return badRequest({ code: "invalid_request" });

  const donor = await getDonorByUserId(guard.session.user.id);
  if (!donor) return json({ ok: false, error: { code: "not_found" } }, 404);

  try {
    const result = await setInterest(id, donor.id, body.interested);
    if (!result) return json({ ok: false, error: { code: "not_found" } }, 404);
    return json({ ok: true, ...result });
  } catch (error) {
    console.error("[donor/campaigns interest]", error);
    return serverError();
  }
}
