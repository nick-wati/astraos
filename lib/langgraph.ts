import type { SOPStep } from "@prisma/client";

export type GraphStepResult = {
  stepId: string;
  status: "succeeded" | "failed" | "needs_human_review" | "escalated";
  output: string;
  tokensUsed: number;
  cost: number;
  latencyMs: number;
  validationScore: number;
};

export type GraphExecutionResult = {
  usedLangGraphPackage: boolean;
  executionLayer: "langgraph" | "astraos-sequential-fallback";
  history: GraphStepResult[];
};

export async function executeSopThroughLangGraph({
  steps,
  runStep
}: {
  steps: SOPStep[];
  runStep: (step: SOPStep, previous?: GraphStepResult) => Promise<GraphStepResult>;
}): Promise<GraphExecutionResult> {
  const history: GraphStepResult[] = [];

  try {
    const langGraph = (await import("@langchain/langgraph")) as any;

    if (langGraph?.StateGraph && langGraph?.START && langGraph?.END) {
      // AstraOS keeps LangGraph behind this adapter so product screens only speak
      // in SOPs, agents, validation gates, retries, escalations, and reviews.
      const channels = {
        index: {
          value: (_left: number, right: number) => right,
          default: () => 0
        },
        history: {
          value: (left: GraphStepResult[], right: GraphStepResult[]) => right ?? left,
          default: () => []
        },
        halted: {
          value: (_left: boolean, right: boolean) => right,
          default: () => false
        }
      };

      const graph = new langGraph.StateGraph({ channels });

      steps.forEach((step, index) => {
        graph.addNode(`agent_${step.id}`, async (state: { history: GraphStepResult[] }) => {
          const previous = state.history[state.history.length - 1];
          const result = await runStep(step, previous);
          const nextHistory = [...state.history, result];
          const halted = result.status !== "succeeded";
          return {
            index: index + 1,
            history: nextHistory,
            halted
          };
        });
      });

      if (steps[0]) {
        graph.addEdge(langGraph.START, `agent_${steps[0].id}`);
      }

      steps.forEach((step, index) => {
        const nextStep = steps[index + 1];
        if (!nextStep) {
          graph.addEdge(`agent_${step.id}`, langGraph.END);
          return;
        }
        graph.addConditionalEdges(
          `agent_${step.id}`,
          (state: { halted: boolean }) => (state.halted ? "stop" : "continue"),
          {
            continue: `agent_${nextStep.id}`,
            stop: langGraph.END
          }
        );
      });

      const compiled = graph.compile();
      const result = await compiled.invoke({ index: 0, history: [], halted: false });
      return {
        usedLangGraphPackage: true,
        executionLayer: "langgraph",
        history: result.history ?? []
      };
    }
  } catch {
    // The local MVP remains runnable even if the LangGraph package is unavailable
    // or changes API shape. The adapter is still the only run path.
  }

  let previous: GraphStepResult | undefined;
  for (const step of steps) {
    const result = await runStep(step, previous);
    history.push(result);
    previous = result;
    if (result.status !== "succeeded") break;
  }

  return {
    usedLangGraphPackage: false,
    executionLayer: "astraos-sequential-fallback",
    history
  };
}
