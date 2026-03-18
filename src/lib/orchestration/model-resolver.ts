import type { LlmProvider, ModelParticipant } from '$lib/models';
// @ts-expect-error - YAML import handled by @rollup/plugin-yaml
import modelRegistry from '$lib/data/models.yaml';

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
  openai: '#10a37f',    // OpenAI green
  anthropic: '#d97706', // Anthropic orange
  google: '#4285f4',    // Google blue
  openrouter: '#a855f7' // OpenRouter purple
};

export interface PricingInfo {
  input: number;
  output: number;
}

export interface ModelDefinition {
  id: string;
  display: string;
  context: number;
  pricing?: PricingInfo;
  provider?: LlmProvider;
}

interface YamlModelRegistry {
  models: {
    openai: ModelDefinition[];
    anthropic: ModelDefinition[];
    google: ModelDefinition[];
    openrouter: ModelDefinition[];
  };
}

// Build a lookup map from the registry
const modelLookup = new Map<string, ModelDefinition>();

function initRegistry() {
  const registry = modelRegistry as YamlModelRegistry;

  for (const model of registry.models.openai) {
    modelLookup.set(model.id.toLowerCase(), { ...model, provider: 'openai' });
  }
  for (const model of registry.models.anthropic) {
    modelLookup.set(model.id.toLowerCase(), { ...model, provider: 'anthropic' });
  }
  for (const model of registry.models.google) {
    modelLookup.set(model.id.toLowerCase(), { ...model, provider: 'google' });
  }
  for (const model of registry.models.openrouter) {
    modelLookup.set(model.id.toLowerCase(), { ...model, provider: 'openrouter' });
  }
}
initRegistry();

export function getModel(modelId: string): ModelDefinition | undefined {
  return modelLookup.get(modelId.toLowerCase());
}

export function resolveProvider(modelId: string): LlmProvider {
  // First check the registry
  const model = getModel(modelId);
  if (model?.provider) {
    return model.provider;
  }

  // Fall back to prefix-based resolution
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
  if (lower.startsWith('gemini-') || lower.startsWith('gemma-')) {
    return 'google';
  }

  // Default to OpenRouter for unknown models
  return 'openrouter';
}

export function getDisplayName(modelId: string): string {
  // Check registry first
  const model = getModel(modelId);
  if (model) {
    return model.display;
  }

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

// Get all models from the registry, grouped by provider
export function getAllModels(): Record<LlmProvider, ModelDefinition[]> {
  const registry = modelRegistry as YamlModelRegistry;
  return {
    openai: registry.models.openai.map(m => ({ ...m, provider: 'openai' as LlmProvider })),
    anthropic: registry.models.anthropic.map(m => ({ ...m, provider: 'anthropic' as LlmProvider })),
    google: registry.models.google.map(m => ({ ...m, provider: 'google' as LlmProvider })),
    openrouter: registry.models.openrouter.map(m => ({ ...m, provider: 'openrouter' as LlmProvider }))
  };
}

// Flat list of all models for easy iteration
export function getAllModelsList(): ModelDefinition[] {
  const all = getAllModels();
  return [
    ...all.openai,
    ...all.anthropic,
    ...all.google,
    ...all.openrouter
  ];
}

// Get model count per provider
export function getModelCounts(): Record<LlmProvider, number> {
  const all = getAllModels();
  return {
    openai: all.openai.length,
    anthropic: all.anthropic.length,
    google: all.google.length,
    openrouter: all.openrouter.length
  };
}
