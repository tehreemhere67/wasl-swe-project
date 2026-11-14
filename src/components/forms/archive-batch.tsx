"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/ui";

/**
 * 4.4 soft delete. Shown only for a batch that holds no units: it hides the batch
 * from the inventory list but keeps the row and its movement history (DR-05).
 */
export function ArchiveBatch({
  batchId,
  labels,
}: {
  batchId: string;
  labels: { action: string; hint: string; working: string; error: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleArchive() {
    setFailed(false);
    setPending(true);
    try {
      const response = await fetch(`/api/inventory/batches/${batchId}/archive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const data = (await response.json()) as { ok?: boolean };
      if (data.ok) {
        router.push("/bank/inventory");
        router.refresh();
        return;
      }
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
      <p className="text-sm text-ink-700">{labels.hint}</p>
      {failed ? (
        <div className="mt-2">
          <Alert tone="error" role="alert">
            {labels.error}
          </Alert>
        </div>
      ) : null}
      <div className="mt-3">
        <Button variant="danger" onClick={handleArchive} disabled={pending}>
          {pending ? labels.working : labels.action}
        </Button>
      </div>
    </div>
  );
}
