'use client';
import { FeedEvent } from '@/store/useWorldStore';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function NormieChip({ n }: { n: { name: string; avatar: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '999px',
      background: `${n.color}18`, border: `1px solid ${n.color}35`,
      color: n.color, fontWeight: 600, fontSize: '0.82rem',
    }}>
      {n.avatar} {n.name}
    </span>
  );
}

interface Props { event: FeedEvent; }

export default function FeedEventCard({ event }: Props) {
  if (event.type === 'drama') {
    return (
      <div className="feed-event drama" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
            color: '#ef4444', textTransform: 'uppercase',
          }}>{event.label}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(event.timestamp)}</span>
        </div>
        {event.normie1 && event.normie2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <NormieChip n={event.normie1} />
            <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>⚡</span>
            <NormieChip n={event.normie2} />
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
          {event.description}
        </p>
        {event.relationshipChange && (
          <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Relationship → <span style={{ color: event.relationshipChange.aType === 'enemy' ? '#ef4444' : '#10b981' }}>
              {event.relationshipChange.aType}
            </span> (score: {event.relationshipChange.aScore > 0 ? '+' : ''}{event.relationshipChange.aScore})
          </div>
        )}
      </div>
    );
  }

  if (event.type === 'conversation') {
    return (
      <div className="feed-event conversation">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {event.sender && <NormieChip n={event.sender} />}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
            {event.receiver && <NormieChip n={event.receiver} />}
            {event.forced && (
              <span style={{ fontSize: '0.65rem', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 6px', borderRadius: '999px' }}>
                GOD MODE
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(event.timestamp)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            padding: '10px 14px', borderRadius: '12px',
            background: 'rgba(124,58,237,0.08)', borderLeft: '2px solid rgba(124,58,237,0.4)',
            fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5,
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {event.sender?.name}
            </span>
            {event.senderMessage}
          </div>
          {event.receiverReply && (
            <div style={{
              padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(6,182,212,0.06)', borderLeft: '2px solid rgba(6,182,212,0.4)',
              fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5,
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {event.receiver?.name}
              </span>
              {event.receiverReply}
            </div>
          )}
        </div>
        {event.relationshipType && event.relationshipType !== 'neutral' && (
          <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Relationship: <span className={`badge badge-${event.relationshipType}`}>{event.relationshipType}</span>
          </div>
        )}
      </div>
    );
  }

  // Post
  return (
    <div className="feed-event post">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {event.normie && <NormieChip n={event.normie} />}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>posted</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(event.timestamp)}</span>
      </div>
      <p style={{
        padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        "{event.content}"
      </p>
    </div>
  );
}
