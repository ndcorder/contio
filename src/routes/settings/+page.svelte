<script lang="ts">
  import { configStore } from '$lib/stores';
  import { PROVIDER_COLORS } from '$lib/orchestration';
  import type { LlmProvider } from '$lib/models';

  const providers: Array<{ key: keyof typeof PROVIDER_COLORS; name: string; placeholder: string }> = [
    { key: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
    { key: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
    { key: 'google', name: 'Google', placeholder: 'AI...' },
    { key: 'openrouter', name: 'OpenRouter', placeholder: 'sk-or-...' }
  ];

  let showKey = $state<Record<string, boolean>>({});

  function toggleShowKey(provider: string) {
    showKey[provider] = !showKey[provider];
  }

  function handleApiKeyChange(provider: LlmProvider, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    configStore.setApiKey(provider, value || undefined);
  }

  function handleDefaultModelsChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const models = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    configStore.setDefaultModels(models);
  }

  function handleRoundsChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value) && value > 0) {
      configStore.updateDiscussion({ defaultRounds: value });
    }
  }

  function handleMaxTokensChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value) && value > 0) {
      configStore.updateDiscussion({ maxTokensPerResponse: value });
    }
  }

  function handleAutoConclusionChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    configStore.updateDiscussion({ enableAutoConclusion: checked });
  }

  function handleObserverModelChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    configStore.updateDiscussion({ observerModel: value });
  }

  function handleSummaryModelChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    configStore.updateDiscussion({ summaryModel: value || undefined });
  }

  function handleSystemPromptChange(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    configStore.updateDiscussion({ systemPrompt: value });
  }
</script>

<div class="settings">
  <header class="settings-header">
    <a href="/" class="back-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Back
    </a>
    <h1>Settings</h1>
  </header>

  <div class="settings-content">
    <section class="settings-section">
      <h2>API Keys</h2>
      <p class="section-desc">Configure your API keys for each provider. Keys are stored locally in your browser.</p>

      {#each providers as provider}
        <div class="form-group">
          <label for={provider.key}>
            <span class="provider-dot" style="background: {PROVIDER_COLORS[provider.key]}"></span>
            {provider.name}
          </label>
          <div class="input-with-toggle">
            <input
              type={showKey[provider.key] ? 'text' : 'password'}
              id={provider.key}
              placeholder={provider.placeholder}
              value={configStore.apiKeys[provider.key] ?? ''}
              oninput={(e) => handleApiKeyChange(provider.key, e)}
            />
            <button
              class="toggle-btn"
              onclick={() => toggleShowKey(provider.key)}
              type="button"
              aria-label={showKey[provider.key] ? 'Hide' : 'Show'}
            >
              {#if showKey[provider.key]}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              {:else}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              {/if}
            </button>
          </div>
          {#if configStore.apiKeys[provider.key]}
            <span class="status-badge configured">Configured</span>
          {:else}
            <span class="status-badge">Not configured</span>
          {/if}
        </div>
      {/each}
    </section>

    <section class="settings-section">
      <h2>Discussion Settings</h2>

      <div class="form-group">
        <label for="defaultModels">Default Models</label>
        <input
          type="text"
          id="defaultModels"
          placeholder="gpt-4o, claude-sonnet-4-20250514"
          value={configStore.defaultModels.join(', ')}
          oninput={handleDefaultModelsChange}
        />
        <span class="hint">Comma-separated list of model IDs</span>
      </div>

      <div class="form-group">
        <label for="defaultRounds">Default Rounds</label>
        <input
          type="number"
          id="defaultRounds"
          min="1"
          max="20"
          value={configStore.discussion.defaultRounds}
          oninput={handleRoundsChange}
        />
      </div>

      <div class="form-group">
        <label for="maxTokens">Max Tokens per Response</label>
        <input
          type="number"
          id="maxTokens"
          min="100"
          max="128000"
          step="100"
          value={configStore.discussion.maxTokensPerResponse}
          oninput={handleMaxTokensChange}
        />
      </div>

      <div class="form-group checkbox-group">
        <input
          type="checkbox"
          id="autoConclusion"
          checked={configStore.discussion.enableAutoConclusion}
          onchange={handleAutoConclusionChange}
        />
        <label for="autoConclusion">Enable Auto-Conclusion</label>
        <span class="hint">Automatically end discussion when consensus is reached</span>
      </div>

      <div class="form-group">
        <label for="observerModel">Observer Model</label>
        <input
          type="text"
          id="observerModel"
          placeholder="gemini-2.5-flash"
          value={configStore.discussion.observerModel}
          oninput={handleObserverModelChange}
        />
        <span class="hint">Model used to detect natural conclusion</span>
      </div>

      <div class="form-group">
        <label for="summaryModel">Summary Model</label>
        <input
          type="text"
          id="summaryModel"
          placeholder="gemini-2.5-flash (leave empty to disable)"
          value={configStore.discussion.summaryModel ?? ''}
          oninput={handleSummaryModelChange}
        />
        <span class="hint">Model used to generate discussion summary</span>
      </div>

      <div class="form-group">
        <label for="systemPrompt">System Prompt</label>
        <textarea
          id="systemPrompt"
          class="system-prompt-textarea"
          placeholder="Enter the system prompt for discussion participants..."
          value={configStore.discussion.systemPrompt}
          oninput={handleSystemPromptChange}
        ></textarea>
        <span class="hint">Instructions given to each model at the start of a discussion</span>
      </div>
    </section>
  </div>
</div>

<style>
  .settings {
    height: 100%;
    overflow-y: auto;
    background: var(--bg-primary);
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    color: var(--text-secondary);
    transition: background 0.15s, color 0.15s;
  }

  .back-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    text-decoration: none;
  }

  .settings-header h1 {
    font-size: 18px;
    font-weight: 600;
  }

  .settings-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
  }

  .settings-section {
    margin-bottom: 32px;
    padding: 20px;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }

  .settings-section h2 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .section-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  .provider-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .input-with-toggle {
    display: flex;
    gap: 8px;
  }

  .input-with-toggle input {
    flex: 1;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    transition: border-color 0.15s, color 0.15s;
  }

  .toggle-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  input[type="text"],
  input[type="password"],
  input[type="number"] {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    transition: border-color 0.15s;
  }

  input:focus {
    border-color: var(--accent);
  }

  input::placeholder {
    color: var(--text-muted);
  }

  input[type="number"] {
    width: 120px;
  }

  .status-badge {
    display: inline-block;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    margin-top: 6px;
  }

  .status-badge.configured {
    background: rgba(34, 197, 94, 0.15);
    color: var(--success);
  }

  .hint {
    display: block;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
  }

  .checkbox-group label {
    margin-bottom: 0;
  }

  .checkbox-group .hint {
    flex-basis: 100%;
    margin-top: 0;
  }

  .system-prompt-textarea {
    width: 100%;
    min-height: 100px;
    max-height: 200px;
    padding: 10px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.5;
    resize: vertical;
    transition: border-color 0.15s;
  }

  .system-prompt-textarea:focus {
    border-color: var(--accent);
  }
</style>
