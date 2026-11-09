/**
 * Formatting helpers. NFR-LOC-05: dates and times are shown in PKT
 * (Asia/Karachi) on the Gregorian calendar, consistently in both languages.
 */

import type { Locale } from "./i18n/types";

export const PKT_TIME_ZONE = "Asia/Karachi";

function intlLocale(locale: Locale): string {
  return locale === "ur" ? "ur-PK" : "en-GB";
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "12 Nov 2026" */
export function formatDate(value: Date | string | null | undefined, locale: Locale = "en"): string {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: PKT_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** e.g. "12 Nov 2026, 18:00" (PKT) */
export function formatDateTime(
  value: Date | string | null | undefined,
  locale: Locale = "en",
): string {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: PKT_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Short time only, e.g. "18:00" */
export function formatTime(value: Date | string | null | undefined, locale: Locale = "en"): string {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: PKT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** "Now", "5 min ago", "3 h ago", "2 d ago" - localized by the caller. */
export function relativeTimeParts(
  value: Date | string | null | undefined,
  now: Date = new Date(),
): { unit: "now" | "minutes" | "hours" | "days"; count: number } {
  const date = toDate(value);
  if (!date) return { unit: "now", count: 0 };
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (diffMinutes < 1) return { unit: "now", count: 0 };
  if (diffMinutes < 60) return { unit: "minutes", count: diffMinutes };
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return { unit: "hours", count: hours };
  return { unit: "days", count: Math.floor(hours / 24) };
}

/** Days and hours waited, used by the administrator's verification queue. */
export function waitingTimeParts(
  createdAt: Date | string,
  now: Date = new Date(),
): { days: number; hours: number } {
  const date = toDate(createdAt);
  if (!date) return { days: 0, hours: 0 };
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffHours = Math.floor(diffMs / 3600000);
  return { days: Math.floor(diffHours / 24), hours: diffHours % 24 };
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
