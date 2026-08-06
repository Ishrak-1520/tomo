export const env = {
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // LLM Configuration
  llmProvider: (process.env.LLM_PROVIDER || 'ollama') as 'openrouter' | 'ollama',
  
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  // Fallback models for OpenRouter
  openRouterModelFallbacks: ['google/gemma-2-9b-it:free', 'meta-llama/llama-3.1-8b-instruct:free'],
  
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1',
  localModelId: process.env.LOCAL_MODEL_ID || 'qwen3:8b',
};

// Simple validation
export function validateEnv() {
  if (env.llmProvider === 'openrouter' && !env.openRouterApiKey) {
    console.warn('WARNING: OPENROUTER_API_KEY is not set but LLM_PROVIDER is openrouter.');
  }
}
