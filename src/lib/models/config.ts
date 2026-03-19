import type { LlmProvider } from './participant';

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}

export interface ModelUsageEntry {
  modelId: string;
  provider: LlmProvider;
  lastUsed: string;
  useCount: number;
}

export interface ModelPreset {
  id: string;
  name: string;
  modelIds: string[];
  discussionMode?: string;
  createdAt: string;
}

export interface DiscussionMode {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  finalRoundPrompt?: string;
  participantRoles?: {
    strategy: 'assign-one' | 'assign-all';
    roles: string[];
  };
  icon?: string;
}

export interface DiscussionSettings {
  defaultRounds: number;
  maxTokensPerResponse: number;
  systemPrompt: string;
  enableAutoConclusion: boolean;
  observerModel: string;
  summaryModel?: string;
  summaryMaxTokens: number;
  messageSummaryThreshold: number;
  messageSummaryMaxTokens: number;
  mode: string;
}

export interface UserConfig {
  apiKeys: ApiKeys;
  defaultModels: string[];
  discussion: DiscussionSettings;
  presets: ModelPreset[];
  customModes: DiscussionMode[];
}

export const BUILT_IN_MODES: DiscussionMode[] = [
  {
    id: 'debate',
    name: 'Debate',
    description: 'Models argue positions and challenge each other',
    systemPrompt: 'You are participating in a multi-model discussion. Engage thoughtfully with the topic and other participants\' perspectives. Be concise but substantive. Challenge ideas when appropriate, but also acknowledge valid points from others.',
    finalRoundPrompt: 'Please summarize your position concisely.',
    icon: 'debate'
  },
  {
    id: 'devils-advocate',
    name: "Devil's Advocate",
    description: 'One model opposes the majority to stress-test ideas',
    systemPrompt: 'You are participating in a multi-model discussion. Engage thoughtfully with the topic and other participants\' perspectives. Be concise but substantive. Challenge ideas when appropriate, but also acknowledge valid points from others.',
    finalRoundPrompt: 'State whether you\'ve changed your position and why.',
    participantRoles: {
      strategy: 'assign-one',
      roles: ['You are the devil\'s advocate in this discussion. Your role is to challenge the majority position, find weaknesses in arguments, and present the strongest possible counterpoints — even if you might personally agree with the majority. Push back hard but fairly.']
    },
    icon: 'devils-advocate'
  },
  {
    id: 'steelman',
    name: 'Steelman',
    description: 'Present the strongest version of others\' arguments before critiquing',
    systemPrompt: 'You are participating in a multi-model discussion using the steelman approach. Before critiquing any argument, you MUST first present the strongest possible version of that argument — even stronger than the original if possible. Only after steelmanning may you offer your critique. This ensures intellectual honesty and thorough analysis.',
    finalRoundPrompt: 'Present the single strongest argument from this entire discussion, regardless of who made it.',
    icon: 'steelman'
  },
  {
    id: 'socratic',
    name: 'Socratic',
    description: 'Build understanding through probing questions',
    systemPrompt: 'You are participating in a Socratic discussion. Instead of making direct claims or arguments, focus on asking probing, thought-provoking questions that expose assumptions, reveal contradictions, and deepen understanding. Guide the exploration through inquiry rather than assertion. You may offer brief observations to frame your questions, but questions should be the primary tool.',
    finalRoundPrompt: 'What is the most important question that remains unanswered from this discussion?',
    icon: 'socratic'
  },
  {
    id: 'pros-cons',
    name: 'Pros & Cons',
    description: 'Structured arguments for and against',
    systemPrompt: 'You are participating in a structured pros and cons analysis. Present clear arguments FOR and AGAINST the topic. Use bullet points or numbered lists. Do not directly rebut other participants — instead, focus on building the most comprehensive case for each side. Be balanced and thorough.',
    finalRoundPrompt: 'Present your final weighted assessment: which side is stronger and why? Be specific about which pros/cons you find most compelling.',
    icon: 'pros-cons'
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Build on each other\'s ideas, no critique',
    systemPrompt: 'You are participating in a collaborative brainstorming session. Your role is to BUILD ON and EXPAND other participants\' ideas — never critique or dismiss them. Use "Yes, and..." thinking. Combine ideas in unexpected ways. Go for quantity and creativity. Wild ideas are encouraged. No evaluation or filtering at this stage.',
    finalRoundPrompt: 'Which idea from this session has the most potential and how would you develop it further? Pick one and sketch out next steps.',
    icon: 'brainstorm'
  }
];

export const defaultDiscussionSettings: DiscussionSettings = {
  defaultRounds: 3,
  maxTokensPerResponse: 16384,
  systemPrompt: BUILT_IN_MODES[0].systemPrompt,
  enableAutoConclusion: true,
  observerModel: 'gemini-2.5-flash',
  summaryModel: 'gemini-2.5-flash',
  summaryMaxTokens: 4096,
  messageSummaryThreshold: 500,
  messageSummaryMaxTokens: 100,
  mode: 'debate'
};

export const defaultConfig: UserConfig = {
  apiKeys: {},
  defaultModels: [],
  discussion: defaultDiscussionSettings,
  presets: [],
  customModes: []
};
