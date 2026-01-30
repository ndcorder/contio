<script lang="ts">
  import { uiStore, configStore } from '$lib/stores';
  import { COMMON_MODELS, PROVIDER_COLORS } from '$lib/orchestration';
  import type { LlmProvider } from '$lib/models';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();

  let customModelInput = $state('');

  function isSelected(modelId: string): boolean {
    return uiStore.selectedModels.includes(modelId);
  }

  function hasApiKey(provider: LlmProvider): boolean {
    return configStore.hasApiKey(provider);
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
</script>

<div class="model-selector">
  <div class="selector-header">
    <h3>Select Models</h3>
    <span class="selected-count">{uiStore.selectedModels.length} selected</span>
  </div>

  <div class="model-list">
    {#each COMMON_MODELS as model}
      {@const enabled = hasApiKey(model.provider)}
      <button
        class="model-item"
        class:selected={isSelected(model.id)}
        class:disabled={!enabled}
        onclick={() => enabled && uiStore.toggleModel(model.id)}
        disabled={!enabled}
        title={enabled ? '' : `Configure ${model.provider} API key in settings`}
      >
        <span class="checkbox" class:checked={isSelected(model.id)}>
          {#if isSelected(model.id)}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          {/if}
        </span>
        <span class="model-name">{model.name}</span>
        <span class="provider-badge" style="background: {PROVIDER_COLORS[model.provider]}20; color: {PROVIDER_COLORS[model.provider]}">
          {model.provider}
        </span>
      </button>
    {/each}
  </div>

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
      <div class="selected-label">Selected:</div>
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

  .model-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 12px;
  }

  .model-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    text-align: left;
    transition: background 0.15s;
  }

  .model-item:hover:not(.disabled) {
    background: var(--bg-hover);
  }

  .model-item.selected {
    background: var(--accent);
    background: rgba(99, 102, 241, 0.15);
  }

  .model-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .model-name {
    flex: 1;
    font-size: 13px;
    color: var(--text-primary);
  }

  .provider-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 500;
  }

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

  .selected-models {
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .selected-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
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
