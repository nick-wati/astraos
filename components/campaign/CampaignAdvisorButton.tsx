"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CampaignObjective } from "@prisma/client";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CampaignAdvisorButton({
  tenantId,
  objective = "revenue_recovery",
  label = "Generate Campaign Plan",
  size = "default",
  variant = "default"
}: {
  tenantId: string;
  objective?: CampaignObjective;
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "ghost" | "danger";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState(false);

  function runAdvisor() {
    setWorking(true);
    startTransition(async () => {
      const response = await fetch(`/api/tenants/${tenantId}/campaign-advisor/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ objective })
      });
      await response.json();
      setWorking(false);
      router.refresh();
    });
  }

  return (
    <Button onClick={runAdvisor} disabled={pending || working} size={size} variant={variant}>
      {pending || working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
      {label}
    </Button>
  );
}
