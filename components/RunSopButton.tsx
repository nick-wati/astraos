"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunSopButton({
  sopId,
  size = "default"
}: {
  sopId: string;
  size?: "default" | "sm" | "lg";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRunning, setIsRunning] = useState(false);

  function runSop() {
    setIsRunning(true);
    startTransition(async () => {
      const response = await fetch(`/api/sops/${sopId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          trigger: "Manual run from AstraOS command center"
        })
      });
      const data = (await response.json()) as { runId?: string };
      setIsRunning(false);
      if (data.runId) {
        router.push(`/runs/${data.runId}`);
        router.refresh();
      }
    });
  }

  return (
    <Button onClick={runSop} disabled={isPending || isRunning} size={size}>
      {isPending || isRunning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      Run SOP
    </Button>
  );
}
