<script lang="ts">
  import '../app.css';
  import 'highlight.js/styles/github-dark-dimmed.css';
  import Sidebar from '$components/Sidebar.svelte';
  import Toast from '$components/Toast.svelte';
  import { uiStore } from '$lib/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { loadConversations } from '$lib/persistence';
  import { conversationsStore, configStore } from '$lib/stores';

  let { children } = $props();

  function handleKeydown(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    switch (e.key) {
      case 'n':
        e.preventDefault();
        conversationsStore.setActive(-1);
        uiStore.clearPrompt();
        goto('/');
        break;
      case 'k':
        e.preventDefault();
        // Focus sidebar search if it exists
        const searchInput = document.querySelector('.sidebar-search input') as HTMLInputElement;
        if (searchInput) {
          if (uiStore.sidebarCollapsed) uiStore.toggleSidebar();
          searchInput.focus();
        }
        break;
      case ',':
        e.preventDefault();
        goto('/settings');
        break;
    }
  }

  onMount(() => {
    // Load persisted conversations on mount
    const stored = loadConversations();
    if (stored.length > 0) {
      conversationsStore.loadFromStorage(stored);
    }

    // Set default models from config if none selected
    if (uiStore.selectedModels.length === 0 && configStore.defaultModels.length > 0) {
      uiStore.setSelectedModels(configStore.defaultModels);
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app" class:sidebar-collapsed={uiStore.sidebarCollapsed}>
  <header class="header">
    <button class="menu-btn" onclick={() => uiStore.toggleSidebar()} aria-label="Toggle sidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
    <h1 class="title">Contio</h1>
    <a href="/settings" class="settings-btn" aria-label="Settings">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    </a>
  </header>

  <div class="main-container">
    <Sidebar />
    <main class="content">
      {@render children()}
    </main>
  </div>
  <Toast />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    height: var(--header-height);
    padding: 0 16px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .menu-btn, .settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    color: var(--text-secondary);
    transition: background 0.15s, color 0.15s;
  }

  .menu-btn:hover, .settings-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .main-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-primary);
  }
</style>
