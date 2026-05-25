# Campaign Service MCP-Style Contract

AstraOS should not own every Wati campaign data source directly. The Campaign Launch Advisor uses a small MCP-style service port so an existing campaign service can provide tenant context, campaign history, cohorts, templates, suppression rules, and optional draft creation.

## Tools

| Tool | Purpose |
| --- | --- |
| `campaign.get_context` | Return the full planning context for a tenant and objective. |
| `campaign.list_history` | Return historical Wati campaign performance. |
| `campaign.list_cohort_candidates` | Return candidate cohorts with intent, fatigue, and expected outcome estimates. |
| `campaign.list_template_candidates` | Return approved WhatsApp templates and variables. |
| `campaign.list_suppression_rules` | Return tenant-specific fatigue, opt-out, and delivery suppression rules. |
| `campaign.estimate_audience` | Estimate reachable audience size for a candidate cohort after suppression. |
| `campaign.validate_template` | Validate a selected template against locale, category, variables, and policy constraints. |
| `campaign.check_contact_eligibility` | Check contact-level eligibility before committing a draft. |
| `campaign.create_draft` | Create a draft campaign after human approval. MVP should not auto-send. |
| `campaign.get_draft_status` | Return draft status after AstraOS creates it. |
| `campaign.get_delivery_events` | Return delivery, reply, opt-out, and failure events for outcome reporting. |
| `campaign.get_outcome_attribution` | Return attributed revenue, conversion, and cost-per-outcome data. |

## HTTP Adapter Shape

Set these environment variables to use an existing campaign service instead of the local Prisma mock adapter:

```bash
CAMPAIGN_SERVICE_BASE_URL="https://campaign-service.internal"
CAMPAIGN_SERVICE_API_KEY="..."
```

Expected endpoints:

```text
POST /mcp/campaign/context
POST /mcp/campaign/history
POST /mcp/campaign/cohorts
POST /mcp/campaign/templates
POST /mcp/campaign/suppression-rules
POST /mcp/campaign/audience-estimate
POST /mcp/campaign/template-validation
POST /mcp/campaign/contact-eligibility
POST /mcp/campaign/drafts
POST /mcp/campaign/draft-status
POST /mcp/campaign/delivery-events
POST /mcp/campaign/outcome-attribution
```

Each endpoint accepts `{ tenantId, objective, windowDays }` where relevant. `campaign.create_draft` accepts the approved recommendation ID, selected cohort/template IDs, send time, and rendered template body.

## Runtime Boundary

AstraOS owns:

- agent orchestration
- LangGraph execution
- Langfuse trace wrapping
- token and cost ledger
- validation and human-review state
- admin observability

The campaign service owns:

- source-of-truth campaign history
- cohort inventory
- template library
- suppression rules
- final draft campaign creation
