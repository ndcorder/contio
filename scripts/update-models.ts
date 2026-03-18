/**
 * Updates the models.yaml file by fetching model lists from each provider's API.
 *
 * Usage: npx tsx scripts/update-models.ts
 *
 * Environment variables:
 *   OPENAI_API_KEY - OpenAI API key
 *   ANTHROPIC_API_KEY - Anthropic API key
 *   GOOGLE_API_KEY - Google API key
 *   OPENROUTER_API_KEY - OpenRouter API key
 *
 * At minimum, OPENROUTER_API_KEY is required for pricing data.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface PricingInfo {
  input: number;
  output: number;
}

interface ModelDefinition {
  id: string;
  display: string;
  pricing: PricingInfo;
  context: number;
}

interface ModelRegistry {
  models: {
    openai: ModelDefinition[];
    anthropic: ModelDefinition[];
    google: ModelDefinition[];
    openrouter: ModelDefinition[];
  };
}

// OpenRouter response types
interface OpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

// OpenAI response types
interface OpenAiModel {
  id: string;
  owned_by?: string;
}

// Anthropic response types
interface AnthropicModel {
  id: string;
  display_name?: string;
}

// Google response types
interface GoogleModel {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
  inputTokenLimit?: number;
}

// Interesting OpenRouter prefixes (third-party models)
const INTERESTING_PREFIXES = [
  'openai/',
  'anthropic/',
  'google/',
  'x-ai/',
  'deepseek/',
  'meta-llama/',
  'mistralai/',
  'qwen/',
  'cohere/',
  'amazon/',
  'microsoft/',
  'perplexity/',
  'ai21/',
  'inflection/',
  'nvidia/',
  'databricks/',
  'snowflake/',
  'zhipu/',
  'minimax/',
  'moonshotai/',
  '01-ai/',
  'nousresearch/',
  'cognitivecomputations/',
  'allenai/',
];

function parsePrice(priceStr?: string): number {
  if (!priceStr) return 0;
  const price = parseFloat(priceStr);
  if (isNaN(price)) return 0;
  // OpenRouter returns price per token, convert to per 1M tokens
  return Math.round(price * 1_000_000 * 100) / 100;
}

function cleanDisplayName(name: string): string {
  const prefixesToRemove = [
    'Meta: ', 'Mistral: ', 'Qwen: ', 'DeepSeek: ', 'Cohere: ', 'xAI: ',
    'Amazon: ', 'Microsoft: ', 'Perplexity: ', 'AI21: ', 'Inflection: ',
    'NVIDIA: ', 'Nvidia: ', 'Databricks: ', 'Snowflake: ', 'Zhipu: ',
    'MiniMax: ', 'Moonshot: ', '01.AI: ', 'Nous: ', 'Allen AI: ',
    'Cognitive Computations: '
  ];

  for (const prefix of prefixesToRemove) {
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
  }
  return name;
}

async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function fetchOpenAiModels(apiKey: string): Promise<OpenAiModel[]> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function fetchAnthropicModels(apiKey: string): Promise<AnthropicModel[]> {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function fetchGoogleModels(apiKey: string): Promise<GoogleModel[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  return data.models || [];
}

function curateOpenRouterModels(models: OpenRouterModel[]): ModelDefinition[] {
  return models
    .filter(m => INTERESTING_PREFIXES.some(p => m.id.toLowerCase().startsWith(p)))
    .filter(m => !m.id.includes(':free'))
    .filter(m => !m.id.includes(':extended'))
    .map(m => ({
      id: m.id,
      display: cleanDisplayName(m.name),
      pricing: {
        input: parsePrice(m.pricing?.prompt),
        output: parsePrice(m.pricing?.completion)
      },
      context: m.context_length || 0
    }));
}

function formatOpenAiDisplayName(modelId: string): string {
  const names: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'o1': 'o1',
    'o1-mini': 'o1 Mini',
    'o1-preview': 'o1 Preview',
    'o1-pro': 'o1 Pro',
    'o3-mini': 'o3 Mini',
  };
  return names[modelId] || modelId;
}

function curateOpenAiModels(
  models: OpenAiModel[],
  openRouterModels: Map<string, OpenRouterModel>
): ModelDefinition[] {
  const chatModels = new Set([
    'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
    'o1', 'o1-mini', 'o1-preview', 'o1-pro', 'o3-mini'
  ]);

  const knownPricing: Record<string, { input: number; output: number; context: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00, context: 128000 },
    'gpt-4o-mini': { input: 0.15, output: 0.60, context: 128000 },
    'gpt-4-turbo': { input: 10.00, output: 30.00, context: 128000 },
    'gpt-4': { input: 30.00, output: 60.00, context: 8192 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50, context: 16385 },
    'o1': { input: 15.00, output: 60.00, context: 200000 },
    'o1-pro': { input: 15.00, output: 60.00, context: 200000 },
    'o3-mini': { input: 1.10, output: 4.40, context: 200000 },
  };

  const result: ModelDefinition[] = [];
  const seen = new Set<string>();

  for (const model of models) {
    // Only include known chat models
    const isChat = chatModels.has(model.id) ||
      Array.from(chatModels).some(c => model.id.startsWith(c));

    if (!isChat) continue;

    // Skip dated snapshots
    if (model.id.includes('-20') && !model.id.endsWith('-preview')) {
      const nonDated = model.id.split('-20')[0];
      if (chatModels.has(nonDated)) continue;
    }

    if (seen.has(model.id)) continue;
    seen.add(model.id);

    // Find pricing
    let pricing = { input: 0, output: 0, context: 128000 };
    for (const [key, value] of Object.entries(knownPricing)) {
      if (model.id.startsWith(key) || model.id === key) {
        pricing = value;
        break;
      }
    }

    // Fallback to OpenRouter pricing
    if (pricing.input === 0) {
      const orModel = openRouterModels.get(`openai/${model.id}`);
      if (orModel) {
        pricing = {
          input: parsePrice(orModel.pricing?.prompt),
          output: parsePrice(orModel.pricing?.completion),
          context: orModel.context_length || 128000
        };
      }
    }

    result.push({
      id: model.id,
      display: formatOpenAiDisplayName(model.id),
      pricing: { input: pricing.input, output: pricing.output },
      context: pricing.context
    });
  }

  return result;
}

function formatAnthropicDisplayName(modelId: string, displayName?: string): string {
  if (displayName) return displayName;

  // Parse model ID like "claude-3-5-sonnet-20241022" -> "Claude 3.5 Sonnet"
  const parts = modelId.split('-');
  if (parts.length >= 3 && parts[0] === 'claude') {
    let version = parts[1];
    if (parts.length >= 4 && /^\d+$/.test(parts[2])) {
      version = `${parts[1]}.${parts[2]}`;
    }
    const tierIdx = parts.length >= 4 && /^\d+$/.test(parts[2]) ? 3 : 2;
    const tier = parts[tierIdx] || '';
    const tierFormatted = tier.charAt(0).toUpperCase() + tier.slice(1);
    return `Claude ${version} ${tierFormatted}`.trim();
  }

  return modelId;
}

function curateAnthropicModels(
  models: AnthropicModel[],
  openRouterModels: Map<string, OpenRouterModel>
): ModelDefinition[] {
  const knownPricing: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku': { input: 0.80, output: 4.00 },
    'claude-3-opus': { input: 15.00, output: 75.00 },
    'claude-3-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    'claude-sonnet-4': { input: 3.00, output: 15.00 },
    'claude-opus-4': { input: 15.00, output: 75.00 },
  };

  return models.map(model => {
    let pricing = { input: 0, output: 0 };

    for (const [key, value] of Object.entries(knownPricing)) {
      if (model.id.startsWith(key)) {
        pricing = value;
        break;
      }
    }

    // Fallback to OpenRouter
    if (pricing.input === 0) {
      const orModel = openRouterModels.get(`anthropic/${model.id}`);
      if (orModel) {
        pricing = {
          input: parsePrice(orModel.pricing?.prompt),
          output: parsePrice(orModel.pricing?.completion)
        };
      }
    }

    return {
      id: model.id,
      display: formatAnthropicDisplayName(model.id, model.display_name),
      pricing,
      context: 200000
    };
  });
}

function formatGoogleDisplayName(modelId: string, displayName?: string): string {
  if (displayName) return displayName;

  // "gemini-2.0-flash" -> "Gemini 2.0 Flash"
  return modelId.split('-').map(p =>
    p.charAt(0).toUpperCase() + p.slice(1)
  ).join(' ');
}

function curateGoogleModels(
  models: GoogleModel[],
  openRouterModels: Map<string, OpenRouterModel>
): ModelDefinition[] {
  const knownPricing: Record<string, { input: number; output: number }> = {
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.5-pro': { input: 1.25, output: 10.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  };

  const result: ModelDefinition[] = [];
  const seen = new Set<string>();

  for (const model of models) {
    // Only include models that support content generation
    if (!model.supportedGenerationMethods?.includes('generateContent')) continue;

    // Extract model ID from "models/gemini-xxx" format
    const modelId = model.name.replace('models/', '');

    // Skip vision-only/embedding models
    if (modelId.includes('vision') || modelId.includes('embedding') || modelId.includes('aqa')) {
      continue;
    }

    if (seen.has(modelId)) continue;
    seen.add(modelId);

    let pricing = { input: 0, output: 0 };
    for (const [key, value] of Object.entries(knownPricing)) {
      if (modelId.startsWith(key)) {
        pricing = value;
        break;
      }
    }

    // Fallback to OpenRouter
    if (pricing.input === 0) {
      const orModel = openRouterModels.get(`google/${modelId}`);
      if (orModel) {
        pricing = {
          input: parsePrice(orModel.pricing?.prompt),
          output: parsePrice(orModel.pricing?.completion)
        };
      }
    }

    result.push({
      id: modelId,
      display: formatGoogleDisplayName(modelId, model.displayName),
      pricing,
      context: model.inputTokenLimit || 128000
    });
  }

  return result;
}

async function main() {
  const openAiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    console.error('Error: OPENROUTER_API_KEY is required for pricing data');
    process.exit(1);
  }

  console.log('Fetching models from providers...\n');

  // Fetch OpenRouter first for pricing data
  console.log('Fetching from OpenRouter...');
  const openRouterModels = await fetchOpenRouterModels(openRouterKey);
  console.log(`  Found ${openRouterModels.length} models`);

  // Index by ID for lookup
  const openRouterLookup = new Map<string, OpenRouterModel>();
  for (const m of openRouterModels) {
    openRouterLookup.set(m.id, m);
  }

  // Curate third-party models from OpenRouter
  const curatedOpenRouter = curateOpenRouterModels(openRouterModels);
  console.log(`  Added ${curatedOpenRouter.length} curated third-party models`);

  // Fetch from OpenAI
  let curatedOpenAi: ModelDefinition[] = [];
  if (openAiKey) {
    console.log('\nFetching from OpenAI...');
    const oaModels = await fetchOpenAiModels(openAiKey);
    console.log(`  Found ${oaModels.length} models`);
    curatedOpenAi = curateOpenAiModels(oaModels, openRouterLookup);
    console.log(`  Added ${curatedOpenAi.length} curated models`);
  } else {
    console.log('\nSkipping OpenAI (no API key)');
  }

  // Fetch from Anthropic
  let curatedAnthropic: ModelDefinition[] = [];
  if (anthropicKey) {
    console.log('\nFetching from Anthropic...');
    const anModels = await fetchAnthropicModels(anthropicKey);
    console.log(`  Found ${anModels.length} models`);
    curatedAnthropic = curateAnthropicModels(anModels, openRouterLookup);
    console.log(`  Added ${curatedAnthropic.length} curated models`);
  } else {
    console.log('\nSkipping Anthropic (no API key)');
  }

  // Fetch from Google
  let curatedGoogle: ModelDefinition[] = [];
  if (googleKey) {
    console.log('\nFetching from Google...');
    const gModels = await fetchGoogleModels(googleKey);
    console.log(`  Found ${gModels.length} models`);
    curatedGoogle = curateGoogleModels(gModels, openRouterLookup);
    console.log(`  Added ${curatedGoogle.length} curated models`);
  } else {
    console.log('\nSkipping Google (no API key)');
  }

  // Sort models
  const sortModels = (models: ModelDefinition[]) =>
    models.sort((a, b) => a.id.localeCompare(b.id));

  const registry: ModelRegistry = {
    models: {
      openai: sortModels(curatedOpenAi),
      anthropic: sortModels(curatedAnthropic),
      google: sortModels(curatedGoogle),
      openrouter: sortModels(curatedOpenRouter)
    }
  };

  // Generate YAML
  const header = `# Contio Model Registry
# Auto-generated by 'npm run update-models'
# Last updated: ${new Date().toISOString().replace('T', ' ').split('.')[0]} UTC
# Pricing is per 1M tokens (USD)

`;

  const yamlContent = header + yaml.dump(registry, {
    indent: 2,
    lineWidth: -1,
    noRefs: true
  });

  // Write to file
  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'models.yaml');
  fs.writeFileSync(outputPath, yamlContent);

  const totalModels =
    registry.models.openai.length +
    registry.models.anthropic.length +
    registry.models.google.length +
    registry.models.openrouter.length;

  console.log(`\nWrote ${totalModels} models to ${outputPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
