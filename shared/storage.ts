import type { Conversation, Message, Role } from './types';

// Each demo calls createStorage with its own key so conversations don't collide in localStorage.
export function createStorage(key: string) {
  return {
    load(): Conversation[] {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as Conversation[]) : [];
    },
    save(conversations: Conversation[]): void {
      localStorage.setItem(key, JSON.stringify(conversations));
    },
  };
}

export function createConversation(firstUserMessage: string): Conversation {
  const title = firstUserMessage.length > 40
    ? firstUserMessage.slice(0, 40) + '…'
    : firstUserMessage;
  return { id: crypto.randomUUID(), title, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
}

export function createMessage(role: Role, content: string): Message {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now() };
}
