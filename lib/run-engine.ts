import type { AgentTeam, RoleAgent, SOPStep, ValidatorAgent } from "@prisma/client";
import { calculateTokenCost } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { runAgentSandbox } from "@/lib/e2b";
import { createRunTrace, createStepObservation } from "@/lib/langfuse";
import { executeSopThroughLangGraph, type GraphStepResult } from "@/lib/langgraph";
import { runMockRoleAgent, runMockValidator } from "@/lib/llm";
import { createId, parseJson, startOfToday, stringify } from "@/lib/utils";

type StepWithAgents = SOPStep & {
  assignedRoleAgent: RoleAgent;
  validatorAgent: ValidatorAgent;
};

type TeamWithSteps = AgentTeam & {
  roleAgents: RoleAgent[];
  validatorAgents: ValidatorAgent[];
  steps: StepWithAgents[];
};

const validatorInputTokens = 180;
const validatorOutputTokens = 90;

function finalStatusFromStep(status: GraphStepResult["status"]) {
  if (status === "needs_human_review") return "needs_human_review" as const;
  if (status === "escalated") return "escalated" as const;
  if (status === "failed") return "failed" as const;
  return "succeeded" as const;
}

function failedStepStatus(action: ValidatorAgent["failureAction"]) {
  if (action === "request_human_review" || action === "retry") {
    return "needs_human_review" as const;
  }
  if (action === "escalate") {
    return "escalated" as const;
  }
  return "failed" as const;
}

async function refreshTeamMetrics(teamId: string) {
  const runs = await prisma.executionRun.findMany({
    where: { teamId },
    select: {
      status: true,
      totalCost: true,
      totalTokens: true,
      outcomeScore: true
    }
  });

  const totalRuns = runs.length;
  const succeeded = runs.filter((run) => run.status === "succeeded").length;
  const totalCost = runs.reduce((sum, run) => sum + run.totalCost, 0);
  const totalTokens = runs.reduce((sum, run) => sum + run.totalTokens, 0);
  const outcomeScore =
    totalRuns === 0
      ? 0
      : runs.reduce((sum, run) => sum + run.outcomeScore, 0) / totalRuns;

  await prisma.agentTeam.update({
    where: { id: teamId },
    data: {
      totalRuns,
      totalCost,
      totalTokens,
      successRate: totalRuns === 0 ? 0 : succeeded / totalRuns,
      outcomeScore
    }
  });
}

async function refreshAgentMetric(agentId: string) {
  const date = startOfToday();
  const stepRuns = await prisma.stepRun.findMany({
    where: {
      roleAgentId: agentId,
      startedAt: {
        gte: date
      }
    },
    select: {
      status: true,
      validationScore: true,
      retryCount: true,
      tokensUsed: true,
      cost: true,
      latencyMs: true
    }
  });

  const runs = stepRuns.length;
  const succeeded = stepRuns.filter((stepRun) => stepRun.status === "succeeded").length;
  const escalated = stepRuns.filter((stepRun) => stepRun.status === "escalated").length;
  const humanReview = stepRuns.filter(
    (stepRun) => stepRun.status === "needs_human_review"
  ).length;
  const withRetries = stepRuns.filter((stepRun) => stepRun.retryCount > 0).length;
  const totalTokens = stepRuns.reduce((sum, stepRun) => sum + stepRun.tokensUsed, 0);
  const totalCost = stepRuns.reduce((sum, stepRun) => sum + stepRun.cost, 0);
  const avgLatencyMs =
    runs === 0
      ? 0
      : Math.round(stepRuns.reduce((sum, stepRun) => sum + stepRun.latencyMs, 0) / runs);
  const validationPassRate =
    runs === 0
      ? 0
      : stepRuns.filter((stepRun) => stepRun.validationScore >= 0.85).length / runs;

  await prisma.agentMetric.upsert({
    where: {
      agentId_date: {
        agentId,
        date
      }
    },
    update: {
      runs,
      successRate: runs === 0 ? 0 : succeeded / runs,
      avgLatencyMs,
      totalTokens,
      totalCost,
      validationPassRate,
      retryRate: runs === 0 ? 0 : withRetries / runs,
      escalationRate: runs === 0 ? 0 : escalated / runs,
      humanReviewRate: runs === 0 ? 0 : humanReview / runs
    },
    create: {
      agentId,
      date,
      runs,
      successRate: runs === 0 ? 0 : succeeded / runs,
      avgLatencyMs,
      totalTokens,
      totalCost,
      validationPassRate,
      retryRate: runs === 0 ? 0 : withRetries / runs,
      escalationRate: runs === 0 ? 0 : escalated / runs,
      humanReviewRate: runs === 0 ? 0 : humanReview / runs
    }
  });
}

