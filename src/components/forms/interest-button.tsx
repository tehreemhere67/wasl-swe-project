"use client";

import { useRef, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { sendJson } from "./send-json";

/**
 * D-06 - "I plan to attend" (FR-CAM-07, A-30). Interest is not binding and can be withdrawn, so the same button
 * toggles it. The count is shown to the donor and to the organizer.
 */
export function InterestButton({
  campaignId,
  initialInterested,
  initialCount,
  labels,
}: {
  campaignId: string;
  initialInterested: boolean;
  initialCount: number;
  labels: { attend: string; attending: string; withdraw: string; count: string; nonBinding: string; error: string };
}) {
  const [interested, setInterested] = useState(initialInterested);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function toggle() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(false);
    const reply = await sendJson(`/api/donor/campaigns/${campaignId}/interest`, "POST", { interested: !interested });
    if (reply.ok) {
      setInterested(Boolean(reply.data.interested));
      setCount(Number(reply.data.interestedCount ?? 0));
    } else {
      setError(true);
    }
    busy.current = false;
    setPending(false);
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert tone="error" role="alert">
          {labels.error}
        </Alert>
      ) : null}
      {interested ? (
        <p className="text-sm font-semibold text-ok-900" role="status">
          {labels.attending}
        </p>
      ) : null}
      <Button type="button" variant={interested ? "secondary" : "primary"} onClick={toggle} disabled={pending}>
        {interested ? labels.withdraw : labels.attend}
      </Button>
      <p className="text-sm text-ink-600" data-testid="interested-count">
        {labels.count.replace("{count}", String(count))}
      </p>
      <p className="hint">{labels.nonBinding}</p>
    </div>
  );
}
