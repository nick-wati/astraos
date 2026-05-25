export type ModelPricing = {
  provider: string;
  model: string;
  inputCostPer1KTokens: number;
  outputCostPer1KTokens: number;
};

export const MODEL_PRICING: ModelPricing[] = [
  {
    provider: "mock",
    model: "mock-command-1",
    inputCostPer1KTokens: 0.0002,
    outputCostPer1KTokens: 0.0006
  },
  {
    provider: "mock",
    model: "mock-validator-1",
    inputCostPer1KTokens: 0.0001,
    outputCostPer1KTokens: 0.0003
  },
  {
    provider: "openai",
    model: "gpt-4.1-mini",
    inputCostPer1KTokens: 0.0004,
    outputCostPer1KTokens: 0.0016
  },
  {
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    inputCostPer1KTokens: 0.003,
    outputCostPer1KTokens: 0.015
  },
  {
    provider: "google",
    model: "gemini-2.5-flash-lite",
    inputCostPer1KTokens: 0.0001,
    outputCostPer1KTokens: 0.0004
  },
  {
    provider: "google",
    model: "gemini-2.5-flash",
    inputCostPer1KTokens: 0.0003,
    outputCostPer1KTokens: 0.0025
  },
  {
    provider: "google",
    model: "gemini-2.5-pro",
    inputCostPer1KTokens: 0.00125,
    outputCostPer1KTokens: 0.01
  }
];

export function getModelPricing(provider: string, model: string) {
  return (
    MODEL_PRICING.find(
      (pricing) => pricing.provider === provider && pricing.model === model
    ) ?? MODEL_PRICING[0]
  );
}

export function calculateTokenCost({
  provider,
  model,
  inputTokens,
  outputTokens
}: {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const pricing = getModelPricing(provider, model);
  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1KTokens;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1KTokens;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
}
