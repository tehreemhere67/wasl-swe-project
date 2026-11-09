import "server-only";

import { query } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { sendSms } from "@/lib/messaging";

/**
 * In-platform notification centre - FR-NOT-04: "The system shall provide every
 * user with an in-platform notification centre showing an unread count. Every
 * notification the system sends shall also be stored there."
 *
 * Modules that produce notifications (requests, campaigns, monitoring) call
 * `createNotification`; the shell only reads them. Content is stored in both
 * languages so it can be shown in whichever language the recipient uses.
 */

export interface NewNotification {
  userId: string;
  category:
    | "verification"
    | "account"
    | "urgent_request"
    | "campaign"
    | "request_closed"
    | "general";
  titleEn: string;
  titleUr: string;
  bodyEn?: string | null;
  bodyUr?: string | null;
  link?: string | null;
}

export async function createNotification(input: NewNotification): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, category, title_en, title_ur, body_en, body_ur, link)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.userId,
      input.category,
      input.titleEn,
      input.titleUr,
      input.bodyEn ?? null,
      input.bodyUr ?? null,
      input.link ?? null,
    ],
  );
}

export interface NotificationRow {
  id: string;
  category: string;
  title_en: string;
  title_ur: string;
  body_en: string | null;
  body_ur: string | null;
  link: string | null;
  delivery_status: string;
  read_at: string | null;
  created_at: string;
}

export async function listNotifications(userId: string, limit = 50): Promise<NotificationRow[]> {
  const { rows } = await query<NotificationRow>(
    `SELECT id, category, title_en, title_ur, body_en, body_ur, link,
            delivery_status, read_at, created_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit],
  );
  return rows;
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const { rows } = await query<{ count: string }>(
    "SELECT count(*)::text AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL",
    [userId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await query(
    "UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2",
    [notificationId, userId],
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await query("UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL", [
    userId,
  ]);
}

/**
 * FR-VER-06: tell an applicant the outcome of its registration through the
 * contact details it gave, and store the same message in the platform.
 */
export async function notifyOrganizationDecision(
  organizationId: string,
  decision: "approved" | "rejected" | "suspended" | "reinstated",
  reason: string | null,
): Promise<void> {
  const { rows } = await query<{
    user_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    org_name: string;
    official_phone: string;
  }>(
    `SELECT u.id AS user_id, u.full_name, u.email, u.phone,
            o.name AS org_name, o.official_phone
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
      WHERE o.id = $1`,
    [organizationId],
  );

  const copy = {
    approved: {
      titleEn: "Registration approved",
      titleUr: "رجسٹریشن منظور ہو گئی",
      bodyEn: "Your organization is verified. You can now use its operational features.",
      bodyUr: "آپ کی تنظیم تصدیق ہو گئی۔ اب آپ اس کی آپریشنل خصوصیات استعمال کر سکتے ہیں۔",
    },
    rejected: {
      titleEn: "Registration rejected",
      titleUr: "رجسٹریشن مسترد ہو گئی",
      bodyEn: reason ? `Reason: ${reason}` : "The registration was rejected.",
      bodyUr: reason ? `وجہ: ${reason}` : "رجسٹریشن مسترد کر دی گئی۔",
    },
    suspended: {
      titleEn: "Organization suspended",
      titleUr: "تنظیم معطل ہو گئی",
      bodyEn: reason ?? "Operational access is paused until the organization is reinstated.",
      bodyUr: reason ?? "بحالی تک آپریشنل رسائی معطل رہے گی۔",
    },
    reinstated: {
      titleEn: "Organization reinstated",
      titleUr: "تنظیم بحال ہو گئی",
      bodyEn: "Operational access has been restored.",
      bodyUr: "آپریشنل رسائی بحال کر دی گئی ہے۔",
    },
  }[decision];

  for (const row of rows) {
    await createNotification({
      userId: row.user_id,
      category: "verification",
      titleEn: copy.titleEn,
      titleUr: copy.titleUr,
      bodyEn: copy.bodyEn,
      bodyUr: copy.bodyUr,
      link: "/status",
    });
  }

  // Also reach the official phone number given at registration (FR-VER-06).
  const seen = new Set<string>();
  for (const row of rows) {
    const target = row.official_phone || row.phone;
    if (!target || seen.has(target)) continue;
    seen.add(target);
    await sendSms(
      target,
      `${copy.titleEn}. ${copy.bodyEn} — Wasl, ${new Date().toISOString().slice(0, 10)}`,
    );
  }
}

/** Human-readable date used in short SMS bodies. */
export function smsDate(value: Date | string): string {
  return formatDate(value, "en");
}
