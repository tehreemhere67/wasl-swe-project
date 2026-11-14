"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/** 7.4 - marks one alert as seen; it leaves the dashboard for 24 hours (A-32). */
export function AcknowledgeAlert({ alertId, label }: { alertId: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const data = (await response.json()) as { ok?: boolean };
      if (data.ok) {
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
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={pending}>
      {failed ? `${label} !` : label}
    </Button>
  );
}
