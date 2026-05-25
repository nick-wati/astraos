import type { RoleAgent } from "@prisma/client";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatMs, formatPercent, titleCase } from "@/lib/utils";

type AgentHealthRow = RoleAgent & {
  latestMetric?: {
    successRate: number;
    avgLatencyMs: number;
    totalTokens: number;
    totalCost: number;
    validationPassRate: number;
    retryRate: number;
    escalationRate: number;
    humanReviewRate: number;
  } | null;
};

export function AgentHealthTable({ agents }: { agents: AgentHealthRow[] }) {
  return (
    <DataTable
      data={agents}
      columns={[
        {
          header: "Agent",
          cell: (agent) => (
            <div>
              <Link href={`/agents/${agent.id}`} className="font-medium hover:text-teal-700">
                {agent.name}
              </Link>
              <p className="text-xs text-muted-foreground">{titleCase(agent.runtimeType)}</p>
            </div>
          )
        },
        {
          header: "Health",
          cell: (agent) => <StatusBadge status={agent.status} />
        },
        {
          header: "Pass rate",
          cell: (agent) => formatPercent(agent.latestMetric?.validationPassRate ?? 0)
        },
        {
          header: "Retry rate",
          cell: (agent) => formatPercent(agent.latestMetric?.retryRate ?? 0)
        },
        {
          header: "Escalation",
          cell: (agent) => formatPercent(agent.latestMetric?.escalationRate ?? 0)
        },
        {
          header: "Latency",
          cell: (agent) => formatMs(agent.latestMetric?.avgLatencyMs ?? 0)
        },
        {
          header: "Cost",
          cell: (agent) => formatCurrency(agent.latestMetric?.totalCost ?? 0)
        }
      ]}
    />
  );
}
