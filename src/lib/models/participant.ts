export type LlmProvider = 'openai' | 'anthropic' | 'google' | 'openrouter';

export interface ModelParticipant {
  modelId: string;
  displayName: string;
  provider: LlmProvider;
  color: string;
}
