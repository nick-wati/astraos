import type { ValidatorAgent } from "@prisma/client";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPercent, titleCase } from "@/lib/utils";

export function ValidatorCard({ validator }: { validator: ValidatorAgent }) {
  return (
    <Card className="h-full border-l-4 border-l-amber-400 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">
            Validator Agent
          </p>
          <h3 className="mt-1 text-base font-semibold">{validator.name}</h3>
        </div>
        <StatusBadge status={validator.status} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
        {validator.validationCriteria}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700">
          <CheckCircle2 className="h-3 w-3" />
          {formatPercent(validator.passThreshold)} gate
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-muted-foreground">
          <ShieldAlert className="h-3 w-3" />
          {titleCase(validator.failureAction)}
        </span>
      </div>
    </Card>
  );
}
