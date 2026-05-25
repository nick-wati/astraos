# AstraOS

AstraOS is Wati's AI-native operating system for converting business SOPs into supervised AI agent teams.

It runs business SOPs through Role Agents and Validator Agents with retry policies, escalation paths, human review, execution history, token/cost monitoring, and business outcome reporting.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## MVP Notes

- SQLite is used for local development through Prisma.
- The focused MVP path is Campaign Launch Advisor for Wati tenants.
- Mock campaign data is seeded locally, but campaign context is accessed through a swappable service port in `lib/campaign-service`.
- LangGraph is wrapped behind AstraOS business concepts in `lib/campaign-agents.ts` and `lib/langgraph.ts`.
- Langfuse traces and observations are sent only when Langfuse environment variables are present; otherwise mock trace IDs are generated.
- E2B is intentionally outside the Campaign MVP path for now. The runtime policy uses `llm_only`, `api_tools`, and `human_assisted`.
- See `docs/campaign-mcp.md` for the MCP-style campaign service contract that an existing Wati campaign service can implement.
- See `docs/rivoli-domain-mcp-api-readiness.md` for the Domain Squad handoff contract across Campaign, Commerce, and Support.

## Useful Commands

```bash
npm run db:push
npm run db:seed
npm run dev
```
