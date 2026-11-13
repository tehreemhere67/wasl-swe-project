"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, TextArea } from "@/components/ui";

export interface CampaignReviewLabels {
  approve: string;
  reject: string;
  returnForChange: string;
  reasonPlaceholder: string;
  reasonRequired: string;
  reviewed: string;
  notPending: string;
  error: string;
  working: string;
}

/**
 * A-04 - Approve / Reject + reason / Return for changes (FR-ADM-03/04/05).
 * A rejection or a return requires a reason; the server re-checks it.
 */
export function CampaignReviewPanel({
  campaignId,
  labels,
}: {
  campaignId: string;
  labels: CampaignReviewLabels;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approve" | "reject" | "return") {
    setError(null);
    setMessage(null);

    if ((decision === "reject" || decision === "return") && reason.trim().length < 3) {
      setError(labels.reasonRequired);
      return;
    }

    setPending(decision);
    try {
      const response = await fetch("/api/admin/campaigns/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, decision, reason: reason.trim() }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: { code?: string } };
      if (!data.ok) {
        setError(data.error?.code === "not_pending" ? labels.notPending : labels.error);
        return;
      }
      setReason("");
      setMessage(labels.reviewed);
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <TextArea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={labels.reasonPlaceholder}
        aria-label={labels.reasonPlaceholder}
        rows={2}
      />

      {message ? (
        <Alert tone="success" role="status">
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="error" role="alert">
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending !== null}
          onClick={() => decide("approve")}
        >
          {pending === "approve" ? labels.working : labels.approve}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={pending !== null}
          onClick={() => decide("reject")}
        >
          {pending === "reject" ? labels.working : labels.reject}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending !== null}
          onClick={() => decide("return")}
        >
          {pending === "return" ? labels.working : labels.returnForChange}
        </Button>
      </div>
    </div>
  );
}