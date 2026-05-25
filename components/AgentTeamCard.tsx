import type { AgentTeam } from "@prisma/client";
import { Activity, CircleDollarSign, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function AgentTeamCard({ team }: { team: AgentTeam }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
            Agent Team
          </p>
          <h2 className="mt-1 text-xl font-semibold">{team.name}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{team.description}</p>
        </div>
        <StatusBadge status={team.status} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-teal-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
            <Activity className="h-4 w-4" />
            Success rate
          </div>
          <p className="mt-2 text-lg font-semibold">{formatPercent(team.successRate)}</p>
        </div>
        <div className="rounded-md bg-violet-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-violet-700">
            <Gauge className="h-4 w-4" />
            Outcome score
          </div>
          <p className="mt-2 text-lg font-semibold">{formatPercent(team.outcomeScore)}</p>
        </div>
        <div className="rounded-md bg-orange-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-orange-700">
            <CircleDollarSign className="h-4 w-4" />
            Total cost
          </div>
          <p className="mt-2 text-lg font-semibold">{formatCurrency(team.totalCost)}</p>
        </div>
      </div>
    </Card>
  );
}
