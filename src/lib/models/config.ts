export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}

export interface DiscussionSettings {
  defaultRounds: number;
  maxTokensPerResponse: number;
  systemPrompt: string;
  enableAutoConclusion: boolean;
  observerModel: string;
  summaryModel?: string;
  summaryMaxTokens: number;
}

export interface UserConfig {
  apiKeys: ApiKeys;
  defaultModels: string[];
  discussion: DiscussionSettings;
}

export const defaultDiscussionSettings: DiscussionSettings = {
  defaultRounds: 3,
  maxTokensPerResponse: 16384,
  systemPrompt: `You are participating in a multi-model discussion. Engage thoughtfully with the topic and other participants' perspectives. Be concise but substantive. Challenge ideas when appropriate, but also acknowledge valid points from others.`,
  enableAutoConclusion: true,
  observerModel: 'gemini-2.5-flash',
  summaryModel: 'gemini-2.5-flash',
  summaryMaxTokens: 4096
};

export const defaultConfig: UserConfig = {
  apiKeys: {},
  defaultModels: [],
  discussion: defaultDiscussionSettings
};
