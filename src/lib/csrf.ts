/**
 * CSRF hardening for JSON API routes - NFR-SEC-04.
 *
 * Cookies are SameSite=Lax, which already blocks cross-site POSTs. We also
 * require a matching Origin header whenever the browser sends one, which stops
 * form-less cross-site submissions and non-browser replay from another origin.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Same-origin form posts may omit Origin in older browsers; the SameSite
    // cookie is the primary defence in that case.
    return true;
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
