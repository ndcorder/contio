import OpenAI from 'openai';
import type { ChatMessage } from '$lib/models';
import type { LlmProviderInterface } from './index';

export function createOpenAIProvider(apiKey: string, baseURL?: string): LlmProviderInterface {
  const client = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true
  });

  return {
    async getCompletion(
      modelId: string,
      messages: ChatMessage[],
      maxTokens: number,
      signal?: AbortSignal
    ): Promise<string> {
      const response = await client.chat.completions.create(
        {
          model: modelId,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          max_tokens: maxTokens
        },
        { signal }
      );

      return response.choices[0]?.message?.content ?? '';
    },

    async *streamCompletion(
      modelId: string,
      messages: ChatMessage[],
      maxTokens: number,
      signal?: AbortSignal
    ): AsyncIterable<string> {
      const stream = await client.chat.completions.create(
        {
          model: modelId,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          max_tokens: maxTokens,
          stream: true
        },
        { signal }
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    }
  };
}
