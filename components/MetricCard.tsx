import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "teal"
}: {
  title: string;
  value: string | number;
  helper?: string;
  icon?: LucideIcon;
  tone?: "teal" | "amber" | "red" | "violet" | "blue" | "stone";
}) {
  const toneClasses = {
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-sky-50 text-sky-700",
    stone: "bg-stone-100 text-stone-700"
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        {Icon ? (
          <span className={cn("rounded-md p-2", toneClasses[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-muted-foreground">{helper}</p> : null}
    </Card>
  );
}
