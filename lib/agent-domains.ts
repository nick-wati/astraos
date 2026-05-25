export type AgentDomain = {
  id: "campaign" | "commerce" | "support";
  name: string;
  status: "active_mvp" | "next" | "planned";
  businessOwner: string;
  purpose: string;
  agentArchetypes: string[];
  mcpTools: string[];
  primaryOutcome: string;
  operatingRisk: string;
  nextAction: string;
};

export type McpInterfaceGroup = {
  capability: string;
  tools: string[];
  ownedBy: string;
  why: string;
};

export const agentDomainCatalog: AgentDomain[] = [
  {
    id: "campaign",
    name: "Campaign",
    status: "active_mvp",
    businessOwner: "Marketing automation",
    purpose:
      "Recommend the next WhatsApp campaign, cohort, template, send time, and approval action.",
    agentArchetypes: [
      "Campaign Performance Analyst",
      "Cohort Strategy Agent",
      "Template Strategy Agent",
      "Send Time Optimizer",
      "Campaign Compliance Validator"
    ],
    mcpTools: [
      "campaign.get_context",
      "campaign.list_history",
      "campaign.list_cohort_candidates",
      "campaign.estimate_audience",
      "campaign.list_template_candidates",
      "campaign.validate_template",
      "campaign.list_suppression_rules",
      "campaign.check_contact_eligibility",
      "campaign.create_draft",
      "campaign.get_draft_status",
      "campaign.get_delivery_events",
      "campaign.get_outcome_attribution"
    ],
    primaryOutcome: "Approved campaign drafts with expected revenue and reply-rate lift.",
    operatingRisk: "Audience fatigue, template quality, opt-out pressure, and cost per outcome.",
    nextAction: "Connect production campaign history, cohorts, templates, and draft creation."
  },
  {
    id: "commerce",
    name: "Commerce",
    status: "next",
    businessOwner: "Revenue operations",
    purpose:
      "Recover carts, recommend products, handle order moments, and trigger commerce-safe messages.",
    agentArchetypes: [
      "Cart Recovery Agent",
      "Product Recommendation Agent",
      "Order Moment Agent",
      "Offer Strategy Agent",
      "Commerce Policy Validator"
    ],
    mcpTools: [
      "commerce.get_context",
      "commerce.list_orders",
      "commerce.get_order",
      "commerce.list_cart_events",
      "commerce.list_browse_events",
      "commerce.list_product_catalog",
      "commerce.list_inventory",
      "commerce.list_customer_segments",
      "commerce.get_customer_profile",
      "commerce.create_offer",
      "commerce.create_message_draft",
      "commerce.get_conversion_events",
      "commerce.record_conversion"
    ],
    primaryOutcome: "Recovered revenue, higher repeat purchase rate, and fewer unsafe offers.",
    operatingRisk: "Inventory mismatch, discount leakage, stale catalog data, and order privacy.",
    nextAction: "Expose cart, order, catalog, inventory, and customer segment context."
  },
  {
    id: "support",
    name: "Support",
    status: "planned",
    businessOwner: "Customer operations",
    purpose:
      "Classify inbound conversations, retrieve knowledge, draft replies, and escalate risky cases.",
    agentArchetypes: [
      "Ticket Intake Agent",
      "Intent Classification Agent",
      "Knowledge Retrieval Agent",
      "Resolution Agent",
      "Escalation Validator"
    ],
    mcpTools: [
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
    ],
    primaryOutcome: "Faster support resolution with controlled human escalation.",
    operatingRisk: "Wrong answer, policy breach, SLA miss, and poor customer tone.",
    nextAction: "Expose conversation, customer, KB, policy, SLA, and escalation primitives."
  }
];

export type DomainAgentOperatingRow = {
  domain: AgentDomain["name"];
  agentName: string;
  status: "live" | "mocked" | "planned";
  targetTiers: string;
  enabledTenants: number;
  primaryModel: string;
  mcpReadiness: number;
  validationScore: number;
  costPer1kRuns: number;
  operatingRisk: string;
  nextAction: string;
};

