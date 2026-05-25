import type { CampaignObjective } from "@prisma/client";
import {
  getCampaignService,
  type CampaignCohortCandidate,
  type CampaignServiceCampaign,
  type CampaignServiceTenant,
  type CampaignSuppressionRule,
  type CampaignTemplateCandidate
} from "@/lib/campaign-service";
import { calculateTokenCost } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { createRunTrace, createStepObservation } from "@/lib/langfuse";
import { createId, stringify } from "@/lib/utils";
import type {
  AgentModelPolicy,
  AgentRuntimeKind,
  ModelGatewayId,
  ModelProviderId
} from "@/lib/agent-runtime/interfaces";

export type CampaignAgentDefinition = {
  name: string;
  role:
    | "performance_analyst"
    | "cohort_strategist"
    | "template_strategist"
    | "send_time_optimizer"
    | "compliance_validator";
  runtime: Extract<AgentRuntimeKind, "llm_only" | "api_tools" | "human_assisted">;
  gateway: ModelGatewayId;
  provider: ModelProviderId;
  model: string;
  promptVersion: string;
  modelPolicy?: Pick<AgentModelPolicy, "fallbackModels" | "routingTags" | "budgetKey">;
  systemBrief: string;
};

export const CAMPAIGN_AGENT_TEAM: CampaignAgentDefinition[] = [
  {
    name: "Campaign Performance Analyst",
    role: "performance_analyst",
    runtime: "api_tools",
    gateway: "litellm",
    provider: "google",
    model: "gemini-2.5-flash",
    promptVersion: "campaign-mvp-v1",
    modelPolicy: {
      routingTags: ["campaign", "analysis", "trusted-api-tools"],
      budgetKey: "campaign-agent-fleet"
    },
    systemBrief:
      "Analyze Wati campaign history and identify objective, cohort, reply, conversion, revenue, spend, and opt-out patterns."
  },
  {
    name: "Cohort Strategy Agent",
    role: "cohort_strategist",
    runtime: "llm_only",
    gateway: "litellm",
    provider: "google",
    model: "gemini-2.5-flash-lite",
    promptVersion: "campaign-mvp-v1",
    modelPolicy: {
      fallbackModels: ["gemini-2.5-flash"],
      routingTags: ["campaign", "cohort", "low-risk"],
      budgetKey: "campaign-agent-fleet"
    },
    systemBrief:
      "Recommend the next campaign cohort using recent intent, fatigue, revenue potential, and opt-out risk."
  },
  {
    name: "Template Strategy Agent",
    role: "template_strategist",
    runtime: "llm_only",
    gateway: "litellm",
    provider: "google",
    model: "gemini-2.5-flash",
    promptVersion: "campaign-mvp-v1",
    modelPolicy: {
      fallbackModels: ["gemini-2.5-flash-lite"],
      routingTags: ["campaign", "template", "customer-facing"],
      budgetKey: "campaign-agent-fleet"
    },
    systemBrief:
      "Draft a WhatsApp campaign template that is concise, personalized, compliant, and tied to the recommended cohort."
  },
  {
    name: "Send Time Optimizer",
    role: "send_time_optimizer",
    runtime: "api_tools",
    gateway: "litellm",
    provider: "google",
    model: "gemini-2.5-flash-lite",
    promptVersion: "campaign-mvp-v1",
    modelPolicy: {
      routingTags: ["campaign", "send-time", "low-risk"],
      budgetKey: "campaign-agent-fleet"
    },
    systemBrief:
      "Choose the best send window from tenant region, prior reply curves, conversion timing, and fatigue controls."
  },
  {
    name: "Campaign Compliance Validator",
    role: "compliance_validator",
    runtime: "llm_only",
    gateway: "litellm",
    provider: "google",
    model: "gemini-2.5-flash-lite",
    promptVersion: "campaign-mvp-v1",
    modelPolicy: {
      fallbackModels: ["gemini-2.5-flash"],
      routingTags: ["campaign", "validator", "policy"],
      budgetKey: "campaign-agent-fleet"
    },
    systemBrief:
      "Validate the campaign plan for opt-out risk, template quality, audience fatigue, policy safety, and business readiness."
  }
];

type CampaignMetrics = {
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
  clickRate: number;
  replyRate: number;
  conversionRate: number;
  revenuePerRecipient: number;
  costPerConversion: number;
  qualityRating: number;
};

