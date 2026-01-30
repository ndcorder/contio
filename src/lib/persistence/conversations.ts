import type { ConversationState } from '$lib/models';

const STORAGE_KEY = 'contio-conversations';
const MAX_CONVERSATIONS = 100;

interface StoredConversation extends Omit<ConversationState, 'createdAt'> {
  createdAt: string;
}

export function loadConversations(): ConversationState[] {
  if (typeof localStorage === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed: StoredConversation[] = JSON.parse(stored);
    return parsed.map(c => ({
      ...c,
      createdAt: new Date(c.createdAt),
      transcript: c.transcript.map(m => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : undefined
      }))
    }));
  } catch {
    return [];
  }
}

export function saveConversations(conversations: ConversationState[]): void {
  if (typeof localStorage === 'undefined') return;

  // Keep only the most recent conversations
  const toSave = conversations.slice(0, MAX_CONVERSATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function saveConversation(conversation: ConversationState): void {
  const existing = loadConversations();
  const index = existing.findIndex(c => c.id === conversation.id);

  if (index >= 0) {
    existing[index] = conversation;
  } else {
    existing.unshift(conversation);
  }

  saveConversations(existing);
}

export function deleteConversation(id: string): void {
  const existing = loadConversations();
  const filtered = existing.filter(c => c.id !== id);
  saveConversations(filtered);
}

export function clearConversations(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function exportConversation(conversation: ConversationState): void {
  const data = JSON.stringify(conversation, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `contio-${conversation.id.slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportConversationAsMarkdown(conversation: ConversationState): void {
  const lines: string[] = [];

  lines.push(`# ${conversation.prompt}`);
  lines.push('');
  lines.push(`**Date:** ${conversation.createdAt.toLocaleString()}`);
  lines.push(`**Participants:** ${conversation.participants.map(p => p.displayName).join(', ')}`);
  lines.push(`**Rounds:** ${conversation.currentRound}/${conversation.rounds}`);
  if (conversation.endedByConsensus) {
    lines.push('**Ended by consensus**');
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const msg of conversation.transcript) {
    lines.push(`## ${msg.participantName}`);
    lines.push('');
    lines.push(msg.content);
    lines.push('');
  }

  if (conversation.summary) {
    lines.push('---');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(conversation.summary);
  }

  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `contio-${conversation.id.slice(0, 8)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
