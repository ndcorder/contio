import type { UserConfig } from '$lib/models';
import { defaultConfig } from '$lib/models';

const STORAGE_KEY = 'contio-config';

export function loadConfig(): UserConfig {
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

export function saveConfig(config: UserConfig): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
