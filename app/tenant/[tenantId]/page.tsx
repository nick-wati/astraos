import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  MessageCircleReply,
  MousePointerClick,
  Send,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AgentExecutionRail } from "@/components/campaign/AgentExecutionRail";
import { ApproveRecommendationButton } from "@/components/campaign/ApproveRecommendationButton";
import { CampaignAdvisorButton } from "@/components/campaign/CampaignAdvisorButton";
import {
  CampaignResponseChart,
  CampaignRevenueChart
} from "@/components/campaign/CampaignCharts";
import { WatiSidebar } from "@/components/campaign/WatiSidebar";
import { WhatsAppPreview } from "@/components/campaign/WhatsAppPreview";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantCampaignDashboard } from "@/lib/campaign-queries";
import { compactNumber, formatCurrency, formatPercent, titleCase } from "@/lib/utils";

type CampaignLike = {
  delivered: number;
  replied: number;
  conversions: number;
  revenue: number;
  optOuts: number;
  sentAt: Date | null;
};

function summarize(campaigns: CampaignLike[]) {
  const delivered = campaigns.reduce((sum, campaign) => sum + campaign.delivered, 0);
  const replied = campaigns.reduce((sum, campaign) => sum + campaign.replied, 0);
  const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const revenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const optOuts = campaigns.reduce((sum, campaign) => sum + campaign.optOuts, 0);

  return {
    delivered,
    replied,
    conversions,
    revenue,
    optOuts,
    replyRate: delivered === 0 ? 0 : replied / delivered,
    conversionRate: delivered === 0 ? 0 : conversions / delivered,
    optOutRate: delivered === 0 ? 0 : optOuts / delivered,
    revenuePerDelivered: delivered === 0 ? 0 : revenue / delivered
  };
}

function delta(current: number, previous: number) {
  return current - previous;
}

function signedPercent(value: number, maximumFractionDigits = 1) {
  return `${value >= 0 ? "+" : ""}${formatPercent(value, maximumFractionDigits)}`;
}

