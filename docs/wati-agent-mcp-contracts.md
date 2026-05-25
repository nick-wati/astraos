# Wati Agent MCP Contracts

AstraOS should treat Wati product services as MCP-style capability providers. AstraOS owns agent orchestration, validation, retry policy, human review, Langfuse telemetry, and cost reporting. Domain services own source-of-truth business data and final write actions.

## Common Shape

Every domain tool should accept:

- `tenantId`
- `windowDays` when reading history
- `objective` when planning an action
- `requestId` for idempotency on write actions

Every response should include:

- stable source IDs
- freshness timestamp
- tenant plan and region when relevant
- policy or consent flags when relevant
- enough metrics for outcome reporting

## Campaign MCP

| Capability | Tools | Owner | Purpose |
| --- | --- | --- | --- |
| Tenant and campaign context | `campaign.get_context` | Campaign service | One planning payload with tenant profile, history, cohorts, templates, and suppression rules. |
| Performance memory | `campaign.list_history` | Campaign analytics | Historical delivery, opens, replies, conversions, revenue, spend, opt-outs, and quality rating. |
| Audience decisioning | `campaign.list_cohort_candidates`, `campaign.estimate_audience` | Segmentation service | Candidate cohorts with estimated audience, fatigue, intent signals, and expected outcome rates. |
| Template decisioning | `campaign.list_template_candidates`, `campaign.validate_template` | Template service | Approved WhatsApp templates, variables, locale, category, and quality score. |
| Compliance and suppression | `campaign.list_suppression_rules`, `campaign.check_contact_eligibility` | Consent / policy service | Recent-touch suppression, opt-outs, delivery failures, and tenant-specific policy rules. |
| Approved writeback | `campaign.create_draft`, `campaign.get_draft_status` | Campaign service | Create a draft campaign after human approval. AstraOS should not auto-send in MVP. |
| Outcome readback | `campaign.get_delivery_events`, `campaign.get_outcome_attribution` | Campaign analytics | Feed replies, conversions, revenue, opt-outs, and delivery status back into agent metrics. |

## Commerce MCP

| Capability | Tools | Owner | Purpose |
| --- | --- | --- | --- |
| Commerce context | `commerce.get_context` | Commerce service | Tenant commerce profile, stores, currencies, catalog freshness, and integration status. |
| Orders | `commerce.list_orders`, `commerce.get_order` | Order service | Recent orders, order status, value, items, fulfillment, and customer history. |
| Cart and browse intent | `commerce.list_cart_events`, `commerce.list_browse_events` | Storefront analytics | Abandoned carts, product views, checkout drops, and recency signals. |
| Catalog and inventory | `commerce.list_product_catalog`, `commerce.list_inventory` | Catalog service | Product metadata, price, stock, variants, margin, and availability. |
| Customer segments | `commerce.list_customer_segments`, `commerce.get_customer_profile` | CRM / CDP | Repeat buyers, VIPs, churn-risk users, consent, and purchase preferences. |
| Offer and message writeback | `commerce.create_offer`, `commerce.create_message_draft` | Commerce / Campaign service | Create recovery offer and WhatsApp message draft after approval. |
| Commerce outcome readback | `commerce.get_conversion_events`, `commerce.record_conversion` | Commerce analytics | Attribute recovered revenue, repeat purchases, and offer performance. |

## Support MCP

| Capability | Tools | Owner | Purpose |
| --- | --- | --- | --- |
| Support context | `support.get_context` | Support service | Tenant support settings, queues, SLA policy, languages, and escalation channels. |
| Conversation access | `support.list_open_conversations`, `support.get_conversation_thread` | Inbox service | Customer messages, channel, timestamps, assignee, tags, and current status. |
| Customer context | `support.get_customer_profile`, `support.list_customer_events` | CRM / Inbox service | Customer identity, plan, order history, prior tickets, and sentiment markers. |
| Knowledge retrieval | `support.search_knowledge_base`, `support.get_policy_rules` | Knowledge / policy service | Approved answers, policy constraints, refund rules, warranty rules, and source citations. |
| Reply action | `support.create_reply_draft`, `support.apply_tags` | Inbox service | Draft response, classify intent, apply tags, and prepare human approval. |
| Escalation | `support.escalate_case`, `support.get_sla_status` | Support service | Route complex or risky cases to human teams with reason and SLA urgency. |
| Resolution readback | `support.record_resolution`, `support.get_csat_events` | Support analytics | Track resolution, reopen rate, SLA miss, human assist rate, and CSAT. |

## MVP Priority

1. Campaign: implement production `get_context`, `list_history`, `list_cohort_candidates`, `list_template_candidates`, `list_suppression_rules`, and `create_draft`.
2. Commerce: start with cart recovery and order moment agents. Prioritize cart events, catalog, inventory, and draft message creation.
3. Support: start with reply draft and escalation agents. Prioritize conversation thread, KB search, policy rules, and reply draft creation.
