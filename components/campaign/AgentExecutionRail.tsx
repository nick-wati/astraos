import type { CampaignAgentEvent } from "@prisma/client";
import { Bot, CheckCircle2, Clock3, Cpu, ReceiptText } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatMs, formatPercent, titleCase } from "@/lib/utils";

export function AgentExecutionRail({
  events,
  showTelemetry = true
}: {
  events: CampaignAgentEvent[];
  showTelemetry?: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-6 text-sm text-muted-foreground">
        Generate a campaign plan to see the supervised agent team timeline.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={event.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              {index === events.length - 1 ? <CheckCircle2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{event.agentName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {showTelemetry
                      ? `${titleCase(event.agentRole)} / ${event.provider} / ${event.model}`
                      : titleCase(event.agentRole)}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{event.output}</p>
              {showTelemetry ? (
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-700">
                    <ReceiptText className="h-3.5 w-3.5" />
                    {event.totalTokens.toLocaleString()} tokens
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-800">
                    <Cpu className="h-3.5 w-3.5" />
                    {formatCurrency(event.cost, 4)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-sky-800">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatMs(event.latencyMs)}
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
                    {formatPercent(event.validationScore, 1)} score
                  </span>
                </div>
              ) : (
                <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {formatPercent(event.validationScore, 1)} confidence
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
