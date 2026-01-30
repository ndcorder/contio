import type { ChatMessage, LlmProvider } from '$lib/models';

export interface LlmProviderInterface {
  getCompletion(
    modelId: string,
    messages: ChatMessage[],
    maxTokens: number,
    signal?: AbortSignal
  ): Promise<string>;

  streamCompletion?(
    modelId: string,
    messages: ChatMessage[],
    maxTokens: number,
    signal?: AbortSignal
  ): AsyncIterable<string>;
}

export type ProviderFactory = (apiKey: string) => LlmProviderInterface;

export { createOpenAIProvider } from './openai';
export { createAnthropicProvider } from './anthropic';
export { createGoogleProvider } from './google';
export { createOpenRouterProvider } from './openrouter';

import { createOpenAIProvider } from './openai';
import { createAnthropicProvider } from './anthropic';
import { createGoogleProvider } from './google';
import { createOpenRouterProvider } from './openrouter';
import type { ApiKeys } from '$lib/models';

export function createProviders(apiKeys: ApiKeys): Map<LlmProvider, LlmProviderInterface> {
  const providers = new Map<LlmProvider, LlmProviderInterface>();

  if (apiKeys.openai) {
    providers.set('openai', createOpenAIProvider(apiKeys.openai));
  }
  if (apiKeys.anthropic) {
    providers.set('anthropic', createAnthropicProvider(apiKeys.anthropic));
  }
  if (apiKeys.google) {
    providers.set('google', createGoogleProvider(apiKeys.google));
  }
  if (apiKeys.openrouter) {
    providers.set('openrouter', createOpenRouterProvider(apiKeys.openrouter));
  }

  return providers;
}
