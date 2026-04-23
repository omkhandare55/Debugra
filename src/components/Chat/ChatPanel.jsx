import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Simple hash to generate consistent avatar colors per user
const hashColor = (str) => {
  const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatTime = (timestamp) => {
  if (!timestamp?.toDate) return '';
  const d = timestamp.toDate();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatPanel({ roomId, user, isOpen, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      // Track unread when panel is closed
      if (!isOpen && msgs.length > prevCountRef.current) {
        setUnreadCount(prev => prev + (msgs.length - prevCountRef.current));
      }
      prevCountRef.current = msgs.length;

      // Auto-scroll
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [roomId, isOpen]);

  // Clear unread on open
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !roomId || !user) return;
    const msg = input.trim();
    setInput('');
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      text: msg,
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      createdAt: serverTimestamp(),
    });
  };

  if (!roomId) return null;

  // Group consecutive messages from same user
  const groupedMessages = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const showHeader = !prev || prev.uid !== msg.uid;
    groupedMessages.push({ ...msg, showHeader });
  });

  return (
    <>
      {/* ===== FLOATING ACTION BUTTON ===== */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="Team Chat"
          style={{
            position: 'fixed', right: '20px', bottom: '20px',
            width: '48px', height: '48px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(139,92,246,0.5), 0 0 0 3px rgba(139,92,246,0.15)',
            transition: 'all 0.25s ease', zIndex: 30,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,92,246,0.6), 0 0 0 4px rgba(139,92,246,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.5), 0 0 0 3px rgba(139,92,246,0.15)'; }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              minWidth: '20px', height: '20px', borderRadius: '10px',
              background: '#ef4444', color: 'white', fontSize: '0.65rem',
              fontWeight: 700, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0 5px',
              border: '2px solid #1e1e1e',
              animation: 'bounce-in 0.3s ease',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ===== CHAT PANEL ===== */}
      {isOpen && (
        <div style={{
          position: 'fixed', right: '20px', bottom: '20px',
          width: '360px', maxHeight: '520px', height: '520px',
          borderRadius: '16px', display: 'flex', flexDirection: 'column',
          background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
          zIndex: 30, overflow: 'hidden',
          animation: 'slide-up 0.3s ease',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>

          {/* ===== HEADER ===== */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.05))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                  Team Chat
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '1px' }}>
                  Room: {roomId}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Online indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '12px',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)',
                marginRight: '8px',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: '#10b981',
                  boxShadow: '0 0 6px rgba(16,185,129,0.5)',
                }} />
                <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 600 }}>LIVE</span>
              </div>
              {/* Close */}
              <button
                onClick={onToggle}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#64748b', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* ===== MESSAGES ===== */}
          <div style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '2px',
          }}>
            {messages.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', flex: 1, gap: '12px', padding: '40px 0',
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '4px' }}>
                    Start the conversation
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
                    Send a message to your team.<br />Everyone in this room will see it.
                  </p>
                </div>
              </div>
            )}

            {groupedMessages.map((msg) => {
              const isMe = msg.uid === user?.uid;
              const avatarColor = hashColor(msg.uid);
              const initial = (msg.displayName?.[0] || '?').toUpperCase();

              return (
                <div key={msg.id} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  marginTop: msg.showHeader ? '12px' : '2px',
                }}>
                  {/* Name + Avatar (only on first of group) */}
                  {msg.showHeader && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      marginBottom: '4px', padding: '0 4px',
                      flexDirection: isMe ? 'row-reverse' : 'row',
                    }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '6px',
                        background: isMe ? '#8b5cf6' : avatarColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.55rem', fontWeight: 700, color: 'white',
                        flexShrink: 0,
                      }}>
                        {initial}
                      </div>
                      <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>
                        {isMe ? 'You' : msg.displayName}
                      </span>
                      <span style={{ fontSize: '0.55rem', color: '#334155' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  {/* Bubble */}
                  <div style={{
                    maxWidth: '82%', padding: '8px 12px',
                    borderRadius: '12px',
                    borderTopLeftRadius: !isMe && msg.showHeader ? '4px' : '12px',
                    borderTopRightRadius: isMe && msg.showHeader ? '4px' : '12px',
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.15))'
                      : 'rgba(255,255,255,0.04)',
                    border: isMe
                      ? '1px solid rgba(139,92,246,0.15)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: isMe ? '#e2e8f0' : '#94a3b8',
                    fontSize: '0.78rem', lineHeight: 1.55,
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* ===== INPUT ===== */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '4px 4px 4px 14px',
              transition: 'border-color 0.2s',
            }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#e2e8f0', fontSize: '0.8rem',
                  fontFamily: "'Inter', sans-serif",
                  padding: '6px 0',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: input.trim()
                    ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                    : 'rgba(255,255,255,0.04)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (input.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={input.trim() ? 'white' : '#475569'}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: '0.58rem', color: '#334155', marginTop: '6px', textAlign: 'center' }}>
              Press Enter to send · Visible to all room members
            </p>
          </div>
        </div>
      )}
    </>
  );
}