async function createRunAlert({
  status,
  sopId,
  runId,
  agentId,
  agentName,
  validatorName
}: {
  status: GraphStepResult["status"];
  sopId: string;
  runId: string;
  agentId: string;
  agentName: string;
  validatorName: string;
}) {
  if (status === "succeeded") return;

  await prisma.alert.create({
    data: {
      severity: status === "failed" ? "critical" : "warning",
      type:
        status === "needs_human_review"
          ? "human_review_needed"
          : status === "escalated"
            ? "repeated_retry"
            : "validation_failure",
      title:
        status === "needs_human_review"
          ? `Human review required for ${agentName}`
          : status === "escalated"
            ? `${agentName} escalated after validation retries`
            : `${validatorName} stopped ${agentName}`,
      description:
        status === "needs_human_review"
          ? `Human review required after repeated validation gaps from ${validatorName}.`
          : status === "escalated"
            ? `Escalation triggered by ${validatorName} after retry policy was exhausted.`
            : `Validation failed because the output did not meet the required business criteria.`,
      sopId,
      agentId,
      runId,
      status: "open"
    }
  });
}

async function executeStep({
  step,
  runId,
  traceId,
  sopId,
  previous
}: {
  step: StepWithAgents;
  runId: string;
  traceId: string;
  sopId: string;
  previous?: GraphStepResult;
}): Promise<GraphStepResult> {
  const startedAt = new Date();
  const input = previous?.output ?? step.expectedInput;
  const stepRun = await prisma.stepRun.create({
    data: {
      runId,
      sopStepId: step.id,
      roleAgentId: step.assignedRoleAgentId,
      validatorAgentId: step.validatorAgentId,
      status: "running",
      input,
      langfuseObservationId: createId("pending_obs"),
      logs: stringify([
        {
          at: startedAt.toISOString(),
          message: `${step.assignedRoleAgent.name} accepted ownership of ${step.name}.`
        }
      ]),
      startedAt
    }
  });

  let attempt = 0;
  let retryCount = 0;
  let finalStatus: GraphStepResult["status"] = "failed";
  let output = "";
  let validationScore = 0;
  let validationResult: Record<string, unknown> = {};
  let totalTokens = 0;
  let totalCost = 0;
  let totalLatencyMs = 0;
  const logs = parseJson<Array<{ at: string; message: string }>>(stepRun.logs, []);
  const maxRetries = step.validatorAgent.maxRetries;

  while (attempt <= maxRetries) {
    const roleOutput = await runMockRoleAgent({
      agent: step.assignedRoleAgent,
      step,
      input,
      attempt
    });
    const sandbox = await runAgentSandbox(step.assignedRoleAgent);
    output = [
      roleOutput.text,
      sandbox.mode === "not_required" ? null : `Sandbox note: ${sandbox.output}`
    ]
      .filter(Boolean)
      .join("\n");

    const validator = await runMockValidator({
      validatorName: step.validatorAgent.name,
      criteria: step.validatorAgent.validationCriteria,
      passThreshold: step.validatorAgent.passThreshold,
      attempt,
      stepName: step.name,
      output
    });
    validationScore = validator.score;
    validationResult = validator.result;

    const roleCost = calculateTokenCost({
      provider: step.assignedRoleAgent.llmProvider,
      model: step.assignedRoleAgent.model,
      inputTokens: roleOutput.inputTokens,
      outputTokens: roleOutput.outputTokens
    });
    const validatorCost = calculateTokenCost({
      provider: "mock",
      model: step.validatorAgent.model,
      inputTokens: validatorInputTokens,
      outputTokens: validatorOutputTokens
    });

    const attemptTokens =
      roleOutput.inputTokens +
      roleOutput.outputTokens +
      validatorInputTokens +
      validatorOutputTokens;
    const attemptCost = roleCost.totalCost + validatorCost.totalCost;
    const attemptLatency = roleOutput.latencyMs + 420 + ((attempt + 1) * 117);

    totalTokens += attemptTokens;
    totalCost += attemptCost;
    totalLatencyMs += attemptLatency;

    logs.push({
      at: new Date().toISOString(),
      message: `${step.assignedRoleAgent.name} generated output for ${step.name}.`
    });
    logs.push({
      at: new Date().toISOString(),
      message: validator.passed
        ? `${step.validatorAgent.name} passed the validation gate at ${Math.round(
            validationScore * 100
          )}%.`
        : `${step.validatorAgent.name} failed the validation gate at ${Math.round(
            validationScore * 100
          )}%.`
    });

    if (validator.passed) {
      finalStatus = "succeeded";
      break;
    }

    if (attempt < maxRetries) {
      retryCount += 1;
      await prisma.stepRun.update({
        where: { id: stepRun.id },
        data: {
          status: "retrying",
          retryCount,
          logs: stringify(logs)
        }
      });
      logs.push({
        at: new Date().toISOString(),
        message: `Retry triggered by ${step.validatorAgent.name}; ${step.assignedRoleAgent.name} is revising the handoff.`
      });
      attempt += 1;
      continue;
    }

    finalStatus = failedStepStatus(step.validatorAgent.failureAction);
    break;
  }

  const observation = await createStepObservation({
    traceId,
    name: `${step.assignedRoleAgent.name} - ${step.validatorAgent.name}`,
    input,
    output,
    metadata: {
      roleAgentId: step.assignedRoleAgentId,
      validatorAgentId: step.validatorAgentId,
      model: step.assignedRoleAgent.model,
      provider: step.assignedRoleAgent.llmProvider,
      promptVersion: "mock-v1",
      totalTokens,
      cost: totalCost,
      latencyMs: totalLatencyMs,
      validationScore,
      retryCount,
      finalStatus
    }
  });

  const completedAt = new Date();
  const stepRunStatus =
    finalStatus === "succeeded"
      ? "succeeded"
      : finalStatus === "needs_human_review"
        ? "needs_human_review"
        : finalStatus === "escalated"
          ? "escalated"
          : "failed";

  await prisma.stepRun.update({
    where: { id: stepRun.id },
    data: {
      status: stepRunStatus,
      output,
      validationResult: stringify(validationResult),
      validationScore,
      langfuseObservationId: observation.id,
      retryCount,
      tokensUsed: totalTokens,
      cost: totalCost,
      latencyMs: totalLatencyMs,
      logs: stringify(logs),
      completedAt
    }
  });

  if (finalStatus === "needs_human_review") {
    await prisma.humanReviewItem.create({
      data: {
        runId,
        stepRunId: stepRun.id,
        sopId,
        agentId: step.assignedRoleAgentId,
        reason: `${step.validatorAgent.name} could not pass ${step.assignedRoleAgent.name} after ${retryCount} retries.`,
        status: "open",
        recommendedAction: "Review the agent output, approve if business risk is acceptable, or ask AstraOS to retry with stricter instructions."
      }
    });
  }

  await createRunAlert({
    status: finalStatus,
    sopId,
    runId,
    agentId: step.assignedRoleAgentId,
    agentName: step.assignedRoleAgent.name,
    validatorName: step.validatorAgent.name
  });
  await refreshAgentMetric(step.assignedRoleAgentId);

  return {
    stepId: step.id,
    status: finalStatus,
    output,
    tokensUsed: totalTokens,
    cost: totalCost,
    latencyMs: totalLatencyMs,
    validationScore
  };
}

