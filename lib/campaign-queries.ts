import type {
  Campaign,
  CampaignAgentEvent,
  CampaignRecommendation,
  CampaignRun,
  Prisma,
  Tenant,
  TenantPlan
} from "@prisma/client";
import {
  getCampaignService,
  type CampaignServiceCampaign
} from "@/lib/campaign-service";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/utils";

export type TenantCampaignDashboard = {
  tenants: Tenant[];
  tenant: Tenant & {
    campaigns: CampaignServiceCampaign[];
    recommendations: CampaignRecommendation[];
    campaignRuns: CampaignRun[];
  };
  metrics: {
    campaigns: number;
    audience: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    conversions: number;
    revenue: number;
    spend: number;
    optOuts: number;
    openRate: number;
    replyRate: number;
    conversionRate: number;
    revenuePerDelivered: number;
    costPerConversion: number;
    qualityRating: number;
  };
  chartData: Array<{
    name: string;
    revenue: number;
    replies: number;
    conversions: number;
    optOuts: number;
  }>;
  latestAgentEvents: CampaignAgentEvent[];
};

function safeRate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

export async function getTenantCampaignDashboard(tenantId?: string): Promise<TenantCampaignDashboard> {
  const tenants = await prisma.tenant.findMany({
    orderBy: {
      name: "asc"
    }
  });

  const selectedTenantId = tenantId ?? tenants[0]?.id;
  if (!selectedTenantId) {
    throw new Error("No tenants have been seeded.");
  }

  const tenantRecord = await prisma.tenant.findUnique({
    where: { id: selectedTenantId },
    include: {
      recommendations: {
        orderBy: {
          createdAt: "desc"
        },
        take: 4
      },
      campaignRuns: {
        orderBy: {
          createdAt: "desc"
        },
        take: 8
      }
    }
  });

  if (!tenantRecord) {
    throw new Error("Tenant not found.");
  }

  const campaignService = getCampaignService();
  const context = await campaignService.getCampaignContext({
    tenantId: tenantRecord.id,
    objective: "revenue_recovery",
    windowDays: 90
  });
  const tenant = {
    ...tenantRecord,
    campaigns: context.campaigns
  };
  const latestRunId = tenant.recommendations[0]?.runId ?? tenant.campaignRuns[0]?.id;
  const latestAgentEvents = latestRunId
    ? await prisma.campaignAgentEvent.findMany({
        where: {
          runId: latestRunId
        },
        orderBy: {
          createdAt: "asc"
        }
      })
    : [];

  const delivered = tenant.campaigns.reduce((sum, campaign) => sum + campaign.delivered, 0);
  const opened = tenant.campaigns.reduce((sum, campaign) => sum + campaign.opened, 0);
  const clicked = tenant.campaigns.reduce((sum, campaign) => sum + campaign.clicked, 0);
  const replied = tenant.campaigns.reduce((sum, campaign) => sum + campaign.replied, 0);
  const conversions = tenant.campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const revenue = tenant.campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const spend = tenant.campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const optOuts = tenant.campaigns.reduce((sum, campaign) => sum + campaign.optOuts, 0);
  const audience = tenant.campaigns.reduce((sum, campaign) => sum + campaign.audienceSize, 0);
  const qualityRating =
    tenant.campaigns.length === 0
      ? 0
      : tenant.campaigns.reduce((sum, campaign) => sum + campaign.qualityRating, 0) /
        tenant.campaigns.length;

  return {
    tenants,
    tenant,
    metrics: {
      campaigns: tenant.campaigns.length,
      audience,
      delivered,
      opened,
      clicked,
      replied,
      conversions,
      revenue,
      spend,
      optOuts,
      openRate: safeRate(opened, delivered),
      replyRate: safeRate(replied, delivered),
      conversionRate: safeRate(conversions, delivered),
      revenuePerDelivered: safeRate(revenue, delivered),
      costPerConversion: safeRate(spend, conversions),
      qualityRating
    },
    chartData: [...tenant.campaigns]
      .sort((a, b) => (a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0))
      .map((campaign) => ({
        name: campaign.name.length > 16 ? `${campaign.name.slice(0, 16)}...` : campaign.name,
        revenue: campaign.revenue,
        replies: campaign.replied,
        conversions: campaign.conversions,
        optOuts: campaign.optOuts
      })),
    latestAgentEvents
  };
}

