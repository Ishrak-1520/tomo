import { env } from '@/config/env';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function generateCompletion(
  messages: ChatMessage[],
  temperature = 0.7
): Promise<string | null> {
  if (env.llmProvider === 'ollama') {
    return callOllama(messages, temperature);
  } else {
    return callOpenRouter(messages, temperature);
  }
}

// Helper to call local Ollama via native API
async function callOllama(messages: ChatMessage[], temperature: number): Promise<string | null> {
  try {
    // Determine base URL, strip /v1 if present to use native /api/chat
    const baseUrl = env.ollamaBaseUrl.replace(/\/v1\/?$/, '');
    
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.localModelId,
        messages,
        temperature,
        stream: false
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.message?.content || null;
  } catch (error) {
    console.error('Ollama completion error:', error);
    return null;
  }
}

async function callOpenRouter(messages: ChatMessage[], temperature: number): Promise<string | null> {
  // Implement fallback logic
  for (const modelId of env.openRouterModelFallbacks) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.openRouterApiKey}`,
          'HTTP-Referer': 'https://tomo.com', // Using original site domain as fallback
          'X-Title': 'Tomo BD Pilot',
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          temperature,
        }),
      });

      if (!res.ok) {
        console.warn(`OpenRouter failed for model ${modelId}: ${res.statusText}`);
        continue; // Try next fallback
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error(`OpenRouter error with model ${modelId}:`, error);
      // Continue to fallback
    }
  }

  console.error('All OpenRouter fallback models failed.');
  return null;
}
