<script lang="ts">
  import { uiStore, configStore } from '$lib/stores';
  import { getAllModels, PROVIDER_COLORS, type ModelDefinition } from '$lib/orchestration';
  import type { LlmProvider } from '$lib/models';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();

  let customModelInput = $state('');
  let searchQuery = $state('');
  let activeTab = $state<LlmProvider | 'recents'>('recents');
  let showKeyInput = $state(false);
  let keyInputValue = $state('');
  let keySavedMsg = $state(false);
  let showPresetInput = $state(false);
  let presetNameInput = $state('');
  let editingPresetId = $state<string | null>(null);
  let editingPresetName = $state('');

  const allModels = getAllModels();
  const providers: LlmProvider[] = ['openai', 'anthropic', 'google', 'openrouter'];

  const recentModels = $derived(configStore.getRecentModels());

  function getFilteredModels(): ModelDefinition[] {
    if (activeTab === 'recents') {
      const recents = recentModels;
      const allModelsList = [...allModels.openai, ...allModels.anthropic, ...allModels.google, ...allModels.openrouter];
      const recentDefs = recents.map(r => {
        const found = allModelsList.find(m => m.id === r.modelId);
        if (found) return { ...found, provider: r.provider };
        return { id: r.modelId, display: r.modelId, context: 0, provider: r.provider };
      });

      if (!searchQuery.trim()) return recentDefs;
      const query = searchQuery.toLowerCase();
      return recentDefs.filter(m =>
        m.id.toLowerCase().includes(query) ||
        m.display.toLowerCase().includes(query)
      );
    }

    const models = allModels[activeTab];
    if (!searchQuery.trim()) return models;

    const query = searchQuery.toLowerCase();
    return models.filter(m =>
      m.id.toLowerCase().includes(query) ||
      m.display.toLowerCase().includes(query)
    );
  }

  function isSelected(modelId: string): boolean {
    return uiStore.selectedModels.includes(modelId);
  }

  function hasApiKey(provider: LlmProvider): boolean {
    return configStore.hasApiKey(provider);
  }

  function toggleModel(modelId: string) {
    uiStore.toggleModel(modelId);
  }

  function addCustomModel() {
    const trimmed = customModelInput.trim();
    if (trimmed && !uiStore.selectedModels.includes(trimmed)) {
      uiStore.toggleModel(trimmed);
      customModelInput = '';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      addCustomModel();
    } else if (event.key === 'Escape') {
      onClose?.();
    }
  }

  function getProviderLabel(provider: LlmProvider): string {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic';
      case 'google': return 'Google';
      case 'openrouter': return 'OpenRouter';
    }
  }

  function getProviderShortLabel(provider: LlmProvider): string {
    switch (provider) {
      case 'openai': return 'OAI';
      case 'anthropic': return 'Ant';
      case 'google': return 'Ggl';
      case 'openrouter': return 'OR';
    }
  }

  function getPlaceholder(provider: LlmProvider): string {
    switch (provider) {
      case 'openai': return 'sk-...';
      case 'anthropic': return 'sk-ant-...';
      case 'google': return 'AI...';
      case 'openrouter': return 'sk-or-...';
    }
  }

  function saveApiKey() {
    const value = keyInputValue.trim();
    if (!value) return;
    if (activeTab !== 'recents') {
      configStore.setApiKey(activeTab, value);
    }
    keyInputValue = '';
    showKeyInput = false;
    keySavedMsg = true;
    setTimeout(() => { keySavedMsg = false; }, 2000);
  }

  // Preset functions
  function saveAsPreset() {
    const name = presetNameInput.trim();
    if (!name || uiStore.selectedModels.length === 0) return;
    configStore.addPreset(name, [...uiStore.selectedModels], uiStore.selectedMode);
    presetNameInput = '';
    showPresetInput = false;
  }

  function loadPreset(preset: { modelIds: string[]; discussionMode?: string }) {
    uiStore.setSelectedModels(preset.modelIds);
    if (preset.discussionMode) {
      uiStore.setSelectedMode(preset.discussionMode);
    }
  }

  function startEditPreset(id: string, name: string, event: MouseEvent) {
    event.stopPropagation();
    editingPresetId = id;
    editingPresetName = name;
  }

  function finishEditPreset() {
    if (editingPresetId && editingPresetName.trim()) {
      configStore.renamePreset(editingPresetId, editingPresetName.trim());
    }
    editingPresetId = null;
    editingPresetName = '';
  }

  function deletePreset(id: string, event: MouseEvent) {
    event.stopPropagation();
    configStore.removePreset(id);
  }

  function getModelSearchCount(): number {
    if (activeTab === 'recents') return recentModels.length;
    return allModels[activeTab].length;
  }

  function getProviderForModel(modelId: string): LlmProvider | undefined {
    if (activeTab !== 'recents') return activeTab;
    const recent = recentModels.find(r => r.modelId === modelId);
    return recent?.provider;
  }
