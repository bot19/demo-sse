import { useState, useEffect, useRef } from "react";
import type { Conversation } from "@shared/types";
import {
  createStorage,
  createConversation,
  createMessage,
} from "@shared/storage";
import { readSSEStream } from "@shared/sse";
import ChatLayout from "@shared/ChatLayout";

// Points to the BFF instead of OpenAI directly — the only meaningful
// difference from the demo 1 client. The SSE reading code is identical
// because the browser doesn't know or care what's behind the stream.
const BFF = "http://localhost:3002";
const storage = createStorage("demo2_conversations");

export default function App() {
  // all chat conversations, persisted to localStorage
  const [conversations, setConversations] = useState<Conversation[]>(
    storage.load
  );

  // id of the currently selected conversation
  const [activeId, setActiveId] = useState<string | null>(null);

  // true while an SSE response is being received
  const [streaming, setStreaming] = useState(false);

  // current value of the message input field
  const [input, setInput] = useState("");

  // ref to the bottom of the messages container
  const bottomRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // ref to the input field
  const inputRef = useRef<HTMLInputElement>(
    null
  ) as React.RefObject<HTMLInputElement>;

  // current active conversation
  const active = conversations.find((c) => c.id === activeId) ?? null;

  // Persist to localStorage whenever conversations change.
  useEffect(() => {
    storage.save(conversations);
  }, [conversations]);

  // Scroll to bottom when a new message appears.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  // Add a new conversation or update an existing one in state.
  function upsertConversation(conv: Conversation) {
    setConversations((prev) => {
      // does this conversation already exist in the list?
      const exists = prev.some((c) => c.id === conv.id);

      // if yes, replace it in place; if no, prepend it as a new conversation
      return exists
        ? prev.map((c) => (c.id === conv.id ? conv : c))
        : [conv, ...prev];
    });
  }

  async function handleSend() {
    // if input is empty or streaming, do nothing
    if (!input.trim() || streaming) return;

    const userMsg = createMessage("user", input.trim());
    const assistantMsg = createMessage("assistant", ""); // placeholder, filled by stream
    setInput("");

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
      // POST to the BFF — identical request shape to demo 1.
      // The BFF forwards this to OpenAI and pipes the response back as SSE.
      const response = await fetch(`${BFF}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the full message history so the model has context.
        // OpenAI is stateless — we own the history.
        body: JSON.stringify({
          messages: [...base.messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // Each delta from the SSE stream is appended to the assistant message in state.
      // This code is identical to demo 1 — the client can't tell it's going through a BFF.
      let content = "";
      await readSSEStream(response, (delta) => {
        content += delta;

        // walks each convo, if matches current convo (snapshot), update the assistant message content
        setConversations((prev) =>
          prev.map((c) =>
            c.id !== snapshot.id
              ? c
              : {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) =>
                    m.id !== assistantMsg.id ? m : { ...m, content }
                  ),
                }
          )
        );
      });
    } catch (err) {
      console.error("Stream error:", err);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    setActiveId(null);
    setInput("");
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
