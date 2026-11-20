"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/ui";
import { sendJson } from "./send-json";

/** O-02 - "Cancel campaign" (FR-CAM-08), with an inline confirmation. Interested donors are told by the server. */
export function CancelCampaign({
  campaignId,
  labels,
}: {
  campaignId: string;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function cancel() {
    setPending(true);
    setError(false);
    const reply = await sendJson(`/api/organizer/campaigns/${campaignId}/cancel`, "POST", {});
    setPending(false);
    if (reply.ok) {
      setConfirming(false);
      router.refresh();
    } else {
      setError(true);
    }
  }

  if (!confirming) {
    return (
      <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>
        {labels["organizer.campaign.cancel"]}
      </Button>
    );
  }
  return (
    <div className="space-y-2">
      <Alert tone="warning" role="alert">
        {error ? labels["organizer.campaign.errorGeneric"] : labels["organizer.campaign.cancelConfirm"]}
      </Alert>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="danger" size="sm" onClick={cancel} disabled={pending}>
          {pending ? labels["organizer.campaign.cancelling"] : labels["organizer.campaign.cancelYes"]}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          {labels["organizer.campaign.cancelKeep"]}
        </Button>
      </div>
    </div>
  );
}
