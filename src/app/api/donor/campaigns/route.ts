import { json } from "@/lib/api";
import { donorGuard } from "@/lib/campaigns/guard";
import { listDonorCampaigns } from "@/lib/campaigns/data";
import { filterCampaigns } from "@/lib/campaigns/rules";

/**
 * GET /api/donor/campaigns?area=&date=&group=&q= - D-05 (FR-CAM-03, FR-CAM-04, FR-CAM-05).
 * Upcoming Approved campaigns only, each with its organizer's name and verification status.
 * Donors only: a hospital, bank or visitor is refused.
 */
export async function GET(request: Request) {
  const guard = await donorGuard(request);
  if ("response" in guard) return guard.response;
  const url = new URL(request.url);
  const all = await listDonorCampaigns();
  const results = filterCampaigns(all, {
    area: url.searchParams.get("area") ?? "",
    date: url.searchParams.get("date") ?? "",
    group: url.searchParams.get("group") ?? "",
    q: url.searchParams.get("q") ?? "",
  });
  return json({ ok: true, count: results.length, campaigns: results });
}
