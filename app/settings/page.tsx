import { BrainCircuit, Database, ListChecks, ReceiptText, ShieldCheck } from "lucide-react";
import { MODEL_PRICING } from "@/lib/pricing";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { titleCase } from "@/lib/utils";

export default function SettingsPage() {
  const settings = [
    {
      name: "Default execution plane",
      value: "GCP Cloud Run worker",
      status: "active"
    },
    {
      name: "Agent orchestration",
      value: "LangGraph adapter with local fallback",
      status: "active"
    },
    {
      name: "Observability",
      value: process.env.LANGFUSE_PUBLIC_KEY ? "Langfuse live traces" : "Mock Langfuse trace IDs",
      status: process.env.LANGFUSE_PUBLIC_KEY ? "active" : "warning"
    },
    {
      name: "Sandbox runtime",
      value: "Disabled for this MVP path",
      status: "paused"
    }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold text-teal-700">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">AstraOS MVP Runtime Policy</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Campaign Launch Advisor uses hosted workers and model routing first. E2B is intentionally
          out of this MVP path until a campaign step truly needs sandboxed code execution.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settings.map((setting) => (
          <Card key={setting.name} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{setting.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{setting.value}</p>
              </div>
              <StatusBadge status={setting.status} />
            </div>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Runtime Routing</CardTitle>
            <CardDescription>How this MVP runs agents without E2B.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg bg-teal-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-teal-800">
                  <BrainCircuit className="h-4 w-4" />
                  llm_only
                </div>
                <p className="mt-2 text-sm text-teal-950/75">
                  Runs inside the shared AstraOS worker, calls Vertex/OpenAI-compatible providers,
                  and persists agent events.
                </p>
              </div>
              <div className="rounded-lg bg-sky-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-sky-800">
                  <ListChecks className="h-4 w-4" />
                  api_tools
                </div>
                <p className="mt-2 text-sm text-sky-950/75">
                  Runs trusted API integrations for Wati campaign history, contact cohorts, and
                  operating metrics.
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <ShieldCheck className="h-4 w-4" />
                  human_assisted
                </div>
                <p className="mt-2 text-sm text-amber-950/75">
                  Reserved for approval gates when a campaign has policy, opt-out, or brand risk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Model Pricing Config</CardTitle>
            <CardDescription>
              Used by the admin portal to calculate estimated cost per agent event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={MODEL_PRICING}
              columns={[
                {
                  header: "Provider",
                  cell: (row) => titleCase(row.provider)
                },
                {
                  header: "Model",
                  cell: (row) => row.model
                },
                {
                  header: "Input / 1K",
                  cell: (row) => `$${row.inputCostPer1KTokens.toFixed(6)}`
                },
                {
                  header: "Output / 1K",
                  cell: (row) => `$${row.outputCostPer1KTokens.toFixed(6)}`
                }
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Backend Support in This MVP</CardTitle>
            <CardDescription>
              The frontend is backed by actual persisted runs, agent events, trace IDs, model
              choices, token accounting, and cost calculations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-stone-50 p-4">
                <Database className="h-5 w-5 text-teal-700" />
                <h3 className="mt-3 font-semibold">Prisma + SQLite MVP</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tenants, campaigns, recommendations, runs, and agent observations are stored
                  locally.
                </p>
              </div>
              <div className="rounded-lg bg-stone-50 p-4">
                <ListChecks className="h-5 w-5 text-teal-700" />
                <h3 className="mt-3 font-semibold">LangGraph adapter</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Campaign agents execute through an orchestration adapter with a local fallback
                  for MVP reliability.
                </p>
              </div>
              <div className="rounded-lg bg-stone-50 p-4">
                <ReceiptText className="h-5 w-5 text-teal-700" />
                <h3 className="mt-3 font-semibold">Langfuse wrapper</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Live traces are used when credentials exist; otherwise AstraOS creates mock trace
                  and observation IDs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
