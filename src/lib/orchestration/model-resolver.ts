import type { LlmProvider, ModelParticipant } from '$lib/models';

// Color palette for participants
const COLOR_PALETTE = [
  '#00d7ff', // cyan
  '#00ff00', // green
  '#ffff00', // yellow
  '#ff00ff', // magenta
  '#ff8700', // orange
  '#0087ff', // blue
  '#ff0000'  // red
];

// Provider colors for UI consistency
export const PROVIDER_COLORS: Record<LlmProvider, string> = {
  openai: '#00ff00',    // green
  anthropic: '#ff8700', // orange
  google: '#0087ff',    // blue
  openrouter: '#ff00ff' // magenta
};

export function resolveProvider(modelId: string): LlmProvider {
  const lower = modelId.toLowerCase();

  // OpenAI models
  if (lower.startsWith('gpt-') ||
      lower.startsWith('o1') ||
      lower.startsWith('o3') ||
      lower.startsWith('o4')) {
    return 'openai';
  }

  // Anthropic models
  if (lower.startsWith('claude-')) {
    return 'anthropic';
  }

  // Google models
  if (lower.startsWith('gemini-')) {
    return 'google';
  }

  // Default to OpenRouter for unknown models
  return 'openrouter';
}

export function getDisplayName(modelId: string): string {
  // If it contains a slash (OpenRouter format), use the part after the slash
  if (modelId.includes('/')) {
    return modelId.split('/').pop() ?? modelId;
  }
  return modelId;
}

export function parseModels(modelIds: string[]): ModelParticipant[] {
  return modelIds.map((modelId, index) => ({
    modelId,
    displayName: getDisplayName(modelId),
    provider: resolveProvider(modelId),
    color: COLOR_PALETTE[index % COLOR_PALETTE.length]
  }));
}

export function parseModelsCsv(csv: string): ModelParticipant[] {
  const modelIds = csv
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return parseModels(modelIds);
}

// Common models for quick selection
export const COMMON_MODELS: Array<{ id: string; name: string; provider: LlmProvider }> = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
  { id: 'o1', name: 'o1', provider: 'openai' },
  { id: 'o1-mini', name: 'o1 Mini', provider: 'openai' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' }
];
