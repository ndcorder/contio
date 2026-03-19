<script lang="ts">
  import type { ConversationState, ApiKeys } from '$lib/models';
  import { BUILT_IN_MODES } from '$lib/models';
  import MessageBubble from './MessageBubble.svelte';
  import { renderMarkdown } from '$lib/utils/markdown';
  import { configStore } from '$lib/stores';
  import { PROVIDER_COLORS } from '$lib/orchestration';
  import { tick } from 'svelte';

  interface Props {
    conversation: ConversationState | undefined;
    streamingParticipant?: string;
    streamingContent?: string;
    onRerun?: (conversation: ConversationState) => void;
    onContinue?: (conversation: ConversationState) => void;
  }

  let { conversation, streamingParticipant, streamingContent, onRerun, onContinue }: Props = $props();

  let scrollContainer: HTMLDivElement;
  let isNearBottom = $state(true);

  function handleScroll() {
    if (!scrollContainer) return;
    const threshold = 100;
    isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < threshold;
  }

  function scrollToBottom() {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      isNearBottom = true;
    }
  }

  const providers: Array<{ key: keyof ApiKeys; name: string }> = [
    { key: 'openai', name: 'OpenAI' },
    { key: 'anthropic', name: 'Anthropic' },
    { key: 'google', name: 'Google' },
    { key: 'openrouter', name: 'OpenRouter' },
  ];

  let hasAnyKeys = $derived(
    providers.some(p => configStore.hasApiKey(p.key))
  );

  function getParticipant(name: string | undefined) {
    if (!name || !conversation) return undefined;
    return conversation.participants.find(p => p.displayName === name);
  }

  function getModeName(modeId: string | undefined): string | undefined {
    if (!modeId) return undefined;
    const mode = BUILT_IN_MODES.find(m => m.id === modeId) ?? configStore.customModes.find(m => m.id === modeId);
    return mode?.name;
  }

  const VERDICT_LABELS: Record<string, { title: string; icon: string }> = {
    'debate': { title: 'Verdict', icon: '&#9878;' },
    'devils-advocate': { title: 'Scrutiny Report', icon: '&#128520;' },
    'steelman': { title: 'Steelman Synthesis', icon: '&#9883;' },
    'socratic': { title: 'Inquiry Summary', icon: '&#10068;' },
    'pros-cons': { title: 'Weighted Assessment', icon: '&#9878;' },
    'brainstorm': { title: 'Ideas Summary', icon: '&#9889;' },
  };

  function getVerdictInfo(modeId: string | undefined) {
    return VERDICT_LABELS[modeId ?? 'debate'] ?? VERDICT_LABELS['debate'];
  }

  // Auto-scroll only when near bottom
  $effect(() => {
    if (conversation?.transcript.length || streamingContent) {
      tick().then(() => {
        if (isNearBottom) {
          scrollToBottom();
        }
      });
    }
  });
</script>

