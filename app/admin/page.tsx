import Link from "next/link";
import {
  AlertTriangle,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  Gauge,
  Headphones,
  Layers3,
  Languages,
  Megaphone,
  PlugZap,
  ReceiptText,
  ShoppingBag,
  Target,
  TrendingUp
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TenantPlan } from "@prisma/client";
import { AdminFilters } from "@/components/campaign/AdminFilters";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  agentDomainCatalog,
  campaignMcpInterfaceGroups,
  domainAgentOperatingRows,
  domainMcpReadinessRows
} from "@/lib/agent-domains";
import { getAdminCampaignObservability } from "@/lib/campaign-queries";
import { cn, formatCurrency, formatMs, formatPercent, titleCase } from "@/lib/utils";

type AdminView = "configuration" | "consumption" | "performance" | "value";
type AdminLanguage = "zh" | "en";

const managerViews: Record<AdminLanguage, Array<{
  id: AdminView;
  label: string;
  description: string;
}>> = {
  zh: [
    {
      id: "configuration",
      label: "配置",
      description: "上线范围和接口"
    },
    {
      id: "consumption",
      label: "消耗",
      description: "预算、成本、路由"
    },
    {
      id: "performance",
      label: "表现",
      description: "质量、延迟、异常"
    },
    {
      id: "value",
      label: "价值",
      description: "收入、转化、回报"
    }
  ],
  en: [
    {
      id: "configuration",
      label: "Configuration",
      description: "Rollout and interfaces"
    },
    {
      id: "consumption",
      label: "Consumption",
      description: "Budget, cost, routing"
    },
    {
      id: "performance",
      label: "Performance",
      description: "Quality, latency, incidents"
    },
    {
      id: "value",
      label: "Value",
      description: "Revenue, conversion, ROI"
    }
  ]
};

const adminCopy = {
  zh: {
    eyebrow: "Wati 智能体运营台",
    title: "智能体团队运营",
    description:
      "像管理一支团队一样管理智能体：配置上线范围，观察运行表现，并证明它们为各租户创造的业务价值。",
    language: "界面语言",
    chinese: "中文",
    english: "English",
    metrics: {
      agentArchetypes: "智能体类型",
      agentArchetypesHelper: "可复用，并服务多个 Wati 租户",
      tenantsInScope: "当前租户范围",
      tenantsInScopeHelper: (count: number) => `${count} 个租户已有智能体运行数据`,
      criticalCapabilities: "关键服务能力",
      criticalCapabilitiesHelper: (interfaces: number, groups: number) =>
        `已登记 ${interfaces} 个服务接口；营销场景包含 ${groups} 组接口契约`,
      deployments: "租户智能体部署",
      deploymentsHelper: (readiness: string) => `平均服务接口就绪度 ${readiness}`
    },
    configuration: {
      domainTitle: "业务智能体领域",
      domainDescription:
        "按业务领域管理智能体，不按底层流程图管理。每个领域都包含角色智能体、校验智能体、可用服务接口、上线风险和下一步接入动作。",
      readinessTitle: "服务接口就绪清单",
      readinessDescription:
        "这里不是运行队列，而是智能体上线前必须具备的 Wati 服务能力清单。接入完成表示智能体可以读取或写入真实业务系统；仍在模拟或缺失时，只能建议、人审或小范围试点。",
      readinessMeaning:
        "判断标准：接入完成可用于生产，模拟接入只适合演示和灰度，缺失能力会限制智能体自动执行。",
      matrixTitle: "智能体上线矩阵",
      matrixDescription:
        "用同一张表判断每类智能体是否适合扩租户、是否需要补接口、以及下一步由谁推动。",
      table: {
        domainAgent: "领域 / 智能体",
        status: "状态",
        tiers: "适用套餐",
        tenants: "租户数",
        model: "主模型",
        readiness: "接口就绪度",
        nextAction: "下一步"
      }
    }
  },
  en: {
    eyebrow: "Wati Agent Portal",
    title: "Agent Fleet Operations",
    description:
      "Manage agents like a fleet: configure them, watch their operating performance, and prove the business value they create across tenants.",
    language: "Language",
    chinese: "中文",
    english: "English",
    metrics: {
      agentArchetypes: "Agent archetypes",
      agentArchetypesHelper: "Reusable agents shared across Wati tenants",
      tenantsInScope: "Tenants in scope",
      tenantsInScopeHelper: (count: number) => `${count} tenants have agent telemetry`,
      criticalCapabilities: "Critical service capabilities",
      criticalCapabilitiesHelper: (interfaces: number, groups: number) =>
        `${interfaces} service interfaces cataloged; ${groups} campaign contract groups`,
      deployments: "Tenant-agent deployments",
      deploymentsHelper: (readiness: string) => `${readiness} average service readiness by archetype`
    },
    configuration: {
      domainTitle: "Business Agent Domains",
      domainDescription:
        "Manage agents by business domain, not by low-level process diagrams. Each domain contains role agents, validator agents, service interfaces, rollout risk, and next integration actions.",
      readinessTitle: "Service Interface Readiness",
      readinessDescription:
        "This is not a runtime queue. It is the list of Wati service capabilities an agent needs before it can safely operate at scale.",
      readinessMeaning:
        "Connected capabilities are production-ready, mocked capabilities are safe for demos or rollout tests, and missing capabilities block autonomous execution.",
      matrixTitle: "Agent Rollout Matrix",
      matrixDescription:
        "Use this table to decide which agents can expand across tenants, which interfaces are missing, and who owns the next action.",
      table: {
        domainAgent: "Domain / Agent",
        status: "Status",
        tiers: "Tiers",
        tenants: "Tenants",
        model: "Primary model",
        readiness: "Service readiness",
        nextAction: "Next action"
      }
    }
  }
};

