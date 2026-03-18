<script lang="ts">
  import { uiStore } from '$lib/stores';
</script>

{#if uiStore.notifications.length > 0}
  <div class="toast-container">
    {#each uiStore.notifications as notification (notification.id)}
      <div class="toast toast-{notification.type}">
        <span class="toast-message">{notification.message}</span>
        <button class="toast-close" onclick={() => uiStore.removeNotification(notification.id)} aria-label="Dismiss notification">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-primary);
    border-left: 3px solid var(--accent);
    animation: slide-in 0.25s ease-out;
  }

  .toast-error {
    border-left-color: var(--error);
  }

  .toast-success {
    border-left-color: var(--success);
  }

  .toast-info {
    border-left-color: var(--accent);
  }

  .toast-message {
    flex: 1;
    line-height: 1.4;
  }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    color: var(--text-secondary);
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .toast-close:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
