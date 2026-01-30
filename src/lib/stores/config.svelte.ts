import type { UserConfig, ApiKeys, DiscussionSettings } from '$lib/models';
import { defaultConfig } from '$lib/models';

const STORAGE_KEY = 'contio-config';

function loadFromStorage(): UserConfig {
  if (typeof localStorage === 'undefined') return defaultConfig;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultConfig;

  try {
    const parsed = JSON.parse(stored);
    return {
      ...defaultConfig,
      ...parsed,
      discussion: { ...defaultConfig.discussion, ...parsed.discussion }
    };
  } catch {
    return defaultConfig;
  }
}

function saveToStorage(config: UserConfig): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function createConfigStore() {
  let config = $state<UserConfig>(loadFromStorage());

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
    }
  };
}

export const configStore = createConfigStore();