function TrendItem({
  tone,
  title,
  value,
  detail,
  icon: Icon
}: {
  tone: "good" | "warning" | "info";
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  const classes = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    info: "border-sky-200 bg-sky-50 text-sky-950"
  };

  return (
    <div className={`rounded-lg border p-4 ${classes[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm opacity-75">{detail}</p>
    </div>
  );
}

function AttentionRow({
  tone,
  title,
  value,
  detail,
  action,
  icon: Icon
}: {
  tone: "good" | "warning" | "info";
  title: string;
  value: string;
  detail: string;
  action: string;
  icon: LucideIcon;
}) {
  const classes = {
    good: {
      shell: "border-emerald-200 bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-800",
      text: "text-emerald-950",
      value: "text-emerald-800"
    },
    warning: {
      shell: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-800",
      text: "text-amber-950",
      value: "text-amber-800"
    },
    info: {
      shell: "border-sky-200 bg-sky-50",
      icon: "bg-sky-100 text-sky-800",
      text: "text-sky-950",
      value: "text-sky-800"
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${classes[tone].shell}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 rounded-md p-2 ${classes[tone].icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className={`font-semibold ${classes[tone].text}`}>{title}</p>
            <span className={`text-sm font-semibold ${classes[tone].value}`}>{value}</span>
          </div>
          <p className={`mt-1 text-sm leading-6 ${classes[tone].text}/75`}>{detail}</p>
          <p className={`mt-3 text-sm font-medium ${classes[tone].text}`}>{action}</p>
        </div>
      </div>
    </div>
  );
}

export default async function TenantCampaignPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const dashboard = await getTenantCampaignDashboard(tenantId);
  const { tenant, tenants, metrics, chartData, latestAgentEvents } = dashboard;
  const latestRecommendation = tenant.recommendations[0];
  const sortedCampaigns = [...tenant.campaigns].sort(
    (a, b) => (b.sentAt?.getTime() ?? 0) - (a.sentAt?.getTime() ?? 0)
  );
  const recent = summarize(sortedCampaigns.slice(0, 3));
  const prior = summarize(sortedCampaigns.slice(3, 6));
  const replyDelta = delta(recent.replyRate, prior.replyRate);
  const conversionDelta = delta(recent.conversionRate, prior.conversionRate);
  const optOutDelta = delta(recent.optOutRate, prior.optOutRate);
  const isApproved = latestRecommendation?.status === "approved";
  const attentionQueue = [
    {
      tone: optOutDelta > 0 ? "warning" : "good",
      title: optOutDelta > 0 ? "Audience fatigue is rising" : "Audience fatigue is under control",
      value: signedPercent(optOutDelta, 2),
      detail:
        optOutDelta > 0
          ? "Recent campaigns produced more opt-outs than the prior window."
          : "Recent campaigns reduced opt-out pressure versus the prior window.",
      action:
        optOutDelta > 0
          ? "Narrow the cohort or refresh the recommendation before approval."
          : "Apply the 72-hour recent-touch suppression before approval.",
      icon: optOutDelta > 0 ? AlertTriangle : ShieldCheck
    },
    {
      tone: replyDelta < 0 ? "warning" : "good",
      title: replyDelta < 0 ? "Reply rate softened" : "Reply rate is improving",
      value: signedPercent(replyDelta, 1),
      detail:
        replyDelta < 0
          ? "The latest campaign window is replying less than the prior comparison set."
          : "The latest campaign window is replying above the prior comparison set.",
      action:
        replyDelta < 0
          ? "Use the recommended send window and keep the message short."
          : "Approve while recent engagement is still warm.",
      icon: replyDelta < 0 ? TrendingDown : TrendingUp
    },
    {
      tone: isApproved ? "good" : "info",
      title: isApproved ? "Draft is approved" : "Approval is the next step",
      value: isApproved ? "Ready" : "Pending",
      detail: latestRecommendation
        ? `${latestRecommendation.audienceEstimate.toLocaleString()} recipients will be handed to Wati campaign draft creation.`
        : "Generate a campaign recommendation before approval.",
      action: isApproved
        ? "Review the draft inside Wati before scheduling."
        : "Approve to create a campaign draft for final human review.",
      icon: isApproved ? CheckCircle2 : CalendarClock
    }
  ] as const;

  return (
    <div className="flex min-h-[calc(100vh-65px)] bg-[#f6f8f5]/70">
      <WatiSidebar />

      <main className="min-w-0 flex-1">
        <div className="border-b border-border bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Campaigns</span>
              <ChevronRight className="h-4 w-4" />
              <span>AstraOS Advisor</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">{tenant.name}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tenants.map((item) => (
                <Link key={item.id} href={`/tenant/${item.id}`}>
                  <Button variant={item.id === tenant.id ? "default" : "secondary"} size="sm">
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Action required</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                      Approve the recommended WhatsApp campaign
                    </h1>
                  </div>
                  {latestRecommendation ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <StatusBadge status={latestRecommendation.status} />
                      <ApproveRecommendationButton
                        recommendationId={latestRecommendation.id}
                        disabled={isApproved}
                        size="default"
                      />
                      <CampaignAdvisorButton
                        tenantId={tenant.id}
                        label="Refresh"
                        variant="secondary"
                        size="default"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              <CardContent className="p-5">
                {latestRecommendation ? (
                  <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                          {titleCase(latestRecommendation.objective)}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                          Risk {latestRecommendation.riskLevel}
                        </span>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-100">
                          {latestRecommendation.audienceEstimate.toLocaleString()} recipients
                        </span>
                      </div>

                      <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-slate-950">
                        {latestRecommendation.recommendedCohort}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {latestRecommendation.cohortReason}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-border bg-white p-4">
                          <p className="text-xs text-muted-foreground">Expected revenue</p>
                          <p className="mt-1 text-xl font-semibold">
                            {formatCurrency(latestRecommendation.expectedRevenue)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-white p-4">
                          <p className="text-xs text-muted-foreground">Expected reply</p>
                          <p className="mt-1 text-xl font-semibold">
                            {formatPercent(latestRecommendation.expectedReplyRate, 1)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-white p-4">
                          <p className="text-xs text-muted-foreground">Send time</p>
                          <p className="mt-1 text-sm font-semibold">
                            {latestRecommendation.recommendedSendTime.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
                          <div>
                            <p className="text-sm font-semibold text-amber-950">
                              Review before approving
                            </p>
                            <p className="mt-1 text-sm leading-6 text-amber-950/78">
                              {latestRecommendation.validatorFeedback}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
                            <CheckCircle2 className="h-4 w-4" />
                            Approved for draft creation
                          </span>
                        ) : (
                          <p className="text-sm font-medium text-emerald-800">
                            Approving creates a campaign draft for review in Wati.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Latest campaign health
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Reply trend</span>
                          <span
                            className={`text-sm font-semibold ${
                              replyDelta >= 0 ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {replyDelta >= 0 ? "+" : ""}
                            {formatPercent(replyDelta, 1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Conversion trend</span>
                          <span
                            className={`text-sm font-semibold ${
                              conversionDelta >= 0 ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {conversionDelta >= 0 ? "+" : ""}
                            {formatPercent(conversionDelta, 1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Opt-out pressure</span>
                          <span
                            className={`text-sm font-semibold ${
                              optOutDelta <= 0 ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {optOutDelta >= 0 ? "+" : ""}
                            {formatPercent(optOutDelta, 2)}
                          </span>
                        </div>
                        <div className="rounded-md bg-white p-3 text-sm text-muted-foreground ring-1 ring-border">
                          Latest data window: last {Math.min(3, sortedCampaigns.length)} campaigns vs
                          prior {Math.min(3, Math.max(0, sortedCampaigns.length - 3))}.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No recommendation yet. Generate the latest campaign plan first.
                    </p>
                    <div className="mt-4">
                      <CampaignAdvisorButton tenantId={tenant.id} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {latestRecommendation ? (
              <WhatsAppPreview
                tenantName={tenant.name}
                templateName={latestRecommendation.recommendedTemplate}
                body={latestRecommendation.templateBody}
                sendTime={latestRecommendation.recommendedSendTime}
                approved={isApproved}
              />
            ) : null}
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TrendItem
              icon={CircleDollarSign}
              title="Current opportunity"
              value={formatCurrency(latestRecommendation?.expectedRevenue ?? metrics.revenue)}
              detail="Projected value of the recommendation awaiting approval."
              tone="good"
            />
            <TrendItem
              icon={replyDelta >= 0 ? TrendingUp : TrendingDown}
              title="Reply trend"
              value={signedPercent(replyDelta, 1)}
              detail={`${metrics.replied.toLocaleString()} historical replies in campaign memory.`}
              tone={replyDelta >= 0 ? "good" : "warning"}
            />
            <TrendItem
              icon={optOutDelta > 0 ? AlertTriangle : ShieldCheck}
              title="Fatigue signal"
              value={signedPercent(optOutDelta, 2)}
              detail="Change in opt-out pressure across the latest campaigns."
              tone={optOutDelta > 0 ? "warning" : "good"}
            />
            <TrendItem
              icon={Users}
              title="Reachable audience"
              value={compactNumber(metrics.delivered)}
              detail={`${formatPercent(metrics.openRate)} open rate across usable campaign history.`}
              tone="info"
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle>Attention Queue</CardTitle>
                <CardDescription>Only the events and trends that affect this approval decision.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attentionQueue.map((item) => (
                    <AttentionRow key={item.title} {...item} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Performance Trends</CardTitle>
                <CardDescription>
                  What changed in recent Wati campaign data before this recommendation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignResponseChart data={chartData} />
              </CardContent>
            </Card>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>How AstraOS Reached This Recommendation</CardTitle>
                <CardDescription>
                  A compact audit view. Detailed token and LLM telemetry is in the Wati admin
                  portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentExecutionRail events={latestAgentEvents} showTelemetry={false} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Past Campaigns Used</CardTitle>
                <CardDescription>
                  The most recent campaign memory used by the advisor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={sortedCampaigns.slice(0, 6)}
                  columns={[
                    {
                      header: "Campaign",
                      cell: (campaign) => (
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.cohortName}</p>
                        </div>
                      )
                    },
                    {
                      header: "Reply",
                      cell: (campaign) => formatPercent(campaign.replied / campaign.delivered, 1)
                    },
                    {
                      header: "Conversion",
                      cell: (campaign) =>
                        formatPercent(campaign.conversions / campaign.delivered, 1)
                    },
                    {
                      header: "Revenue",
                      cell: (campaign) => formatCurrency(campaign.revenue)
                    }
                  ]}
                />
              </CardContent>
            </Card>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue History</CardTitle>
                <CardDescription>Kept below the approval view for deeper inspection.</CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignRevenueChart data={chartData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tenant Snapshot</CardTitle>
                <CardDescription>Latest usable campaign data for this tenant.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <Send className="h-4 w-4 text-emerald-700" />
                    <p className="mt-3 text-2xl font-semibold">{metrics.campaigns}</p>
                    <p className="text-sm text-muted-foreground">Campaigns analyzed</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <MessageCircleReply className="h-4 w-4 text-violet-700" />
                    <p className="mt-3 text-2xl font-semibold">
                      {formatPercent(metrics.replyRate, 1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Historical reply rate</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <MousePointerClick className="h-4 w-4 text-sky-700" />
                    <p className="mt-3 text-2xl font-semibold">
                      {formatPercent(metrics.conversionRate, 1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Historical conversion rate</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <CircleDollarSign className="h-4 w-4 text-amber-700" />
                    <p className="mt-3 text-2xl font-semibold">
                      {formatCurrency(metrics.costPerConversion)}
                    </p>
                    <p className="text-sm text-muted-foreground">Cost per conversion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