<div class="chat-view" bind:this={scrollContainer} onscroll={handleScroll}>
  {#if conversation}
    <div class="chat-header">
      <h2 class="prompt">{conversation.prompt}</h2>
      <div class="meta">
        <span class="status status-{conversation.status}">{conversation.status}</span>
        <span class="round">Round {conversation.currentRound}/{conversation.rounds}</span>
        {#if conversation.mode}
          {@const modeName = getModeName(conversation.mode)}
          {#if modeName}
            <span class="mode-badge">{modeName}</span>
          {/if}
        {/if}
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
      {#if conversation.status === 'complete' || conversation.status === 'error'}
        <div class="chat-actions">
          {#if onRerun}
            <button class="action-btn" onclick={() => onRerun(conversation)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Re-run
            </button>
          {/if}
          {#if onContinue && conversation.currentRound < conversation.rounds}
            <button class="action-btn" onclick={() => onContinue(conversation)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Continue
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <div class="messages">
      {#each conversation.transcript as message, i (i)}
        {#if message.round && (i === 0 || message.round !== conversation.transcript[i - 1]?.round)}
          <div class="round-divider">
            <span class="round-label">Round {message.round}</span>
          </div>
        {/if}
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
      {@const verdictInfo = getVerdictInfo(conversation.verdictMode)}
      <div class="verdict-card">
        <div class="verdict-header">
          <span class="verdict-icon">{@html verdictInfo.icon}</span>
          <h3>{verdictInfo.title}</h3>
        </div>
        <div class="verdict-content markdown-content">{@html renderMarkdown(conversation.summary)}</div>
      </div>
    {/if}
  {:else}
    <div class="empty-state">
      <div class="onboarding">
        <h1 class="brand">Contio</h1>
        <p class="subtitle">Multi-model AI discussion arena</p>

        <div class="quick-start">
          <h3>Quick Start</h3>
          <ol class="steps">
            <li><span class="step-num">1</span> Configure API keys in <a href="/settings">Settings</a></li>
            <li><span class="step-num">2</span> Select 2+ models from the sidebar</li>
            <li><span class="step-num">3</span> Enter a topic and start the discussion</li>
          </ol>
        </div>

        <div class="provider-status">
          <h3>Provider Status</h3>
          <div class="provider-list">
            {#each providers as provider}
              {@const configured = configStore.hasApiKey(provider.key)}
              <div class="provider-row">
                {#if configured}
                  <svg class="status-icon" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="{PROVIDER_COLORS[provider.key]}33" stroke="{PROVIDER_COLORS[provider.key]}" stroke-width="1.5"/>
                    <path d="M5 8l2 2 4-4" stroke="{PROVIDER_COLORS[provider.key]}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                {:else}
                  <svg class="status-icon" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="var(--bg-tertiary)" stroke="var(--text-muted)" stroke-width="1.5"/>
                  </svg>
                {/if}
                <span class="provider-name" class:configured>{provider.name}</span>
              </div>
            {/each}
          </div>
        </div>

        {#if !hasAnyKeys}
          <a href="/settings" class="cta-link">Configure API Keys</a>
        {/if}
      </div>
    </div>
  {/if}

  {#if !isNearBottom && conversation}
    <button class="scroll-to-bottom" onclick={scrollToBottom} aria-label="Scroll to bottom">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
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

  .mode-badge {
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(99, 102, 241, 0.15);
    color: var(--accent);
    font-weight: 500;
    font-size: 12px;
  }

  .participants {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chat-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .action-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--accent);
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

  .round-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0 12px;
  }

  .round-divider::before,
  .round-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }

  .round-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .verdict-card {
    margin-top: 24px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05));
    border-radius: 10px;
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .verdict-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  }

  .verdict-icon {
    font-size: 20px;
    line-height: 1;
  }

  .verdict-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--accent);
    margin: 0;
  }

  .verdict-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-primary);
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .onboarding {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 400px;
    gap: 24px;
  }

  .brand {
    font-size: 32px;
    font-weight: 700;
    color: var(--accent);
    margin: 0;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-muted);
    margin: -16px 0 0;
  }

  .quick-start, .provider-status {
    width: 100%;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 16px 20px;
    text-align: left;
  }

  .quick-start h3, .provider-status h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin: 0 0 12px;
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .steps li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .steps a {
    color: var(--accent);
    text-decoration: none;
  }

  .steps a:hover {
    text-decoration: underline;
  }

  .provider-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .provider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .provider-name {
    font-size: 13px;
    color: var(--text-muted);
  }

  .provider-name.configured {
    color: var(--text-secondary);
  }

  .cta-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 24px;
    background: var(--accent);
    color: white;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .cta-link:hover {
    opacity: 0.85;
  }

  .scroll-to-bottom {
    position: sticky;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    z-index: 5;
  }

  .scroll-to-bottom:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
</style>
