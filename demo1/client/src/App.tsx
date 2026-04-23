import { useState, useEffect, useRef } from 'react';
import type { Conversation } from '@shared/types';
import { loadConversations, saveConversations, createConversation, createMessage } from './storage';
import { readSSEStream } from './sse';
import ChatLayout from './ChatLayout';

const SERVER = 'http://localhost:3001';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const inputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // Persist to localStorage whenever conversations change.
  useEffect(() => { saveConversations(conversations); }, [conversations]);

  // Scroll to bottom when a new message appears.
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages.length]);

  // Add a new conversation or update an existing one in state.
  function upsertConversation(conv: Conversation) {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      return exists ? prev.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...prev];
    });
  }

  async function handleSend() {
    if (!input.trim() || streaming) return;

    const userMsg = createMessage('user', input.trim());
    const assistantMsg = createMessage('assistant', ''); // placeholder, filled by stream
    setInput('');

    // Use the active conversation or start a fresh one.
    const base = active ?? createConversation(userMsg.content);
    const snapshot: Conversation = {
      ...base,
      messages: [...base.messages, userMsg, assistantMsg],
      updatedAt: Date.now(),
    };

    upsertConversation(snapshot);
    setActiveId(snapshot.id);
    setStreaming(true);

    try {
      const response = await fetch(`${SERVER}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the full message history so the model has context.
        // OpenAI is stateless — we own the history.
        body: JSON.stringify({
          messages: [...base.messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      // Each delta from the SSE stream is appended to the assistant message in state.
      let content = '';
      await readSSEStream(response, (delta) => {
        content += delta;
        setConversations((prev) =>
          prev.map((c) =>
            c.id !== snapshot.id ? c : {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) => m.id !== assistantMsg.id ? m : { ...m, content }),
            }
          )
        );
      });
    } catch (err) {
      console.error('Stream error:', err);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    setActiveId(null);
    setInput('');
    inputRef.current?.focus();
  }

  return (
    <ChatLayout
      conversations={conversations}
      active={active}
      activeId={activeId}
      streaming={streaming}
      input={input}
      onSelectConversation={setActiveId}
      onNewChat={startNewChat}
      onInputChange={setInput}
      onSend={handleSend}
      inputRef={inputRef}
      bottomRef={bottomRef}
    />
  );
}
