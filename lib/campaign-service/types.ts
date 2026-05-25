import type { CampaignObjective } from "@prisma/client";

export type CampaignServiceTenant = {
  id: string;
  externalTenantId?: string;
  name: string;
  slug: string;
  industry: string;
  region: string;
  plan: string;
  status: string;
  defaultLocale: string;
  monthlyTokenBudget?: number;
  monthlyCostBudget?: number;
};

export type CampaignServiceCampaign = {
  id: string;
  externalCampaignId?: string;
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
};

export type CampaignCohortCandidate = {
  id: string;
  name: string;
  description: string;
  estimatedAudience: number;
  intentSignals: string[];
  suppressionReason?: string;
  fatigueScore: number;
  expectedReplyRate: number;
  expectedConversionRate: number;
};

export type CampaignTemplateCandidate = {
  id: string;
  name: string;
  body: string;
  locale: string;
  category: "marketing" | "utility";
  qualityScore: number;
  variables: string[];
};

export type CampaignSuppressionRule = {
  id: string;
  name: string;
  description: string;
  windowHours: number;
  severity: "info" | "warning" | "critical";
};

export type CampaignContextRequest = {
  tenantId: string;
  objective: CampaignObjective;
  windowDays?: number;
};

export type CampaignContext = {
  tenant: CampaignServiceTenant;
  campaigns: CampaignServiceCampaign[];
  cohortCandidates: CampaignCohortCandidate[];
  templateCandidates: CampaignTemplateCandidate[];
  suppressionRules: CampaignSuppressionRule[];
};

export type CampaignDraftRequest = {
  tenantId: string;
  recommendationId: string;
  cohortId?: string;
  templateId?: string;
  sendAt: Date;
  templateBody: string;
};

export type CampaignDraftResponse = {
  draftCampaignId: string;
  status: "draft_created" | "needs_review" | "failed";
  previewUrl?: string;
  message: string;
};

export interface CampaignServicePort {
  name: string;
  getCampaignContext(request: CampaignContextRequest): Promise<CampaignContext>;
  listCampaignHistory(request: CampaignContextRequest): Promise<CampaignServiceCampaign[]>;
  listCohortCandidates(request: CampaignContextRequest): Promise<CampaignCohortCandidate[]>;
  listTemplateCandidates(request: CampaignContextRequest): Promise<CampaignTemplateCandidate[]>;
  listSuppressionRules(tenantId: string): Promise<CampaignSuppressionRule[]>;
  createCampaignDraft?(request: CampaignDraftRequest): Promise<CampaignDraftResponse>;
}

export const CAMPAIGN_MCP_TOOLS = [
  {
    name: "campaign.get_context",
    description:
      "Return tenant profile, historical campaigns, cohort candidates, template candidates, and suppression rules for campaign planning."
  },
  {
    name: "campaign.list_history",
    description:
      "Return historical Wati campaign performance for a tenant and objective within a time window."
  },
  {
    name: "campaign.list_cohort_candidates",
    description:
      "Return campaign cohorts with estimated audience, fatigue score, intent signals, and expected outcome rates."
  },
  {
    name: "campaign.list_template_candidates",
    description:
      "Return approved WhatsApp template candidates with variables, locale, category, and quality score."
  },
  {
    name: "campaign.list_suppression_rules",
    description:
      "Return tenant-specific contact suppression and fatigue rules before a campaign recommendation is accepted."
  },
  {
    name: "campaign.create_draft",
    description:
      "Create a draft campaign in the tenant campaign system. This MVP does not auto-send campaigns."
  }
] as const;
