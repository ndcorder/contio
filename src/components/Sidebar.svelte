<script lang="ts">
  import { conversationsStore, uiStore } from '$lib/stores';
  import { deleteConversation } from '$lib/persistence';

  function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  }

  function truncatePrompt(prompt: string, maxLength = 50): string {
    if (prompt.length <= maxLength) return prompt;
    return prompt.slice(0, maxLength).trim() + '...';
  }

  function handleDelete(id: string, event: MouseEvent) {
    event.stopPropagation();
    if (confirm('Delete this conversation?')) {
      deleteConversation(id);
      conversationsStore.remove(id);
    }
  }

  function getStatusIndicator(status: string): string {
    switch (status) {
      case 'running': return 'status-running';
      case 'complete': return 'status-complete';
      case 'error': return 'status-error';
      default: return 'status-pending';
    }
  }
</script>

<aside class="sidebar" class:collapsed={uiStore.sidebarCollapsed}>
  <div class="sidebar-header">
    <span class="sidebar-title">Conversations</span>
    <span class="count">{conversationsStore.list.length}</span>
  </div>

  <div class="conversation-list">
    {#each conversationsStore.list as conversation, index (conversation.id)}
      <div
        class="conversation-item"
        class:active={index === conversationsStore.activeIndex}
        onclick={() => conversationsStore.setActive(index)}
        onkeydown={(e) => e.key === 'Enter' && conversationsStore.setActive(index)}
        role="button"
        tabindex="0"
      >
        <div class="conversation-header">
          <span class="status-dot {getStatusIndicator(conversation.status)}"></span>
          <span class="date">{formatDate(conversation.createdAt)}</span>
          <button
            class="delete-btn"
            onclick={(e) => handleDelete(conversation.id, e)}
            aria-label="Delete conversation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="conversation-prompt">{truncatePrompt(conversation.prompt)}</div>
        <div class="conversation-meta">
          <span class="participants">{conversation.participants.length} models</span>
          <span class="rounds">Round {conversation.currentRound}/{conversation.rounds}</span>
        </div>
      </div>
    {:else}
      <div class="empty-state">
        <p>No conversations yet</p>
        <p class="hint">Start a new discussion below</p>
      </div>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-width);
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    transition: width 0.2s ease, margin 0.2s ease;
  }

  .sidebar.collapsed {
    width: 0;
    margin-left: calc(var(--sidebar-width) * -1);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-title {
    font-weight: 600;
    color: var(--text-primary);
  }

  .count {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .conversation-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    text-align: left;
    margin-bottom: 4px;
    transition: background 0.15s;
  }

  .conversation-item:hover {
    background: var(--bg-hover);
  }

  .conversation-item.active {
    background: var(--bg-tertiary);
  }

  .conversation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-pending { background: var(--text-muted); }
  .status-running { background: var(--warning); animation: pulse 1.5s infinite; }
  .status-complete { background: var(--success); }
  .status-error { background: var(--error); }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .date {
    flex: 1;
    font-size: 12px;
    color: var(--text-muted);
  }

  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.15s, color 0.15s, background 0.15s;
  }

  .conversation-item:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    background: var(--error);
    color: white;
  }

  .conversation-prompt {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: 6px;
  }

  .conversation-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;
    color: var(--text-muted);
  }

  .empty-state p {
    margin-bottom: 4px;
  }

  .empty-state .hint {
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
