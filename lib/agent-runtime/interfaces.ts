export type AgentRuntimeKind = "llm_only" | "api_tools" | "e2b_sandbox" | "human_assisted";

export type ModelProviderId =
  | "mock"
  | "openai"
  | "anthropic"
  | "google"
  | "azure"
  | "bedrock"
  | "vertex_ai";

export type ModelGatewayId = "mock" | "litellm";

export type AgentModelPolicy = {
  gateway: ModelGatewayId;
  provider: ModelProviderId;
  model: string;
  litellmModel?: string;
  promptVersion: string;
  temperature?: number;
  maxTokens?: number;
  fallbackModels?: string[];
  routingTags?: string[];
  budgetKey?: string;
};

export type ModelInvocationUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
};

export type ModelInvocationRequest = {
  tenantId: string;
  runId: string;
  agentName: string;
  agentRole: string;
  runtime: AgentRuntimeKind;
  policy: AgentModelPolicy;
  input: unknown;
  metadata?: Record<string, unknown>;
};

export type ModelInvocationResult = {
  output: string;
  usage: ModelInvocationUsage;
  providerRequestId?: string;
  raw?: unknown;
};

export interface ModelGatewayPort {
  name: "mock" | "litellm";
  invoke(request: ModelInvocationRequest): Promise<ModelInvocationResult>;
  estimateCost?(request: Pick<ModelInvocationRequest, "policy" | "input">): Promise<number>;
  listModels?(): Promise<AgentModelPolicy[]>;
}

export type AgentStepStatus = "succeeded" | "failed" | "needs_human_review" | "escalated";

export type AgentStepExecutionResult = {
  stepId: string;
  agentName: string;
  validatorName?: string;
  status: AgentStepStatus;
  output: string;
  usage: ModelInvocationUsage;
  validationScore?: number;
  retryCount?: number;
};

export type AgentTeamExecutionRequest = {
  tenantId: string;
  sopId: string;
  teamId: string;
  runId: string;
  inputPayload: unknown;
};

export type AgentTeamExecutionResult = {
  runId: string;
  status: AgentStepStatus;
  executionLayer: "langgraph" | "astraos-sequential-fallback";
  history: AgentStepExecutionResult[];
};

export interface AgentOrchestratorPort {
  name: "langgraph";
  execute(request: AgentTeamExecutionRequest): Promise<AgentTeamExecutionResult>;
  resume?(runId: string, inputPayload?: unknown): Promise<AgentTeamExecutionResult>;
}

export type ObservabilityTraceRequest = {
  tenantId: string;
  runId: string;
  sopId?: string;
  teamId?: string;
  name: string;
  metadata?: Record<string, unknown>;
};

export type ObservabilityObservationRequest = {
  traceId: string;
  tenantId: string;
  runId: string;
  agentName: string;
  modelPolicy: AgentModelPolicy;
  input: unknown;
  output: unknown;
  usage: ModelInvocationUsage;
  validationScore?: number;
  retryCount?: number;
  metadata?: Record<string, unknown>;
};

export type ObservabilityHandle = {
  id: string;
  mode: "mock" | "live";
  url?: string;
};

export interface ObservabilityPort {
  name: "mock" | "langfuse";
  createTrace(request: ObservabilityTraceRequest): Promise<ObservabilityHandle>;
  createObservation(request: ObservabilityObservationRequest): Promise<ObservabilityHandle>;
  score?(request: {
    traceId: string;
    name: string;
    value: number;
    comment?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
