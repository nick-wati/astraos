# Rivoli Domain MCP / API Readiness Contract

这份文档给 Domain Level Squad 使用。目标是让 Rivoli / Wati 现有业务服务以 MCP-style capability provider 的形式接入 AstraOS，让 AstraOS 可以运行 Campaign、Commerce、Support 领域的智能体。

AstraOS 负责：

- Agent orchestration、retry、human review、validation gate
- LangGraph execution state
- Langfuse tracing、token、latency、cost、quality metrics
- Admin Portal 里的 agent performance、consumption、value reporting

Domain services 负责：

- 业务 source of truth
- tenant-scoped data access
- policy、consent、eligibility、SLA 等规则
- human-approved writeback，例如创建 campaign draft、message draft、reply draft、escalation

MVP 原则：AstraOS 可以建议和创建待审批草稿，但不要自动发送消息、自动改订单、自动关闭工单。

## Common Contract

所有接口必须支持多租户隔离。每个请求都必须包含：

| Field | Required | Notes |
| --- | --- | --- |
| `tenantId` | Yes | Wati tenant id. 如果 domain service 使用外部 id，需要在响应里返回 `externalTenantId`。 |
| `requestId` | Required for writes | Idempotency key. 同一个 `requestId` 重放不能创建重复草稿或重复升级。 |
| `objective` | Planning APIs | 例如 `revenue_recovery`、`cart_recovery`、`support_resolution`。 |
| `windowDays` | History APIs | 默认 30 或 90，domain service 可以设置最大窗口。 |
| `locale` | Optional | 用于模板、知识库、回复语气。 |

所有响应建议包含：

| Field | Notes |
| --- | --- |
| `sourceIds` | 原始业务对象 id，便于审计和回放。 |
| `freshnessAt` | 数据更新时间，AstraOS 用它判断是否允许自动建议。 |
| `tenantPlan` / `region` | Admin Portal 按 tier / region 分析表现。 |
| `policyFlags` | consent、opt-out、SLA、inventory、template policy 等。 |
| `metrics` | 足够计算 outcome、quality、cost per outcome。 |

统一错误格式：

```json
{
  "error": {
    "code": "TENANT_NOT_FOUND | STALE_DATA | POLICY_BLOCKED | RATE_LIMITED | WRITE_REJECTED",
    "message": "Human readable reason",
    "retryable": false,
    "details": {}
  }
}
```

## Transport

MVP 可以先用 HTTP adapter，路径保持 MCP tool naming 的语义：

```text
POST /mcp/{domain}/{capability}
Authorization: Bearer <service-token>
X-Request-Id: <requestId>
```

后续如果接入正式 MCP server，tool names 保持不变，AstraOS adapter 只替换 transport。

## P0 Campaign Interfaces

Campaign 是当前 MVP 主路径。它支持用户看到历史 campaign 表现，然后由 agent 推荐 cohort、template、send time，并创建待审批 campaign draft。

| Priority | Tool | Owner Squad | Purpose | Must Return |
| --- | --- | --- | --- | --- |
| P0 | `campaign.get_context` | Campaign service | 一次性返回规划所需上下文。 | tenant profile, history, cohort candidates, templates, suppression rules |
| P0 | `campaign.list_history` | Campaign analytics | 读取历史表现。 | delivered, opened, clicked, replied, conversions, revenue, spend, optOuts, qualityRating |
| P0 | `campaign.list_cohort_candidates` | Segmentation | 推荐可触达受众。 | estimatedAudience, intentSignals, fatigueScore, expectedReplyRate, expectedConversionRate |
| P0 | `campaign.list_template_candidates` | Template service | 返回可用 WhatsApp 模板。 | body, locale, category, variables, qualityScore, approvalStatus |
| P0 | `campaign.list_suppression_rules` | Consent / Policy | 返回疲劳、退订、发送限制。 | rule id, windowHours, severity, description |
| P0 | `campaign.create_draft` | Campaign service | 人审通过后创建草稿，不自动发送。 | draftCampaignId, status, previewUrl |
| P1 | `campaign.estimate_audience` | Segmentation | 对具体 cohort 做触达规模估算。 | reachableAudience, suppressedCount, reasons |
| P1 | `campaign.validate_template` | Template service | 对选中模板做变量和政策校验。 | passed, score, missingVariables, policyFlags |
| P1 | `campaign.check_contact_eligibility` | Consent / Policy | 联系人级发送资格检查。 | eligible, blockedReasons |
| P1 | `campaign.get_outcome_attribution` | Analytics | 回流结果用于 value reporting。 | revenue, conversions, replies, optOuts, attributionWindow |

Example `campaign.get_context` request:

```json
{
  "tenantId": "tenant_123",
  "objective": "revenue_recovery",
  "windowDays": 90,
  "locale": "en"
}
```

Example `campaign.create_draft` request:

```json
{
  "tenantId": "tenant_123",
  "requestId": "astraos_run_abc_step_create_draft",
  "recommendationId": "rec_123",
  "cohortId": "cohort_high_intent_30d",
  "templateId": "tpl_winback_v2",
  "sendAt": "2026-05-27T10:00:00+08:00",
  "templateBody": "Hi {{first_name}}, your saved item is still available..."
}
```

