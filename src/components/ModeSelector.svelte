<script lang="ts">
  import { uiStore, configStore } from '$lib/stores';

  let showDropdown = $state(false);

  const modes = $derived(configStore.getAllModes());
  const currentMode = $derived(modes.find(m => m.id === uiStore.selectedMode) ?? modes[0]);

  function selectMode(modeId: string) {
    uiStore.setSelectedMode(modeId);
    showDropdown = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.mode-selector')) {
      showDropdown = false;
    }
  }

  const MODE_ICONS: Record<string, string> = {
    'debate': '&#9878;',       // crossed swords
    'devils-advocate': '&#128520;', // imp
    'steelman': '&#9883;',     // shield
    'socratic': '&#10068;',    // question
    'pros-cons': '&#9878;',    // scales
    'brainstorm': '&#9889;',   // lightning
  };

  function getModeIcon(mode: { id: string; icon?: string }): string {
    return MODE_ICONS[mode.icon ?? mode.id] ?? '&#9679;';
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="mode-selector">
  <button
    class="mode-trigger"
    onclick={() => showDropdown = !showDropdown}
    title={currentMode.description}
  >
    <span class="mode-icon">{@html getModeIcon(currentMode)}</span>
    <span class="mode-name">{currentMode.name}</span>
    <svg class="chevron" class:open={showDropdown} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  {#if showDropdown}
    <div class="mode-dropdown">
      {#each modes as mode (mode.id)}
        <button
          class="mode-option"
          class:active={mode.id === uiStore.selectedMode}
          onclick={() => selectMode(mode.id)}
        >
          <span class="option-icon">{@html getModeIcon(mode)}</span>
          <div class="option-info">
            <span class="option-name">{mode.name}</span>
            <span class="option-desc">{mode.description}</span>
          </div>
          {#if mode.id === uiStore.selectedMode}
            <svg class="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mode-selector {
    position: relative;
  }

  .mode-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .mode-trigger:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .mode-icon {
    font-size: 14px;
    line-height: 1;
  }

  .mode-name {
    font-weight: 500;
  }

  .chevron {
    transition: transform 0.15s;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .mode-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 6px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 4px;
    min-width: 280px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 50;
  }

  .mode-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border-radius: 6px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }

  .mode-option:hover {
    background: var(--bg-hover);
  }

  .mode-option.active {
    background: rgba(99, 102, 241, 0.1);
  }

  .option-icon {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
    width: 20px;
    text-align: center;
  }

  .option-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .option-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .option-desc {
    font-size: 11px;
    color: var(--text-muted);
  }

  .check {
    color: var(--accent);
    flex-shrink: 0;
  }
</style>
