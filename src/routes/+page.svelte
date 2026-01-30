<script lang="ts">
  import ChatView from '$components/ChatView.svelte';
  import PromptInput from '$components/PromptInput.svelte';
  import { conversationsStore, configStore, uiStore } from '$lib/stores';
  import { createProviders } from '$lib/providers';
  import { parseModels, runDiscussionStreaming } from '$lib/orchestration';
  import { saveConversation } from '$lib/persistence';
  import type { ChatMessage } from '$lib/models';

  let streamingParticipant = $state<string | undefined>(undefined);
  let streamingContent = $state<string>('');
  let abortController: AbortController | null = null;

  async function handleSubmit(prompt: string, modelIds: string[]) {
    // Create participants from model IDs
    const participants = parseModels(modelIds);

    // Create new conversation
    const conversation = conversationsStore.add(
      prompt,
      participants,
      configStore.discussion.defaultRounds
    );

    // Create providers from API keys
    const providers = createProviders(configStore.apiKeys);

    // Create abort controller for cancellation
    abortController = new AbortController();

    uiStore.setStreaming(true);
    streamingParticipant = undefined;
    streamingContent = '';

    try {
      await runDiscussionStreaming(
        conversation,
        providers,
        configStore.discussion,
        {
          onMessage: (message: ChatMessage) => {
            // Clear streaming state when message is complete
            streamingParticipant = undefined;
            streamingContent = '';
            // Save after each message
            saveConversation(conversation);
          },
          onRoundStart: (round: number) => {
            conversationsStore.setCurrentRound(conversation.id, round);
          },
          onStreamChunk: (participantName: string, chunk: string) => {
            streamingParticipant = participantName;
            streamingContent += chunk;
          },
          onStreamEnd: (participantName: string) => {
            streamingParticipant = undefined;
            streamingContent = '';
          },
          onStatusChange: (status) => {
            conversationsStore.setStatus(conversation.id, status);
          },
          onComplete: (summary) => {
            if (summary) {
              conversationsStore.setSummary(conversation.id, summary);
            }
            saveConversation(conversation);
          },
          onError: (error) => {
            conversationsStore.setStatus(conversation.id, 'error', error);
            saveConversation(conversation);
          }
        },
        abortController.signal
      );
    } catch (err) {
      console.error('Discussion error:', err);
    } finally {
      uiStore.setStreaming(false);
      abortController = null;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Escape to cancel running discussion
    if (event.key === 'Escape' && abortController) {
      abortController.abort();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="page">
  <ChatView
    conversation={conversationsStore.active}
    {streamingParticipant}
    {streamingContent}
  />
  <PromptInput
    onSubmit={handleSubmit}
    disabled={uiStore.isStreaming}
  />
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
</style>