## P1 Commerce Interfaces

Commerce 适合第二批。优先支持 cart recovery、product recommendation、order moment 和 offer/message draft。

| Priority | Tool | Owner Squad | Purpose | Must Return |
| --- | --- | --- | --- | --- |
| P1 | `commerce.get_context` | Commerce service | 返回商店、订单、购物车、商品、segment 总上下文。 | tenant, recentOrders, cartEvents, products, segments |
| P1 | `commerce.list_cart_events` | Storefront analytics | 读取 abandoned cart 和 checkout drop。 | cartId, customerId, value, itemCount, productIds, lastActivityAt |
| P1 | `commerce.list_product_catalog` | Catalog | 商品目录。 | productId, name, category, price, currency, inventoryAvailable, marginBand |
| P1 | `commerce.list_inventory` | Catalog / Inventory | 库存校验。 | productId, available, freshnessAt |
| P1 | `commerce.list_customer_segments` | CRM / CDP | 可触达客户群。 | estimatedCustomers, purchaseSignals, consentStatus |
| P1 | `commerce.create_message_draft` | Commerce / Campaign | 创建 WhatsApp 消息草稿。 | draftMessageId, status |
| P2 | `commerce.create_offer` | Commerce | 创建优惠草稿。 | offerId, discount, expiresAt, approvalStatus |
| P2 | `commerce.get_conversion_events` | Commerce analytics | 回流转化。 | recoveredRevenue, purchases, offerUsage |

Key validation requirements:

- 不允许推荐无库存商品。
- 折扣需要返回 margin guardrail。
- 消息草稿必须带 consent status 和 opt-out eligibility。
- 所有 write action 必须 idempotent。

## P1 Support Interfaces

Support 适合第三批或并行灰度。优先支持 reply draft 和 escalation，不自动发送最终回复。

| Priority | Tool | Owner Squad | Purpose | Must Return |
| --- | --- | --- | --- | --- |
| P1 | `support.get_context` | Support service | 返回队列、SLA、policy、语言等上下文。 | tenant, openConversations, policyRules |
| P1 | `support.get_conversation_thread` | Inbox | 读取会话线程。 | messages, sender, createdAt, channel |
| P1 | `support.search_knowledge_base` | Knowledge | 检索知识库和宏。 | title, excerpt, source, url, confidence |
| P1 | `support.get_policy_rules` | Policy | 回复和升级规则。 | severity, instruction |
| P1 | `support.create_reply_draft` | Inbox | 创建待审核回复草稿。 | draftReplyId, status |
| P1 | `support.escalate_case` | Inbox / Support | 高风险会话升级。 | escalationId, status, assigneeQueue |
| P2 | `support.get_sla_status` | Support | SLA 状态。 | remainingMinutes, breachRisk |
| P2 | `support.record_resolution` | Support analytics | 回流解决结果。 | resolutionStatus, reopenRate, csat |

Key validation requirements:

- Reply draft 必须带 citation source ids。
- Policy critical 命中时必须进入 human review。
- SLA high / urgent 不能只生成建议，需要创建 escalation draft 或提醒。

## Admin Observability Events

Domain services 不需要计算 LLM token 或 Langfuse trace，但需要给 AstraOS 足够的业务 outcome 信号。

| Event | Producer | Purpose |
| --- | --- | --- |
| `campaign.outcome_updated` | Campaign analytics | 更新 replies、conversions、revenue、opt-outs。 |
| `commerce.conversion_updated` | Commerce analytics | 更新 recovered revenue、offer usage、repeat purchase。 |
| `support.resolution_updated` | Support analytics | 更新 resolution、SLA miss、CSAT、human assist rate。 |

Recommended event payload:

```json
{
  "tenantId": "tenant_123",
  "domain": "campaign",
  "sourceId": "campaign_456",
  "occurredAt": "2026-05-27T12:00:00Z",
  "metrics": {
    "revenue": 1280,
    "conversions": 18,
    "replies": 44,
    "optOuts": 3
  }
}
```

## Security And Scale Requirements

- Enforce tenant-level authorization in the domain service, not only in AstraOS.
- All list APIs must support pagination or server-side limits.
- All timestamps should be ISO 8601 with timezone.
- PII fields should be minimized. Agents usually need cohort-level and message-thread context, not full raw profiles.
- Write APIs must use `requestId` for idempotency.
- Rate limit by tenant and by AstraOS service identity.
- Return `freshnessAt`; stale data should not be silently treated as safe.

## Definition Of Ready

A Domain Squad is ready for AstraOS pilot when:

1. P0/P1 read APIs return production tenant-scoped data.
2. Write APIs create drafts only, never auto-send or auto-close.
3. Errors use the common error shape.
4. Every write API is idempotent by `requestId`.
5. Response payloads include stable source ids and `freshnessAt`.
6. The squad can provide a staging base URL and service token.
7. AstraOS can run the mocked agent path against the staging adapter without code changes outside the adapter.

