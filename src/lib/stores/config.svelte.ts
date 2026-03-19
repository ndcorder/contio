import type { UserConfig, ApiKeys, DiscussionSettings, ModelUsageEntry, ModelPreset, DiscussionMode } from '$lib/models';
import type { LlmProvider } from '$lib/models';
import { defaultConfig, BUILT_IN_MODES } from '$lib/models';

const STORAGE_KEY = 'contio-config';
const USAGE_KEY = 'contio-model-usage';

function loadFromStorage(): UserConfig {
  if (typeof localStorage === 'undefined') return defaultConfig;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultConfig;

  try {
    const parsed = JSON.parse(stored);
    return {
      ...defaultConfig,
      ...parsed,
      discussion: { ...defaultConfig.discussion, ...parsed.discussion },
      presets: parsed.presets ?? [],
      customModes: parsed.customModes ?? []
    };
  } catch {
    return defaultConfig;
  }
}

function saveToStorage(config: UserConfig): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function loadUsageFromStorage(): ModelUsageEntry[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(USAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveUsageToStorage(usage: ModelUsageEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

function createConfigStore() {
  let config = $state<UserConfig>(loadFromStorage());
  let modelUsage = $state<ModelUsageEntry[]>(loadUsageFromStorage());

  return {
    get value() {
      return config;
    },

    get apiKeys() {
      return config.apiKeys;
    },

    get defaultModels() {
      return config.defaultModels;
    },

    get discussion() {
      return config.discussion;
    },

    get presets() {
      return config.presets;
    },

    get customModes() {
      return config.customModes;
    },

    setApiKey(provider: keyof ApiKeys, key: string | undefined) {
      config.apiKeys = { ...config.apiKeys, [provider]: key };
      saveToStorage(config);
    },

    setDefaultModels(models: string[]) {
      config.defaultModels = models;
      saveToStorage(config);
    },

    updateDiscussion(settings: Partial<DiscussionSettings>) {
      config.discussion = { ...config.discussion, ...settings };
      saveToStorage(config);
    },

    reset() {
      config = { ...defaultConfig };
      saveToStorage(config);
    },

    hasApiKey(provider: keyof ApiKeys): boolean {
      return !!config.apiKeys[provider];
    },

    // --- Model Usage (Recents) ---

    recordModelUsage(modelId: string, provider: LlmProvider) {
      const existing = modelUsage.find(e => e.modelId === modelId);
      if (existing) {
        existing.lastUsed = new Date().toISOString();
        existing.useCount++;
        modelUsage = [...modelUsage];
      } else {
        modelUsage = [...modelUsage, {
          modelId,
          provider,
          lastUsed: new Date().toISOString(),
          useCount: 1
        }];
      }
      saveUsageToStorage(modelUsage);
    },

    getRecentModels(limit = 15): ModelUsageEntry[] {
      return [...modelUsage]
        .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .slice(0, limit);
    },

    // --- Model Presets ---

    addPreset(name: string, modelIds: string[], discussionMode?: string): ModelPreset {
      const preset: ModelPreset = {
        id: crypto.randomUUID(),
        name,
        modelIds,
        discussionMode,
        createdAt: new Date().toISOString()
      };
      config.presets = [...config.presets, preset];
      saveToStorage(config);
      return preset;
    },

    removePreset(id: string) {
      config.presets = config.presets.filter(p => p.id !== id);
      saveToStorage(config);
    },

    renamePreset(id: string, name: string) {
      const preset = config.presets.find(p => p.id === id);
      if (preset) {
        preset.name = name;
        config.presets = [...config.presets];
        saveToStorage(config);
      }
    },

    // --- Discussion Modes ---

    getAllModes(): DiscussionMode[] {
      return [...BUILT_IN_MODES, ...config.customModes];
    },

    getMode(id: string): DiscussionMode | undefined {
      return BUILT_IN_MODES.find(m => m.id === id) ?? config.customModes.find(m => m.id === id);
    },

    addCustomMode(mode: Omit<DiscussionMode, 'id'>): DiscussionMode {
      const fullMode: DiscussionMode = { ...mode, id: crypto.randomUUID() };
      config.customModes = [...config.customModes, fullMode];
      saveToStorage(config);
      return fullMode;
    },

    removeCustomMode(id: string) {
      config.customModes = config.customModes.filter(m => m.id !== id);
      saveToStorage(config);
    }
  };
}

export const configStore = createConfigStore();
