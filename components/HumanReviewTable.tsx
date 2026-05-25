import type {
  BusinessSOP,
  ExecutionRun,
  HumanReviewItem,
  RoleAgent,
  SOPStep,
  StepRun,
  ValidatorAgent
} from "@prisma/client";
import Link from "next/link";
import { ReviewActionButtons } from "@/components/ReviewActionButtons";
import { StatusBadge } from "@/components/StatusBadge";
import { parseJson } from "@/lib/utils";

type ReviewItem = HumanReviewItem & {
  sop: BusinessSOP;
  run: ExecutionRun;
  agent: RoleAgent;
  stepRun: StepRun & {
    sopStep: SOPStep;
    validatorAgent: ValidatorAgent;
  };
};

export function HumanReviewTable({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground">
        No human review items are open. AstraOS will surface decisions here when validation risk needs human judgment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const validation = parseJson<Record<string, string>>(item.stepRun.validationResult, {});
        return (
          <div key={item.id} className="rounded-lg border border-border bg-white p-5 shadow-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={item.status} />
                  <StatusBadge status={item.run.status} label={`Run ${item.run.status}`} />
                </div>
                <h3 className="mt-3 text-lg font-semibold">{item.reason}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Link href={`/sops/${item.sopId}`} className="hover:text-teal-700">
                    {item.sop.name}
                  </Link>{" "}
                  /{" "}
                  <Link href={`/runs/${item.runId}`} className="hover:text-teal-700">
                    Execution Run {item.runId.slice(-8)}
                  </Link>{" "}
                  / {item.stepRun.sopStep.name} / {item.agent.name}
                </p>
              </div>
              {item.status === "open" ? <ReviewActionButtons reviewItemId={item.id} /> : null}
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-md bg-stone-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Agent output
                </p>
                <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm">{item.stepRun.output}</p>
              </div>
              <div className="rounded-md bg-amber-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-amber-700">
                  Validator feedback
                </p>
                <p className="mt-2 text-sm text-amber-950">
                  {validation.reason ?? `${item.stepRun.validatorAgent.name} requested review.`}
                </p>
              </div>
              <div className="rounded-md bg-teal-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-teal-700">
                  Recommended action
                </p>
                <p className="mt-2 text-sm text-teal-950">{item.recommendedAction}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
