export type SupportServiceTenant = {
  id: string;
  externalTenantId?: string;
  name: string;
  plan: string;
  region: string;
  defaultLocale: string;
  supportChannels: Array<"whatsapp" | "instagram" | "web_chat" | "email">;
  defaultSlaMinutes: number;
};

export type SupportConversation = {
  id: string;
  externalConversationId?: string;
  tenantId: string;
  customerId: string;
  channel: "whatsapp" | "instagram" | "web_chat" | "email";
  status: "open" | "pending" | "resolved" | "escalated";
  priority: "low" | "normal" | "high" | "urgent";
  tags: string[];
  lastMessageAt: Date;
  assignee?: string;
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  sender: "customer" | "agent" | "system";
  body: string;
  createdAt: Date;
};

export type KnowledgeResult = {
  id: string;
  title: string;
  source: "help_center" | "policy" | "macro" | "internal_note";
  excerpt: string;
  url?: string;
  confidence: number;
};

export type SupportPolicyRule = {
  id: string;
  name: string;
  severity: "info" | "warning" | "critical";
  instruction: string;
};

export type SupportContextRequest = {
  tenantId: string;
  queue?: string;
  locale?: string;
  windowDays?: number;
};

export type SupportContext = {
  tenant: SupportServiceTenant;
  openConversations: SupportConversation[];
  policyRules: SupportPolicyRule[];
};

export type SupportReplyDraftRequest = {
  tenantId: string;
  requestId: string;
  conversationId: string;
  replyBody: string;
  citations?: KnowledgeResult[];
  recommendedTags?: string[];
};

export type SupportReplyDraftResponse = {
  draftReplyId: string;
  status: "draft_created" | "needs_review" | "failed";
  message: string;
};

export type SupportEscalationRequest = {
  tenantId: string;
  requestId: string;
  conversationId: string;
  reason: string;
  urgency: "normal" | "high" | "urgent";
};

export interface SupportServicePort {
  name: string;
  getSupportContext(request: SupportContextRequest): Promise<SupportContext>;
  listOpenConversations(request: SupportContextRequest): Promise<SupportConversation[]>;
  getConversationThread(tenantId: string, conversationId: string): Promise<SupportMessage[]>;
  searchKnowledgeBase(tenantId: string, query: string, locale?: string): Promise<KnowledgeResult[]>;
  getPolicyRules(tenantId: string): Promise<SupportPolicyRule[]>;
  createReplyDraft?(request: SupportReplyDraftRequest): Promise<SupportReplyDraftResponse>;
  escalateCase?(request: SupportEscalationRequest): Promise<{ status: "escalated" | "failed"; message: string }>;
}

export const SUPPORT_MCP_TOOLS = [
  "support.get_context",
  "support.list_open_conversations",
  "support.get_conversation_thread",
  "support.get_customer_profile",
  "support.list_customer_events",
  "support.search_knowledge_base",
  "support.get_policy_rules",
  "support.create_reply_draft",
  "support.apply_tags",
  "support.escalate_case",
  "support.get_sla_status",
  "support.record_resolution",
  "support.get_csat_events"
] as const;