type CampaignPlanState = {
  tenant: CampaignServiceTenant;
  objective: CampaignObjective;
  metrics: CampaignMetrics;
  topCampaigns: CampaignServiceCampaign[];
  cohortCandidates: CampaignCohortCandidate[];
  templateCandidates: CampaignTemplateCandidate[];
  suppressionRules: CampaignSuppressionRule[];
  recommendedCohort?: string;
  selectedCohortId?: string;
  cohortReason?: string;
  audienceEstimate?: number;
  recommendedTemplate?: string;
  selectedTemplateId?: string;
  templateBody?: string;
  recommendedSendTime?: Date;
  sendTimeReason?: string;
  expectedRevenue?: number;
  expectedReplyRate?: number;
  expectedConversionRate?: number;
  riskLevel?: string;
  validatorFeedback?: string;
  operatingSummary?: string;
};

function safeRate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function objectiveLabel(objective: CampaignObjective) {
  return objective.replaceAll("_", " ");
}

function analyzeCampaigns(campaigns: CampaignServiceCampaign[]): CampaignMetrics {
  const delivered = campaigns.reduce((sum, campaign) => sum + campaign.delivered, 0);
  const opened = campaigns.reduce((sum, campaign) => sum + campaign.opened, 0);
  const clicked = campaigns.reduce((sum, campaign) => sum + campaign.clicked, 0);
  const replied = campaigns.reduce((sum, campaign) => sum + campaign.replied, 0);
  const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const revenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const spend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const optOuts = campaigns.reduce((sum, campaign) => sum + campaign.optOuts, 0);
  const audience = campaigns.reduce((sum, campaign) => sum + campaign.audienceSize, 0);
  const qualityRating =
    campaigns.length === 0
      ? 0
      : campaigns.reduce((sum, campaign) => sum + campaign.qualityRating, 0) /
        campaigns.length;

  return {
    campaigns: campaigns.length,
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
    clickRate: safeRate(clicked, delivered),
    replyRate: safeRate(replied, delivered),
    conversionRate: safeRate(conversions, delivered),
    revenuePerRecipient: safeRate(revenue, delivered),
    costPerConversion: safeRate(spend, conversions),
    qualityRating
  };
}

function selectTopCampaigns(campaigns: CampaignServiceCampaign[]) {
  return [...campaigns]
    .sort((a, b) => b.revenue / Math.max(1, b.delivered) - a.revenue / Math.max(1, a.delivered))
    .slice(0, 3);
}

function inferCohort(
  tenant: CampaignServiceTenant,
  campaigns: CampaignServiceCampaign[],
  objective: CampaignObjective
) {
  const top = selectTopCampaigns(campaigns)[0];
  if (tenant.industry.toLowerCase().includes("education")) {
    return {
      cohort:
        objective === "event_promotion"
          ? "Trial registrants who clicked pricing or batch timing but have not booked a counsellor slot"
          : "High-intent leads with recent course engagement and no completed enrollment",
      estimate: 11800,
      reason:
        "This cohort has the strongest reply-to-conversion behavior and clear decision intent from recent Wati conversations."
    };
  }
  if (tenant.industry.toLowerCase().includes("healthcare")) {
    return {
      cohort: "Patients due for a preventive visit who previously replied to appointment reminders",
      estimate: 7200,
      reason:
        "Preventive-care cohorts show high reply quality and low opt-out risk when contacted during weekday late mornings."
    };
  }
  return {
    cohort:
      objective === "reactivation"
        ? "Dormant buyers with at least two past purchases and no message in the last 45 days"
        : `Customers similar to "${top?.cohortName ?? "recent high-intent buyers"}" with cart or product-view activity in the last 14 days`,
    estimate: 9800,
    reason:
      "Recent product intent plus proven prior purchase behavior gives the best balance of expected revenue and fatigue control."
  };
}

function draftTemplate(
  tenant: CampaignServiceTenant,
  objective: CampaignObjective,
  cohort: string
) {
  if (tenant.industry.toLowerCase().includes("education")) {
    return {
      name: "Counsellor Slot Confirmation",
      body:
        "Hi {{first_name}}, based on your interest in {{course_name}}, we found a batch that fits your goal. Would you like a counsellor to confirm the best timing today?"
    };
  }
  if (tenant.industry.toLowerCase().includes("healthcare")) {
    return {
      name: "Preventive Care Reminder",
      body:
        "Hi {{first_name}}, your preventive check-up window is open this week. CarePlus can help you book a convenient slot. Would you like to see available times?"
    };
  }
  return {
    name: objective === "reactivation" ? "Come Back With Personalized Pick" : "Cart Recovery With Product Proof",
    body:
      "Hi {{first_name}}, your {{product_name}} is still waiting. Shoppers with your preferences usually pair it with {{recommended_pairing}}. Want us to reserve it with your loyalty perk?"
  };
}

