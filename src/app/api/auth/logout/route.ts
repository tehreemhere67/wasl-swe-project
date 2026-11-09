import { destroyCurrentSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/auth/session";
import { forbidden, redirectTo } from "@/lib/api";
import { isSameOrigin } from "@/lib/csrf";

/** POST /api/auth/logout - clears the session and returns to the landing page. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const meta = await requestMeta();
  await destroyCurrentSession();
  await recordAudit({ action: "logout", ip: meta.ip });
  return redirectTo(request, "/");
}
