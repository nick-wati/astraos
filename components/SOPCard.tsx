import type { AgentTeam, BusinessSOP, ExecutionRun } from "@prisma/client";
import Link from "next/link";
import { Archive, Eye, Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RunSopButton } from "@/components/RunSopButton";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function SOPCard({
  sop,
  team,
  latestRun,
  roleAgentCount,
  validatorAgentCount
}: {
  sop: BusinessSOP;
  team?: AgentTeam;
  latestRun?: ExecutionRun | null;
  roleAgentCount: number;
  validatorAgentCount: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <StatusBadge status={sop.status} />
            {latestRun ? <StatusBadge status={latestRun.status} label={`Latest ${latestRun.status}`} /> : null}
          </div>
          <h3 className="mt-3 text-xl font-semibold">{sop.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{sop.businessObjective}</p>
          <p className="mt-3 text-xs text-muted-foreground">Owner: {sop.owner}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/sops/${sop.id}`}>
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4" />
              View SOP
            </Button>
          </Link>
          <RunSopButton sopId={sop.id} size="sm" />
          <Button variant="secondary" size="sm">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
          <Button variant="secondary" size="sm">
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs text-muted-foreground">Agent teams</p>
          <p className="mt-1 font-semibold">1</p>
        </div>
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs text-muted-foreground">Role Agents</p>
          <p className="mt-1 font-semibold">{roleAgentCount}</p>
        </div>
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs text-muted-foreground">Validator Agents</p>
          <p className="mt-1 font-semibold">{validatorAgentCount}</p>
        </div>
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs text-muted-foreground">Success rate</p>
          <p className="mt-1 font-semibold">{formatPercent(team?.successRate ?? 0)}</p>
        </div>
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs text-muted-foreground">Token/cost trend</p>
          <p className="mt-1 font-semibold">
            {(team?.totalTokens ?? 0).toLocaleString()} / {formatCurrency(team?.totalCost ?? 0)}
          </p>
        </div>
      </div>
    </Card>
  );
}