export const domainAgentOperatingRows: DomainAgentOperatingRow[] = [
  {
    domain: "Campaign",
    agentName: "Campaign Performance Analyst",
    status: "live",
    targetTiers: "Growth, Enterprise",
    enabledTenants: 10000,
    primaryModel: "gemini-2.5-flash",
    mcpReadiness: 0.72,
    validationScore: 0.87,
    costPer1kRuns: 2.6,
    operatingRisk: "Wrong cohort read can waste broadcast budget.",
    nextAction: "Connect production campaign analytics and outcome attribution."
  },
  {
    domain: "Campaign",
    agentName: "Campaign Compliance Validator",
    status: "live",
    targetTiers: "All tiers",
    enabledTenants: 10000,
    primaryModel: "gemini-2.5-flash-lite",
    mcpReadiness: 0.66,
    validationScore: 0.92,
    costPer1kRuns: 0.9,
    operatingRisk: "Consent, opt-out, and recent-touch mistakes are high blast radius.",
    nextAction: "Add contact-level eligibility checks before draft creation."
  },
  {
    domain: "Commerce",
    agentName: "Cart Recovery Agent",
    status: "mocked",
    targetTiers: "Growth, Enterprise",
    enabledTenants: 3200,
    primaryModel: "gemini-2.5-flash-lite",
    mcpReadiness: 0.38,
    validationScore: 0.84,
    costPer1kRuns: 1.4,
    operatingRisk: "Inventory or price mismatch can create bad customer experiences.",
    nextAction: "Expose cart events, catalog, inventory, and draft message writeback."
  },
  {
    domain: "Commerce",
    agentName: "Commerce Policy Validator",
    status: "planned",
    targetTiers: "Enterprise",
    enabledTenants: 900,
    primaryModel: "gemini-2.5-flash-lite",
    mcpReadiness: 0.22,
    validationScore: 0.81,
    costPer1kRuns: 0.8,
    operatingRisk: "Discount leakage and invalid offers can hurt margin.",
    nextAction: "Define offer constraints, margin bands, and stock-safe validation."
  },
  {
    domain: "Support",
    agentName: "Resolution Agent",
    status: "planned",
    targetTiers: "All tiers",
    enabledTenants: 10000,
    primaryModel: "gemini-2.5-flash",
    mcpReadiness: 0.31,
    validationScore: 0.79,
    costPer1kRuns: 3.1,
    operatingRisk: "Incorrect answers, missing citations, and tone issues require human review.",
    nextAction: "Connect conversation thread, KB search, policy rules, and reply draft creation."
  },
  {
    domain: "Support",
    agentName: "Escalation Validator",
    status: "planned",
    targetTiers: "Growth, Enterprise",
    enabledTenants: 6400,
    primaryModel: "gemini-2.5-flash-lite",
    mcpReadiness: 0.28,
    validationScore: 0.86,
    costPer1kRuns: 0.7,
    operatingRisk: "SLA miss or failed escalation creates operational risk.",
    nextAction: "Expose SLA status and escalation channels from Inbox."
  }
];

export type DomainMcpReadinessRow = {
  domain: AgentDomain["name"];
  capability: string;
  owner: string;
  readiness: "connected" | "mocked" | "missing";
  priority: "p0" | "p1" | "p2";
  tools: string[];
};

export const domainMcpReadinessRows: DomainMcpReadinessRow[] = [
  {
    domain: "Campaign",
    capability: "Campaign planning context",
    owner: "Campaign service",
    readiness: "mocked",
    priority: "p0",
    tools: ["campaign.get_context", "campaign.list_history"]
  },
  {
    domain: "Campaign",
    capability: "Approved campaign draft",
    owner: "Campaign service",
    readiness: "mocked",
    priority: "p0",
    tools: ["campaign.create_draft", "campaign.get_draft_status"]
  },
  {
    domain: "Commerce",
    capability: "Cart and catalog context",
    owner: "Commerce service",
    readiness: "missing",
    priority: "p1",
    tools: ["commerce.list_cart_events", "commerce.list_product_catalog", "commerce.list_inventory"]
  },
  {
    domain: "Commerce",
    capability: "Commerce-safe message draft",
    owner: "Commerce / Campaign service",
    readiness: "missing",
    priority: "p1",
    tools: ["commerce.create_offer", "commerce.create_message_draft"]
  },
  {
    domain: "Support",
    capability: "Conversation and KB context",
    owner: "Inbox / Knowledge service",
    readiness: "missing",
    priority: "p1",
    tools: ["support.get_conversation_thread", "support.search_knowledge_base"]
  },
  {
    domain: "Support",
    capability: "Reply draft and escalation",
    owner: "Inbox service",
    readiness: "missing",
    priority: "p1",
    tools: ["support.create_reply_draft", "support.escalate_case"]
  }
];

export const campaignMcpInterfaceGroups: McpInterfaceGroup[] = [
  {
    capability: "Tenant and campaign context",
    tools: ["campaign.get_context"],
    ownedBy: "Campaign service",
    why: "Returns tenant profile, objective, historical campaigns, cohorts, templates, and suppression rules in one planning payload."
  },
  {
    capability: "Performance memory",
    tools: ["campaign.list_history"],
    ownedBy: "Analytics / Campaign service",
    why: "Lets agents compare recent performance, reply trend, opt-outs, conversion quality, and revenue by objective."
  },
  {
    capability: "Audience decisioning",
    tools: ["campaign.list_cohort_candidates", "campaign.estimate_audience"],
    ownedBy: "Segmentation service",
    why: "Gives AstraOS eligible cohorts, audience size, fatigue score, intent signals, and expected outcome estimates."
  },
  {
    capability: "Template decisioning",
    tools: ["campaign.list_template_candidates", "campaign.validate_template"],
    ownedBy: "Template service",
    why: "Ensures agents only recommend approved WhatsApp templates with locale, variables, category, and quality score."
  },
  {
    capability: "Compliance and suppression",
    tools: ["campaign.list_suppression_rules", "campaign.check_contact_eligibility"],
    ownedBy: "Consent / Policy service",
    why: "Prevents recent-touch fatigue, opt-out violations, repeated delivery failures, and tenant-specific policy breaches."
  },
  {
    capability: "Approved action writeback",
    tools: ["campaign.create_draft", "campaign.get_draft_status"],
    ownedBy: "Campaign service",
    why: "After human approval, AstraOS creates a draft campaign for Wati review without auto-sending."
  },
  {
    capability: "Outcome readback",
    tools: ["campaign.get_delivery_events", "campaign.get_outcome_attribution"],
    ownedBy: "Campaign analytics",
    why: "Feeds delivery, replies, conversions, revenue, and opt-outs back into agent performance and cost-per-outcome reporting."
  }
];
