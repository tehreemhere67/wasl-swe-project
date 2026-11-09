import { createSession, requestMeta } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/csrf";
import { transaction } from "@/lib/db";
import {
  isOrganizationType,
  normalizeMobile,
  validateOrganizationRegistration,
  type OrganizationType,
  type Role,
} from "@/lib/validation";
import { badRequest, forbidden, json, readJson, serverError } from "@/lib/api";

/**
 * POST /api/auth/org/register - G-02 and FR-VER-01.
 *
 * Accepts multipart/form-data so that the supporting document is uploaded
 * with the registration. The organization is created with status Pending and
 * the representative is signed in and sent to the account status screen (G-04).
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

const ROLE_FOR_TYPE: Record<OrganizationType, Role> = {
  hospital: "hospital",
  blood_bank: "blood_bank",
  donation_org: "donation_org",
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const contentType = request.headers.get("content-type") ?? "";
  const raw: Record<string, unknown> = {};

  const fieldNames = [
    "type",
    "name",
    "address",
    "officialPhone",
    "officialEmail",
    "licenceNumber",
    "representativeName",
    "representativeDesignation",
    "password",
    "confirmPassword",
    "area",
  ];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return badRequest({ code: "invalid_request" });
    for (const key of fieldNames) {
      const value = form.get(key);
      if (typeof value === "string") raw[key] = value;
    }
    raw.__document = form.get("document");
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    // Some clients post the fields without a file; answer with the specific
    // "supporting document required" error instead of a generic bad request.
    const params = new URLSearchParams(await request.text());
    for (const key of fieldNames) {
      const value = params.get(key);
      if (typeof value === "string") raw[key] = value;
    }
  } else {
    const body = await readJson<Record<string, unknown>>(request);
    if (!body) return badRequest({ code: "invalid_request" });
    Object.assign(raw, body);
  }

  const validation = validateOrganizationRegistration(raw);
  if (!validation.ok || !validation.values) return badRequest(validation.errors);
  const values = validation.values;

  const organizationType = values.type;
  if (!isOrganizationType(organizationType)) {
    return badRequest([{ field: "type", message: "invalid" }]);
  }

  const document = raw.__document;
  if (!(document instanceof File) || document.size === 0) {
    return badRequest([{ field: "document", message: "required" }]);
  }
  if (!ALLOWED_TYPES.has(document.type)) {
    return badRequest([{ field: "document", message: "type" }]);
  }
  if (document.size > MAX_FILE_BYTES) {
    return badRequest([{ field: "document", message: "size" }]);
  }

  const phone = normalizeMobile(values.officialPhone);
  if (!phone) return badRequest([{ field: "officialPhone", message: "invalidMobile" }]);

  const passwordHash = await hashPassword(values.password);
  const fileBytes = Buffer.from(await document.arrayBuffer());
  const area = typeof raw.area === "string" && raw.area.trim() ? raw.area.trim() : null;
  const meta = await requestMeta();

  let organizationId: string;
  let userId: string;
  try {
    const created = await transaction(async (tx) => {
      const org = await tx.query<{ id: string }>(
        `INSERT INTO organizations
           (type, name, address_karachi, area, official_phone, official_email,
            licence_number, representative_name, representative_designation, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
         RETURNING id`,
        [
          organizationType,
          values.name,
          values.address,
          area,
          phone,
          values.officialEmail.toLowerCase(),
          values.licenceNumber,
          values.representativeName,
          values.representativeDesignation,
        ],
      );
      const newOrgId = org.rows[0].id;

      await tx.query(
        `INSERT INTO organization_documents (organization_id, file_name, mime_type, size_bytes, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [newOrgId, document.name, document.type, document.size, fileBytes],
      );

      const user = await tx.query<{ id: string }>(
        `INSERT INTO users (role, email, phone, password_hash, full_name, status, organization_id)
         VALUES ($1, $2, $3, $4, $5, 'active', $6)
         RETURNING id`,
        [
          ROLE_FOR_TYPE[organizationType],
          values.officialEmail.toLowerCase(),
          phone,
          passwordHash,
          values.representativeName,
          newOrgId,
        ],
      );

      return { organizationId: newOrgId, userId: user.rows[0].id };
    });
    organizationId = created.organizationId;
    userId = created.userId;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return json({ ok: false, error: { code: "exists" } }, 409);
    }
    console.error("[org/register]", error);
    return serverError();
  }

  await createSession(userId, meta);
  await recordAudit({
    actorUserId: userId,
    actorRole: ROLE_FOR_TYPE[organizationType],
    action: "organization_registered",
    entityType: "organization",
    entityId: organizationId,
    details: { type: organizationType, name: values.name },
    ip: meta.ip,
  });

  return json({ ok: true, redirect: "/status" });
}
