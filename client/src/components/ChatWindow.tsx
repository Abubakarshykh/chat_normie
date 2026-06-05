'use client';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface Message { role: 'user' | 'normie'; content: string; timestamp: string; }
interface Props {
  normieId: string;
  normieName: string;
  normieAvatar: string;
  normieColor: string;
  normieMood: string;
}

const SESSION_ID = `session_${Date.now()}`;

export default function ChatWindow({ normieId, normieName, normieAvatar, normieColor, normieMood }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState(normieMood);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.sendChat(normieId, userMsg.content, SESSION_ID);
      setMood(data.mood);
      setMessages(prev => [...prev, {
        role: 'normie',
        content: data.reply,
        timestamp: data.timestamp,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'normie',
        content: '...',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    await api.clearChat(normieId, SESSION_ID).catch(() => {});
    setMessages([]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '560px' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: `${normieColor}20`, border: `1.5px solid ${normieColor}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>{normieAvatar}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{normieName}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mood: {mood}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearHistory}>Clear</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', textAlign: 'center', gap: '12px',
          }}>
            <div style={{ fontSize: '40px' }}>{normieAvatar}</div>
            <div style={{ fontSize: '0.9rem' }}>
              Start a conversation with <strong style={{ color: normieColor }}>{normieName}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>They'll respond in character…</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
            {msg.role === 'normie' && (
              <div style={{
                width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                background: `${normieColor}20`, border: `1px solid ${normieColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              }}>{normieAvatar}</div>
            )}
            <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'normie'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '8px',
              background: `${normieColor}20`, border: `1px solid ${normieColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>{normieAvatar}</div>
            <div className="chat-bubble normie" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: normieColor,
                    animation: `float 1s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
        <input
          className="input-field"
          placeholder={`Message ${normieName}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-primary"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0, opacity: loading || !input.trim() ? 0.5 : 1 }}
        >
          {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : '→'}
        </button>
      </div>
    </div>
  );
}
