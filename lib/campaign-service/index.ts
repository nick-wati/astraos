import { HttpCampaignService } from "@/lib/campaign-service/http";
import { PrismaCampaignService } from "@/lib/campaign-service/prisma";

export function getCampaignService() {
  if (process.env.CAMPAIGN_SERVICE_BASE_URL) {
    return new HttpCampaignService(
      process.env.CAMPAIGN_SERVICE_BASE_URL,
      process.env.CAMPAIGN_SERVICE_API_KEY
    );
  }

  return new PrismaCampaignService();
}

export type {
  CampaignCohortCandidate,
  CampaignContext,
  CampaignContextRequest,
  CampaignDraftRequest,
  CampaignDraftResponse,
  CampaignServiceCampaign,
  CampaignServicePort,
  CampaignServiceTenant,
  CampaignSuppressionRule,
  CampaignTemplateCandidate
} from "@/lib/campaign-service/types";
