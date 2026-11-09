import { getSession } from "@/lib/auth/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import { isSameOrigin } from "@/lib/csrf";
import { forbidden, json, readJson, redirectTo, refererPath, unauthorized } from "@/lib/api";

/** POST /api/notifications/read - G-05 mark a single notification or all read. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const session = await getSession();
  if (!session) return unauthorized();

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");

  if (isForm) {
    const form = await request.formData().catch(() => null);
    const id = form ? String(form.get("id") ?? "") : "";
    const all = form ? String(form.get("all") ?? "") === "1" : false;
    if (all) await markAllNotificationsRead(session.user.id);
    else if (id) await markNotificationRead(session.user.id, id);
    return redirectTo(request, refererPath(request, "/notifications"));
  }

  const body = await readJson<{ id?: string; all?: boolean }>(request);
  if (!body) return json({ ok: false, error: { code: "invalid_request" } }, 400);

  if (body.all) await markAllNotificationsRead(session.user.id);
  else if (body.id) await markNotificationRead(session.user.id, body.id);
  else return json({ ok: false, error: { code: "invalid_request" } }, 400);

  return json({ ok: true });
}
