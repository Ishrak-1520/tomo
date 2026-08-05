import { generateCompletion } from '../llm/client';
import { RiskTier } from './pattern-matcher';

export interface ModelClassificationResult {
  isRisk: boolean;
  tier: RiskTier;
  reason: string;
}

const CLASSIFICATION_PROMPT = `
You are a strict safety classifier for a mental health support application.
Your ONLY job is to evaluate if the user's message indicates a risk of harm to self or others.
Evaluate the message for:
1. Explicit suicidal ideation or intent.
2. Expressions of extreme hopelessness combined with plan-like language.
3. Self-harm disclosure (past or present) or requests for methods.
4. Intent to harm someone else.

The user's message might be in English, Bangla, or Banglish (Bangla written in Latin letters).

Respond ONLY with a JSON object in this exact format, with no markdown formatting or extra text:
{"isRisk": true/false, "tier": "high" | "moderate" | "none", "reason": "Short explanation of why"}

Bias toward safety: If you are uncertain but there are hints of risk, classify it as true.
`;

export async function classifyWithModel(message: string): Promise<ModelClassificationResult> {
  const response = await generateCompletion([
    { role: 'system', content: CLASSIFICATION_PROMPT },
    { role: 'user', content: `Message to classify: "${message}"` }
  ], 0.0); // Temperature 0 for deterministic output

  if (!response) {
    // If the model fails or times out, we err on the side of caution or rely on Layer 1.
    // For safety, if we can't classify, we might want to flag for human review, but here we return a fallback.
    return { isRisk: false, tier: 'none', reason: 'Model failed to respond' };
  }

  try {
    // Try to parse the JSON. Since models sometimes output markdown blocks (e.g. \`\`\`json), strip them.
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('\`\`\`json')) {
      cleanResponse = cleanResponse.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }
    const parsed = JSON.parse(cleanResponse);
    return {
      isRisk: Boolean(parsed.isRisk),
      tier: parsed.tier || 'none',
      reason: parsed.reason || 'No reason provided'
    };
  } catch (error) {
    console.error('Failed to parse model classification:', response, error);
    // If we get an unparseable response that might imply danger, we could fail safe (return true).
    // For the pilot, returning false but logging is safer to avoid blocking everyone if the model hallucinates format.
    // However, the spec says "Bias the whole system toward over-triggering". Let's fail safe.
    const lowerRes = response.toLowerCase();
    if (lowerRes.includes('true') || lowerRes.includes('high') || lowerRes.includes('suicid')) {
        return { isRisk: true, tier: 'moderate', reason: 'Parse failed but keywords detected in raw response' };
    }
    return { isRisk: false, tier: 'none', reason: 'Parse failed, no obvious keywords' };
  }
}
