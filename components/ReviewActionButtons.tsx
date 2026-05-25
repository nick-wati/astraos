"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, RotateCcw, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { action: "approve", label: "Approve", icon: Check },
  { action: "reject", label: "Reject", icon: X },
  { action: "retry", label: "Retry", icon: RotateCcw },
  { action: "escalate", label: "Escalate", icon: ShieldAlert },
  { action: "resolve", label: "Mark resolved", icon: Flag }
] as const;

export function ReviewActionButtons({ reviewItemId }: { reviewItemId: string }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(action: (typeof actions)[number]["action"]) {
    setPendingAction(action);
    startTransition(async () => {
      const response = await fetch(`/api/review/${reviewItemId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = (await response.json()) as { runId?: string };
      setPendingAction(null);
      if (action === "retry" && data.runId) {
        router.push(`/runs/${data.runId}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ action, label, icon: Icon }) => (
        <Button
          key={action}
          size="sm"
          variant={action === "reject" ? "danger" : action === "approve" ? "default" : "secondary"}
          disabled={isPending}
          onClick={() => submit(action)}
        >
          <Icon className="h-4 w-4" />
          {pendingAction === action ? "Working" : label}
        </Button>
      ))}
    </div>
  );
}
