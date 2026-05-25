import type { CampaignObjective } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CampaignCohortCandidate,
  CampaignContext,
  CampaignContextRequest,
  CampaignDraftRequest,
  CampaignDraftResponse,
  CampaignServiceCampaign,
  CampaignServicePort,
  CampaignSuppressionRule,
  CampaignTemplateCandidate
} from "@/lib/campaign-service/types";

function toServiceCampaign(campaign: {
  id: string;
  tenantId: string;
  name: string;
  objective: CampaignObjective;
  status: string;
  cohortName: string;
  templateName: string;
  sentAt: Date | null;
  audienceSize: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  conversions: number;
  revenue: number;
  spend: number;
  optOuts: number;
  qualityRating: number;
}): CampaignServiceCampaign {
  return {
    id: campaign.id,
    tenantId: campaign.tenantId,
    name: campaign.name,
    objective: campaign.objective,
    status: campaign.status,
    cohortName: campaign.cohortName,
    templateName: campaign.templateName,
    sentAt: campaign.sentAt,
    audienceSize: campaign.audienceSize,
    delivered: campaign.delivered,
    opened: campaign.opened,
    clicked: campaign.clicked,
    replied: campaign.replied,
    conversions: campaign.conversions,
    revenue: campaign.revenue,
    spend: campaign.spend,
    optOuts: campaign.optOuts,
    qualityRating: campaign.qualityRating
  };
}

function cohortCandidatesFor(
  industry: string,
  objective: CampaignObjective
): CampaignCohortCandidate[] {
  if (industry.toLowerCase().includes("education")) {
    return [
      {
        id: "trial-pricing-clickers",
        name: "Trial registrants with pricing intent",
        description: "Registered leads who clicked pricing or batch timing but have not booked counselling.",
        estimatedAudience: 11800,
        intentSignals: ["trial_registered", "pricing_clicked", "batch_time_viewed"],
        fatigueScore: 0.22,
        expectedReplyRate: 0.118,
        expectedConversionRate: 0.041
      },
      {
        id: "scholarship-deadline",
        name: "Scholarship applicants near deadline",
        description: "Applicants with started forms and no payment confirmation.",
        estimatedAudience: 7400,
        intentSignals: ["form_started", "deadline_visible", "no_payment"],
        fatigueScore: 0.28,
        expectedReplyRate: 0.101,
        expectedConversionRate: 0.037
      }
    ];
  }

  if (industry.toLowerCase().includes("healthcare")) {
    return [
      {
        id: "preventive-care-due",
        name: "Patients due for preventive care",
        description: "Patients with prior appointment replies and upcoming check-up windows.",
        estimatedAudience: 7200,
        intentSignals: ["appointment_history", "preventive_due", "prior_reply"],
        fatigueScore: 0.16,
        expectedReplyRate: 0.086,
        expectedConversionRate: 0.047
      },
      {
        id: "missed-appointment-recovery",
        name: "Missed appointment recovery",
        description: "No-show patients with no rescheduled appointment.",
        estimatedAudience: 3900,
        intentSignals: ["no_show", "no_reschedule", "care_plan_active"],
        fatigueScore: 0.31,
        expectedReplyRate: 0.074,
        expectedConversionRate: 0.039
      }
    ];
  }

  return [
    {
      id: "abandoned-cart-14d",
      name: "Abandoned cart customers with recent product intent",
      description: "Customers with cart or product-view activity in the last 14 days and no recent campaign touch.",
      estimatedAudience: objective === "reactivation" ? 8200 : 9800,
      intentSignals: ["cart_abandoned", "product_viewed", "loyalty_available"],
      fatigueScore: 0.24,
      expectedReplyRate: 0.086,
      expectedConversionRate: 0.032
    },
    {
      id: "vip-repeat-buyers",
      name: "VIP repeat buyers near replenishment window",
      description: "High-LTV customers who are close to expected replenishment timing.",
      estimatedAudience: 6400,
      intentSignals: ["repeat_purchase", "replenishment_due", "loyalty_tier"],
      fatigueScore: 0.18,
      expectedReplyRate: 0.094,
      expectedConversionRate: 0.038
    }
  ];
}

