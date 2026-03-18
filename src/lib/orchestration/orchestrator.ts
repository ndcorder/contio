import type { ConversationState, ChatMessage, DiscussionSettings, LlmProvider } from '$lib/models';
import type { LlmProviderInterface } from '$lib/providers';
import { buildMessages, buildObserverPrompt, buildSummaryPrompt } from './prompt-builder';
import { resolveProvider } from './model-resolver';

export interface OrchestratorCallbacks {
  onMessage?: (message: ChatMessage) => void;
  onRoundStart?: (round: number) => void;
  onStatusChange?: (status: ConversationState['status']) => void;
  onComplete?: (summary?: string) => void;
  onError?: (error: string) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function runDiscussion(
  conversation: ConversationState,
  providers: Map<LlmProvider, LlmProviderInterface>,
  settings: DiscussionSettings,
  callbacks: OrchestratorCallbacks = {},
  signal?: AbortSignal
): Promise<void> {
  const { onMessage, onRoundStart, onStatusChange, onComplete, onError } = callbacks;

  conversation.status = 'running';
  onStatusChange?.('running');

  const messagesPerRound = conversation.participants.length;
  const completedRounds = messagesPerRound > 0
    ? Math.floor(conversation.transcript.length / messagesPerRound)
    : 0;
  const startRound = completedRounds + 1;

  let endedByConsensus = false;

  try {
    for (let round = startRound; round <= conversation.rounds; round++) {
      if (signal?.aborted) {
        throw new Error('Cancelled by user');
      }

      conversation.currentRound = round;
      onRoundStart?.(round);

      const isFinalRound = round === conversation.rounds;
      const shuffledParticipants = shuffleArray(conversation.participants);

      for (const participant of shuffledParticipants) {
        if (signal?.aborted) {
          throw new Error('Cancelled by user');
        }

        const provider = providers.get(participant.provider);
        if (!provider) {
          console.warn(`No provider registered for ${participant.provider}, skipping ${participant.modelId}`);
          continue;
        }

        const messages = buildMessages(
          settings.systemPrompt,
          conversation.prompt,
          conversation.transcript,
          participant,
          isFinalRound
        );

        try {
          const response = await provider.getCompletion(
            participant.modelId,
            messages,
            settings.maxTokensPerResponse,
            signal
          );

          const chatMessage: ChatMessage = {
            role: 'assistant',
            content: response,
            participantName: participant.displayName,
            timestamp: new Date()
          };

          // Generate per-message summary for long messages
          if (response.length >= settings.messageSummaryThreshold) {
            chatMessage.summary = await generateMessageSummary(
              response,
              participant.modelId,
              provider,
              settings.messageSummaryMaxTokens,
              signal
            );
          }

          conversation.transcript.push(chatMessage);
          onMessage?.(chatMessage);
        } catch (err) {
          if (signal?.aborted) {
            throw new Error('Cancelled by user');
          }

          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Error from ${participant.modelId}:`, errorMessage);

          const chatMessage: ChatMessage = {
            role: 'assistant',
            content: `[Error: ${errorMessage}]`,
            participantName: participant.displayName,
            timestamp: new Date()
          };

          conversation.transcript.push(chatMessage);
          onMessage?.(chatMessage);
        }
      }

      // Check for natural conclusion after round 3+
      if (settings.enableAutoConclusion && round >= 3 && !isFinalRound) {
        const shouldConclude = await checkForNaturalConclusion(
          conversation,
          settings.observerModel,
          providers,
          signal
        );

        if (shouldConclude) {
          console.log(`Observer detected natural conclusion at round ${round}`);
          endedByConsensus = true;
          break;
        }
      }
    }

    conversation.status = 'complete';
    conversation.endedByConsensus = endedByConsensus;
    onStatusChange?.('complete');

    // Generate summary if configured
    if (settings.summaryModel && conversation.transcript.length > 0) {
      const summary = await generateSummary(
        conversation,
        settings.summaryModel,
        settings.summaryMaxTokens,
        providers,
        signal
      );
      if (summary) {
        conversation.summary = summary;
      }
    }

    onComplete?.(conversation.summary);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    conversation.status = 'error';
    conversation.errorMessage = errorMessage;
    onStatusChange?.('error');
    onError?.(errorMessage);

    if (errorMessage !== 'Cancelled by user') {
      throw err;
    }
  }
}

async function checkForNaturalConclusion(
  conversation: ConversationState,
  observerModel: string,
  providers: Map<LlmProvider, LlmProviderInterface>,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const provider = providers.get(resolveProvider(observerModel));
    if (!provider) {
      console.warn(`No provider available for observer model ${observerModel}`);
      return false;
    }

    const messagesPerRound = conversation.participants.length;
    const lastRoundMessages = conversation.transcript.slice(-messagesPerRound);

    const prompt = buildObserverPrompt(
      conversation.prompt,
      conversation.currentRound,
      conversation.rounds,
      lastRoundMessages
    );

    const response = await provider.getCompletion(
      observerModel,
      [{ role: 'user', content: prompt }],
      50, // Very short response expected
      signal
    );

    return response.trim().toUpperCase().includes('CONCLUDE');
  } catch (err) {
    console.warn('Observer check failed, continuing discussion:', err);
    return false;
  }
}

async function generateSummary(
  conversation: ConversationState,
  summaryModel: string,
  maxTokens: number,
  providers: Map<LlmProvider, LlmProviderInterface>,
  signal?: AbortSignal
): Promise<string | undefined> {
  try {
    const provider = providers.get(resolveProvider(summaryModel));
    if (!provider) {
      console.warn(`No provider available for summary model ${summaryModel}`);
      return undefined;
    }

    const prompt = buildSummaryPrompt(conversation.prompt, conversation.transcript);

    const summary = await provider.getCompletion(
      summaryModel,
      [{ role: 'user', content: prompt }],
      maxTokens,
      signal
    );

    return summary;
  } catch (err) {
    console.warn('Failed to generate summary:', err);
    return undefined;
  }
}

async function generateMessageSummary(
  content: string,
  modelId: string,
  provider: LlmProviderInterface,
  maxTokens: number,
  signal?: AbortSignal
): Promise<string | undefined> {
  try {
    const prompt = `Summarize this response in one concise sentence (max 20 words):\n\n${content}`;

    const summary = await provider.getCompletion(
      modelId,
      [{ role: 'user', content: prompt }],
      maxTokens,
      signal
    );

    return summary.trim();
  } catch (err) {
    console.warn('Failed to generate message summary:', err);
    return undefined;
  }
}

// Streaming version for real-time display
export async function runDiscussionStreaming(
  conversation: ConversationState,
  providers: Map<LlmProvider, LlmProviderInterface>,
  settings: DiscussionSettings,
  callbacks: OrchestratorCallbacks & {
    onStreamChunk?: (participantName: string, chunk: string) => void;
    onStreamEnd?: (participantName: string) => void;
  } = {},
  signal?: AbortSignal
): Promise<void> {
  const { onMessage, onRoundStart, onStatusChange, onComplete, onError, onStreamChunk, onStreamEnd } = callbacks;

  conversation.status = 'running';
  onStatusChange?.('running');

  const messagesPerRound = conversation.participants.length;
  const completedRounds = messagesPerRound > 0
    ? Math.floor(conversation.transcript.length / messagesPerRound)
    : 0;
  const startRound = completedRounds + 1;

  let endedByConsensus = false;

  try {
    for (let round = startRound; round <= conversation.rounds; round++) {
      if (signal?.aborted) {
        throw new Error('Cancelled by user');
      }

      conversation.currentRound = round;
      onRoundStart?.(round);

      const isFinalRound = round === conversation.rounds;
      const shuffledParticipants = shuffleArray(conversation.participants);

      for (const participant of shuffledParticipants) {
        if (signal?.aborted) {
          throw new Error('Cancelled by user');
        }

        const provider = providers.get(participant.provider);
        if (!provider) {
          console.warn(`No provider registered for ${participant.provider}, skipping ${participant.modelId}`);
          continue;
        }

        const messages = buildMessages(
          settings.systemPrompt,
          conversation.prompt,
          conversation.transcript,
          participant,
          isFinalRound
        );

        try {
          let fullContent = '';

          if (provider.streamCompletion) {
            // Use streaming if available
            for await (const chunk of provider.streamCompletion(
              participant.modelId,
              messages,
              settings.maxTokensPerResponse,
              signal
            )) {
              if (signal?.aborted) {
                throw new Error('Cancelled by user');
              }
              fullContent += chunk;
              onStreamChunk?.(participant.displayName, chunk);
            }
            onStreamEnd?.(participant.displayName);
          } else {
            // Fall back to non-streaming
            fullContent = await provider.getCompletion(
              participant.modelId,
              messages,
              settings.maxTokensPerResponse,
              signal
            );
          }

          const chatMessage: ChatMessage = {
            role: 'assistant',
            content: fullContent,
            participantName: participant.displayName,
            timestamp: new Date()
          };

          // Generate per-message summary for long messages
          if (fullContent.length >= settings.messageSummaryThreshold) {
            chatMessage.summary = await generateMessageSummary(
              fullContent,
              participant.modelId,
              provider,
              settings.messageSummaryMaxTokens,
              signal
            );
          }

          conversation.transcript.push(chatMessage);
          onMessage?.(chatMessage);
        } catch (err) {
          if (signal?.aborted) {
            throw new Error('Cancelled by user');
          }

          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Error from ${participant.modelId}:`, errorMessage);

          const chatMessage: ChatMessage = {
            role: 'assistant',
            content: `[Error: ${errorMessage}]`,
            participantName: participant.displayName,
            timestamp: new Date()
          };

          conversation.transcript.push(chatMessage);
          onMessage?.(chatMessage);
        }
      }

      // Check for natural conclusion after round 3+
      if (settings.enableAutoConclusion && round >= 3 && !isFinalRound) {
        const shouldConclude = await checkForNaturalConclusion(
          conversation,
          settings.observerModel,
          providers,
          signal
        );

        if (shouldConclude) {
          console.log(`Observer detected natural conclusion at round ${round}`);
          endedByConsensus = true;
          break;
        }
      }
    }

    conversation.status = 'complete';
    conversation.endedByConsensus = endedByConsensus;
    onStatusChange?.('complete');

    // Generate summary if configured
    if (settings.summaryModel && conversation.transcript.length > 0) {
      const summary = await generateSummary(
        conversation,
        settings.summaryModel,
        settings.summaryMaxTokens,
        providers,
        signal
      );
      if (summary) {
        conversation.summary = summary;
      }
    }

    onComplete?.(conversation.summary);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    conversation.status = 'error';
    conversation.errorMessage = errorMessage;
    onStatusChange?.('error');
    onError?.(errorMessage);

    if (errorMessage !== 'Cancelled by user') {
      throw err;
    }
  }
}
