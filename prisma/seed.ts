import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function j(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function daysAgo(days: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function futureDays(days: number, hour = 11) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function rate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

async function clearDatabase() {
  await prisma.campaignAgentEvent.deleteMany();
  await prisma.campaignRecommendation.deleteMany();
  await prisma.campaignRun.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.tenant.deleteMany();

  await prisma.alert.deleteMany();
  await prisma.humanReviewItem.deleteMany();
  await prisma.agentMetric.deleteMany();
  await prisma.stepRun.deleteMany();
  await prisma.executionRun.deleteMany();
  await prisma.sOPStep.deleteMany();
  await prisma.validatorAgent.deleteMany();
  await prisma.roleAgent.deleteMany();
  await prisma.agentTeam.deleteMany();
  await prisma.businessSOP.deleteMany();
}

const tenantBlueprints = [
  {
    name: "GlowCart Beauty",
    slug: "glowcart",
    industry: "Beauty ecommerce",
    region: "Southeast Asia",
    plan: "growth" as const,
    locale: "en",
    campaigns: [
      ["Hydration Serum Back-in-Stock", "revenue_recovery", "VIP skincare buyers", "Back in stock with loyalty perk", 9200, 8870, 4220, 760, 318, 18760, 580, 18, 0.91],
      ["Ramadan Gift Set Launch", "product_launch", "Gift buyers 180d", "Limited-time bundle announcement", 15400, 14980, 6110, 1210, 426, 31420, 920, 39, 0.87],
      ["Cart Recovery - SPF Kit", "revenue_recovery", "Abandoned cart 48h", "Cart reminder with product proof", 11800, 11210, 3960, 890, 284, 17640, 430, 27, 0.84],
      ["Dormant Customer Reactivation", "reactivation", "No purchase 120d", "We saved your shade", 18600, 17520, 5160, 940, 212, 12680, 610, 71, 0.76],
      ["Loyalty Tier Upgrade", "retention", "Silver loyalty near upgrade", "Unlock gold perks", 6400, 6260, 3020, 620, 188, 14240, 260, 9, 0.93],
      ["Clean Beauty Education", "support_education", "Sensitive skin buyers", "Ingredient guide", 7800, 7590, 2880, 510, 96, 5420, 210, 13, 0.9]
    ]
  },
  {
    name: "EduSpark Academy",
    slug: "eduspark",
    industry: "Online education",
    region: "India",
    plan: "enterprise" as const,
    locale: "en-IN",
    campaigns: [
      ["Trial Class Reminder", "event_promotion", "Registered trial leads", "Class starts tomorrow", 22400, 21830, 9920, 2310, 870, 52200, 870, 34, 0.94],
      ["Counsellor Follow-up", "retention", "High intent leads", "Counsellor slot follow-up", 13400, 12980, 5880, 1640, 522, 37540, 640, 22, 0.9],
      ["Exam Crash Course Launch", "product_launch", "Exam prep cohort", "Crash course launch", 18200, 17610, 7020, 1510, 476, 42840, 780, 48, 0.86],
      ["Dormant Lead Reactivation", "reactivation", "No response 60d", "Still preparing?", 28700, 26910, 7820, 1300, 318, 21440, 920, 104, 0.72],
      ["Parent Webinar Invite", "event_promotion", "Parent segment", "Free webinar reminder", 9800, 9570, 4010, 830, 246, 12820, 330, 19, 0.88],
      ["Scholarship Deadline", "revenue_recovery", "Scholarship applicants", "Deadline urgency", 12100, 11820, 5360, 1430, 392, 27660, 420, 16, 0.91]
    ]
  },
  {
    name: "CarePlus Clinics",
    slug: "careplus",
    industry: "Healthcare",
    region: "UAE",
    plan: "enterprise" as const,
    locale: "en",
    campaigns: [
      ["Annual Check-up Reminder", "retention", "Patients due for check-up", "Preventive care reminder", 14200, 13890, 6110, 1110, 540, 43200, 510, 17, 0.95],
      ["Dental Cleaning Recall", "retention", "Dental recall 6m", "Cleaning slot reminder", 8600, 8420, 3480, 690, 260, 20800, 280, 9, 0.93],
      ["Flu Shot Awareness", "support_education", "Family accounts", "Seasonal flu awareness", 17100, 16620, 5320, 820, 210, 12600, 390, 31, 0.89],
      ["Missed Appointment Recovery", "revenue_recovery", "No-show patients", "Reschedule missed appointment", 5100, 4920, 1890, 440, 172, 13760, 160, 12, 0.84],
      ["Specialist Consultation Launch", "product_launch", "Chronic care patients", "New specialist availability", 7600, 7390, 2680, 570, 184, 18400, 240, 14, 0.87],
      ["Lab Report Follow-up", "support_education", "Recent lab patients", "Report collection reminder", 6800, 6650, 2940, 810, 312, 0, 120, 6, 0.96]
    ]
  }
] as const;

const agentTeam = [
  {
    name: "Campaign Performance Analyst",
    role: "performance_analyst" as const,
    runtime: "api_tools" as const,
    model: "gemini-2.5-flash",
    summary: "Reads historical campaign metrics, finds winning patterns, and flags weak cohorts."
  },
  {
    name: "Cohort Strategy Agent",
    role: "cohort_strategist" as const,
    runtime: "llm_only" as const,
    model: "gemini-2.5-flash-lite",
    summary: "Chooses the next audience cohort based on recency, intent, fatigue, and likely revenue."
  },
  {
    name: "Template Strategy Agent",
    role: "template_strategist" as const,
    runtime: "llm_only" as const,
    model: "gemini-2.5-flash",
    summary: "Drafts a WhatsApp-safe campaign template aligned to business objective and cohort context."
  },
  {
    name: "Send Time Optimizer",
    role: "send_time_optimizer" as const,
    runtime: "api_tools" as const,
    model: "gemini-2.5-flash-lite",
    summary: "Selects a recommended send window using previous reply curves and regional behavior."
  },
  {
    name: "Campaign Compliance Validator",
    role: "compliance_validator" as const,
    runtime: "llm_only" as const,
    model: "gemini-2.5-flash-lite",
    summary: "Validates opt-out risk, template quality, policy safety, and audience fatigue before launch."
  }
];

async function createCampaignRun({
  tenantId,
  objective,
  daysBack
}: {
  tenantId: string;
  objective: "revenue_recovery" | "product_launch" | "reactivation" | "retention" | "event_promotion" | "support_education";
  daysBack: number;
}) {
  const startedAt = daysAgo(daysBack, 13);
  const run = await prisma.campaignRun.create({
    data: {
      tenantId,
      status: "succeeded",
      objective,
      inputPayload: j({
        request: "Generate next campaign launch recommendation",
        dataWindow: "last_90_days"
      }),
      outputPayload: j({
        decision: "Recommended campaign plan created",
        runLayer: "LangGraph adapter"
      }),
      langfuseTraceId: `mock_trace_campaign_${tenantId.slice(-4)}_${daysBack}`,
      startedAt,
      completedAt: new Date(startedAt.getTime() + 1000 * 38),
      totalInputTokens: 3200 + daysBack * 41,
      totalOutputTokens: 1680 + daysBack * 23,
      totalTokens: 4880 + daysBack * 64,
      totalCost: 0.72 + daysBack * 0.018,
      latencyMs: 12800 + daysBack * 210,
      outcomeScore: 0.89
    }
  });

  let inputTokens = 520;
  let outputTokens = 260;
  for (const [index, agent] of agentTeam.entries()) {
    inputTokens += index * 70 + daysBack * 3;
    outputTokens += index * 44 + daysBack * 2;
    const totalTokens = inputTokens + outputTokens;
    const cost =
      agent.model === "gemini-2.5-flash"
        ? inputTokens * 0.0000003 + outputTokens * 0.0000025
        : inputTokens * 0.0000001 + outputTokens * 0.0000004;
    await prisma.campaignAgentEvent.create({
      data: {
        tenantId,
        runId: run.id,
        agentName: agent.name,
        agentRole: agent.role,
        runtime: agent.runtime,
        provider: "google",
        model: agent.model,
        promptVersion: "campaign-mvp-v1",
        input: j({
          historicalWindow: "last_90_days",
          objective,
          agentBrief: agent.summary
        }),
        output: `${agent.name} completed its operating judgment and handed off structured campaign evidence.`,
        validationScore: 0.82 + index * 0.025,
        status: "succeeded",
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        latencyMs: 900 + index * 360 + daysBack * 13,
        langfuseObservationId: `mock_obs_campaign_${run.id.slice(-5)}_${index}`
      }
    });
  }

  return run;
}

async function main() {
  await clearDatabase();

  for (const tenantBlueprint of tenantBlueprints) {
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantBlueprint.name,
        slug: tenantBlueprint.slug,
        industry: tenantBlueprint.industry,
        region: tenantBlueprint.region,
        plan: tenantBlueprint.plan,
        status: "active",
        monthlyConversationCap: tenantBlueprint.plan === "enterprise" ? 500000 : 150000,
        monthlyTokenBudget: tenantBlueprint.plan === "enterprise" ? 12000000 : 5000000,
        monthlyCostBudget: tenantBlueprint.plan === "enterprise" ? 2500 : 800,
        defaultLocale: tenantBlueprint.locale
      }
    });

    for (const [index, campaign] of tenantBlueprint.campaigns.entries()) {
      const [
        name,
        objective,
        cohortName,
        templateName,
        audienceSize,
        delivered,
        opened,
        clicked,
        replied,
        revenue,
        spend,
        optOuts,
        qualityRating
      ] = campaign;
      await prisma.campaign.create({
        data: {
          tenantId: tenant.id,
          name,
          objective,
          status: "completed",
          cohortName,
          templateName,
          sentAt: daysAgo(index * 8 + 5, 11 + (index % 4)),
          audienceSize,
          delivered,
          opened,
          clicked,
          replied,
          conversions: Math.max(24, Math.round(replied * (0.24 + index * 0.015))),
          revenue,
          spend,
          optOuts,
          qualityRating,
          notes: j({
            openRate: rate(opened, delivered),
            replyRate: rate(replied, delivered),
            conversionRate: rate(Math.max(24, Math.round(replied * (0.24 + index * 0.015))), delivered),
            costPerConversion: spend / Math.max(24, Math.round(replied * (0.24 + index * 0.015)))
          })
        }
      });
    }

    const run = await createCampaignRun({
      tenantId: tenant.id,
      objective: tenantBlueprint.slug === "eduspark" ? "event_promotion" : "revenue_recovery",
      daysBack: 2
    });
    await createCampaignRun({
      tenantId: tenant.id,
      objective: "retention",
      daysBack: 12
    });
    await createCampaignRun({
      tenantId: tenant.id,
      objective: "reactivation",
      daysBack: 28
    });

    await prisma.campaignRecommendation.create({
      data: {
        tenantId: tenant.id,
        runId: run.id,
        status: "recommended",
        objective: tenantBlueprint.slug === "eduspark" ? "event_promotion" : "revenue_recovery",
        recommendedCohort:
          tenantBlueprint.slug === "glowcart"
            ? "Abandoned cart customers with skincare category interest, last active within 14 days"
            : tenantBlueprint.slug === "eduspark"
              ? "Trial class registrants who clicked pricing but have not booked a counsellor slot"
              : "Patients due for annual check-up who engaged with preventive care reminders",
        cohortReason:
          "This cohort has strong historical reply behavior, low opt-out risk, and recent intent signals.",
        audienceEstimate: tenantBlueprint.slug === "eduspark" ? 11800 : tenantBlueprint.slug === "careplus" ? 7200 : 9800,
        recommendedTemplate:
          tenantBlueprint.slug === "eduspark"
            ? "Trial Class Seat Confirmation"
            : tenantBlueprint.slug === "careplus"
              ? "Preventive Care Reminder"
              : "Cart Recovery With Product Proof",
        templateBody:
          tenantBlueprint.slug === "glowcart"
            ? "Hi {{first_name}}, your {{product_name}} is still in your cart. Customers with your skin profile usually pair it with our hydration routine. Want us to reserve it with your loyalty perk?"
            : tenantBlueprint.slug === "eduspark"
              ? "Hi {{first_name}}, your trial class seat is almost ready. Based on your goal, we recommend the {{course_name}} track. Would you like a counsellor to confirm the best batch timing?"
              : "Hi {{first_name}}, it has been a while since your last check-up. CarePlus has preventive care slots open this week. Would you like us to help book a convenient time?",
        recommendedSendTime: futureDays(2, tenantBlueprint.slug === "eduspark" ? 18 : 11),
        sendTimeReason:
          "Prior campaigns show the best reply-to-conversion curve in this window with lower opt-out risk.",
        expectedRevenue: tenantBlueprint.slug === "eduspark" ? 44800 : tenantBlueprint.slug === "careplus" ? 31800 : 22600,
        expectedReplyRate: tenantBlueprint.slug === "eduspark" ? 0.118 : 0.086,
        expectedConversionRate: tenantBlueprint.slug === "careplus" ? 0.047 : 0.032,
        riskLevel: "Medium",
        validatorFeedback:
          "Template is business-safe. Keep opt-out language available and suppress users contacted in the last 72 hours.",
        operatingSummary:
          "AstraOS recommends a campaign that balances recent intent, fatigue control, expected revenue, and WhatsApp template quality."
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
