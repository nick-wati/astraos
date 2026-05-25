import type { RoleAgent, SOPStep } from "@prisma/client";
import { parseList } from "@/lib/utils";

export type AgentOutput = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

function pick<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function hashText(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export async function runMockRoleAgent({
  agent,
  step,
  input,
  attempt
}: {
  agent: RoleAgent;
  step: SOPStep;
  input: string;
  attempt: number;
}): Promise<AgentOutput> {
  const responsibilities = parseList(agent.responsibilities);
  const outputs = parseList(agent.outputs);
  const seed = hashText(`${agent.id}-${step.id}-${attempt}-${input.length}`);
  const confidence = Math.min(96, 74 + ((seed + attempt * 7) % 22));
  const finding = pick(
    [
      "the required business context is present",
      "the handoff is ready for validation",
      "one operating risk needs closer review",
      "the next agent has enough structured context",
      "the expected outcome can be measured"
    ],
    seed
  );

  const text = [
    `${agent.name} completed "${step.name}" with ${confidence}% operating confidence.`,
    `This agent owns ${agent.roleTitle.toLowerCase()} and produced ${outputs[0] ?? "a structured handoff"}.`,
    `Primary judgment: ${finding}.`,
    responsibilities.length
      ? `Responsibilities applied: ${responsibilities.slice(0, 2).join("; ")}.`
      : "Responsibilities applied: business policy, accuracy review, and clean handoff.",
    attempt > 0
      ? `Retry context: attempt ${attempt + 1} incorporated validator feedback from the previous attempt.`
      : "No retry was required before the initial validation gate."
  ].join("\n");

  return {
    text,
    inputTokens: 420 + (seed % 260),
    outputTokens: 260 + ((seed + attempt * 31) % 320),
    latencyMs: 820 + (seed % 2200) + attempt * 360
  };
}

export async function runMockValidator({
  validatorName,
  criteria,
  passThreshold,
  attempt,
  stepName,
  output
}: {
  validatorName: string;
  criteria: string;
  passThreshold: number;
  attempt: number;
  stepName: string;
  output: string;
}) {
  const seed = hashText(`${validatorName}-${stepName}-${attempt}-${output.length}`);
  const base = 0.72 + ((seed % 23) / 100);
  const retryLift = attempt * 0.08;
  const score = Math.min(0.98, Number((base + retryLift).toFixed(2)));
  const passed = score >= passThreshold;

  return {
    score,
    passed,
    result: {
      validator: validatorName,
      score,
      passThreshold,
      decision: passed ? "passed" : "failed",
      reason: passed
        ? `${validatorName} confirmed the output satisfies the operating standard.`
        : `${validatorName} failed the validation gate because ${criteria.toLowerCase()} was not strong enough.`,
      businessLanguage: passed
        ? "Validation passed and the SOP can continue to the next accountable agent."
        : "Retry triggered because the validator found a quality gap in the business handoff."
    }
  };
}
