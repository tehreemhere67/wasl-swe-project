import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { forbidden, json, unauthorized } from "@/lib/api";

/**
 * GET /api/documents/[id] - serves a supporting document.
 *
 * DR-04: "Verification documents shall be visible only to administrators and
 * to the submitting organization."
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await context.params;

  const { rows } = await query<{
    file_name: string;
    mime_type: string;
    content: Uint8Array | null;
    organization_id: string;
  }>(
    `SELECT d.file_name, d.mime_type, d.content, d.organization_id
       FROM organization_documents d
      WHERE d.id = $1`,
    [id],
  );

  if (rows.length === 0) return json({ ok: false, error: { code: "not_found" } }, 404);
  const document = rows[0];

  const isAdmin = session.user.role === "admin";
  const isOwner = session.user.organization?.id === document.organization_id;
  if (!isAdmin && !isOwner) return forbidden();

  const bytes = document.content ?? new Uint8Array();
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": document.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${document.file_name.replace(/["\\]/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
