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

export class HttpCampaignService implements CampaignServicePort {
  name = "http-campaign-service";

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        ...init?.headers
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Campaign service request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getCampaignContext(request: CampaignContextRequest): Promise<CampaignContext> {
    return this.request<CampaignContext>(`/mcp/campaign/context`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }

  async listCampaignHistory(request: CampaignContextRequest): Promise<CampaignServiceCampaign[]> {
    return this.request<CampaignServiceCampaign[]>(`/mcp/campaign/history`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }

  async listCohortCandidates(request: CampaignContextRequest): Promise<CampaignCohortCandidate[]> {
    return this.request<CampaignCohortCandidate[]>(`/mcp/campaign/cohorts`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }

  async listTemplateCandidates(request: CampaignContextRequest): Promise<CampaignTemplateCandidate[]> {
    return this.request<CampaignTemplateCandidate[]>(`/mcp/campaign/templates`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }

  async listSuppressionRules(tenantId: string): Promise<CampaignSuppressionRule[]> {
    return this.request<CampaignSuppressionRule[]>(`/mcp/campaign/suppression-rules`, {
      method: "POST",
      body: JSON.stringify({ tenantId })
    });
  }

  async createCampaignDraft(request: CampaignDraftRequest): Promise<CampaignDraftResponse> {
    return this.request<CampaignDraftResponse>(`/mcp/campaign/drafts`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }
}
