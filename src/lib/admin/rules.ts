/**
 * Pure rules for the administrator area - Member 2, Sprint 1.
 *
 * A-03 account management (FR-ADM-02) and A-04 campaign review
 * (FR-ADM-03/04/05). Deliberately import-free: no React, no `server-only`,
 * no database, so plain `node` can unit-test it (tests/admin.test.ts).
 */

export interface RuleError {
  field: string;
  message: string;
}

export interface RuleResult {
  ok: boolean;
  errors: RuleError[];
  values: Record<string, string>;
}

/** ------------------------------------------------------------------ */
/** A-03 - account management                                           */
/** ------------------------------------------------------------------ */

export const ACCOUNT_ACTIONS = ["deactivate", "reactivate"] as const;
export type AccountAction = (typeof ACCOUNT_ACTIONS)[number];

export const ACCOUNT_STATUSES = ["active", "deactivated"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export function isAccountAction(value: unknown): value is AccountAction {
  return typeof value === "string" && (ACCOUNT_ACTIONS as readonly string[]).includes(value);
}

export function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === "string" && (ACCOUNT_STATUSES as readonly string[]).includes(value);
}

/** Trim, lower-case, collapse whitespace. Never builds a regex or SQL. */
export function normalizeQuery(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

/** +923001110003 and 03001110003 both become 03001110003 for phone search. */
function localDigits(value: string): string {
  const digits = digitsOf(value);
  return digits.startsWith("92") && digits.length > 10 ? `0${digits.slice(2)}` : digits;
}

export interface AccountSearchRow {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  organizationName?: string | null;
}

/** Case-insensitive search used by A-03: name, email, phone, organization. */
export function matchesAccountQuery(row: AccountSearchRow, query: unknown): boolean {
  const term = normalizeQuery(query);
  if (!term) return true;

  const haystacks = [row.fullName, row.email ?? "", row.phone ?? "", row.organizationName ?? ""];
  if (haystacks.some((value) => value.toLowerCase().includes(term))) return true;

  const termDigits = localDigits(term);
  if (!termDigits || !row.phone) return false;
  return localDigits(row.phone).includes(termDigits);
}

export function validateAccountAction(input: Record<string, unknown>): RuleResult {
  const errors: RuleError[] = [];
  const values = {
    userId: typeof input.userId === "string" ? input.userId.trim() : "",
    action: typeof input.action === "string" ? input.action.trim() : "",
  };

  if (!values.userId) errors.push({ field: "userId", message: "required" });
  if (!values.action) errors.push({ field: "action", message: "required" });
  else if (!isAccountAction(values.action)) errors.push({ field: "action", message: "invalid" });

  return { ok: errors.length === 0, errors, values };
}

export type AccountBlockReason =
  | "self"
  | "last_admin"
  | "already_deactivated"
  | "already_active";

export interface AccountChangeInput {
  actorId: string;
  targetId: string;
  targetRole: string;
  targetStatus: AccountStatus;
  /** Administrators whose status is currently "active". */
  activeAdminCount: number;
}

export type AccountChangeDecision = { ok: true } | { ok: false; reason: AccountBlockReason };

export function canChangeAccountStatus(
  input: AccountChangeInput,
  action: AccountAction,
): AccountChangeDecision {
  // An administrator may never change their own account, so the platform
  // always keeps at least one working administrator login.
  if (input.actorId === input.targetId) return { ok: false, reason: "self" };

  if (action === "deactivate") {
    if (input.targetStatus === "deactivated") return { ok: false, reason: "already_deactivated" };
    if (input.targetRole === "admin" && input.activeAdminCount <= 1) {
      return { ok: false, reason: "last_admin" };
    }
    return { ok: true };
  }

  if (input.targetStatus === "active") return { ok: false, reason: "already_active" };
  return { ok: true };
}

/** ------------------------------------------------------------------ */
/** A-04 - campaign review                                              */
/** ------------------------------------------------------------------ */

/** "return" = return for changes: the campaign goes back to Draft. */
export const CAMPAIGN_DECISIONS = ["approve", "reject", "return"] as const;
export type CampaignDecision = (typeof CAMPAIGN_DECISIONS)[number];

/** SRS 4.2 fixed campaign statuses. */
export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "cancelled",
  "completed",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export function isCampaignDecision(value: unknown): value is CampaignDecision {
  return typeof value === "string" && (CAMPAIGN_DECISIONS as readonly string[]).includes(value);
}

/** Only a campaign waiting for approval may be reviewed. */
export function isReviewableCampaignStatus(status: unknown): boolean {
  return status === "pending_approval";
}

export function campaignStatusFor(decision: CampaignDecision): CampaignStatus {
  if (decision === "approve") return "approved";
  if (decision === "reject") return "rejected";
  return "draft";
}

export function validateCampaignDecision(input: Record<string, unknown>): RuleResult {
  const errors: RuleError[] = [];
  const values = {
    campaignId: typeof input.campaignId === "string" ? input.campaignId.trim() : "",
    decision: typeof input.decision === "string" ? input.decision.trim() : "",
    reason: typeof input.reason === "string" ? input.reason.trim() : "",
  };

  if (!values.campaignId) errors.push({ field: "campaignId", message: "required" });

  if (!values.decision) {
    errors.push({ field: "decision", message: "required" });
  } else if (!isCampaignDecision(values.decision)) {
    errors.push({ field: "decision", message: "invalid" });
  } else if (
    (values.decision === "reject" || values.decision === "return") &&
    values.reason.length < 3
  ) {
    errors.push({ field: "reason", message: "required" });
  }

  return { ok: errors.length === 0, errors, values };
}

/** Maps a campaign status to the shared Badge tones (IR-02). */
export function campaignStatusTone(
  status: string,
): "neutral" | "verified" | "pending" | "rejected" | "suspended" {
  switch (status) {
    case "approved":
      return "verified";
    case "pending_approval":
      return "pending";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "suspended";
    default:
      return "neutral";
  }
}