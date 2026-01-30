<script lang="ts">
  import type { ChatMessage, ModelParticipant } from '$lib/models';

  interface Props {
    message: ChatMessage;
    participant?: ModelParticipant;
    isStreaming?: boolean;
  }

  let { message, participant, isStreaming = false }: Props = $props();

  function getColor(): string {
    return participant?.color ?? '#6366f1';
  }
</script>

<div class="message" style="--participant-color: {getColor()}">
  <div class="message-header">
    <span class="participant-name" style="color: {getColor()}">{message.participantName ?? 'System'}</span>
    {#if message.timestamp}
      <span class="timestamp">{message.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
    {/if}
    {#if isStreaming}
      <span class="streaming-indicator">typing...</span>
    {/if}
  </div>
  <div class="message-content">
    {message.content}
  </div>
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
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>
