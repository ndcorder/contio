<script lang="ts">
  import type { ChatMessage, ModelParticipant } from '$lib/models';
  import { renderMarkdown } from '$lib/utils/markdown';

  interface Props {
    message: ChatMessage;
    participant?: ModelParticipant;
    isStreaming?: boolean;
  }

  let { message, participant, isStreaming = false }: Props = $props();

  let hasSummary = $derived(!!message.summary);
  let isExpanded = $state(false);

  // Auto-expand if no summary available
  $effect(() => {
    if (!hasSummary) {
      isExpanded = true;
    }
  });

  function getColor(): string {
    return participant?.color ?? '#6366f1';
  }

  function toggleExpand() {
    if (hasSummary) {
      isExpanded = !isExpanded;
    }
  }

  let copied = $state(false);

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(message.content);
      copied = true;
      setTimeout(() => { copied = false; }, 1500);
    } catch {
      // Clipboard API may be unavailable in some contexts
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpand();
    }
  }
</script>

<div class="message" class:collapsible={hasSummary} style="--participant-color: {getColor()}">
  <div class="message-header">
    <span class="participant-name" style="color: {getColor()}">{message.participantName ?? 'System'}</span>
    {#if message.timestamp}
      <span class="timestamp">{message.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
    {/if}
    {#if isStreaming}
      <span class="streaming-indicator">typing...</span>
    {/if}
    <button class="copy-btn" onclick={copyContent} aria-label="Copy message">
      {#if copied}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      {/if}
    </button>
    {#if hasSummary}
      <button class="expand-toggle" onclick={toggleExpand} aria-expanded={isExpanded}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
    {/if}
  </div>
  {#if isExpanded}
    <div class="message-content markdown-content">
      {@html renderMarkdown(message.content)}
    </div>
  {:else}
    <div
      class="message-summary"
      role="button"
      tabindex="0"
      onclick={toggleExpand}
      onkeydown={handleKeydown}
    >
      {message.summary}
    </div>
  {/if}
</div>

<style>
  .message {
    padding: 16px 20px;
    border-left: 3px solid var(--participant-color);
    background: var(--bg-secondary);
    border-radius: 0 8px 8px 0;
    margin-bottom: 12px;
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .participant-name {
    font-weight: 600;
    font-size: 13px;
  }

  .timestamp {
    font-size: 11px;
    color: var(--text-muted);
  }

  .streaming-indicator {
    font-size: 11px;
    color: var(--warning);
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .message-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
    word-wrap: break-word;
  }

  .expand-toggle {
    margin-left: auto;
    font-size: 11px;
    color: var(--accent);
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--bg-tertiary);
    transition: background 0.15s;
  }

  .expand-toggle:hover {
    background: var(--bg-hover);
  }

  .message-summary {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-secondary);
    font-style: italic;
    cursor: pointer;
    padding: 4px 0;
  }

  .message-summary:hover {
    color: var(--text-primary);
  }

  .collapsible {
    cursor: default;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.15s, color 0.15s, background 0.15s;
    cursor: pointer;
  }

  .message:hover .copy-btn {
    opacity: 1;
  }

  .copy-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
</style>
