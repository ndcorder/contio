import type { ChatMessage } from './chat';
import type { ModelParticipant } from './participant';

export type ConversationStatus = 'pending' | 'running' | 'complete' | 'error';

export interface ConversationState {
  id: string;
  prompt: string;
  participants: ModelParticipant[];
  transcript: ChatMessage[];
  rounds: number;
  currentRound: number;
  status: ConversationStatus;
  errorMessage?: string;
  endedByConsensus: boolean;
  summary?: string;
  mode?: string;
  verdictMode?: string;
  createdAt: Date;
}

export function createConversation(
  prompt: string,
  participants: ModelParticipant[],
  rounds: number,
  mode?: string
): ConversationState {
  return {
    id: crypto.randomUUID(),
    prompt,
    participants,
    transcript: [],
    rounds,
    currentRound: 0,
    status: 'pending',
    endedByConsensus: false,
    mode,
    createdAt: new Date()
  };
}
