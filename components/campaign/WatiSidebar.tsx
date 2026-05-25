import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Boxes,
  Inbox,
  Megaphone,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

function NavItem({
  icon: Icon,
  label,
  active,
  href = "#"
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
        active
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function WatiSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-white/92 px-4 py-5 lg:block">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">
          W
        </div>
        <div>
          <p className="text-sm font-semibold">Wati</p>
          <p className="text-xs text-muted-foreground">Campaign workspace</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Engage
          </p>
          <div className="mt-2 space-y-1">
            <NavItem icon={Inbox} label="Team Inbox" />
            <NavItem icon={Megaphone} label="Campaigns" active />
            <NavItem icon={MessageSquareText} label="Templates" />
            <NavItem icon={Users} label="Contacts" />
          </div>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Intelligence
          </p>
          <div className="mt-2 space-y-1">
            <NavItem icon={Sparkles} label="AstraOS Advisor" active />
            <NavItem icon={Bot} label="Agent Teams" href="/admin" />
            <NavItem icon={BarChart3} label="Analytics" />
            <NavItem icon={ShieldCheck} label="Quality Gates" href="/admin" />
          </div>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Platform
          </p>
          <div className="mt-2 space-y-1">
            <NavItem icon={Boxes} label="Integrations" />
            <NavItem icon={Settings} label="Settings" href="/settings" />
          </div>
        </div>
      </div>
    </aside>
  );
}
