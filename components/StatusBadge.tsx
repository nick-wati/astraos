import { cn, statusTone, titleCase } from "@/lib/utils";

const toneClass = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-stone-200 bg-stone-50 text-stone-700"
};

export function StatusBadge({
  status,
  label,
  className
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = statusTone(status) as keyof typeof toneClass;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className
      )}
    >
      {label ?? titleCase(status)}
    </span>
  );
}
