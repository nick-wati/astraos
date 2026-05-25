import type { RoleAgent } from "@prisma/client";
import Link from "next/link";
import { Cpu, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { parseList, titleCase } from "@/lib/utils";

export function AgentCard({ agent, href }: { agent: RoleAgent; href?: string }) {
  const content = (
    <Card className="h-full p-4 transition hover:border-teal-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
            Role Agent
          </p>
          <h3 className="mt-1 text-base font-semibold">{agent.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{agent.roleTitle}</p>
        </div>
        <StatusBadge status={agent.status} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{agent.roleDescription}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 text-teal-700">
          <Cpu className="h-3 w-3" />
          {titleCase(agent.runtimeType)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1">
          <ShieldCheck className="h-3 w-3" />
          {parseList(agent.decisionRights).length} decision rights
        </span>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
