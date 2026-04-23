import type { Conversation, Message, Role } from '@shared/types';

const KEY = 'demo1_conversations';

export function loadConversations(): Conversation[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Conversation[]) : [];
}

export function saveConversations(conversations: Conversation[]): void {
  localStorage.setItem(KEY, JSON.stringify(conversations));
}

export function createConversation(firstUserMessage: string): Conversation {
  const title =
    firstUserMessage.length > 40
      ? firstUserMessage.slice(0, 40) + '…'
      : firstUserMessage;
  return {
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

export function createMessage(role: Role, content: string): Message {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now() };
}
