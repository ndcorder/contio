<script lang="ts">
  import ChatView from '$components/ChatView.svelte';
  import PromptInput from '$components/PromptInput.svelte';
  import { conversationsStore, configStore, uiStore } from '$lib/stores';
  import { createProviders } from '$lib/providers';
  import { parseModels, runDiscussionStreaming } from '$lib/orchestration';
  import { saveConversation } from '$lib/persistence';
  import type { ChatMessage, ConversationState } from '$lib/models';

  let streamingParticipant = $state<string | undefined>(undefined);
  let streamingContent = $state<string>('');
  let abortController: AbortController | null = null;

  function createCallbacks(conv: ConversationState) {
    return {
      onMessage: (_message: ChatMessage) => {
        streamingParticipant = undefined;
        streamingContent = '';
        saveConversation(conv);
      },
      onRoundStart: (round: number) => {
        conversationsStore.setCurrentRound(conv.id, round);
      },
      onStreamChunk: (participantName: string, chunk: string) => {
        streamingParticipant = participantName;
        streamingContent += chunk;
      },
      onStreamEnd: (_participantName: string) => {
        streamingParticipant = undefined;
        streamingContent = '';
      },
      onStatusChange: (status: ConversationState['status']) => {
        conversationsStore.setStatus(conv.id, status);
      },
      onComplete: (summary?: string) => {
        if (summary) {
          conversationsStore.setSummary(conv.id, summary);
        }
        saveConversation(conv);
      },
      onError: (error: string) => {
        conversationsStore.setStatus(conv.id, 'error', error);
        saveConversation(conv);
        uiStore.addNotification(error, 'error');
      }
    };
  }

  async function runDiscussion(conv: ConversationState) {
    const providers = createProviders(configStore.apiKeys);
    abortController = new AbortController();
    uiStore.setStreaming(true);
    streamingParticipant = undefined;
    streamingContent = '';

    try {
      await runDiscussionStreaming(
        conv, providers, configStore.discussion,
        createCallbacks(conv), abortController.signal
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Discussion failed';
      if (msg !== 'Cancelled by user') {
        uiStore.addNotification(msg, 'error');
      }
    } finally {
      uiStore.setStreaming(false);
      abortController = null;
    }
  }

  async function handleSubmit(prompt: string, modelIds: string[]) {
    const participants = parseModels(modelIds);
    const conversation = conversationsStore.add(
      prompt, participants, configStore.discussion.defaultRounds
    );
    await runDiscussion(conversation);
  }

  function handleRerun(conv: ConversationState) {
    handleSubmit(conv.prompt, conv.participants.map(p => p.modelId));
  }

  function handleContinue(conv: ConversationState) {
    runDiscussion(conv);
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
    onRerun={handleRerun}
    onContinue={handleContinue}
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
