import type { LucideIcon } from "lucide-react";

export function CampaignInsightCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "emerald"
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "yellow" | "blue" | "plum";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800",
    yellow: "bg-yellow-50 text-yellow-800",
    blue: "bg-sky-50 text-sky-800",
    plum: "bg-violet-50 text-violet-800"
  };

  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-md p-2 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
