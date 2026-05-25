import type { AgentTeam, BusinessSOP, RoleAgent, SOPStep, ValidatorAgent } from "@prisma/client";
import Link from "next/link";
import { ArrowDown, Flag, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPercent, titleCase } from "@/lib/utils";

type StepWithAgents = SOPStep & {
  assignedRoleAgent: RoleAgent;
  validatorAgent: ValidatorAgent;
};

export function AgentOrgChart({
  sop,
  team,
  steps
}: {
  sop: BusinessSOP;
  team: AgentTeam;
  steps: StepWithAgents[];
}) {
  return (
    <Card className="command-grid overflow-hidden p-5">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-teal-200 bg-white p-4 text-center shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
            Business Objective
          </p>
          <h3 className="mt-2 text-lg font-semibold">{sop.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{sop.businessObjective}</p>
        </div>
        <div className="flex justify-center py-3 text-teal-700">
          <ArrowDown className="h-5 w-5" />
        </div>
        <div className="mx-auto max-w-2xl rounded-lg border border-stone-200 bg-white p-4 text-center shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-600">
            Agent Team
          </p>
          <h4 className="mt-2 text-base font-semibold">{team.name}</h4>
          <div className="mt-3 flex justify-center gap-2">
            <StatusBadge status={team.status} />
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
              Outcome {formatPercent(team.outcomeScore)}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.id} className="relative rounded-lg border border-border bg-white p-4 shadow-panel">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-700 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
                    Execution Order
                  </p>
                  <Link href={`/agents/${step.assignedRoleAgent.id}`}>
                    <h4 className="mt-1 text-base font-semibold hover:text-teal-700">
                      {step.assignedRoleAgent.name}
                    </h4>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This agent owns {step.assignedRoleAgent.roleTitle.toLowerCase()}.
                  </p>
                </div>
                <StatusBadge status={step.assignedRoleAgent.status} />
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">
                    Validation Gate
                  </p>
                  <span className="text-xs font-medium text-amber-700">
                    {formatPercent(step.validatorAgent.passThreshold)}
                  </span>
                </div>
                <p className="mt-1 font-medium">{step.validatorAgent.name}</p>
                <p className="mt-1 text-sm text-amber-900/75">
                  {step.validatorAgent.validationCriteria}
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md bg-stone-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                    <Flag className="h-3.5 w-3.5" />
                    Escalation path
                  </div>
                  <p className="mt-1 text-sm">{titleCase(step.validatorAgent.failureAction)}</p>
                </div>
                <div className="rounded-md bg-stone-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                    <UserCheck className="h-3.5 w-3.5" />
                    Human review path
                  </div>
                  <p className="mt-1 text-sm">
                    {step.validatorAgent.failureAction === "request_human_review"
                      ? "Required after retries"
                      : "Available on escalation"}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 ? (
                <div className="absolute -bottom-3 left-1/2 hidden -translate-x-1/2 rounded-full border border-border bg-white p-1 text-muted-foreground lg:block">
                  <ArrowDown className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
