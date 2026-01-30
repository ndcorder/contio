import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '$lib/models';
import type { LlmProviderInterface } from './index';

export function createGoogleProvider(apiKey: string): LlmProviderInterface {
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    async getCompletion(
      modelId: string,
      messages: ChatMessage[],
      maxTokens: number,
      signal?: AbortSignal
    ): Promise<string> {
      // Extract system instruction and convert messages to Gemini format
      let systemInstruction: string | undefined;
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemInstruction = msg.content;
        } else {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }

      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: maxTokens
        }
      });

      // Use signal for abort if provided
      if (signal) {
        signal.addEventListener('abort', () => {
          // Google SDK doesn't have native abort support, but we can check before returning
        });
      }

      const result = await model.generateContent({ contents });
      const response = result.response;
      return response.text();
    },

    async *streamCompletion(
      modelId: string,
      messages: ChatMessage[],
      maxTokens: number,
      signal?: AbortSignal
    ): AsyncIterable<string> {
      let systemInstruction: string | undefined;
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemInstruction = msg.content;
        } else {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }

      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: maxTokens
        }
      });

      const result = await model.generateContentStream({ contents });

      for await (const chunk of result.stream) {
        if (signal?.aborted) break;
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    }
  };
}
