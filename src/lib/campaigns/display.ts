import type { Locale } from "@/lib/i18n/types";
import { formatDate } from "@/lib/format";
import { karachiTime } from "./rules";

/** Shared display helpers for the campaign screens (pure, no database). */

export function campaignTitle(c: { titleEn: string; titleUr: string }, locale: Locale): string {
  return locale === "ur" && c.titleUr.trim() ? c.titleUr : c.titleEn;
}

export function campaignDescription(
  c: { descriptionEn: string; descriptionUr: string },
  locale: Locale,
): string {
  return locale === "ur" && c.descriptionUr.trim() ? c.descriptionUr : c.descriptionEn;
}

/** "20 Nov 2026 · 10:00" in Karachi time. */
export function campaignWhen(startsAt: string, locale: Locale): string {
  return `${formatDate(startsAt, locale)} · ${karachiTime(startsAt)}`;
}

export const STATUS_KEY: Record<string, string> = {
  draft: "organizer.campaign.statusDraft",
  pending_approval: "organizer.campaign.statusPending",
  approved: "organizer.campaign.statusApproved",
  rejected: "organizer.campaign.statusRejected",
  cancelled: "organizer.campaign.statusCancelled",
  completed: "organizer.campaign.statusCompleted",
};

export const STATUS_TONE: Record<string, "neutral" | "verified" | "pending" | "rejected" | "suspended"> = {
  draft: "neutral",
  pending_approval: "pending",
  approved: "verified",
  rejected: "rejected",
  cancelled: "suspended",
  completed: "neutral",
};