function chooseSendTime(tenant: CampaignServiceTenant, metrics: CampaignMetrics) {
  const sendTime = new Date();
  sendTime.setDate(sendTime.getDate() + 2);
  sendTime.setHours(
    tenant.region.toLowerCase().includes("india")
      ? 18
      : tenant.region.toLowerCase().includes("uae")
        ? 10
        : 11,
    0,
    0,
    0
  );

  return {
    sendTime,
    reason:
      metrics.replyRate > 0.08
        ? "Prior campaigns show replies convert best in this window while opt-out risk stays below the tenant threshold."
        : "This window improves reply probability for the region and avoids the lower quality afternoon send band."
  };
}

function usageFor(agent: CampaignAgentDefinition, state: CampaignPlanState, index: number) {
  const inputTokens =
    520 +
    index * 110 +
    Math.round(JSON.stringify(state).length / 70) +
    (agent.runtime === "api_tools" ? 160 : 0);
  const outputTokens = 280 + index * 70 + (agent.role === "template_strategist" ? 180 : 0);
  const cost = calculateTokenCost({
    provider: agent.provider,
    model: agent.model,
    inputTokens,
    outputTokens
  });
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    totalCost: cost.totalCost,
    latencyMs: 850 + index * 430 + Math.round(outputTokens * 1.6)
  };
}

async function executeAgentStep({
  agent,
  index,
  state,
  traceId,
  runId,
  tenantId
}: {
  agent: CampaignAgentDefinition;
  index: number;
  state: CampaignPlanState;
  traceId: string;
  runId: string;
  tenantId: string;
}) {
  let nextState = { ...state };
  let output = "";
  let validationScore = 0.86 + index * 0.02;

  if (agent.role === "performance_analyst") {
    output = `Historical campaigns show ${(state.metrics.replyRate * 100).toFixed(
      1
    )}% reply rate, ${(state.metrics.conversionRate * 100).toFixed(
      1
    )}% conversion rate, and $${state.metrics.revenuePerRecipient.toFixed(
      2
    )} revenue per delivered recipient.`;
  }

  if (agent.role === "cohort_strategist") {
    const candidate = state.cohortCandidates[0];
    const inferred = inferCohort(state.tenant, state.topCampaigns, state.objective);
    const cohort = {
      id: candidate?.id,
      cohort: candidate?.name ?? inferred.cohort,
      estimate: candidate?.estimatedAudience ?? inferred.estimate,
      reason: candidate
        ? `${candidate.description} Intent signals: ${candidate.intentSignals.join(", ")}.`
        : inferred.reason
    };
    nextState = {
      ...nextState,
      recommendedCohort: cohort.cohort,
      selectedCohortId: cohort.id,
      cohortReason: cohort.reason,
      audienceEstimate: cohort.estimate
    };
    output = `Recommended cohort: ${cohort.cohort}. ${cohort.reason}`;
  }

  if (agent.role === "template_strategist") {
    const candidate = state.templateCandidates[0];
    const template =
      candidate ??
      draftTemplate(
        state.tenant,
        state.objective,
        state.recommendedCohort ?? "high-intent audience"
      );
    nextState = {
      ...nextState,
      recommendedTemplate: template.name,
      selectedTemplateId: candidate?.id,
      templateBody: template.body
    };
    output = `Template "${template.name}" drafted for ${state.recommendedCohort}.`;
  }

  if (agent.role === "send_time_optimizer") {
    const timing = chooseSendTime(state.tenant, state.metrics);
    const projectedReplyRate = Math.max(0.035, Math.min(0.14, state.metrics.replyRate * 1.12));
    const projectedConversionRate = Math.max(
      0.018,
      Math.min(0.075, state.metrics.conversionRate * 1.18)
    );
    const audience = state.audienceEstimate ?? Math.round(state.metrics.delivered * 0.6);
    const expectedRevenue = Math.round(
      audience * projectedConversionRate * Math.max(55, state.metrics.revenuePerRecipient * 18)
    );
    nextState = {
      ...nextState,
      recommendedSendTime: timing.sendTime,
      sendTimeReason: timing.reason,
      expectedReplyRate: projectedReplyRate,
      expectedConversionRate: projectedConversionRate,
      expectedRevenue
    };
    output = `Recommended send window: ${timing.sendTime.toLocaleString()}. ${timing.reason}`;
  }

  if (agent.role === "compliance_validator") {
    const fatigueRisk = state.metrics.optOuts / Math.max(1, state.metrics.delivered);
    const criticalRules = state.suppressionRules.filter((rule) => rule.severity === "critical");
    const riskLevel = fatigueRisk > 0.004 || criticalRules.length > 0 ? "Medium" : "Low";
    const feedback =
      riskLevel === "Medium"
        ? `Apply suppression rules before launch: ${state.suppressionRules
            .map((rule) => rule.name)
            .join("; ")}.`
        : "Campaign is ready for review with low opt-out risk and clear business value.";
    validationScore = riskLevel === "Medium" ? 0.84 : 0.92;
    nextState = {
      ...nextState,
      riskLevel,
      validatorFeedback: feedback,
      operatingSummary:
        "AstraOS recommends a campaign plan that balances historical performance, audience intent, send timing, template quality, and WhatsApp risk controls."
    };
    output = `Validation ${validationScore >= 0.82 ? "passed" : "requires review"}: ${feedback}`;
  }

  const usage = usageFor(agent, nextState, index);
  const observation = await createStepObservation({
    traceId,
    name: agent.name,
    input: {
      tenantId,
      objective: state.objective,
      agentRole: agent.role
    },
    output,
    metadata: {
      gateway: agent.gateway,
      model: agent.model,
      provider: agent.provider,
      promptVersion: agent.promptVersion,
      routingTags: agent.modelPolicy?.routingTags,
      budgetKey: agent.modelPolicy?.budgetKey,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      cost: usage.totalCost,
      latencyMs: usage.latencyMs,
      validationScore,
      runtime: agent.runtime
    }
  });

  await prisma.campaignAgentEvent.create({
    data: {
      tenantId,
      runId,
      agentName: agent.name,
      agentRole: agent.role,
      runtime: agent.runtime,
      provider: agent.provider,
      model: agent.model,
      promptVersion: agent.promptVersion,
      input: stringify({
        brief: agent.systemBrief,
        objective: state.objective,
        tenant: state.tenant.name
      }),
      output,
      validationScore,
      status: validationScore >= 0.82 ? "succeeded" : "needs_review",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      cost: usage.totalCost,
      latencyMs: usage.latencyMs,
      langfuseObservationId: observation.id
    }
  });

  return {
    state: nextState,
    usage
  };
}

