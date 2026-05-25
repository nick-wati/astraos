"use client";

import { Search, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { titleCase } from "@/lib/utils";

export type TenantMultiSelectOption = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  region: string;
  plan: string;
};

export function TenantMultiSelect({
  tenants,
  selectedTenantIds,
  formId,
  language = "zh"
}: {
  tenants: TenantMultiSelectOption[];
  selectedTenantIds: string[];
  formId: string;
  language?: "zh" | "en";
}) {
  const text = {
    zh: {
      allTenants: "全部租户",
      oneTenant: "1 个租户",
      tenants: (count: number) => `${count} 个租户`,
      label: "租户",
      trigger: "搜索并多选",
      placeholder: "搜索租户、别名、套餐、地区……",
      noResults: "没有匹配的租户。",
      shownSelected: (shown: number, selected: number) => `显示 ${shown} 个 / 已选 ${selected} 个`,
      clear: "清空租户",
      apply: "应用租户"
    },
    en: {
      allTenants: "All tenants",
      oneTenant: "1 tenant",
      tenants: (count: number) => `${count} tenants`,
      label: "Tenants",
      trigger: "Search & select",
      placeholder: "Search tenant, slug, tier, region...",
      noResults: "No tenants match this search.",
      shownSelected: (shown: number, selected: number) => `${shown} shown / ${selected} selected`,
      clear: "Clear tenants",
      apply: "Apply tenants"
    }
  }[language];
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set(selectedTenantIds));
  const selectedTenants = tenants.filter((tenant) => selectedIds.has(tenant.id));
  const selectedLabel =
    selectedIds.size === 0
      ? text.allTenants
      : selectedIds.size === 1
        ? selectedTenants[0]?.name ?? text.oneTenant
        : text.tenants(selectedIds.size);

  const visibleTenants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? tenants.filter((tenant) =>
          [
            tenant.name,
            tenant.slug,
            tenant.industry,
            tenant.region,
            tenant.plan
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalized)
        )
      : tenants;

    return matches
      .sort((a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)))
      .slice(0, 80);
  }, [query, selectedIds, tenants]);

  function toggleTenant(tenantId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(tenantId)) {
        next.delete(tenantId);
      } else {
        next.add(tenantId);
      }
      return next;
    });
  }

  function clearTenant(tenantId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(tenantId);
      return next;
    });
  }

  function planLabel(plan: string) {
    if (language === "en") return titleCase(plan);
    return {
      starter: "入门版",
      growth: "成长版",
      enterprise: "企业版"
    }[plan] ?? plan;
  }

  return (
    <div className="min-w-0">
      {[...selectedIds].map((tenantId) => (
        <input key={tenantId} form={formId} type="hidden" name="tenantId" value={tenantId} />
      ))}

      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {text.label}
      </p>
      <details className="group relative mt-2">
        <summary className="flex h-9 cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-border bg-white px-3 text-sm shadow-sm transition hover:border-emerald-300">
          <span className="flex min-w-0 items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selectedLabel}</span>
          </span>
          <span className="text-xs text-muted-foreground">{text.trigger}</span>
        </summary>
        <div className="absolute left-0 z-20 mt-2 w-full min-w-[360px] rounded-lg border border-border bg-white p-3 shadow-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.placeholder}
              className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          {selectedTenants.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTenants.map((tenant) => (
                <span
                  key={tenant.id}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200"
                >
                  <span className="truncate">{tenant.name}</span>
                  <button
                    type="button"
                    onClick={() => clearTenant(tenant.id)}
                    className="rounded-full p-0.5 text-emerald-800 hover:bg-emerald-100"
                    aria-label={`Remove ${tenant.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 max-h-64 space-y-1 overflow-auto pr-1">
            {visibleTenants.map((tenant) => (
              <label
                key={tenant.id}
                className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-emerald-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(tenant.id)}
                  onChange={() => toggleTenant(tenant.id)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-emerald-700"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{tenant.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {planLabel(tenant.plan)} / {tenant.industry} / {tenant.region}
                  </span>
                </span>
              </label>
            ))}
            {visibleTenants.length === 0 ? (
              <div className="rounded-md bg-stone-50 px-3 py-4 text-sm text-muted-foreground">
                {text.noResults}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {text.shownSelected(visibleTenants.length, selectedIds.size)}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>
                {text.clear}
              </Button>
              <Button type="submit" form={formId} size="sm">
                {text.apply}
              </Button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
