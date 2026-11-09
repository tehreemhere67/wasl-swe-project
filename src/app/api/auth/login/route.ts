import { authenticate } from "@/lib/auth/login";
import { landingPath } from "@/lib/auth/rules";
import { requestMeta } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { validateLogin } from "@/lib/validation";
import { badRequest, forbidden, json, readJson } from "@/lib/api";

/** POST /api/auth/login - G-01. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson<{ identifier?: string; password?: string }>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateLogin(body);
  if (!validation.ok || !validation.values) return badRequest(validation.errors);

  const meta = await requestMeta();
  const outcome = await authenticate(validation.values.identifier, validation.values.password, meta);

  if (!outcome.ok) {
    if (outcome.reason === "locked") {
      const minutes = Math.max(
        1,
        Math.ceil((outcome.lockedUntil.getTime() - Date.now()) / 60000),
      );
      return json({ ok: false, error: { code: "locked", minutes } }, 429);
    }
    if (outcome.reason === "deactivated") {
      return json({ ok: false, error: { code: "deactivated" } }, 403);
    }
    return json(
      { ok: false, error: { code: "invalid", attemptsLeft: outcome.attemptsLeft ?? null } },
      401,
    );
  }

  return json({
    ok: true,
    redirect: landingPath(
      outcome.user.role,
      outcome.user.organization?.verificationStatus ?? null,
    ),
  });
}