async function executeCampaignTeamWithLangGraph({
  state,
  traceId,
  runId,
  tenantId
}: {
  state: CampaignPlanState;
  traceId: string;
  runId: string;
  tenantId: string;
}) {
  let currentState = state;
  const usage: Array<ReturnType<typeof usageFor>> = [];

  try {
    const langGraph = (await import("@langchain/langgraph")) as any;
    if (langGraph?.StateGraph && langGraph?.START && langGraph?.END) {
      const channels = {
        campaignState: {
          value: (_left: CampaignPlanState, right: CampaignPlanState) => right,
          default: () => state
        }
      };
      const graph = new langGraph.StateGraph({ channels });

      CAMPAIGN_AGENT_TEAM.forEach((agent, index) => {
        graph.addNode(agent.role, async (graphState: { campaignState: CampaignPlanState }) => {
          const result = await executeAgentStep({
            agent,
            index,
            state: graphState.campaignState,
            traceId,
            runId,
            tenantId
          });
          usage.push(result.usage);
          return {
            campaignState: result.state
          };
        });
      });

      graph.addEdge(langGraph.START, CAMPAIGN_AGENT_TEAM[0].role);
      CAMPAIGN_AGENT_TEAM.forEach((agent, index) => {
        const next = CAMPAIGN_AGENT_TEAM[index + 1];
        graph.addEdge(agent.role, next ? next.role : langGraph.END);
      });

      const compiled = graph.compile();
      const result = await compiled.invoke({ campaignState: state });
      return {
        state: result.campaignState as CampaignPlanState,
        usage,
        executionLayer: "langgraph"
      };
    }
  } catch {
    // MVP remains runnable locally if the LangGraph package is unavailable.
  }

  for (const [index, agent] of CAMPAIGN_AGENT_TEAM.entries()) {
    const result = await executeAgentStep({
      agent,
      index,
      state: currentState,
      traceId,
      runId,
      tenantId
    });
    currentState = result.state;
    usage.push(result.usage);
  }

  return {
    state: currentState,
    usage,
    executionLayer: "sequential-langgraph-adapter"
  };
}

