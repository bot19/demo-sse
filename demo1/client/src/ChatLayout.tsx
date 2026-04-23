import { useRef } from 'react';
import type { Conversation, Message } from '@shared/types';
import s from './styles';

interface Props {
  conversations: Conversation[];
  active: Conversation | null;
  activeId: string | null;
  streaming: boolean;
  input: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
}

export default function ChatLayout({
  conversations, active, activeId, streaming,
  input, onSelectConversation, onNewChat,
  onInputChange, onSend, inputRef, bottomRef,
}: Props) {
  const lastMsgId = active?.messages.at(-1)?.id;

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <button onClick={onNewChat} style={s.newChatBtn}>+ New Chat</button>
        </div>
        <div style={s.convList}>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              style={{ ...s.convItem, background: c.id === activeId ? '#e8e8e8' : 'transparent', fontWeight: c.id === activeId ? 600 : 400 }}
            >
              {c.title}
            </div>
          ))}
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.messages}>
          {!active && <p style={s.emptyState}>Start a new conversation →</p>}

          {active?.messages.map((m: Message) => (
            <div key={m.id} style={{ ...s.msgRow, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={s.msgRole}>{m.role === 'user' ? 'You' : 'AI'}</div>
              <div style={{ ...s.msgBubble, background: m.role === 'user' ? '#111' : '#f0f0f0', color: m.role === 'user' ? '#fff' : '#111' }}>
                {m.content || (streaming && m.id === lastMsgId ? '▌' : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={s.inputBar}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            disabled={streaming}
            placeholder={streaming ? 'Waiting for response…' : 'Message — Enter to send'}
            style={s.input}
          />
          <button
            onClick={onSend}
            disabled={streaming || !input.trim()}
            style={{ ...s.sendBtn, opacity: streaming || !input.trim() ? 0.4 : 1, cursor: streaming || !input.trim() ? 'default' : 'pointer' }}
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
