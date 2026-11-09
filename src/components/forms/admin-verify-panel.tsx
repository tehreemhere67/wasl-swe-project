"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, TextArea } from "@/components/ui";

export interface VerifyPanelLabels {
  approve: string;
  reject: string;
  suspend: string;
  reinstate: string;
  reasonPlaceholder: string;
  reasonRequired: string;
  reviewed: string;
  error: string;
  working: string;
}

/**
 * A-02 - administrator decision controls (FR-VER-02, FR-VER-04).
 * A rejection or a suspension requires a reason.
 */
export function AdminVerifyPanel({
  organizationId,
  status,
  labels,
}: {
  organizationId: string;
  status: "pending" | "verified" | "rejected" | "suspended";
  labels: VerifyPanelLabels;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "rejected" | "suspended" | "reinstated") {
    setError(null);
    setMessage(null);

    if ((decision === "rejected" || decision === "suspended") && reason.trim().length < 3) {
      setError(labels.reasonRequired);
      return;
    }

    setPending(decision);
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, decision, reason: reason.trim() }),
      });
      const data = (await response.json()) as { ok?: boolean };
      if (!data.ok) {
        setError(labels.error);
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
      {status !== "rejected" ? (
        <TextArea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={labels.reasonPlaceholder}
          aria-label={labels.reasonPlaceholder}
          rows={2}
        />
      ) : null}

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
        {status === "pending" ? (
          <>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending !== null}
              onClick={() => decide("approved")}
            >
              {pending === "approved" ? labels.working : labels.approve}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={pending !== null}
              onClick={() => decide("rejected")}
            >
              {pending === "rejected" ? labels.working : labels.reject}
            </Button>
          </>
        ) : null}

        {status === "verified" ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending !== null}
            onClick={() => decide("suspended")}
          >
            {pending === "suspended" ? labels.working : labels.suspend}
          </Button>
        ) : null}

        {status === "suspended" ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending !== null}
            onClick={() => decide("reinstated")}
          >
            {pending === "reinstated" ? labels.working : labels.reinstate}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
