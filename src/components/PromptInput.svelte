<script lang="ts">
  import { uiStore } from '$lib/stores';
  import ModelSelector from './ModelSelector.svelte';

  interface Props {
    onSubmit: (prompt: string, models: string[]) => void;
    disabled?: boolean;
  }

  let { onSubmit, disabled = false }: Props = $props();

  let showModelSelector = $state(false);
  let textareaEl: HTMLTextAreaElement;

  function handleSubmit() {
    const prompt = uiStore.promptBuffer.trim();
    const models = uiStore.selectedModels;

    if (!prompt || models.length < 2 || disabled) return;

    onSubmit(prompt, models);
    uiStore.clearPrompt();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function toggleModelSelector() {
    showModelSelector = !showModelSelector;
  }
</script>

<div class="prompt-input">
  {#if showModelSelector}
    <div class="model-selector-container">
      <ModelSelector onClose={() => showModelSelector = false} />
    </div>
  {/if}

  <div class="input-row">
    <button
      class="model-btn"
      onclick={toggleModelSelector}
      class:active={showModelSelector}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
      </svg>
      <span class="model-count">{uiStore.selectedModels.length}</span>
    </button>

    <textarea
      bind:this={textareaEl}
      class="prompt-textarea"
      placeholder="Enter a topic for discussion..."
      value={uiStore.promptBuffer}
      oninput={(e) => uiStore.setPromptBuffer(e.currentTarget.value)}
      onkeydown={handleKeydown}
      {disabled}
    ></textarea>

    <button
      class="submit-btn"
      onclick={handleSubmit}
      disabled={disabled || !uiStore.promptBuffer.trim() || uiStore.selectedModels.length < 2}
      title={uiStore.selectedModels.length < 2 ? 'Select at least 2 models' : 'Start discussion (Cmd+Enter)'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    </button>
  </div>

  <div class="input-footer">
    {#if uiStore.selectedModels.length < 2}
      <span class="hint error">Select at least 2 models to start a discussion</span>
    {:else}
      <span class="hint">Press Cmd+Enter to send</span>
    {/if}
    <span class="models-preview">
      {#each uiStore.selectedModels.slice(0, 3) as model}
        <span class="model-chip">{model}</span>
      {/each}
      {#if uiStore.selectedModels.length > 3}
        <span class="model-chip more">+{uiStore.selectedModels.length - 3}</span>
      {/if}
    </span>
  </div>
</div>

<style>
  .prompt-input {
    padding: 16px 20px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
  }

  .model-selector-container {
    margin-bottom: 12px;
  }

  .input-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .model-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
    transition: border-color 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .model-btn:hover, .model-btn.active {
    border-color: var(--accent);
    color: var(--accent);
  }

  .model-count {
    font-size: 12px;
    font-weight: 600;
    background: var(--bg-hover);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .prompt-textarea {
    flex: 1;
    min-height: 44px;
    max-height: 120px;
    padding: 10px 14px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    resize: none;
    font-size: 14px;
    line-height: 1.5;
    transition: border-color 0.15s;
  }

  .prompt-textarea:focus {
    border-color: var(--accent);
  }

  .prompt-textarea::placeholder {
    color: var(--text-muted);
  }

  .prompt-textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: var(--accent);
    border-radius: 8px;
    color: white;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
  }

  .hint {
    color: var(--text-muted);
  }

  .hint.error {
    color: var(--warning);
  }

  .models-preview {
    display: flex;
    gap: 6px;
  }

  .model-chip {
    padding: 2px 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: 11px;
  }

  .model-chip.more {
    color: var(--text-muted);
  }
</style>
