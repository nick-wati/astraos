"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function ApproveRecommendationButton({
  recommendationId,
  disabled,
  size = "lg",
  variant = "default"
}: {
  recommendationId: string;
  disabled?: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState(false);

  function approve() {
    setWorking(true);
    startTransition(async () => {
      await fetch(`/api/recommendations/${recommendationId}/approve`, {
        method: "POST"
      });
      setWorking(false);
      router.refresh();
    });
  }

  return (
    <Button onClick={approve} disabled={disabled || pending || working} size={size} variant={variant}>
      {pending || working ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Approve campaign
    </Button>
  );
}