export async function runCampaignLaunchAdvisor({
  tenantId,
  objective = "revenue_recovery"
}: {
  tenantId: string;
  objective?: CampaignObjective;
}) {
  const campaignService = getCampaignService();
  const context = await campaignService.getCampaignContext({
    tenantId,
    objective,
    windowDays: 90
  });
  const tenant = context.tenant;

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  const runId = createId("campaign_run");
  const trace = await createRunTrace({
    name: `${tenant.name} Campaign Launch Advisor`,
    sopId: tenant.id,
    runId,
    metadata: {
      product: "AstraOS",
      tenantId: tenant.id,
      objective,
      agentTeam: "Campaign Launch Advisor"
    }
  });

  const run = await prisma.campaignRun.create({
    data: {
      id: runId,
      tenantId: tenant.id,
      status: "running",
      objective,
      inputPayload: stringify({
        objective,
        dataWindow: "last_90_days",
      tenant: tenant.name,
      campaignService: campaignService.name
      }),
      langfuseTraceId: trace.id
    }
  });

  const initialState: CampaignPlanState = {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      industry: tenant.industry,
      region: tenant.region,
      plan: tenant.plan,
      status: tenant.status,
      defaultLocale: tenant.defaultLocale,
      monthlyTokenBudget: tenant.monthlyTokenBudget,
      monthlyCostBudget: tenant.monthlyCostBudget
    },
    objective,
    metrics: analyzeCampaigns(context.campaigns),
    topCampaigns: selectTopCampaigns(context.campaigns),
    cohortCandidates: context.cohortCandidates,
    templateCandidates: context.templateCandidates,
    suppressionRules: context.suppressionRules
  };

  const execution = await executeCampaignTeamWithLangGraph({
    state: initialState,
    traceId: trace.id,
    runId: run.id,
    tenantId: tenant.id
  });

  const finalState = execution.state;
  const totalInputTokens = execution.usage.reduce((sum, item) => sum + item.inputTokens, 0);
  const totalOutputTokens = execution.usage.reduce((sum, item) => sum + item.outputTokens, 0);
  const totalTokens = execution.usage.reduce((sum, item) => sum + item.totalTokens, 0);
  const totalCost = execution.usage.reduce((sum, item) => sum + item.totalCost, 0);
  const latencyMs = execution.usage.reduce((sum, item) => sum + item.latencyMs, 0);
  const outcomeScore =
    finalState.riskLevel === "Low" ? 0.92 : finalState.riskLevel === "Medium" ? 0.86 : 0.78;

  const completedRun = await prisma.campaignRun.update({
    where: { id: run.id },
    data: {
      status: outcomeScore >= 0.82 ? "succeeded" : "needs_review",
      outputPayload: stringify({
        recommendedCohort: finalState.recommendedCohort,
        recommendedTemplate: finalState.recommendedTemplate,
        recommendedSendTime: finalState.recommendedSendTime,
        executionLayer: execution.executionLayer
      }),
      completedAt: new Date(),
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalCost,
      latencyMs,
      outcomeScore
    }
  });

  const recommendation = await prisma.campaignRecommendation.create({
    data: {
      tenantId: tenant.id,
      runId: run.id,
      status: "recommended",
      objective,
      recommendedCohort: finalState.recommendedCohort ?? "High-intent reachable customers",
      cohortReason:
        finalState.cohortReason ??
        "AstraOS selected this cohort from recent engagement and conversion behavior.",
      audienceEstimate: finalState.audienceEstimate ?? Math.round(finalState.metrics.delivered * 0.55),
      recommendedTemplate: finalState.recommendedTemplate ?? "Recommended WhatsApp Campaign",
      templateBody:
        finalState.templateBody ??
        "Hi {{first_name}}, we found an update that may be useful based on your recent activity. Would you like to learn more?",
      recommendedSendTime: finalState.recommendedSendTime ?? new Date(),
      sendTimeReason:
        finalState.sendTimeReason ??
        "Chosen from recent reply behavior and regional send-time quality.",
      expectedRevenue: finalState.expectedRevenue ?? Math.round(finalState.metrics.revenue * 0.2),
      expectedReplyRate: finalState.expectedReplyRate ?? finalState.metrics.replyRate,
      expectedConversionRate: finalState.expectedConversionRate ?? finalState.metrics.conversionRate,
      riskLevel: finalState.riskLevel ?? "Medium",
      validatorFeedback:
        finalState.validatorFeedback ??
        "Suppress recently contacted users and preserve standard WhatsApp opt-out handling.",
      operatingSummary:
        finalState.operatingSummary ??
        "AstraOS generated a campaign recommendation from historical performance and tenant operating rules."
    }
  });

  return {
    run: completedRun,
    recommendation
  };
}
