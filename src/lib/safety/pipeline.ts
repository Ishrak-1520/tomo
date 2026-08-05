import { checkPatterns, PatternMatchResult } from './pattern-matcher';
import { classifyWithModel, ModelClassificationResult } from './model-classifier';

export interface SafetyPipelineResult {
  isRisk: boolean;
  layer1: PatternMatchResult;
  layer2: ModelClassificationResult | null;
}

export async function runSafetyPipeline(message: string): Promise<SafetyPipelineResult> {
  // 1. Layer 1: Fast deterministic pass
  const layer1Result = checkPatterns(message);
  
  // 2. Layer 2: Model-based second opinion
  // We run this regardless of layer 1 to have complete logs, though we could short-circuit.
  // The spec says "Escalate if either layer flags — don't require both to agree."
  const layer2Result = await classifyWithModel(message);

  const isRisk = layer1Result.isRisk || layer2Result.isRisk;

  return {
    isRisk,
    layer1: layer1Result,
    layer2: layer2Result
  };
}
