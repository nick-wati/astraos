import type { ExecutionRun, RoleAgent, SOPStep, StepRun, ValidatorAgent } from "@prisma/client";
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatMs, formatPercent, parseJson } from "@/lib/utils";

type StepRunWithRelations = StepRun & {
  sopStep: SOPStep;
  roleAgent: RoleAgent;
  validatorAgent: ValidatorAgent;
};

function timelineIcon(status: string) {
  if (status === "succeeded") return CheckCircle2;
  if (status === "retrying") return RotateCcw;
  if (status === "needs_human_review") return UserCheck;
  if (status === "failed" || status === "escalated") return AlertTriangle;
  return Clock;
}

export function RunTimeline({
  run,
  stepRuns
}: {
  run: ExecutionRun;
  stepRuns: StepRunWithRelations[];
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
              Run Timeline
            </p>
            <h2 className="mt-1 text-lg font-semibold">Execution Run {run.id.slice(-8)}</h2>
          </div>
          <StatusBadge status={run.status} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs text-muted-foreground">Token consumption</p>
            <p className="mt-1 font-semibold">{run.totalTokens.toLocaleString()}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs text-muted-foreground">Estimated cost</p>
            <p className="mt-1 font-semibold">{formatCurrency(run.totalCost, 4)}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs text-muted-foreground">Latency</p>
            <p className="mt-1 font-semibold">{formatMs(run.latencyMs)}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs text-muted-foreground">Outcome score</p>
            <p className="mt-1 font-semibold">{formatPercent(run.outcomeScore)}</p>
          </div>
        </div>
      </Card>
      <div className="relative space-y-4 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-px before:bg-border">
        {stepRuns.map((stepRun) => {
          const Icon = timelineIcon(stepRun.status);
          const validation = parseJson<Record<string, string | number>>(stepRun.validationResult, {});
          const logs = parseJson<Array<{ at: string; message: string }>>(stepRun.logs, []);
          return (
            <Card key={stepRun.id} className="relative ml-10 p-4">
              <span className="absolute -left-[2.35rem] top-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-teal-700">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Step {stepRun.sopStep.order}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{stepRun.sopStep.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stepRun.roleAgent.name} executed, then {stepRun.validatorAgent.name} validated the handoff.
                  </p>
                </div>
                <StatusBadge status={stepRun.status} />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md bg-stone-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Input
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{stepRun.input}</p>
                </div>
                <div className="rounded-md bg-stone-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Output
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{stepRun.output}</p>
                </div>
              </div>
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">
                  Validation Result
                </p>
                <p className="mt-2 text-sm text-amber-950">
                  {String(validation.reason ?? "Validation result recorded.")}
                </p>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-5">
                <div className="rounded-md bg-white p-2 ring-1 ring-border">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="font-semibold">{formatPercent(stepRun.validationScore)}</p>
                </div>
                <div className="rounded-md bg-white p-2 ring-1 ring-border">
                  <p className="text-xs text-muted-foreground">Retries</p>
                  <p className="font-semibold">{stepRun.retryCount}</p>
                </div>
                <div className="rounded-md bg-white p-2 ring-1 ring-border">
                  <p className="text-xs text-muted-foreground">Tokens</p>
                  <p className="font-semibold">{stepRun.tokensUsed.toLocaleString()}</p>
                </div>
                <div className="rounded-md bg-white p-2 ring-1 ring-border">
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="font-semibold">{formatCurrency(stepRun.cost, 4)}</p>
                </div>
                <div className="rounded-md bg-white p-2 ring-1 ring-border">
                  <p className="text-xs text-muted-foreground">Trace link</p>
                  <p className="truncate font-semibold text-teal-700">{stepRun.langfuseObservationId}</p>
                </div>
              </div>
              <div className="mt-3 rounded-md bg-stone-950 p-3 text-xs text-stone-100">
                {logs.map((log, index) => (
                  <p key={index}>
                    <span className="text-stone-400">{new Date(log.at).toLocaleTimeString()} </span>
                    {log.message}
                  </p>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
