import { createOpenAIProvider } from './openai';
import type { LlmProviderInterface } from './index';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export function createOpenRouterProvider(apiKey: string): LlmProviderInterface {
  // OpenRouter uses the same API shape as OpenAI, just with a different base URL
  return createOpenAIProvider(apiKey, OPENROUTER_BASE_URL);
}
