import { createId } from "@/lib/utils";

type TraceInput = {
  name: string;
  sopId: string;
  runId: string;
  metadata?: Record<string, unknown>;
};

type ObservationInput = {
  traceId: string;
  name: string;
  input: unknown;
  output: unknown;
  metadata: Record<string, unknown>;
};

function langfuseConfigured() {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY &&
      process.env.LANGFUSE_SECRET_KEY &&
      process.env.LANGFUSE_BASE_URL
  );
}

export async function createRunTrace(input: TraceInput) {
  const mockId = createId("mock_trace");

  if (!langfuseConfigured()) {
    return {
      id: mockId,
      mode: "mock" as const,
      url: `/settings#langfuse`
    };
  }

  try {
    const mod = (await import("langfuse")) as any;
    const client = new mod.Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL
    });
    const trace = client.trace({
      name: input.name,
      id: input.runId,
      sessionId: input.sopId,
      metadata: input.metadata
    });
    return {
      id: trace?.id ?? input.runId,
      mode: "live" as const,
      url: `${process.env.LANGFUSE_BASE_URL}/trace/${trace?.id ?? input.runId}`
    };
  } catch {
    return {
      id: mockId,
      mode: "mock" as const,
      url: `/settings#langfuse`
    };
  }
}

export async function createStepObservation(input: ObservationInput) {
  const mockId = createId("mock_obs");

  if (!langfuseConfigured()) {
    return {
      id: mockId,
      mode: "mock" as const
    };
  }

  try {
    const mod = (await import("langfuse")) as any;
    const client = new mod.Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL
    });
    const trace = client.trace({ id: input.traceId, name: "AstraOS Execution Run" });
    const observation = trace.span({
      name: input.name,
      input: input.input,
      output: input.output,
      metadata: input.metadata
    });
    return {
      id: observation?.id ?? mockId,
      mode: "live" as const
    };
  } catch {
    return {
      id: mockId,
      mode: "mock" as const
    };
  }
}
