import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Tenant, TenantPlan } from "@prisma/client";
import { TenantMultiSelect } from "@/components/campaign/TenantMultiSelect";
import { Button } from "@/components/ui/button";
import { titleCase } from "@/lib/utils";

export function AdminFilters({
  selectedPlan,
  tenants,
  selectedTenantIds,
  dateFrom,
  dateTo,
  view = "configuration",
  language = "zh"
}: {
  selectedPlan?: TenantPlan;
  tenants: Tenant[];
  selectedTenantIds: string[];
  dateFrom: string;
  dateTo: string;
  view?: string;
  language?: "zh" | "en";
}) {
  const plans: TenantPlan[] = ["starter", "growth", "enterprise"];
  const formId = "admin-scope-filter";
  const text = {
    zh: {
      scope: "筛选范围",
      applies: "适用于所有管理视角",
      tier: "套餐",
      allTiers: "全部套餐",
      dateRange: "日期范围",
      to: "至",
      startDate: "开始日期",
      endDate: "结束日期",
      apply: "应用",
      reset: "重置"
    },
    en: {
      scope: "Scope filters",
      applies: "Applies to all manager views",
      tier: "Tier",
      allTiers: "All tiers",
      dateRange: "Date range",
      to: "to",
      startDate: "Start date",
      endDate: "End date",
      apply: "Apply",
      reset: "Reset"
    }
  }[language];
  const tenantOptions = tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    industry: tenant.industry,
    region: tenant.region,
    plan: tenant.plan
  }));

  function hrefForPlan(plan?: TenantPlan) {
    const params = new URLSearchParams({ view, dateFrom, dateTo, lang: language });
    if (plan) params.set("plan", plan);
    for (const tenantId of selectedTenantIds) {
      params.append("tenantId", tenantId);
    }
    return `/admin?${params.toString()}`;
  }

  function planLabel(plan: TenantPlan) {
    if (language === "en") return titleCase(plan);
    return {
      starter: "入门版",
      growth: "成长版",
      enterprise: "企业版"
    }[plan];
  }

  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {text.scope}
        </span>
        <span className="text-xs text-muted-foreground">
          {text.applies}
        </span>
      </div>

      <div className="mt-2 grid gap-3 md:grid-cols-[minmax(260px,auto)_minmax(280px,1fr)] md:items-end xl:grid-cols-[auto_minmax(260px,1fr)_auto_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {text.tier}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Link href={hrefForPlan()}>
              <Button variant={!selectedPlan ? "default" : "secondary"} size="sm">
                {text.allTiers}
              </Button>
            </Link>
            {plans.map((plan) => (
              <Link key={plan} href={hrefForPlan(plan)}>
                <Button variant={selectedPlan === plan ? "default" : "secondary"} size="sm">
                  {planLabel(plan)}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <form id={formId} action="/admin" className="contents">
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="lang" value={language} />
          {selectedPlan ? <input type="hidden" name="plan" value={selectedPlan} /> : null}

          <TenantMultiSelect
            tenants={tenantOptions}
            selectedTenantIds={selectedTenantIds}
            formId={formId}
            language={language}
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {text.dateRange}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <label className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  aria-label={text.startDate}
                  name="dateFrom"
                  type="date"
                  defaultValue={dateFrom}
                  className="h-9 rounded-md border border-border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500"
                />
              </label>
              <span className="text-xs text-muted-foreground">{text.to}</span>
              <label>
                <input
                  aria-label={text.endDate}
                  name="dateTo"
                  type="date"
                  defaultValue={dateTo}
                  className="h-9 rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-emerald-500"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              {text.apply}
            </Button>
            <Link href={`/admin?view=${view}&lang=${language}`}>
              <Button type="button" variant="secondary" size="sm">
                {text.reset}
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