export async function runBusinessSop(
  sopId: string,
  inputPayload: Record<string, unknown> = {
    trigger: "Manual run from AstraOS",
    source: "internal_mvp"
  }
) {
  const sop = await prisma.businessSOP.findUnique({
    where: { id: sopId },
    include: {
      teams: {
        include: {
          roleAgents: true,
          validatorAgents: true,
          steps: {
            include: {
              assignedRoleAgent: true,
              validatorAgent: true
            },
            orderBy: {
              order: "asc"
            }
          }
        }
      }
    }
  });

  if (!sop) {
    throw new Error("Business SOP not found.");
  }

  const team = sop.teams[0] as TeamWithSteps | undefined;
  if (!team) {
    throw new Error("Business SOP has no Agent Team.");
  }

  const runId = createId("run");
  const trace = await createRunTrace({
    name: `${sop.name} Execution Run`,
    sopId: sop.id,
    runId,
    metadata: {
      product: "AstraOS",
      teamId: team.id,
      businessObjective: sop.businessObjective
    }
  });

  await prisma.executionRun.create({
    data: {
      id: runId,
      sopId: sop.id,
      teamId: team.id,
      status: "running",
      inputPayload: stringify(inputPayload),
      langfuseTraceId: trace.id,
      startedAt: new Date()
    }
  });

  const graphResult = await executeSopThroughLangGraph({
    steps: team.steps,
    runStep: (step, previous) =>
      executeStep({
        step: step as StepWithAgents,
        runId,
        traceId: trace.id,
        sopId: sop.id,
        previous
      })
  });

  const failed = graphResult.history.find((result) => result.status !== "succeeded");
  const status = failed ? finalStatusFromStep(failed.status) : "succeeded";
  const totalTokens = graphResult.history.reduce((sum, step) => sum + step.tokensUsed, 0);
  const totalCost = graphResult.history.reduce((sum, step) => sum + step.cost, 0);
  const latencyMs = graphResult.history.reduce((sum, step) => sum + step.latencyMs, 0);
  const outcomeScore =
    graphResult.history.length === 0
      ? 0
      : graphResult.history.reduce((sum, step) => sum + step.validationScore, 0) /
        graphResult.history.length;

  const completedRun = await prisma.executionRun.update({
    where: { id: runId },
    data: {
      status,
      completedAt: new Date(),
      totalTokens,
      totalCost,
      latencyMs,
      outcomeScore,
      outputPayload: stringify({
        finalStatus: status,
        businessOutcome:
          status === "succeeded"
            ? `${sop.name} completed through supervised Role Agents and Validator Agents.`
            : `${sop.name} requires operating attention before the outcome can be trusted.`,
        executionLayer: graphResult.executionLayer,
        usedLangGraphPackage: graphResult.usedLangGraphPackage,
        traceId: trace.id
      })
    },
    include: {
      stepRuns: {
        include: {
          sopStep: true,
          roleAgent: true,
          validatorAgent: true
        },
        orderBy: {
          startedAt: "asc"
        }
      }
    }
  });

  await refreshTeamMetrics(team.id);

  return completedRun;
}