</script>

<div class="model-selector">
  <div class="selector-header">
    <h3>Select Models</h3>
    <span class="selected-count">{uiStore.selectedModels.length} selected</span>
  </div>

  <!-- Presets Row -->
  {#if configStore.presets.length > 0}
    <div class="presets-row">
      <span class="presets-label">Presets:</span>
      <div class="presets-chips">
        {#each configStore.presets as preset (preset.id)}
          {#if editingPresetId === preset.id}
            <input
              class="preset-edit-input"
              type="text"
              bind:value={editingPresetName}
              onblur={finishEditPreset}
              onkeydown={(e) => { if (e.key === 'Enter') finishEditPreset(); if (e.key === 'Escape') { editingPresetId = null; } }}
              autofocus
            />
          {:else}
            <div
              class="preset-chip"
              role="button"
              tabindex="0"
              onclick={() => loadPreset(preset)}
              onkeydown={(e) => { if (e.key === 'Enter') loadPreset(preset); }}
              title="{preset.modelIds.length} models: {preset.modelIds.join(', ')}"
            >
              <span class="preset-name">{preset.name}</span>
              <span class="preset-count">{preset.modelIds.length}</span>
              <span class="preset-edit" role="button" tabindex="0" onclick={(e) => startEditPreset(preset.id, preset.name, e)} onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); startEditPreset(preset.id, preset.name, e as unknown as MouseEvent); }}} title="Rename" aria-label="Rename preset">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </span>
              <span class="preset-delete" role="button" tabindex="0" onclick={(e) => deletePreset(preset.id, e)} onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); deletePreset(preset.id, e as unknown as MouseEvent); }}} title="Delete" aria-label="Delete preset">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <div class="provider-tabs">
    <button
      class="tab"
      class:active={activeTab === 'recents'}
      onclick={() => { activeTab = 'recents'; searchQuery = ''; }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span class="tab-label">Recent</span>
      <span class="tab-count">{recentModels.length}</span>
    </button>
    {#each providers as provider}
      <button
        class="tab"
        class:active={activeTab === provider}
        class:has-key={hasApiKey(provider)}
        onclick={() => { activeTab = provider; searchQuery = ''; }}
        style="--provider-color: {PROVIDER_COLORS[provider]}"
      >
        <span class="tab-dot"></span>
        <span class="tab-label">{getProviderShortLabel(provider)}</span>
        <span class="tab-count">{allModels[provider].length}</span>
        {#if !hasApiKey(provider)}
          <span class="no-key-icon" title="API key not configured">!</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="search-box">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      type="text"
      placeholder="Search {getModelSearchCount()} models..."
      bind:value={searchQuery}
    />
    {#if searchQuery}
      <button class="clear-search" onclick={() => searchQuery = ''} aria-label="Clear search">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    {/if}
  </div>

  <div class="model-list">
    {#each getFilteredModels() as model (model.id)}
      {@const modelProvider = getProviderForModel(model.id)}
      {@const keyConfigured = modelProvider ? hasApiKey(modelProvider) : true}
      <button
        class="model-item"
        class:selected={isSelected(model.id)}
        class:no-key={!keyConfigured}
        onclick={() => toggleModel(model.id)}
      >
        <span class="checkbox" class:checked={isSelected(model.id)}>
          {#if isSelected(model.id)}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          {/if}
        </span>
        <span class="model-info">
          <span class="model-name">
            {#if activeTab === 'recents' && model.provider}
              <span class="provider-dot" style="background: {PROVIDER_COLORS[model.provider as LlmProvider]}"></span>
            {/if}
            {model.display}
          </span>
          <span class="model-id">{model.id}</span>
        </span>
        {#if model.context > 0}
          <span class="context-size">{(model.context / 1000).toFixed(0)}k</span>
        {/if}
      </button>
    {/each}
    {#if getFilteredModels().length === 0}
      {#if activeTab === 'recents' && !searchQuery}
        <div class="no-results">Your recently used models will appear here</div>
      {:else}
        <div class="no-results">No models match "{searchQuery}"</div>
      {/if}
    {/if}
  </div>

  {#if activeTab !== 'recents' && !hasApiKey(activeTab)}
    <div class="api-key-warning">
      <div class="api-key-warning-top">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          No API key configured for {getProviderLabel(activeTab)}.
          <button class="setup-now-link" onclick={() => { showKeyInput = !showKeyInput; }}>Set up now</button>
          or <a href="/settings">Settings</a>
        </span>
      </div>
      {#if showKeyInput}
        <div class="api-key-inline-form">
          <input
            type="password"
            class="api-key-input"
            placeholder={getPlaceholder(activeTab)}
            bind:value={keyInputValue}
            onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') saveApiKey(); }}
          />
          <button class="api-key-save-btn" onclick={saveApiKey} disabled={!keyInputValue.trim()}>Save</button>
        </div>
      {/if}
    </div>
  {:else if keySavedMsg}
    <div class="api-key-saved">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>Saved!</span>
    </div>
  {/if}

  <div class="custom-model">
    <input
      type="text"
      placeholder="Add custom model ID..."
      bind:value={customModelInput}
      onkeydown={handleKeydown}
    />
    <button class="add-btn" onclick={addCustomModel} disabled={!customModelInput.trim()}>
      Add
    </button>
  </div>

  {#if uiStore.selectedModels.length > 0}
    <div class="selected-models">
      <div class="selected-header">
        <span class="selected-label">Selected:</span>
        {#if !showPresetInput}
          <button class="save-preset-btn" onclick={() => showPresetInput = true}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save as preset
          </button>
        {/if}
      </div>
      {#if showPresetInput}
        <div class="preset-save-form">
          <input
            type="text"
            class="preset-name-input"
            placeholder="Preset name..."
            bind:value={presetNameInput}
            onkeydown={(e) => { if (e.key === 'Enter') saveAsPreset(); if (e.key === 'Escape') showPresetInput = false; }}
            autofocus
          />
          <button class="preset-save-btn" onclick={saveAsPreset} disabled={!presetNameInput.trim()}>Save</button>
          <button class="preset-cancel-btn" onclick={() => showPresetInput = false}>Cancel</button>
        </div>
      {/if}
      <div class="selected-tags">
        {#each uiStore.selectedModels as modelId}
          <span class="selected-tag">
            {modelId}
            <button class="remove-btn" onclick={() => uiStore.toggleModel(modelId)} aria-label="Remove {modelId}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .model-selector {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    max-width: 500px;
  }

  .selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .selector-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .selected-count {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* Presets */
  .presets-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    overflow-x: auto;
  }

  .presets-label {
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .presets-chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
  }

  .preset-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-primary);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.15s;
    user-select: none;
  }

  .preset-chip:hover {
    border-color: var(--accent);
  }

  .preset-name {
    font-weight: 500;
  }

  .preset-count {
    font-size: 10px;
    padding: 1px 4px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    color: var(--text-muted);
  }

  .preset-edit, .preset-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s;
  }

  .preset-chip:hover .preset-edit,
  .preset-chip:hover .preset-delete {
    opacity: 1;
  }

  .preset-edit:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .preset-delete:hover {
    background: var(--error);
    color: white;
  }

  .preset-edit-input {
    padding: 4px 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--accent);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-primary);
    outline: none;
    width: 100px;
  }

  /* Provider Tabs */
  .provider-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
    padding: 4px;
    background: var(--bg-secondary);
    border-radius: 8px;
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    transition: background 0.15s, color 0.15s;
  }

  .tab:hover {
    background: var(--bg-hover);
  }

  .tab.active {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .tab-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--provider-color);
    opacity: 0.5;
  }

  .tab.active .tab-dot,
  .tab.has-key .tab-dot {
    opacity: 1;
  }

  .tab-label {
    font-size: 11px;
  }

  .tab-count {
    font-size: 10px;
    padding: 1px 4px;
    background: var(--bg-primary);
    border-radius: 3px;
    color: var(--text-muted);
  }

  .tab.active .tab-count {
    background: var(--bg-secondary);
  }

  .no-key-icon {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--warning);
    color: black;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Search */
  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .search-box svg {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .search-box input {
    flex: 1;
    background: transparent;
    border: none;
    font-size: 13px;
    color: var(--text-primary);
    outline: none;
  }

  .search-box input::placeholder {
    color: var(--text-muted);
  }

  .clear-search {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
  }

  .clear-search:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .no-results {
    text-align: center;
    padding: 20px;
    color: var(--text-muted);
    font-size: 13px;
  }

  /* Model list */
  .model-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 280px;
    overflow-y: auto;
    margin-bottom: 12px;
  }

  .model-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 6px;
    text-align: left;
    transition: background 0.15s;
  }

  .model-item:hover {
    background: var(--bg-hover);
  }

  .model-item.selected {
    background: rgba(99, 102, 241, 0.15);
  }

  .model-item.no-key {
    opacity: 0.7;
  }

  .checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color 0.15s, background 0.15s;
  }

  .checkbox.checked {
    border-color: var(--accent);
    background: var(--accent);
    color: white;
  }

  .model-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .model-name {
    font-size: 13px;
    color: var(--text-primary);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .provider-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .model-id {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .context-size {
    font-size: 11px;
    color: var(--text-muted);
    padding: 2px 6px;
    background: var(--bg-secondary);
    border-radius: 4px;
    flex-shrink: 0;
  }

  /* API Key */
  .api-key-warning {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    color: var(--warning);
  }

  .api-key-warning-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .api-key-warning-top svg {
    flex-shrink: 0;
  }

  .api-key-warning a {
    color: var(--warning);
    text-decoration: underline;
  }

  .setup-now-link {
    background: none;
    border: none;
    padding: 0;
    font-size: inherit;
    font-family: inherit;
    color: var(--accent);
    cursor: pointer;
    text-decoration: none;
  }

  .setup-now-link:hover {
    text-decoration: underline;
  }

  .api-key-inline-form {
    display: flex;
    gap: 8px;
  }

  .api-key-input {
    flex: 1;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-primary);
    outline: none;
  }

  .api-key-input:focus {
    border-color: var(--accent);
  }

  .api-key-input::placeholder {
    color: var(--text-muted);
  }

  .api-key-save-btn {
    background: var(--accent);
    color: white;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .api-key-save-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .api-key-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .api-key-saved {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    color: rgb(34, 197, 94);
  }

  /* Custom model */
  .custom-model {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .custom-model input {
    flex: 1;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
  }

  .custom-model input:focus {
    border-color: var(--accent);
  }

  .add-btn {
    padding: 8px 16px;
    background: var(--accent);
    color: white;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.15s;
  }

  .add-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Selected models */
  .selected-models {
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .selected-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .selected-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .save-preset-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }

  .save-preset-btn:hover {
    color: var(--accent);
    background: var(--bg-hover);
  }

  .preset-save-form {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }

  .preset-name-input {
    flex: 1;
    padding: 6px 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--accent);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-primary);
    outline: none;
  }

  .preset-save-btn {
    padding: 6px 12px;
    background: var(--accent);
    color: white;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }

  .preset-save-btn:disabled {
    opacity: 0.5;
  }

  .preset-cancel-btn {
    padding: 6px 12px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border-radius: 6px;
    font-size: 12px;
  }

  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .selected-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 4px 8px;
    background: var(--bg-secondary);
    border-radius: 4px;
    color: var(--text-primary);
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
  }

  .remove-btn:hover {
    background: var(--error);
    color: white;
  }
</style>
