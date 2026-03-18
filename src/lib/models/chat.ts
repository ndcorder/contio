export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  participantName?: string;
  timestamp?: Date;
  summary?: string;
}

export interface DiscussionRound {
  roundNumber: number;
  responses: ChatMessage[];
}
