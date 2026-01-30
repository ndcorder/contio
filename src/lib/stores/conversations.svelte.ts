import type { ConversationState, ChatMessage, ModelParticipant, ConversationStatus } from '$lib/models';
import { createConversation } from '$lib/models';

function createConversationsStore() {
  let conversations = $state<ConversationState[]>([]);
  let activeIndex = $state<number>(-1);

  return {
    get list() {
      return conversations;
    },

    get activeIndex() {
      return activeIndex;
    },

    get active(): ConversationState | undefined {
      if (activeIndex < 0 || activeIndex >= conversations.length) return undefined;
      return conversations[activeIndex];
    },

    add(prompt: string, participants: ModelParticipant[], rounds: number): ConversationState {
      const conversation = createConversation(prompt, participants, rounds);
      conversations = [conversation, ...conversations];
      activeIndex = 0;
      return conversation;
    },

    setActive(index: number) {
      if (index >= 0 && index < conversations.length) {
        activeIndex = index;
      }
    },

    setActiveById(id: string) {
      const index = conversations.findIndex(c => c.id === id);
      if (index >= 0) {
        activeIndex = index;
      }
    },

    updateTranscript(id: string, message: ChatMessage) {
      const index = conversations.findIndex(c => c.id === id);
      if (index >= 0) {
        conversations[index].transcript = [...conversations[index].transcript, message];
        conversations = [...conversations];
      }
    },

    setStatus(id: string, status: ConversationStatus, errorMessage?: string) {
      const index = conversations.findIndex(c => c.id === id);
      if (index >= 0) {
        conversations[index].status = status;
        if (errorMessage !== undefined) {
          conversations[index].errorMessage = errorMessage;
        }
        conversations = [...conversations];
      }
    },

    setCurrentRound(id: string, round: number) {
      const index = conversations.findIndex(c => c.id === id);
      if (index >= 0) {
        conversations[index].currentRound = round;
        conversations = [...conversations];
      }
    },

    setSummary(id: string, summary: string) {
      const index = conversations.findIndex(c => c.id === id);
      if (index >= 0) {
        conversations[index].summary = summary;
        conversations = [...conversations];
      }
    },

    setEndedByConsensus(id: string, value: boolean) {
      const index = conversations.findIndex(c => c.id === id);
      if (index >= 0) {
        conversations[index].endedByConsensus = value;
        conversations = [...conversations];
      }
    },

    remove(id: string) {
      const index = conversations.findIndex(c => c.id === id);
      if (index >= 0) {
        conversations = conversations.filter(c => c.id !== id);
        if (activeIndex >= conversations.length) {
          activeIndex = Math.max(0, conversations.length - 1);
        }
        if (conversations.length === 0) {
          activeIndex = -1;
        }
      }
    },

    loadFromStorage(stored: ConversationState[]) {
      conversations = stored.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        transcript: c.transcript.map(m => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : undefined
        }))
      }));
      if (conversations.length > 0 && activeIndex < 0) {
        activeIndex = 0;
      }
    },

    clear() {
      conversations = [];
      activeIndex = -1;
    }
  };
}

export const conversationsStore = createConversationsStore();
