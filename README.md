# AstraOS

AstraOS is Wati's AI-native operating system for converting business SOPs into supervised AI agent teams.

It runs business SOPs through Role Agents and Validator Agents with retry policies, escalation paths, human review, execution history, token/cost monitoring, and business outcome reporting.

## Architecture Direction

The current MVP should move toward this dependency split:

| Layer | Primary dependency | AstraOS responsibility | Notes |
| --- | --- | --- | --- |
| Model gateway | LiteLLM | Model routing, fallback policy, provider abstraction, tenant budget keys, usage/cost normalization | Agents should call AstraOS model interfaces, not OpenAI/Anthropic/Gemini SDKs directly. |
| Agent orchestration | LangGraph | Long-running agent team execution, retries, escalation routing, pause/resume, persisted execution state | Product UX should keep saying Agent Team, Role Agent, Validator Agent, Run Timeline. |
| Observability | Langfuse | Traces, observations, validation scores, prompt versions, token/cost/latency telemetry | Admin Portal should summarize this in business terms. |
| Domain data/actions | MCP-style Wati service APIs | Campaign, Commerce, and Support data access plus approved writeback | Domain services own source-of-truth data and final write actions. |

This is viable because the boundaries are clean:

- LiteLLM is a model gateway, not an agent orchestrator.
- LangGraph is the orchestration engine, not the user-facing product concept.
- Langfuse is the trace/eval/cost system, not the admin UX itself.
- AstraOS remains the business operating layer across agents, validators, runs, approvals, and outcomes.

## Runtime Interfaces

New runtime boundary interfaces live in:

```text
lib/agent-runtime/interfaces.ts
```

The important ports are:

- `ModelGatewayPort`: future LiteLLM adapter boundary.
- `AgentOrchestratorPort`: LangGraph adapter boundary.
- `ObservabilityPort`: Langfuse adapter boundary.
- `AgentModelPolicy`: agent-level model routing, fallback, prompt version, budget key, and routing tags.
- `ModelInvocationUsage`: normalized token, cost, and latency shape used by Admin Portal.

Campaign agents now carry a `gateway: "litellm"` and optional `modelPolicy` metadata in `lib/campaign-agents.ts`. The current execution path still uses mock output and persisted telemetry, so this is an interface-level migration rather than a runtime rewrite.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The active local demo often runs on:

```bash
npm run dev -- -p 3003
```

## Environment

Core local:

```bash
DATABASE_URL="file:./dev.db"
```

Optional LiteLLM gateway:

```bash
LITELLM_BASE_URL=""
LITELLM_API_KEY=""
LITELLM_DEFAULT_MODEL="gemini/gemini-2.5-flash-lite"
```

Optional Langfuse:

```bash
LANGFUSE_PUBLIC_KEY=""
LANGFUSE_SECRET_KEY=""
LANGFUSE_BASE_URL="https://cloud.langfuse.com"
```

Optional domain service adapter:

```bash
CAMPAIGN_SERVICE_BASE_URL=""
CAMPAIGN_SERVICE_API_KEY=""
```

If these are unset, the MVP stays runnable with Prisma-backed mock campaign data, mock LLM output, and mock trace IDs.

## MVP Notes

- SQLite is used for local development through Prisma.
- The focused MVP path is Campaign Launch Advisor for Wati tenants.
- Mock campaign data is seeded locally, but campaign context is accessed through a swappable service port in `lib/campaign-service`.
- LangGraph is wrapped behind AstraOS business concepts in `lib/campaign-agents.ts` and `lib/langgraph.ts`.
- Langfuse traces and observations are sent only when Langfuse environment variables are present; otherwise mock trace IDs are generated.
- E2B is intentionally outside the Campaign MVP path for now. The runtime policy uses `llm_only`, `api_tools`, and `human_assisted`.
- See `docs/campaign-mcp.md` for the MCP-style campaign service contract that an existing Wati campaign service can implement.
- See `docs/rivoli-domain-mcp-api-readiness.md` for the Domain Squad handoff contract across Campaign, Commerce, and Support.

## Handoff For The Next Engineer

Suggested implementation order:

1. Implement a LiteLLM adapter behind `ModelGatewayPort`.
2. Keep existing mock output as the fallback path for local demos.
3. Route Campaign agent model calls through the new model gateway adapter.
4. Map LiteLLM usage into `ModelInvocationUsage`.
5. Send normalized usage and validation scores into the Langfuse adapter.
6. Keep Admin Portal screens reading from persisted agent events, not directly from LiteLLM or Langfuse.

Do not expose LiteLLM, LangGraph, or Langfuse as primary user-facing concepts in the tenant UI. They are runtime infrastructure behind AstraOS.

## Useful Commands

```bash
npm run db:push
npm run db:seed
npm run build
npm run dev
```

