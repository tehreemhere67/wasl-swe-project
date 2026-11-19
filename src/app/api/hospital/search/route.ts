import { badRequest, forbidden, json, serverError, unauthorized } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { searchAvailability } from "@/lib/search/data";
import { validateSearchInput } from "@/lib/search/rules";

/**
 * GET /api/hospital/search?bloodGroup=O-&component=Red%20blood%20cells
 * Module 5 / H-02 (FR-INV-07, FR-INV-08, FR-INV-09, FR-VER-03, A-12).
 *
 * Order: signed in -> hospital role + Verified organization -> validation -> query.
 * Only a verified hospital reads cross-bank inventory. Donors, blood banks, donation
 * organizations, pending/rejected/suspended hospitals, the public and (on this
 * hospital-only route) administrators are refused. A GET changes nothing, so no
 * same-origin check is needed.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (session.user.role !== "hospital") return forbidden();

  const organization = session.user.organization;
  if (!organization || organization.verificationStatus !== "verified") return forbidden();

  const url = new URL(request.url);
  const validation = validateSearchInput({
    bloodGroup: url.searchParams.get("bloodGroup") ?? undefined,
    component: url.searchParams.get("component") ?? undefined,
  });
  if (!validation.ok) {
    return badRequest(validation.errors.map((error) => ({ field: error.field, message: error.code })));
  }

  try {
    const search = await searchAvailability(validation.values);
    return json({
      ok: true,
      bloodGroup: search.values.bloodGroup,
      component: search.values.component,
      count: search.results.length,
      searchedAt: search.searchedAt,
      results: search.results,
    });
  } catch (error) {
    console.error("[api/hospital/search]", error);
    return serverError();
  }
}
