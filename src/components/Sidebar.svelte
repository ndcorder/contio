<script lang="ts">
  import { conversationsStore, uiStore } from '$lib/stores';
  import { deleteConversation, exportConversation, exportConversationAsMarkdown } from '$lib/persistence';
  import ConfirmDialog from './ConfirmDialog.svelte';

  let searchQuery = $state('');
  let openMenuId = $state<string | null>(null);
  let confirmState = $state<{ message: string; onConfirm: () => void } | null>(null);

  let filteredList = $derived(
    searchQuery.trim()
      ? conversationsStore.list.filter(c => c.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
      : conversationsStore.list
  );

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

  function handleClickOutside() {
    openMenuId = null;
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

<svelte:window onclick={handleClickOutside} />

<aside class="sidebar" class:collapsed={uiStore.sidebarCollapsed}>
  <div class="sidebar-header">
    <span class="sidebar-title">Conversations</span>
    <div class="sidebar-header-actions">
      <span class="count">{filteredList.length === conversationsStore.list.length ? conversationsStore.list.length : `${filteredList.length}/${conversationsStore.list.length}`}</span>
      <button class="new-btn" onclick={() => { conversationsStore.setActive(-1); uiStore.clearPrompt(); }} aria-label="New conversation">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  </div>

  <div class="sidebar-search">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      type="text"
      placeholder="Search conversations..."
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

  <div class="conversation-list">
    {#each filteredList as conversation, index (conversation.id)}
      <div
        class="conversation-item"
        class:active={conversation.id === conversationsStore.active?.id}
        onclick={() => conversationsStore.setActive(conversationsStore.list.indexOf(conversation))}
        onkeydown={(e) => e.key === 'Enter' && conversationsStore.setActive(conversationsStore.list.indexOf(conversation))}
        role="button"
        tabindex="0"
      >
        <div class="conversation-header">
          <span class="status-dot {getStatusIndicator(conversation.status)}"></span>
          <span class="date">{formatDate(conversation.createdAt)}</span>
          <button
            class="menu-btn"
            onclick={(e) => { e.stopPropagation(); openMenuId = openMenuId === conversation.id ? null : conversation.id; }}
            aria-label="Conversation options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
        <div class="conversation-prompt">{truncatePrompt(conversation.prompt)}</div>
        <div class="conversation-meta">
          <span class="participants">{conversation.participants.length} models</span>
          <span class="rounds">Round {conversation.currentRound}/{conversation.rounds}</span>
        </div>
        {#if openMenuId === conversation.id}
          <div class="overflow-menu">
            <button class="overflow-item" onclick={(e) => { e.stopPropagation(); exportConversation(conversation); openMenuId = null; }}>
              Export JSON
            </button>
            <button class="overflow-item" onclick={(e) => { e.stopPropagation(); exportConversationAsMarkdown(conversation); openMenuId = null; }}>
              Export Markdown
            </button>
            <button class="overflow-item danger" onclick={(e) => { e.stopPropagation(); openMenuId = null; confirmState = { message: 'Delete this conversation?', onConfirm: () => { deleteConversation(conversation.id); conversationsStore.remove(conversation.id); confirmState = null; } }; }}>
              Delete
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <p>No conversations yet</p>
        <p class="hint">Start a new discussion below</p>
      </div>
    {/each}
  </div>
</aside>

{#if confirmState}
  <ConfirmDialog
    message={confirmState.message}
    onConfirm={confirmState.onConfirm}
    onCancel={() => confirmState = null}
  />
{/if}

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
    border-right: none;
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

  .sidebar-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .count {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .new-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--bg-tertiary);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 18px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .new-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .conversation-item {
    position: relative;
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

  .menu-btn {
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

  .conversation-item:hover .menu-btn {
    opacity: 1;
  }

  .menu-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .overflow-menu {
    position: absolute;
    right: 8px;
    top: 100%;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 4px;
    min-width: 160px;
    z-index: 50;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .overflow-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-primary);
    text-align: left;
    border-radius: 4px;
    transition: background 0.15s;
    cursor: pointer;
  }

  .overflow-item:hover {
    background: var(--bg-hover);
  }

  .overflow-item.danger {
    color: var(--error);
  }

  .overflow-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
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

  .sidebar-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin: 8px 8px 0;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
  }

  .sidebar-search svg {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .sidebar-search input {
    flex: 1;
    background: transparent;
    border: none;
    font-size: 12px;
    color: var(--text-primary);
    outline: none;
  }

  .sidebar-search input::placeholder {
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
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .clear-search:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
</style>
