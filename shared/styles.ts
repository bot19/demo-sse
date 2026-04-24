import type { CSSProperties } from 'react';

const s: Record<string, CSSProperties> = {
  shell:        { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar:      { width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', background: '#fafafa' },
  sidebarHeader:{ padding: '12px 12px', borderBottom: '1px solid #e0e0e0' },
  newChatBtn:   { width: '100%', padding: '8px 0', background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' },
  convList:     { flex: 1, overflowY: 'auto' },
  convItem:     { padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f0f0f0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  main:         { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  messages:     { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 },
  emptyState:   { color: '#aaa', textAlign: 'center', marginTop: 80, fontSize: 15 },
  msgRow:       { display: 'flex', flexDirection: 'column', gap: 4 },
  msgRole:      { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' },
  msgBubble:    { maxWidth: '72%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  inputBar:     { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e0e0e0' },
  input:        { flex: 1, padding: '10px 14px', fontSize: 14, border: '1px solid #ddd', borderRadius: 8, outline: 'none' },
  sendBtn:      { padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14 },
};

export default s;