function templateCandidatesFor(industry: string): CampaignTemplateCandidate[] {
  if (industry.toLowerCase().includes("education")) {
    return [
      {
        id: "counsellor-slot-confirmation",
        name: "Counsellor Slot Confirmation",
        body:
          "Hi {{first_name}}, based on your interest in {{course_name}}, we found a batch that fits your goal. Would you like a counsellor to confirm the best timing today?",
        locale: "en-IN",
        category: "marketing",
        qualityScore: 0.91,
        variables: ["first_name", "course_name"]
      }
    ];
  }

  if (industry.toLowerCase().includes("healthcare")) {
    return [
      {
        id: "preventive-care-reminder",
        name: "Preventive Care Reminder",
        body:
          "Hi {{first_name}}, your preventive check-up window is open this week. CarePlus can help you book a convenient slot. Would you like to see available times?",
        locale: "en",
        category: "utility",
        qualityScore: 0.94,
        variables: ["first_name"]
      }
    ];
  }

  return [
    {
      id: "cart-recovery-product-proof",
      name: "Cart Recovery With Product Proof",
      body:
        "Hi {{first_name}}, your {{product_name}} is still waiting. Shoppers with your preferences usually pair it with {{recommended_pairing}}. Want us to reserve it with your loyalty perk?",
      locale: "en",
      category: "marketing",
      qualityScore: 0.88,
      variables: ["first_name", "product_name", "recommended_pairing"]
    }
  ];
}

function defaultSuppressionRules(): CampaignSuppressionRule[] {
  return [
    {
      id: "recent-touch-72h",
      name: "Suppress recent campaign touches",
      description: "Do not include contacts who received a marketing campaign in the last 72 hours.",
      windowHours: 72,
      severity: "warning"
    },
    {
      id: "opt-out-always",
      name: "Respect opt-outs",
      description: "Always suppress opted-out contacts and contacts marked as do-not-market.",
      windowHours: 0,
      severity: "critical"
    },
    {
      id: "failed-delivery-30d",
      name: "Suppress repeated delivery failures",
      description: "Suppress contacts with repeated WhatsApp delivery failures in the last 30 days.",
      windowHours: 720,
      severity: "info"
    }
  ];
}

export class PrismaCampaignService implements CampaignServicePort {
  name = "prisma-mock-campaign-service";

  async getCampaignContext(request: CampaignContextRequest): Promise<CampaignContext> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.tenantId }
    });
    if (!tenant) {
      throw new Error("Tenant not found in AstraOS campaign service.");
    }

    const campaigns = await this.listCampaignHistory(request);
    return {
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
      campaigns,
      cohortCandidates: await this.listCohortCandidates(request),
      templateCandidates: await this.listTemplateCandidates(request),
      suppressionRules: await this.listSuppressionRules(request.tenantId)
    };
  }

  async listCampaignHistory(request: CampaignContextRequest) {
    const from = new Date();
    from.setDate(from.getDate() - (request.windowDays ?? 90));
    const campaigns = await prisma.campaign.findMany({
      where: {
        tenantId: request.tenantId,
        sentAt: {
          gte: from
        }
      },
      orderBy: {
        sentAt: "desc"
      },
      take: 25
    });
    return campaigns.map(toServiceCampaign);
  }

  async listCohortCandidates(request: CampaignContextRequest) {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: request.tenantId }
    });
    return cohortCandidatesFor(tenant.industry, request.objective);
  }

  async listTemplateCandidates(request: CampaignContextRequest) {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: request.tenantId }
    });
    return templateCandidatesFor(tenant.industry);
  }

  async listSuppressionRules(_tenantId: string) {
    return defaultSuppressionRules();
  }

  async createCampaignDraft(request: CampaignDraftRequest): Promise<CampaignDraftResponse> {
    return {
      draftCampaignId: `mock_draft_${request.recommendationId}`,
      status: "draft_created",
      message:
        "Mock campaign draft created. In production this method should call the tenant campaign service and never auto-send without approval."
    };
  }
}
