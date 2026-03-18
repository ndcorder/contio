<script lang="ts">
  import type { ConversationState } from '$lib/models';
  import MessageBubble from './MessageBubble.svelte';
  import { renderMarkdown } from '$lib/utils/markdown';
  import { tick } from 'svelte';

  interface Props {
    conversation: ConversationState | undefined;
    streamingParticipant?: string;
    streamingContent?: string;
  }

  let { conversation, streamingParticipant, streamingContent }: Props = $props();

  let scrollContainer: HTMLDivElement;

  function getParticipant(name: string | undefined) {
    if (!name || !conversation) return undefined;
    return conversation.participants.find(p => p.displayName === name);
  }

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    if (conversation?.transcript.length || streamingContent) {
      tick().then(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
    }
  });
</script>

<div class="chat-view" bind:this={scrollContainer}>
  {#if conversation}
    <div class="chat-header">
      <h2 class="prompt">{conversation.prompt}</h2>
      <div class="meta">
        <span class="status status-{conversation.status}">{conversation.status}</span>
        <span class="round">Round {conversation.currentRound}/{conversation.rounds}</span>
        {#if conversation.endedByConsensus}
          <span class="consensus">Ended by consensus</span>
        {/if}
      </div>
      <div class="participants">
        {#each conversation.participants as participant}
          <span class="participant-tag" style="background: {participant.color}20; color: {participant.color}; border-color: {participant.color}">
            {participant.displayName}
          </span>
        {/each}
      </div>
    </div>

    <div class="messages">
      {#each conversation.transcript as message, i (i)}
        <MessageBubble {message} participant={getParticipant(message.participantName)} />
      {/each}

      {#if streamingParticipant && streamingContent}
        <MessageBubble
          message={{ role: 'assistant', content: streamingContent, participantName: streamingParticipant }}
          participant={getParticipant(streamingParticipant)}
          isStreaming={true}
        />
      {/if}
    </div>

    {#if conversation.summary}
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-content markdown-content">{@html renderMarkdown(conversation.summary)}</div>
      </div>
    {/if}
  {:else}
    <div class="empty-state">
      <h2>Welcome to Contio</h2>
      <p>Start a new discussion by selecting models and entering a prompt below.</p>
    </div>
  {/if}
</div>

<style>
  .chat-view {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .chat-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .prompt {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 13px;
  }

  .status {
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
  }

  .status-pending { background: var(--text-muted); color: white; }
  .status-running { background: var(--warning); color: black; }
  .status-complete { background: var(--success); color: white; }
  .status-error { background: var(--error); color: white; }

  .round, .consensus {
    color: var(--text-secondary);
  }

  .consensus {
    color: var(--success);
  }

  .participants {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .participant-tag {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid;
  }

  .messages {
    display: flex;
    flex-direction: column;
  }

  .summary {
    margin-top: 24px;
    padding: 20px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .summary h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .summary-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--text-secondary);
  }

  .empty-state h2 {
    font-size: 24px;
    margin-bottom: 8px;
    color: var(--text-primary);
  }

  .empty-state p {
    font-size: 14px;
    max-width: 400px;
  }
</style>
