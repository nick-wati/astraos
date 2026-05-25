import type { Alert } from "@prisma/client";
import { AlertTriangle, Bell, CircleAlert } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { titleCase } from "@/lib/utils";

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground">
        No active alerts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = alert.severity === "critical" ? CircleAlert : alert.severity === "warning" ? AlertTriangle : Bell;
        return (
          <div key={alert.id} className="rounded-lg border border-border bg-white p-4 shadow-panel">
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-stone-100 p-2 text-stone-700">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={alert.severity} />
                  <span className="text-xs text-muted-foreground">{titleCase(alert.type)}</span>
                </div>
                <h3 className="mt-2 font-semibold">{alert.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
              </div>
              <StatusBadge status={alert.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
