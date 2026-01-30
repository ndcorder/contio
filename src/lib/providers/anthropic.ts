import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '$lib/models';
import type { LlmProviderInterface } from './index';

export function createAnthropicProvider(apiKey: string): LlmProviderInterface {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  return {
    async getCompletion(
      modelId: string,
      messages: ChatMessage[],
      maxTokens: number,
      signal?: AbortSignal
    ): Promise<string> {
      // Extract system message if present
      let systemPrompt: string | undefined;
      const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemPrompt = msg.content;
        } else {
          apiMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          });
        }
      }

      const response = await client.messages.create(
        {
          model: modelId,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: apiMessages
        },
        { signal }
      );

      const textBlock = response.content.find(block => block.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : '';
    },

    async *streamCompletion(
      modelId: string,
      messages: ChatMessage[],
      maxTokens: number,
      signal?: AbortSignal
    ): AsyncIterable<string> {
      let systemPrompt: string | undefined;
      const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemPrompt = msg.content;
        } else {
          apiMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          });
        }
      }

      const stream = client.messages.stream(
        {
          model: modelId,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: apiMessages
        },
        { signal }
      );

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    }
  };
}