export type AdminFilters = {
  tenantId?: string;
  tenantIds?: string[];
  tenant?: string;
  plan?: TenantPlan;
  days?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

export type AdminAgentRow = {
  tenantName: string;
  tenantPlan: TenantPlan;
  agentName: string;
  agentRole: string;
  runtime: string;
  provider: string;
  model: string;
  runs: number;
  avgValidationScore: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
};

export type AdminAgentFleetRow = {
  agentName: string;
  agentRole: string;
  runtime: string;
  tenantCount: number;
  runs: number;
  avgValidationScore: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  primaryModel: string;
  modelCount: number;
};

export type AdminTenantRow = {
  tenantId: string;
  tenantName: string;
  tenantPlan: TenantPlan;
  industry: string;
  region: string;
  agentCount: number;
  runs: number;
  avgValidationScore: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
};

export type AdminTierRow = {
  plan: TenantPlan;
  tenantCount: number;
  agentCount: number;
  runs: number;
  avgValidationScore: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  primaryModel: string;
};

export type AdminValueTenantRow = {
  tenantId: string;
  tenantName: string;
  tenantPlan: TenantPlan;
  actualRevenue: number;
  conversions: number;
  campaignSpend: number;
  expectedRevenue: number;
  approvedRecommendations: number;
  llmCost: number;
  llmCostToRevenueRate: number;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mostUsedModel(events: CampaignAgentEvent[]) {
  const modelCounts = new Map<string, number>();
  for (const event of events) {
    modelCounts.set(event.model, (modelCounts.get(event.model) ?? 0) + event.totalTokens);
  }
  return (
    [...modelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No model yet"
  );
}

export async function getAdminCampaignObservability(filters: AdminFilters) {
  const tenants = await prisma.tenant.findMany({
    orderBy: {
      name: "asc"
    }
  });
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - (filters.days ?? 30));
  let from = filters.dateFrom ?? defaultFrom;
  let to = filters.dateTo ?? new Date();
  if (from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }
  const toInclusive = new Date(to);
  toInclusive.setHours(23, 59, 59, 999);
  const tenantIds = Array.from(
    new Set([filters.tenantId, ...(filters.tenantIds ?? [])].filter(Boolean))
  ) as string[];
  const tenantSearch = filters.tenant?.trim();
  const tenantWhere: Prisma.TenantWhereInput = {
    ...(filters.plan ? { plan: filters.plan } : {}),
    ...(tenantIds.length > 0 ? { id: { in: tenantIds } } : {}),
    ...(tenantSearch
      ? {
          OR: [
            { id: tenantSearch },
            { slug: { contains: tenantSearch } },
            { name: { contains: tenantSearch } }
          ]
        }
      : {})
  };
  const scopedTenants = await prisma.tenant.findMany({
    where: tenantWhere,
    orderBy: {
      name: "asc"
    }
  });
  const scopedTenantIds = new Set(scopedTenants.map((tenant) => tenant.id));
  const tenantRelationFilter: Prisma.TenantWhereInput = {
    ...(filters.plan ? { plan: filters.plan } : {}),
    ...(tenantIds.length > 0 ? { id: { in: tenantIds } } : {}),
    ...(tenantSearch
      ? {
          OR: [
            { id: tenantSearch },
            { slug: { contains: tenantSearch } },
            { name: { contains: tenantSearch } }
          ]
        }
      : {})
  };
  const tenantEventFilter: Prisma.CampaignAgentEventWhereInput =
    tenantIds.length > 0 || filters.plan || tenantSearch
      ? {
          ...(tenantIds.length > 0 ? { tenantId: { in: tenantIds } } : {}),
          ...(filters.plan || tenantSearch ? { tenant: tenantRelationFilter } : {})
        }
      : {};
  const runTenantFilter: Prisma.CampaignRunWhereInput =
    tenantIds.length > 0 || filters.plan || tenantSearch
      ? {
          ...(tenantIds.length > 0 ? { tenantId: { in: tenantIds } } : {}),
          ...(filters.plan || tenantSearch ? { tenant: tenantRelationFilter } : {})
        }
      : {};
  const campaignTenantFilter: Prisma.CampaignWhereInput =
    tenantIds.length > 0 || filters.plan || tenantSearch
      ? {
          ...(tenantIds.length > 0 ? { tenantId: { in: tenantIds } } : {}),
          ...(filters.plan || tenantSearch ? { tenant: tenantRelationFilter } : {})
        }
      : {};
  const recommendationTenantFilter: Prisma.CampaignRecommendationWhereInput =
    tenantIds.length > 0 || filters.plan || tenantSearch
      ? {
          ...(tenantIds.length > 0 ? { tenantId: { in: tenantIds } } : {}),
          ...(filters.plan || tenantSearch ? { tenant: tenantRelationFilter } : {})
        }
      : {};

  const events = await prisma.campaignAgentEvent.findMany({
    where: {
      ...tenantEventFilter,
      createdAt: {
        gte: from,
        lte: toInclusive
      }
    },
    include: {
      tenant: true,
      run: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const runs = await prisma.campaignRun.findMany({
    where: {
      ...runTenantFilter,
      createdAt: {
        gte: from,
        lte: toInclusive
      }
    },
    include: {
      tenant: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const campaigns = await prisma.campaign.findMany({
    where: {
      ...campaignTenantFilter,
      sentAt: {
        gte: from,
        lte: toInclusive
      }
    },
    include: {
      tenant: true
    },
    orderBy: {
      sentAt: "desc"
    }
  });

  const recommendations = await prisma.campaignRecommendation.findMany({
    where: {
      ...recommendationTenantFilter,
      createdAt: {
        gte: from,
        lte: toInclusive
      }
    },
    include: {
      tenant: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const grouped = new Map<string, CampaignAgentEvent[]>();
  for (const event of events) {
    const key = `${event.tenantId}:${event.agentName}:${event.model}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(event);
    grouped.set(key, bucket);
  }

  const agentRows: AdminAgentRow[] = Array.from(grouped.values()).map((bucket) => {
    const first = bucket[0] as CampaignAgentEvent & { tenant: Tenant };
    const runsCount = bucket.length;
    return {
      tenantName: first.tenant.name,
      tenantPlan: first.tenant.plan,
      agentName: first.agentName,
      agentRole: first.agentRole,
      runtime: first.runtime,
      provider: first.provider,
      model: first.model,
      runs: runsCount,
      avgValidationScore:
        bucket.reduce((sum, event) => sum + event.validationScore, 0) / Math.max(1, runsCount),
      inputTokens: bucket.reduce((sum, event) => sum + event.inputTokens, 0),
      outputTokens: bucket.reduce((sum, event) => sum + event.outputTokens, 0),
      totalTokens: bucket.reduce((sum, event) => sum + event.totalTokens, 0),
      totalCost: bucket.reduce((sum, event) => sum + event.cost, 0),
      avgLatencyMs:
        bucket.reduce((sum, event) => sum + event.latencyMs, 0) / Math.max(1, runsCount)
    };
  });

  const groupedByAgent = new Map<string, (CampaignAgentEvent & { tenant: Tenant })[]>();
  for (const event of events as Array<CampaignAgentEvent & { tenant: Tenant }>) {
    const key = `${event.agentName}:${event.agentRole}:${event.runtime}`;
    const bucket = groupedByAgent.get(key) ?? [];
    bucket.push(event);
    groupedByAgent.set(key, bucket);
  }
  const agentFleetRows: AdminAgentFleetRow[] = [...groupedByAgent.values()].map((bucket) => {
    const first = bucket[0];
    const tenantIds = new Set(bucket.map((event) => event.tenantId));
    const models = new Set(bucket.map((event) => event.model));
    return {
      agentName: first.agentName,
      agentRole: first.agentRole,
      runtime: first.runtime,
      tenantCount: tenantIds.size,
      runs: bucket.length,
      avgValidationScore: average(bucket.map((event) => event.validationScore)),
      inputTokens: bucket.reduce((sum, event) => sum + event.inputTokens, 0),
      outputTokens: bucket.reduce((sum, event) => sum + event.outputTokens, 0),
      totalTokens: bucket.reduce((sum, event) => sum + event.totalTokens, 0),
      totalCost: bucket.reduce((sum, event) => sum + event.cost, 0),
      avgLatencyMs: average(bucket.map((event) => event.latencyMs)),
      primaryModel: mostUsedModel(bucket),
      modelCount: models.size
    };
  });

  const groupedByTenant = new Map<string, (CampaignAgentEvent & { tenant: Tenant })[]>();
  for (const event of events as Array<CampaignAgentEvent & { tenant: Tenant }>) {
    const bucket = groupedByTenant.get(event.tenantId) ?? [];
    bucket.push(event);
    groupedByTenant.set(event.tenantId, bucket);
  }
  const tenantRows: AdminTenantRow[] = [...groupedByTenant.values()].map((bucket) => {
    const first = bucket[0];
    const agentNames = new Set(bucket.map((event) => event.agentName));
    const runIds = new Set(bucket.map((event) => event.runId));
    return {
      tenantId: first.tenantId,
      tenantName: first.tenant.name,
      tenantPlan: first.tenant.plan,
      industry: first.tenant.industry,
      region: first.tenant.region,
      agentCount: agentNames.size,
      runs: runIds.size,
      avgValidationScore: average(bucket.map((event) => event.validationScore)),
      totalTokens: bucket.reduce((sum, event) => sum + event.totalTokens, 0),
      totalCost: bucket.reduce((sum, event) => sum + event.cost, 0),
      avgLatencyMs: average(bucket.map((event) => event.latencyMs))
    };
  });

  const groupedByTier = new Map<TenantPlan, (CampaignAgentEvent & { tenant: Tenant })[]>();
  for (const event of events as Array<CampaignAgentEvent & { tenant: Tenant }>) {
    const bucket = groupedByTier.get(event.tenant.plan) ?? [];
    bucket.push(event);
    groupedByTier.set(event.tenant.plan, bucket);
  }
  const tierRows: AdminTierRow[] = [...groupedByTier.entries()].map(([plan, bucket]) => {
    const tenantIds = new Set(bucket.map((event) => event.tenantId));
    const agentNames = new Set(bucket.map((event) => event.agentName));
    const runIds = new Set(bucket.map((event) => event.runId));
    return {
      plan,
      tenantCount: tenantIds.size,
      agentCount: agentNames.size,
      runs: runIds.size,
      avgValidationScore: average(bucket.map((event) => event.validationScore)),
      totalTokens: bucket.reduce((sum, event) => sum + event.totalTokens, 0),
      totalCost: bucket.reduce((sum, event) => sum + event.cost, 0),
      avgLatencyMs: average(bucket.map((event) => event.latencyMs)),
      primaryModel: mostUsedModel(bucket)
    };
  });

  const totalTokens = events.reduce((sum, event) => sum + event.totalTokens, 0);
  const totalCost = events.reduce((sum, event) => sum + event.cost, 0);
  const windowStart = new Date(from);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(to);
  windowEnd.setHours(0, 0, 0, 0);
  const windowDays = Math.max(
    1,
    Math.round((windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const budgetScale = windowDays / 30;
  const windowTokenBudget = Math.round(
    scopedTenants.reduce((sum, tenant) => sum + tenant.monthlyTokenBudget, 0) * budgetScale
  );
  const windowCostBudget =
    scopedTenants.reduce((sum, tenant) => sum + tenant.monthlyCostBudget, 0) * budgetScale;
  const actualRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const campaignSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const expectedRevenue = recommendations.reduce(
    (sum, recommendation) => sum + recommendation.expectedRevenue,
    0
  );
  const approvedRecommendations = recommendations.filter((recommendation) =>
    ["approved", "sent"].includes(recommendation.status)
  ).length;
  const avgValidationScore =
    events.length === 0
      ? 0
      : events.reduce((sum, event) => sum + event.validationScore, 0) / events.length;
  const avgLatencyMs =
    events.length === 0
      ? 0
      : events.reduce((sum, event) => sum + event.latencyMs, 0) / events.length;

  const today = startOfToday();
  const todayRuns = runs.filter((run) => run.createdAt >= today).length;
  const campaignBuckets = new Map<string, typeof campaigns>();
  for (const campaign of campaigns) {
    const bucket = campaignBuckets.get(campaign.tenantId) ?? [];
    bucket.push(campaign);
    campaignBuckets.set(campaign.tenantId, bucket);
  }
  const recommendationBuckets = new Map<string, typeof recommendations>();
  for (const recommendation of recommendations) {
    const bucket = recommendationBuckets.get(recommendation.tenantId) ?? [];
    bucket.push(recommendation);
    recommendationBuckets.set(recommendation.tenantId, bucket);
  }
  const eventCostByTenant = new Map<string, number>();
  for (const event of events) {
    eventCostByTenant.set(event.tenantId, (eventCostByTenant.get(event.tenantId) ?? 0) + event.cost);
  }
  const valueTenantRows: AdminValueTenantRow[] = scopedTenants.map((tenant) => {
    const tenantCampaigns = campaignBuckets.get(tenant.id) ?? [];
    const tenantRecommendations = recommendationBuckets.get(tenant.id) ?? [];
    const tenantActualRevenue = tenantCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
    const tenantLlmCost = eventCostByTenant.get(tenant.id) ?? 0;
    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantPlan: tenant.plan,
      actualRevenue: tenantActualRevenue,
      conversions: tenantCampaigns.reduce((sum, campaign) => sum + campaign.conversions, 0),
      campaignSpend: tenantCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0),
      expectedRevenue: tenantRecommendations.reduce(
        (sum, recommendation) => sum + recommendation.expectedRevenue,
        0
      ),
      approvedRecommendations: tenantRecommendations.filter((recommendation) =>
        ["approved", "sent"].includes(recommendation.status)
      ).length,
      llmCost: tenantLlmCost,
      llmCostToRevenueRate: tenantActualRevenue === 0 ? 0 : tenantLlmCost / tenantActualRevenue
    };
  });

  return {
    tenants,
    filters: {
      tenantId: tenantIds[0],
      tenantIds,
      tenant: filters.tenant,
      plan: filters.plan,
      days: filters.days ?? 30,
      dateFrom: from,
      dateTo: to
    },
    summary: {
      scopedTenantCount: scopedTenantIds.size,
      observedTenantCount: new Set(events.map((event) => event.tenantId)).size,
      agentArchetypes: new Set(events.map((event) => event.agentName)).size,
      tenantAgentDeployments: new Set(
        events.map((event) => `${event.tenantId}:${event.agentName}`)
      ).size,
      runs: runs.length,
      todayRuns,
      agentEvents: events.length,
      totalTokens,
      totalCost,
      windowDays,
      windowTokenBudget,
      windowCostBudget,
      tokenBudgetUsage: windowTokenBudget === 0 ? 0 : totalTokens / windowTokenBudget,
      costBudgetUsage: windowCostBudget === 0 ? 0 : totalCost / windowCostBudget,
      actualRevenue,
      conversions,
      campaignSpend,
      expectedRevenue,
      approvedRecommendations,
      recommendationCount: recommendations.length,
      llmCostToRevenueRate: actualRevenue === 0 ? 0 : totalCost / actualRevenue,
      valuePerLlmDollar: totalCost === 0 ? 0 : actualRevenue / totalCost,
      avgValidationScore,
      avgLatencyMs,
      succeededRuns: runs.filter((run) => run.status === "succeeded").length,
      reviewRuns: runs.filter((run) => run.status === "needs_review").length
    },
    agentFleetRows: agentFleetRows.sort((a, b) => b.totalCost - a.totalCost),
    tenantRows: tenantRows.sort((a, b) => b.totalCost - a.totalCost),
    tierRows: tierRows.sort((a, b) => b.totalTokens - a.totalTokens),
    valueTenantRows: valueTenantRows.sort((a, b) => b.actualRevenue - a.actualRevenue),
    agentRows: agentRows.sort((a, b) => b.totalCost - a.totalCost),
    recentRuns: runs,
    recentEvents: events.slice(0, 12),
    modelData: Object.values(
      events.reduce<Record<string, { name: string; tokens: number; cost: number }>>((acc, event) => {
        acc[event.model] ??= { name: event.model, tokens: 0, cost: 0 };
        acc[event.model].tokens += event.totalTokens;
        acc[event.model].cost += event.cost;
        return acc;
      }, {})
    )
  };
}
