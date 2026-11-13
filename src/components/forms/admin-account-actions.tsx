"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/ui";

export interface AccountActionLabels {
  deactivate: string;
  reactivate: string;
  working: string;
  updated: string;
  error: string;
  selfBlocked: string;
  lastAdmin: string;
}

/**
 * A-03 - per-account Deactivate / Reactivate (FR-ADM-02).
 * The server still enforces every rule; this only renders the control.
 */
export function AdminAccountActions({
  userId,
  status,
  isSelf,
  labels,
}: {
  userId: string;
  status: "active" | "deactivated";
  isSelf: boolean;
  labels: AccountActionLabels;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const action = status === "active" ? "deactivate" : "reactivate";

  async function run() {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/accounts/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: { code?: string } };
      if (!data.ok) {
        if (data.error?.code === "self") setError(labels.selfBlocked);
        else if (data.error?.code === "last_admin") setError(labels.lastAdmin);
        else setError(labels.error);
        return;
      }
      setMessage(labels.updated);
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setPending(false);
    }
  }

  if (isSelf) {
    return <p className="text-xs text-ink-500">{labels.selfBlocked}</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant={status === "active" ? "secondary" : "primary"}
        disabled={pending}
        onClick={run}
      >
        {pending ? labels.working : status === "active" ? labels.deactivate : labels.reactivate}
      </Button>
      {message ? <span className="text-xs text-ok-900">{message}</span> : null}
      {error ? (
        <Alert tone="error" role="alert">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}