function OpsInsightRow({
  tone,
  icon: Icon,
  label,
  title,
  detail,
  metric
}: {
  tone: "good" | "warning" | "info";
  icon: LucideIcon;
  label: string;
  title: string;
  detail: string;
  metric: string;
}) {
  const classes = {
    good: {
      shell: "border-emerald-200 bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-800",
      label: "text-emerald-800",
      title: "text-emerald-950"
    },
    warning: {
      shell: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-800",
      label: "text-amber-800",
      title: "text-amber-950"
    },
    info: {
      shell: "border-sky-200 bg-sky-50",
      icon: "bg-sky-100 text-sky-800",
      label: "text-sky-800",
      title: "text-sky-950"
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${classes[tone].shell}`}>
      <div className="flex items-start gap-3">
        <span className={`rounded-md p-2 ${classes[tone].icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${classes[tone].label}`}>
                {label}
              </p>
              <p className={`mt-1 font-semibold ${classes[tone].title}`}>{title}</p>
            </div>
            <span className={`text-sm font-semibold ${classes[tone].label}`}>{metric}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

const domainDisplay: Record<AdminLanguage, Record<(typeof agentDomainCatalog)[number]["id"], {
  name: string;
  owner: string;
  purpose: string;
  agents: string[];
  interfaces: string[];
  outcome: string;
  risk: string;
  nextAction: string;
}>> = {
  zh: {
    campaign: {
      name: "营销活动",
      owner: "营销自动化团队",
      purpose: "根据历史活动表现，建议下一次 WhatsApp 群发的受众、模板、发送时间和审批动作。",
      agents: ["活动表现分析员", "受众策略智能体", "模板策略智能体", "发送时间优化器", "活动合规校验员"],
      interfaces: ["读取历史活动和成效", "评估候选受众", "校验模板和抑制规则", "创建待审批活动草稿"],
      outcome: "产出可审批的活动草稿，并预估收入、回复率和转化提升。",
      risk: "受众疲劳、模板质量、退订压力、单位成效成本。",
      nextAction: "优先接入生产活动历史、受众分组、模板库和草稿创建能力。"
    },
    commerce: {
      name: "电商转化",
      owner: "收入运营团队",
      purpose: "围绕购物车、商品、订单和库存，推荐安全的转化动作和 WhatsApp 消息。",
      agents: ["购物车挽回智能体", "商品推荐智能体", "订单时刻智能体", "优惠策略智能体", "电商政策校验员"],
      interfaces: ["读取购物车和浏览事件", "读取商品与库存", "读取客户分群", "创建优惠和消息草稿"],
      outcome: "提升挽回收入和复购率，同时减少不安全优惠。",
      risk: "库存不准、价格不准、折扣泄漏、订单隐私。",
      nextAction: "接入购物车事件、商品目录、库存和客户分群上下文。"
    },
    support: {
      name: "客户支持",
      owner: "客户运营团队",
      purpose: "识别客户问题，检索知识库，起草回复，并把高风险会话升级给人工团队。",
      agents: ["工单接收智能体", "意图分类智能体", "知识检索智能体", "解决方案智能体", "升级校验员"],
      interfaces: ["读取会话线程", "搜索知识库", "读取政策规则和服务级别", "创建回复草稿并升级会话"],
      outcome: "缩短解决时间，并把高风险问题控制在人工审批内。",
      risk: "错误回答、政策违规、超时未处理、语气不当。",
      nextAction: "接入会话、客户资料、知识库、政策规则和升级通道。"
    }
  },
  en: {
    campaign: {
      name: "Campaign",
      owner: "Marketing automation",
      purpose: "Recommend the next WhatsApp campaign audience, template, send time, and approval action from historical performance.",
      agents: [
        "Campaign Performance Analyst",
        "Cohort Strategy Agent",
        "Template Strategy Agent",
        "Send Time Optimizer",
        "Campaign Compliance Validator"
      ],
      interfaces: [
        "Read campaign history and outcomes",
        "Evaluate audience candidates",
        "Validate templates and suppression rules",
        "Create approval-ready campaign drafts"
      ],
      outcome: "Approval-ready campaign drafts with expected revenue, reply-rate lift, and conversion lift.",
      risk: "Audience fatigue, template quality, opt-out pressure, and cost per outcome.",
      nextAction: "Connect production campaign history, cohorts, templates, and draft creation."
    },
    commerce: {
      name: "Commerce",
      owner: "Revenue operations",
      purpose: "Recommend safe conversion actions and WhatsApp messages from cart, product, order, and inventory signals.",
      agents: [
        "Cart Recovery Agent",
        "Product Recommendation Agent",
        "Order Moment Agent",
        "Offer Strategy Agent",
        "Commerce Policy Validator"
      ],
      interfaces: [
        "Read cart and browse events",
        "Read catalog and inventory",
        "Read customer segments",
        "Create offers and message drafts"
      ],
      outcome: "Recovered revenue, higher repeat purchase rate, and fewer unsafe offers.",
      risk: "Inventory mismatch, price mismatch, discount leakage, and order privacy.",
      nextAction: "Expose cart events, catalog, inventory, and customer segment context."
    },
    support: {
      name: "Support",
      owner: "Customer operations",
      purpose: "Classify customer issues, retrieve knowledge, draft replies, and escalate risky conversations.",
      agents: [
        "Ticket Intake Agent",
        "Intent Classification Agent",
        "Knowledge Retrieval Agent",
        "Resolution Agent",
        "Escalation Validator"
      ],
      interfaces: [
        "Read conversation threads",
        "Search knowledge base",
        "Read policy rules and SLA state",
        "Create reply drafts and escalations"
      ],
      outcome: "Faster support resolution with controlled human escalation.",
      risk: "Wrong answer, policy breach, SLA miss, and poor customer tone.",
      nextAction: "Expose conversation, customer, KB, policy, SLA, and escalation primitives."
    }
  }
};

function DomainCard({
  domain,
  language
}: {
  domain: (typeof agentDomainCatalog)[number];
  language: AdminLanguage;
}) {
  const iconMap = {
    campaign: Megaphone,
    commerce: ShoppingBag,
    support: Headphones
  };
  const Icon = iconMap[domain.id];
  const display = domainDisplay[language][domain.id];
  const statusLabel = language === "zh"
    ? {
        active_mvp: "试点运行",
        next: "下一批",
        planned: "规划中"
      }[domain.status]
    : {
        active_mvp: "Active MVP",
        next: "Next",
        planned: "Planned"
      }[domain.status];

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">{display.name}</p>
            <p className="text-xs text-muted-foreground">{display.owner}</p>
          </div>
        </div>
        <StatusBadge status={domain.status} label={statusLabel} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{display.purpose}</p>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span className="rounded-md bg-slate-50 px-2 py-1">
          {language === "zh"
            ? `${domain.agentArchetypes.length} 类智能体`
            : `${domain.agentArchetypes.length} agent archetypes`}
        </span>
        <span className="rounded-md bg-slate-50 px-2 py-1">
          {language === "zh"
            ? `${domain.mcpTools.length} 个服务接口`
            : `${domain.mcpTools.length} service interfaces`}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {language === "zh" ? "智能体组成" : "Agent team"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {display.agents.map((agent) => (
              <span key={agent} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 ring-1 ring-emerald-100">
                {agent}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {language === "zh" ? "需要接入的服务能力" : "Required service capabilities"}
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {display.interfaces.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
        <span className="font-medium">{language === "zh" ? "业务产出：" : "Outcome: "}</span>
        {display.outcome}
      </div>
      <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
        <span className="font-medium">{language === "zh" ? "主要风险：" : "Risk: "}</span>
        {display.risk}
      </div>
      <p className="mt-3 text-sm font-medium text-emerald-800">{display.nextAction}</p>
    </div>
  );
}

function parseTenantPlan(value?: string): TenantPlan | undefined {
  if (value === "starter" || value === "growth" || value === "enterprise") {
    return value;
  }
  return undefined;
}

function labelStatus(status: string, language: AdminLanguage) {
  if (language === "en") return undefined;
  const labels: Record<string, string> = {
    live: "运行中",
    mocked: "模拟接入",
    planned: "规划中",
    connected: "已接入",
    missing: "缺失",
    p0: "最高优先级",
    p1: "高优先级",
    p2: "中优先级"
  };
  return labels[status];
}

function labelDomain(name: string, language: AdminLanguage) {
  if (language === "en") return name;
  return {
    Campaign: "营销活动",
    Commerce: "电商转化",
    Support: "客户支持"
  }[name] ?? name;
}

function labelAgent(name: string, language: AdminLanguage) {
  if (language === "en") return name;
  const labels: Record<string, string> = {
    "Campaign Performance Analyst": "活动表现分析员",
    "Cohort Strategy Agent": "受众策略智能体",
    "Template Strategy Agent": "模板策略智能体",
    "Send Time Optimizer": "发送时间优化器",
    "Campaign Compliance Validator": "活动合规校验员",
    "Cart Recovery Agent": "购物车挽回智能体",
    "Product Recommendation Agent": "商品推荐智能体",
    "Order Moment Agent": "订单时刻智能体",
    "Offer Strategy Agent": "优惠策略智能体",
    "Commerce Policy Validator": "电商政策校验员",
    "Ticket Intake Agent": "工单接收智能体",
    "Intent Classification Agent": "意图分类智能体",
    "Knowledge Retrieval Agent": "知识检索智能体",
    "Resolution Agent": "解决方案智能体",
    "Escalation Validator": "升级校验员"
  };
  return labels[name] ?? name;
}

function labelAgentRole(role: string, language: AdminLanguage) {
  if (language === "en") return titleCase(role);
  const labels: Record<string, string> = {
    performance_analyst: "表现分析",
    cohort_strategist: "受众策略",
    template_strategist: "模板策略",
    send_time_optimizer: "发送时间优化",
    compliance_validator: "合规校验"
  };
  return labels[role] ?? titleCase(role);
}

function labelTiers(value: string, language: AdminLanguage) {
  if (language === "en") return value;
  return value
    .replace("All tiers", "全部套餐")
    .replace("Growth", "成长版")
    .replace("Enterprise", "企业版")
    .replace("Starter", "入门版");
}

function labelNextAction(agentName: string, fallback: string, language: AdminLanguage) {
  if (language === "en") return fallback;
  const labels: Record<string, string> = {
    "Campaign Performance Analyst": "接入生产活动分析和成效归因。",
    "Campaign Compliance Validator": "在创建草稿前补齐联系人级资格检查。",
    "Cart Recovery Agent": "接入购物车事件、商品目录、库存和消息草稿回写。",
    "Commerce Policy Validator": "定义优惠约束、毛利区间和库存安全校验。",
    "Resolution Agent": "接入会话线程、知识库搜索、政策规则和回复草稿。",
    "Escalation Validator": "接入服务级别状态和会话升级通道。"
  };
  return labels[agentName] ?? fallback;
}

function labelCostAction(
  row: {
    avgValidationScore: number;
    modelCount: number;
  },
  language: AdminLanguage
) {
  if (row.avgValidationScore < 0.84) {
    return language === "zh" ? "先修质量，再降成本" : "Fix quality before cost cuts";
  }
  if (row.avgValidationScore >= 0.9) {
    return language === "zh" ? "测试更便宜模型路由" : "Test cheaper model routing";
  }
  if (row.modelCount > 1) {
    return language === "zh" ? "统一模型路由策略" : "Standardize model routing";
  }
  return language === "zh" ? "保持，观察预算" : "Keep, watch budget";
}

function labelBudgetStatus(usage: number, language: AdminLanguage) {
  if (usage >= 1) return language === "zh" ? "限制扩量" : "Limit rollout";
  if (usage >= 0.75) return language === "zh" ? "需要关注" : "Watch";
  return language === "zh" ? "安全" : "Healthy";
}

function labelReadinessCapability(capability: string, language: AdminLanguage) {
  if (language === "en") return capability;
  const labels: Record<string, string> = {
    "Campaign planning context": "营销活动规划上下文",
    "Approved campaign draft": "已审批活动草稿",
    "Cart and catalog context": "购物车与商品目录上下文",
    "Commerce-safe message draft": "电商安全消息草稿",
    "Conversation and KB context": "会话与知识库上下文",
    "Reply draft and escalation": "回复草稿与人工升级"
  };
  return labels[capability] ?? capability;
}

function labelOwner(owner: string, language: AdminLanguage) {
  if (language === "en") return owner;
  const labels: Record<string, string> = {
    "Campaign service": "营销活动服务",
    "Commerce / Campaign service": "电商服务 / 营销活动服务",
    "Inbox / Knowledge service": "收件箱服务 / 知识库服务",
    "Inbox service": "收件箱服务"
  };
  return labels[owner] ?? owner;
}

function parseAdminView(value?: string): AdminView {
  if (value === "consumption" || value === "performance" || value === "value") return value;
  return "configuration";
}

function parseLanguage(value?: string): AdminLanguage {
  return value === "en" ? "en" : "zh";
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseParamArray(value?: string | string[]) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function parseDateParam(value?: string | string[]) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function viewHref({
  view,
  plan,
  tenantIds,
  dateFrom,
  dateTo,
  language
}: {
  view: AdminView;
  plan?: TenantPlan;
  tenantIds: string[];
  dateFrom: string;
  dateTo: string;
  language: AdminLanguage;
}) {
  const params = new URLSearchParams({ view, dateFrom, dateTo, lang: language });
  if (plan) params.set("plan", plan);
  for (const tenantId of tenantIds) {
    params.append("tenantId", tenantId);
  }
  return `/admin?${params.toString()}`;
}

function ManagerViewTabs({
  activeView,
  plan,
  tenantIds,
  dateFrom,
  dateTo,
  language
}: {
  activeView: AdminView;
  plan?: TenantPlan;
  tenantIds: string[];
  dateFrom: string;
  dateTo: string;
  language: AdminLanguage;
}) {
  return (
    <nav className="grid gap-1 rounded-lg border border-border bg-white p-1 shadow-sm md:grid-cols-4">
      {managerViews[language].map((view) => (
        <Link
          key={view.id}
          href={viewHref({ view: view.id, plan, tenantIds, dateFrom, dateTo, language })}
          className={cn(
            "min-w-0 rounded-md px-3 py-3 transition hover:bg-emerald-50",
            activeView === view.id
              ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500"
              : "text-foreground"
          )}
        >
          <p className="text-sm font-semibold">{view.label}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{view.description}</p>
        </Link>
      ))}
    </nav>
  );
}

function LanguageSwitch({
  activeLanguage,
  activeView,
  plan,
  tenantIds,
  dateFrom,
  dateTo
}: {
  activeLanguage: AdminLanguage;
  activeView: AdminView;
  plan?: TenantPlan;
  tenantIds: string[];
  dateFrom: string;
  dateTo: string;
}) {
  const copy = adminCopy[activeLanguage];
  const activeLabel = activeLanguage === "zh" ? copy.chinese : copy.english;

  return (
    <details className="group relative">
      <summary
        aria-label={copy.language}
        className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
      >
        <Languages className="h-4 w-4 text-emerald-800" />
        <span>{activeLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-36 rounded-lg border border-border bg-white p-1 text-sm shadow-xl">
        {(["zh", "en"] as AdminLanguage[]).map((language) => {
          const label = language === "zh" ? copy.chinese : copy.english;
          return (
            <Link
              key={language}
              href={viewHref({
                view: activeView,
                plan,
                tenantIds,
                dateFrom,
                dateTo,
                language
              })}
              className={cn(
                "block rounded-md px-3 py-2 transition",
                activeLanguage === language
                  ? "bg-emerald-50 font-semibold text-emerald-950"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{
    tenantId?: string | string[];
    tenant?: string | string[];
    plan?: string | string[];
    days?: string | string[];
    dateFrom?: string | string[];
    dateTo?: string | string[];
    lang?: string | string[];
    view?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const days = Number(firstParam(params.days) ?? 30);
  const selectedPlan = parseTenantPlan(firstParam(params.plan));
  const activeView = parseAdminView(firstParam(params.view));
  const activeLanguage = parseLanguage(firstParam(params.lang));
  const selectedTenantIds = parseParamArray(params.tenantId);
  const selectedDateFrom = parseDateParam(params.dateFrom);
  const selectedDateTo = parseDateParam(params.dateTo);
  const data = await getAdminCampaignObservability({
    tenantIds: selectedTenantIds,
    tenant: firstParam(params.tenant),
    plan: selectedPlan,
    days: Number.isFinite(days) ? days : 30,
    dateFrom: selectedDateFrom,
    dateTo: selectedDateTo
  });
  const filterDateFrom = formatDateParam(data.filters.dateFrom);
  const filterDateTo = formatDateParam(data.filters.dateTo);
  const copy = adminCopy[activeLanguage];

  const agentCostRows = [...data.agentFleetRows].sort((a, b) => b.totalCost - a.totalCost);
  const agentPerformanceRows = [...data.agentFleetRows].sort(
    (a, b) => a.avgValidationScore - b.avgValidationScore || b.avgLatencyMs - a.avgLatencyMs
  );
  const tierPerformanceRows = [...data.tierRows].sort(
    (a, b) => a.avgValidationScore - b.avgValidationScore || b.avgLatencyMs - a.avgLatencyMs
  );
  const highestCostAgent = agentCostRows[0];
  const weakestTier = tierPerformanceRows[0];
  const lowestValidationAgent = [...data.agentFleetRows].sort(
    (a, b) => a.avgValidationScore - b.avgValidationScore
  )[0];
  const slowestAgent = [...data.agentFleetRows].sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)[0];
  const primaryModel = [...data.modelData].sort((a, b) => b.tokens - a.tokens)[0];
  const totalInputTokens = data.agentRows.reduce((sum, row) => sum + row.inputTokens, 0);
  const totalOutputTokens = data.agentRows.reduce((sum, row) => sum + row.outputTokens, 0);
  const tokenTotal = Math.max(1, totalInputTokens + totalOutputTokens);
  const primaryModelShare =
    data.summary.totalTokens === 0 || !primaryModel
      ? 0
      : primaryModel.tokens / data.summary.totalTokens;
  const totalMcpInterfaces = agentDomainCatalog.reduce(
    (sum, domain) => sum + domain.mcpTools.length,
    0
  );
  const configuredMcpInterfaces = domainMcpReadinessRows.filter(
    (row) => row.readiness === "connected" || row.readiness === "mocked"
  ).length;
  const averageMcpReadiness =
    domainAgentOperatingRows.reduce((sum, row) => sum + row.mcpReadiness, 0) /
    Math.max(1, domainAgentOperatingRows.length);
  const costPerAgentObservation =
    data.summary.agentEvents === 0 ? 0 : data.summary.totalCost / data.summary.agentEvents;
  const costBudgetUsage = data.summary.costBudgetUsage;
  const tokenBudgetUsage = data.summary.tokenBudgetUsage;
  const costBudgetStatus = labelBudgetStatus(costBudgetUsage, activeLanguage);
  const costBudgetTone = costBudgetUsage >= 1 ? "red" : costBudgetUsage >= 0.75 ? "amber" : "teal";
  const tokenBudgetTone = tokenBudgetUsage >= 1 ? "red" : tokenBudgetUsage >= 0.75 ? "amber" : "blue";
  const modelConcentrationTone = primaryModelShare >= 0.7 ? "amber" : "blue";
  const insightBudgetTone = costBudgetUsage >= 0.75 ? "warning" : "good";
  const insightModelTone = primaryModelShare >= 0.7 ? "warning" : "info";
  const valueTierRows = [...data.valueTenantRows.reduce((grouped, row) => {
    const bucket = grouped.get(row.tenantPlan) ?? {
      plan: row.tenantPlan,
      tenantCount: 0,
      actualRevenue: 0,
      expectedRevenue: 0,
      conversions: 0,
      approvedRecommendations: 0,
      llmCost: 0
    };
    bucket.tenantCount += 1;
    bucket.actualRevenue += row.actualRevenue;
    bucket.expectedRevenue += row.expectedRevenue;
    bucket.conversions += row.conversions;
    bucket.approvedRecommendations += row.approvedRecommendations;
    bucket.llmCost += row.llmCost;
    grouped.set(row.tenantPlan, bucket);
    return grouped;
  }, new Map<TenantPlan, {
    plan: TenantPlan;
    tenantCount: number;
    actualRevenue: number;
    expectedRevenue: number;
    conversions: number;
    approvedRecommendations: number;
    llmCost: number;
  }>()).values()].sort((a, b) => b.actualRevenue - a.actualRevenue);
  const bestValueTier = valueTierRows[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative">
        <div className="max-w-3xl pr-24 sm:pr-32">
          <p className="text-sm font-semibold text-teal-700">{copy.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {copy.description}
          </p>
        </div>
        <div className="absolute right-0 top-0">
          <LanguageSwitch
            activeLanguage={activeLanguage}
            activeView={activeView}
            plan={data.filters.plan}
            tenantIds={data.filters.tenantIds}
            dateFrom={filterDateFrom}
            dateTo={filterDateTo}
          />
        </div>
      </div>

      <section className="mt-6">
        <ManagerViewTabs
          activeView={activeView}
          plan={data.filters.plan}
          tenantIds={data.filters.tenantIds}
          dateFrom={filterDateFrom}
          dateTo={filterDateTo}
          language={activeLanguage}
        />
      </section>

      <section className="mt-4">
        <AdminFilters
          selectedPlan={data.filters.plan}
          tenants={data.tenants}
          selectedTenantIds={data.filters.tenantIds}
          dateFrom={filterDateFrom}
          dateTo={filterDateTo}
          view={activeView}
          language={activeLanguage}
        />
      </section>

      {activeView === "configuration" ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title={copy.metrics.agentArchetypes}
              value={data.summary.agentArchetypes}
              helper={copy.metrics.agentArchetypesHelper}
              icon={Layers3}
            />
            <MetricCard
              title={copy.metrics.tenantsInScope}
              value={data.summary.scopedTenantCount.toLocaleString()}
              helper={copy.metrics.tenantsInScopeHelper(data.summary.observedTenantCount)}
              icon={Building2}
              tone="blue"
            />
            <MetricCard
              title={copy.metrics.criticalCapabilities}
              value={`${configuredMcpInterfaces}/${domainMcpReadinessRows.length}`}
              helper={copy.metrics.criticalCapabilitiesHelper(
                totalMcpInterfaces,
                campaignMcpInterfaceGroups.length
              )}
              icon={PlugZap}
              tone="amber"
            />
            <MetricCard
              title={copy.metrics.deployments}
              value={data.summary.tenantAgentDeployments.toLocaleString()}
              helper={copy.metrics.deploymentsHelper(formatPercent(averageMcpReadiness, 0))}
              icon={Gauge}
              tone="violet"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>{copy.configuration.domainTitle}</CardTitle>
                <CardDescription>
                  {copy.configuration.domainDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-3">
                  {agentDomainCatalog.map((domain) => (
                    <DomainCard key={domain.id} domain={domain} language={activeLanguage} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{copy.configuration.readinessTitle}</CardTitle>
                <CardDescription>
                  {copy.configuration.readinessDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
                  {copy.configuration.readinessMeaning}
                </div>
                <div className="space-y-3">
                  {domainMcpReadinessRows.map((row) => (
                    <div
                      key={`${row.domain}-${row.capability}`}
                      className="rounded-lg border border-border bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {labelReadinessCapability(row.capability, activeLanguage)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {labelDomain(row.domain, activeLanguage)} /{" "}
                            {labelOwner(row.owner, activeLanguage)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <StatusBadge
                            status={row.readiness}
                            label={labelStatus(row.readiness, activeLanguage)}
                          />
                          <StatusBadge
                            status={row.priority}
                            label={labelStatus(row.priority, activeLanguage) ?? row.priority.toUpperCase()}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {row.tools.map((tool) => (
                          <span
                            key={tool}
                            className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-border"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{copy.configuration.matrixTitle}</CardTitle>
                <CardDescription>
                  {copy.configuration.matrixDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={domainAgentOperatingRows}
                  columns={[
                    {
                      header: copy.configuration.table.domainAgent,
                      cell: (row) => (
                        <div>
                          <p className="font-medium">{labelAgent(row.agentName, activeLanguage)}</p>
                          <p className="text-xs text-muted-foreground">
                            {labelDomain(row.domain, activeLanguage)}
                          </p>
                        </div>
                      )
                    },
                    {
                      header: copy.configuration.table.status,
                      cell: (row) => (
                        <StatusBadge status={row.status} label={labelStatus(row.status, activeLanguage)} />
                      )
                    },
                    {
                      header: copy.configuration.table.tiers,
                      cell: (row) => labelTiers(row.targetTiers, activeLanguage)
                    },
                    {
                      header: copy.configuration.table.tenants,
                      cell: (row) => row.enabledTenants.toLocaleString()
                    },
                    {
                      header: copy.configuration.table.model,
                      cell: (row) => row.primaryModel
                    },
                    {
                      header: copy.configuration.table.readiness,
                      cell: (row) => formatPercent(row.mcpReadiness, 0)
                    },
                    {
                      header: copy.configuration.table.nextAction,
                      cell: (row) => labelNextAction(row.agentName, row.nextAction, activeLanguage)
                    }
                  ]}
                />
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      {activeView === "consumption" ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title={activeLanguage === "zh" ? "成本护栏" : "Cost guardrail"}
              value={costBudgetStatus}
              helper={
                activeLanguage === "zh"
                  ? `已用 ${formatPercent(costBudgetUsage, 2)} / ${formatCurrency(data.summary.windowCostBudget)} 周期预算`
                  : `${formatPercent(costBudgetUsage, 2)} of ${formatCurrency(data.summary.windowCostBudget)} window budget`
              }
              icon={DollarSign}
              tone={costBudgetTone}
            />
            <MetricCard
              title={activeLanguage === "zh" ? "令牌预算使用率" : "Token budget used"}
              value={formatPercent(tokenBudgetUsage, 2)}
              helper={
                activeLanguage === "zh"
                  ? `${data.summary.totalTokens.toLocaleString()} / ${data.summary.windowTokenBudget.toLocaleString()} 令牌`
                  : `${data.summary.totalTokens.toLocaleString()} / ${data.summary.windowTokenBudget.toLocaleString()} tokens`
              }
              icon={ReceiptText}
              tone={tokenBudgetTone}
            />
            <MetricCard
              title={activeLanguage === "zh" ? "主模型依赖" : "Primary model dependency"}
              value={formatPercent(primaryModelShare, 1)}
              helper={
                primaryModel
                  ? activeLanguage === "zh"
                    ? `${primaryModel.name} 承担主要用量`
                    : `${primaryModel.name} carries routed usage`
                  : activeLanguage === "zh"
                    ? "暂无模型用量"
                    : "No model usage yet"
              }
              icon={BrainCircuit}
              tone={modelConcentrationTone}
            />
            <MetricCard
              title={activeLanguage === "zh" ? "单次智能体决策成本" : "Cost per agent decision"}
              value={formatCurrency(costPerAgentObservation, 5)}
              helper={
                activeLanguage === "zh"
                  ? `${data.summary.agentEvents} 次智能体执行；输入 ${formatPercent(totalInputTokens / tokenTotal, 1)}`
                  : `${data.summary.agentEvents} agent executions; ${formatPercent(totalInputTokens / tokenTotal, 1)} input tokens`
              }
              icon={Gauge}
              tone="stone"
            />
          </section>

          <section className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeLanguage === "zh" ? "扩量前的成本判断" : "Cost Decisions Before Rollout"}
                </CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "只回答三件事：预算是否安全，哪个智能体先处理，模型路由是否过度集中。"
                    : "Answer three things: budget safety, cost driver, and model concentration."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <OpsInsightRow
                    tone={insightBudgetTone}
                    icon={DollarSign}
                    label={activeLanguage === "zh" ? "预算状态" : "Budget status"}
                    title={costBudgetStatus}
                    metric={formatPercent(costBudgetUsage, 2)}
                    detail={
                      activeLanguage === "zh"
                        ? `当前筛选范围覆盖 ${data.summary.scopedTenantCount} 个租户、${data.summary.windowDays} 天。超过 75% 时先暂停扩大覆盖。`
                        : `${data.summary.scopedTenantCount} tenants over ${data.summary.windowDays} days. Hold expansion once usage crosses 75%.`
                    }
                  />
                  <OpsInsightRow
                    tone="warning"
                    icon={AlertTriangle}
                    label={activeLanguage === "zh" ? "成本来源" : "Cost driver"}
                    title={
                      highestCostAgent
                        ? labelAgent(highestCostAgent.agentName, activeLanguage)
                        : activeLanguage === "zh"
                          ? "暂无成本数据"
                          : "No cost data yet"
                    }
                    metric={highestCostAgent ? formatCurrency(highestCostAgent.totalCost, 4) : "$0"}
                    detail={
                      highestCostAgent
                        ? activeLanguage === "zh"
                          ? `当前使用 ${highestCostAgent.primaryModel}，覆盖 ${highestCostAgent.tenantCount} 个租户。扩量前检查提示词长度、模型路由和校验阈值。`
                          : `It uses ${highestCostAgent.primaryModel} across ${highestCostAgent.tenantCount} tenants. Review prompt length, routing, and validator thresholds before expansion.`
                        : activeLanguage === "zh"
                          ? "有运行数据后，这里会显示最该优化的智能体。"
                          : "This will show the first agent to optimize once data exists."
                    }
                  />
                  <OpsInsightRow
                    tone={insightModelTone}
                    icon={BrainCircuit}
                    label={activeLanguage === "zh" ? "模型集中度" : "Model concentration"}
                    title={primaryModel?.name ?? (activeLanguage === "zh" ? "暂无主模型" : "No primary model")}
                    metric={formatPercent(primaryModelShare, 1)}
                    detail={
                      primaryModelShare >= 0.7
                        ? activeLanguage === "zh"
                          ? "主模型占比偏高。先把校验类和低风险分析类智能体迁到更便宜模型。"
                          : "Dependency is high. Move validators and low-risk analysis agents to cheaper models first."
                        : activeLanguage === "zh"
                          ? "模型分布健康。继续用质量和成本共同决定路由。"
                          : "Model mix is healthy. Keep routing decisions tied to both quality and cost."
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeLanguage === "zh" ? "需要检查的智能体" : "Agents to Review"}
                </CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "按成本排序，只保留负责人需要判断的信息。"
                    : "Sorted by cost, with only the fields an owner needs to act."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={agentCostRows.slice(0, 6)}
                  columns={[
                    {
                      header: activeLanguage === "zh" ? "智能体" : "Agent",
                      cell: (row) => (
                        <div>
                          <p className="font-medium">{labelAgent(row.agentName, activeLanguage)}</p>
                          <p className="text-xs text-muted-foreground">
                            {labelAgentRole(row.agentRole, activeLanguage)}
                          </p>
                        </div>
                      )
                    },
                    {
                      header: activeLanguage === "zh" ? "覆盖" : "Coverage",
                      cell: (row) =>
                        activeLanguage === "zh"
                          ? `${row.tenantCount.toLocaleString()} 个租户`
                          : `${row.tenantCount.toLocaleString()} tenants`
                    },
                    {
                      header: activeLanguage === "zh" ? "模型" : "Model",
                      cell: (row) => row.primaryModel
                    },
                    {
                      header: activeLanguage === "zh" ? "单次成本" : "Unit cost",
                      cell: (row) => formatCurrency(row.runs === 0 ? 0 : row.totalCost / row.runs, 5)
                    },
                    {
                      header: activeLanguage === "zh" ? "周期成本" : "Window cost",
                      cell: (row) => formatCurrency(row.totalCost, 4)
                    },
                    {
                      header: activeLanguage === "zh" ? "动作" : "Action",
                      cell: (row) => labelCostAction(row, activeLanguage)
                    }
                  ]}
                />
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      {activeView === "performance" ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Fleet quality"
              value={formatPercent(data.summary.avgValidationScore, 1)}
              helper="Average validation score across observed agents"
              icon={Gauge}
              tone="violet"
            />
            <MetricCard
              title="Average latency"
              value={formatMs(data.summary.avgLatencyMs)}
              helper={`${data.summary.agentEvents} agent executions`}
              icon={Clock3}
              tone="blue"
            />
            <MetricCard
              title={activeLanguage === "zh" ? "审核积压" : "Review backlog"}
              value={data.summary.reviewRuns}
              helper={
                activeLanguage === "zh"
                  ? `${data.summary.succeededRuns} 个运行已成功`
                  : `${data.summary.succeededRuns} runs succeeded`
              }
              icon={CheckCircle2}
            />
            <MetricCard
              title={activeLanguage === "zh" ? "扩量判断" : "Rollout decision"}
              value={
                data.summary.reviewRuns === 0 && data.summary.avgValidationScore >= 0.86
                  ? activeLanguage === "zh"
                    ? "继续"
                    : "Continue"
                  : activeLanguage === "zh"
                    ? "暂停"
                    : "Hold"
              }
              helper={
                activeLanguage === "zh"
                  ? "综合质量、延迟和人工审核压力"
                  : "Based on quality, latency, and review pressure"
              }
              icon={Target}
              tone="stone"
            />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <CardHeader>
                <CardTitle>{activeLanguage === "zh" ? "本周行动板" : "Action Board"}</CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "只保留需要 CEO、CTO 或 EM 做决定的运行信号。"
                    : "Only signals that require a CEO, CTO, or EM decision stay here."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <OpsInsightRow
                    tone={data.summary.reviewRuns > 0 ? "warning" : "good"}
                    icon={data.summary.reviewRuns > 0 ? AlertTriangle : CheckCircle2}
                    label={activeLanguage === "zh" ? "人工审核压力" : "Human review pressure"}
                    title={
                      data.summary.reviewRuns > 0
                        ? activeLanguage === "zh"
                          ? `${data.summary.reviewRuns} 个运行需要人工审核`
                          : `${data.summary.reviewRuns} runs need human review`
                        : activeLanguage === "zh"
                          ? "当前范围没有人工审核积压"
                          : "No human review backlog in this scope"
                    }
                    metric={`${data.summary.reviewRuns}`}
                    detail={
                      data.summary.reviewRuns > 0
                        ? activeLanguage === "zh"
                          ? "审核积压意味着至少一支智能体团队在对租户可见动作前暂停，需要 EM 介入。"
                          : "Review pressure means at least one agent team is pausing before tenant-visible action."
                        : activeLanguage === "zh"
                          ? "智能体通过校验，没有制造额外审批负担。"
                          : "Agents are clearing validation without creating extra approval load."
                    }
                  />
                  <OpsInsightRow
                    tone={
                      lowestValidationAgent && lowestValidationAgent.avgValidationScore < 0.86
                        ? "warning"
                        : "good"
                    }
                    icon={
                      lowestValidationAgent && lowestValidationAgent.avgValidationScore < 0.86
                        ? AlertTriangle
                        : CheckCircle2
                    }
                    label={activeLanguage === "zh" ? "质量底线" : "Validation floor"}
                    title={
                      lowestValidationAgent
                        ? activeLanguage === "zh"
                          ? `${lowestValidationAgent.agentName} 质量分最低`
                          : `${lowestValidationAgent.agentName} has the lowest validation score`
                        : activeLanguage === "zh"
                          ? "暂无质量数据"
                          : "No validation data yet"
                    }
                    metric={
                      lowestValidationAgent
                        ? formatPercent(lowestValidationAgent.avgValidationScore, 1)
                        : "0%"
                    }
                    detail={
                      lowestValidationAgent
                        ? activeLanguage === "zh"
                          ? "继续扩大租户范围前，先检查这个智能体的校验标准和失败样本。"
                          : `${titleCase(lowestValidationAgent.agentRole)} should be reviewed before moving more tenant volume through this route.`
                        : activeLanguage === "zh"
                          ? "产生运行数据后会显示质量底线。"
                          : "Validator quality will appear once agent events are recorded."
                    }
                  />
                  <OpsInsightRow
                    tone="info"
                    icon={Clock3}
                    label={activeLanguage === "zh" ? "延迟风险" : "Latency watch"}
                    title={
                      slowestAgent
                        ? activeLanguage === "zh"
                          ? `${slowestAgent.agentName} 最慢`
                          : `${slowestAgent.agentName} is the slowest agent`
                        : activeLanguage === "zh"
                          ? "暂无延迟数据"
                          : "No latency data yet"
                    }
                    metric={slowestAgent ? formatMs(slowestAgent.avgLatencyMs) : "0ms"}
                    detail={
                      slowestAgent
                        ? activeLanguage === "zh"
                          ? `${slowestAgent.primaryModel} 正在处理 ${slowestAgent.tenantCount} 个租户的相关任务，适合优先排查模型路由或工具调用。`
                          : `${slowestAgent.primaryModel} is handling ${titleCase(slowestAgent.agentRole)} work across ${slowestAgent.tenantCount} tenants.`
                        : activeLanguage === "zh"
                          ? "首次运行后会显示延迟信号。"
                          : "Latency telemetry will appear after the first advisor run."
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{activeLanguage === "zh" ? "扩量建议" : "Rollout Recommendation"}</CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "把质量、延迟和人工审核压力合成一个管理动作。"
                    : "Combines quality, latency, and review pressure into one management action."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-800">
                    {data.summary.reviewRuns === 0 && data.summary.avgValidationScore >= 0.86
                      ? activeLanguage === "zh"
                        ? "建议继续灰度扩量"
                        : "Continue controlled rollout"
                      : activeLanguage === "zh"
                        ? "暂停扩量，先修质量"
                        : "Hold rollout and fix quality first"}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-emerald-950">
                    {formatPercent(data.summary.avgValidationScore, 1)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-950">
                    {activeLanguage === "zh"
                      ? `当前范围内 ${data.summary.succeededRuns} 个运行成功，${data.summary.reviewRuns} 个需要人工审核。CTO 关注延迟和模型路由，EM 关注质量底线，CEO 只需要知道是否能继续扩大。`
                      : `${data.summary.succeededRuns} runs succeeded and ${data.summary.reviewRuns} need review in this scope. CTO owns latency and routing, EM owns quality floor, CEO needs the rollout answer.`}
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">{activeLanguage === "zh" ? "质量" : "Quality"}</p>
                    <p className="mt-1 font-semibold">{formatPercent(data.summary.avgValidationScore, 1)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">{activeLanguage === "zh" ? "延迟" : "Latency"}</p>
                    <p className="mt-1 font-semibold">{formatMs(data.summary.avgLatencyMs)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">{activeLanguage === "zh" ? "审核" : "Review"}</p>
                    <p className="mt-1 font-semibold">{data.summary.reviewRuns}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{activeLanguage === "zh" ? "智能体可靠性排行" : "Agent Reliability Ranking"}</CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "按智能体类型判断谁可以扩量，谁需要修复。"
                    : "Decide which agent archetypes can scale and which need repair."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={agentPerformanceRows}
                  columns={[
                    {
                      header: activeLanguage === "zh" ? "智能体" : "Agent",
                      cell: (row) => (
                        <div>
                          <p className="font-medium">{row.agentName}</p>
                          <p className="text-xs text-muted-foreground">{titleCase(row.agentRole)}</p>
                        </div>
                      )
                    },
                    {
                      header: activeLanguage === "zh" ? "运行数" : "Runs",
                      cell: (row) => row.runs.toLocaleString()
                    },
                    {
                      header: activeLanguage === "zh" ? "质量" : "Validation",
                      cell: (row) => formatPercent(row.avgValidationScore, 1)
                    },
                    {
                      header: activeLanguage === "zh" ? "延迟" : "Latency",
                      cell: (row) => formatMs(row.avgLatencyMs)
                    },
                    {
                      header: activeLanguage === "zh" ? "建议" : "Decision",
                      cell: (row) => (
                        <StatusBadge
                          status={row.avgValidationScore < 0.86 ? "warning" : "healthy"}
                          label={
                            row.avgValidationScore < 0.86
                              ? activeLanguage === "zh"
                                ? "先修复"
                                : "Needs repair"
                              : activeLanguage === "zh"
                                ? "可扩量"
                                : "Can scale"
                          }
                        />
                      )
                    }
                  ]}
                />
              </CardContent>
            </Card>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle>{activeLanguage === "zh" ? "套餐扩量判断" : "Tier Rollout Readiness"}</CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "按套餐判断是不是适合扩大智能体覆盖，而不是逐个租户翻表。"
                    : "Decide whether each subscription tier is ready for broader agent coverage, without tenant-by-tenant tables."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={tierPerformanceRows}
                  columns={[
                    {
                      header: activeLanguage === "zh" ? "套餐" : "Tier",
                      cell: (row) => activeLanguage === "zh" ? labelTiers(titleCase(row.plan), activeLanguage) : titleCase(row.plan)
                    },
                    {
                      header: activeLanguage === "zh" ? "质量" : "Quality",
                      cell: (row) => formatPercent(row.avgValidationScore, 1)
                    },
                    {
                      header: activeLanguage === "zh" ? "延迟" : "Latency",
                      cell: (row) => formatMs(row.avgLatencyMs)
                    },
                    {
                      header: activeLanguage === "zh" ? "管理动作" : "Action",
                      cell: (row) =>
                        row.avgValidationScore >= 0.86 && row.avgLatencyMs < 2500
                          ? activeLanguage === "zh"
                            ? "扩大覆盖"
                            : "Expand coverage"
                          : activeLanguage === "zh"
                            ? "保留灰度"
                            : "Keep limited rollout"
                    }
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{activeLanguage === "zh" ? "最弱套餐信号" : "Weakest Tier Signal"}</CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "管理者只需要知道哪里最先拖慢扩量。"
                    : "Management only needs the segment that slows expansion first."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-amber-800">
                    {weakestTier
                      ? activeLanguage === "zh"
                        ? `${labelTiers(titleCase(weakestTier.plan), activeLanguage)} 需要关注`
                        : `${titleCase(weakestTier.plan)} needs attention`
                      : activeLanguage === "zh"
                        ? "暂无套餐信号"
                        : "No tier signal yet"}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-amber-950">
                    {weakestTier ? formatPercent(weakestTier.avgValidationScore, 1) : "0%"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-950">
                    {weakestTier
                      ? activeLanguage === "zh"
                        ? `平均延迟 ${formatMs(weakestTier.avgLatencyMs)}。继续扩量前，EM 应检查该套餐下失败样本和人工审核原因。`
                        : `Average latency is ${formatMs(weakestTier.avgLatencyMs)}. EM should inspect failed samples and review causes before expanding this tier.`
                      : activeLanguage === "zh"
                        ? "有数据后会显示阻碍扩量的套餐。"
                        : "This will show the tier that blocks rollout once data exists."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      {activeView === "value" ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Attributed revenue"
              value={formatCurrency(data.summary.actualRevenue)}
              helper={`${data.summary.conversions.toLocaleString()} conversions in scope`}
              icon={TrendingUp}
            />
            <MetricCard
              title="Expected pipeline"
              value={formatCurrency(data.summary.expectedRevenue)}
              helper={`${data.summary.recommendationCount} recommendations generated`}
              icon={Target}
              tone="blue"
            />
            <MetricCard
              title="Approved drafts"
              value={data.summary.approvedRecommendations}
              helper="Human-approved agent recommendations"
              icon={CheckCircle2}
              tone="violet"
            />
            <MetricCard
              title="Value per LLM dollar"
              value={formatCurrency(data.summary.valuePerLlmDollar)}
              helper={`${formatPercent(data.summary.llmCostToRevenueRate, 3)} LLM cost / revenue`}
              icon={DollarSign}
              tone="amber"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Tier Value</CardTitle>
                <CardDescription>
                  Whether agent value is concentrated in one tier or healthy across the customer base.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={valueTierRows}
                  empty="No tier value data in this scope."
                  columns={[
                    {
                      header: "Tier",
                      cell: (row) => titleCase(row.plan)
                    },
                    {
                      header: "Tenants",
                      cell: (row) => row.tenantCount.toLocaleString()
                    },
                    {
                      header: "Revenue",
                      cell: (row) => formatCurrency(row.actualRevenue)
                    },
                    {
                      header: "Expected",
                      cell: (row) => formatCurrency(row.expectedRevenue)
                    },
                    {
                      header: "Approved",
                      cell: (row) => row.approvedRecommendations
                    },
                    {
                      header: "Value / LLM $",
                      cell: (row) =>
                        formatCurrency(row.llmCost === 0 ? 0 : row.actualRevenue / row.llmCost)
                    }
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{activeLanguage === "zh" ? "投资判断" : "Investment Decision"}</CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "把收入、审批和模型成本转成 CEO/CTO/EM 下一步动作。"
                    : "Translate revenue, approvals, and model cost into CEO/CTO/EM next actions."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <OpsInsightRow
                    tone={data.summary.valuePerLlmDollar > 100 ? "good" : "warning"}
                    icon={TrendingUp}
                    label={activeLanguage === "zh" ? "CEO" : "CEO"}
                    title={
                      data.summary.valuePerLlmDollar > 100
                        ? activeLanguage === "zh"
                          ? "可以继续扩大商业化试点"
                          : "Continue monetization rollout"
                        : activeLanguage === "zh"
                          ? "先证明单位经济性"
                          : "Prove unit economics first"
                    }
                    metric={formatCurrency(data.summary.valuePerLlmDollar)}
                    detail={
                      activeLanguage === "zh"
                        ? "用每 1 美元模型成本带来的业务收入判断是否继续投入，而不是只看生成了多少建议。"
                        : "Use revenue per model dollar to decide expansion, not the number of generated recommendations."
                    }
                  />
                  <OpsInsightRow
                    tone="info"
                    icon={Target}
                    label={activeLanguage === "zh" ? "GTM" : "GTM"}
                    title={
                      bestValueTier
                        ? activeLanguage === "zh"
                          ? `${labelTiers(titleCase(bestValueTier.plan), activeLanguage)} 已验证价值`
                          : `${titleCase(bestValueTier.plan)} is the proven value segment`
                        : activeLanguage === "zh"
                          ? "暂无已验证套餐"
                          : "No proven tier yet"
                    }
                    metric={bestValueTier ? formatCurrency(bestValueTier.actualRevenue) : "$0"}
                    detail={
                      activeLanguage === "zh"
                        ? "优先把销售话术、套餐包装和案例沉淀到价值已验证的套餐。"
                        : "Package sales messaging and case studies around the tier where value is already proven."
                    }
                  />
                  <OpsInsightRow
                    tone={data.summary.approvedRecommendations > 0 ? "good" : "warning"}
                    icon={CheckCircle2}
                    label={activeLanguage === "zh" ? "EM" : "EM"}
                    title={
                      activeLanguage === "zh"
                        ? `${data.summary.approvedRecommendations} 个建议获得人工批准`
                        : `${data.summary.approvedRecommendations} recommendations approved`
                    }
                    metric={`${data.summary.approvedRecommendations}`}
                    detail={
                      activeLanguage === "zh"
                        ? "审批数代表业务用户是否愿意采纳智能体建议，是比运行次数更重要的产品信号。"
                        : "Approvals show whether business users trust the recommendation, which matters more than run count."
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{activeLanguage === "zh" ? "价值证明摘要" : "Value Proof Summary"}</CardTitle>
                <CardDescription>
                  {activeLanguage === "zh"
                    ? "保留可以支撑投资决策的业务结果，不展示运行日志。"
                    : "Keep the business proof that supports investment decisions, not run logs."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {activeLanguage === "zh" ? "已归因收入" : "Attributed revenue"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(data.summary.actualRevenue)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeLanguage === "zh"
                        ? `${data.summary.conversions.toLocaleString()} 次转化被归因到相关活动。`
                        : `${data.summary.conversions.toLocaleString()} conversions attributed to related campaigns.`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {activeLanguage === "zh" ? "待兑现管道" : "Expected pipeline"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(data.summary.expectedRevenue)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeLanguage === "zh"
                        ? "来自已生成但尚未完全兑现的活动建议。"
                        : "From generated recommendations that have not fully converted yet."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {activeLanguage === "zh" ? "模型成本占比" : "Model cost ratio"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatPercent(data.summary.llmCostToRevenueRate, 3)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeLanguage === "zh"
                        ? "如果这个比例稳定偏低，CEO 才有理由扩大投入。"
                        : "If this remains low, the CEO has a reason to keep investing."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </main>
  );
}