export async function handleHumanReviewAction({
  reviewItemId,
  action,
  reviewer = "Operations lead"
}: {
  reviewItemId: string;
  action: "approve" | "reject" | "retry" | "escalate" | "resolve";
  reviewer?: string;
}) {
  const item = await prisma.humanReviewItem.findUnique({
    where: { id: reviewItemId },
    include: {
      sop: true,
      run: true,
      stepRun: {
        include: {
          roleAgent: true,
          validatorAgent: true
        }
      }
    }
  });

  if (!item) {
    throw new Error("Human review item not found.");
  }

  if (action === "retry") {
    await prisma.humanReviewItem.update({
      where: { id: reviewItemId },
      data: {
        status: "resolved",
        reviewer,
        resolvedAt: new Date(),
        recommendedAction: "Retry accepted by human review. A new supervised execution run was created."
      }
    });
    return runBusinessSop(item.sopId, {
      trigger: "Human review retry",
      previousRunId: item.runId,
      reviewItemId
    });
  }

  const reviewStatus =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "resolved";

  await prisma.humanReviewItem.update({
    where: { id: reviewItemId },
    data: {
      status: reviewStatus,
      reviewer,
      resolvedAt: new Date(),
      recommendedAction:
        action === "escalate"
          ? "Escalated to the SOP owner for final decision rights."
          : action === "approve"
            ? "Approved by human reviewer. The run can be treated as accepted with oversight."
            : action === "reject"
              ? "Rejected by human reviewer. The output should not be used."
              : "Marked resolved by human reviewer."
    }
  });

  if (action === "escalate") {
    await prisma.executionRun.update({
      where: { id: item.runId },
      data: {
        status: "escalated"
      }
    });
    await prisma.alert.create({
      data: {
        severity: "critical",
        type: "human_review_needed",
        title: `${item.stepRun.roleAgent.name} escalated by human review`,
        description: "The reviewer escalated this decision because the agent output needs owner-level judgment.",
        sopId: item.sopId,
        agentId: item.agentId,
        runId: item.runId,
        status: "open"
      }
    });
  }

  return prisma.humanReviewItem.findUnique({
    where: { id: reviewItemId },
    include: {
      sop: true,
      run: true,
      stepRun: true,
      agent: true
    }
  });
}
