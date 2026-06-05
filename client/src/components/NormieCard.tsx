'use client';
import Link from 'next/link';
import { NormieSummary } from '@/store/useWorldStore';

const MOOD_EMOJI: Record<string, string> = {
  'happy': '😄', 'content': '😊', 'neutral': '😐', 'annoyed': '😤',
  'hostile': '😠', 'furious': '🤬', 'fired-up': '🔥', 'calculating': '🧮',
  'dreamy': '🌙', 'scheming': '🤔', 'glitching': '⚡', 'observing': '👁️',
  'destructive': '💥', 'fabulous': '✨', 'weary': '😮‍💨',
};

const STAT_COLORS: Record<string, string> = {
  charisma: '#ec4899', intelligence: '#8b5cf6',
  aggression: '#ef4444', humor: '#f59e0b', empathy: '#10b981',
};

interface Props { normie: NormieSummary; rank?: number; }

export default function NormieCard({ normie, rank }: Props) {
  return (
    <Link href={`/normie/${normie.id}`} style={{ display: 'block' }}>
      <div className="glass-card" style={{
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${normie.color}, transparent)`,
          opacity: 0.8,
        }} />

        {/* Rank badge */}
        {rank && (
          <div style={{
            position: 'absolute', top: 14, right: 14,
            width: 24, height: 24, borderRadius: '50%',
            background: rank === 1 ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' :
                        rank === 2 ? 'linear-gradient(135deg,#94a3b8,#cbd5e1)' :
                        rank === 3 ? 'linear-gradient(135deg,#b45309,#d97706)' :
                        'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 800, color: rank <= 3 ? '#000' : 'var(--text-muted)',
          }}>#{rank}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          {/* NFT Pixel Art Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '14px',
            background: `${normie.color}20`,
            border: `2px solid ${normie.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: `0 0 20px ${normie.color}30`,
            flexShrink: 0,
          }}>
            {normie.imageUrl ? (
              <img
                src={normie.imageUrl}
                alt={normie.nftName || normie.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  imageRendering: 'pixelated',
                }}
                onError={(e) => {
                  // Fallback to emoji avatar if image fails
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span style="font-size:24px">${normie.avatar}</span>`;
                  }
                }}
              />
            ) : (
              <span style={{ fontSize: '24px' }}>{normie.avatar}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>
              {normie.name}
            </div>
            {normie.nftName && (
              <div style={{ fontSize: '0.68rem', color: normie.color, fontWeight: 600, marginBottom: '1px', opacity: 0.85 }}>
                {normie.nftName}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {normie.archetype}
            </div>
          </div>
          <div style={{ fontSize: '18px' }}>
            {MOOD_EMOJI[normie.mood] || '😐'}
          </div>
        </div>

        {/* Reputation */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Reputation</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{normie.reputation.toLocaleString()}</span>
          </div>
          <div className="rep-bar" style={{ height: '4px', background: `linear-gradient(90deg, ${normie.color}, ${normie.color}80)`, width: `${Math.min(100, normie.reputation / 10)}%` }} />
        </div>

        {/* Key Stats (top 3) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[['charisma', normie.stats.charisma], ['intelligence', normie.stats.intelligence], ['humor', normie.stats.humor]].map(([key, val]) => (
            <div key={key as string} style={{
              flex: 1, textAlign: 'center', padding: '6px 4px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: STAT_COLORS[key as string] }}>
                {val}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {(key as string).slice(0, 4)}
              </div>
            </div>
          ))}
        </div>

        {/* Traits */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {normie.traits.slice(0, 3).map(t => (
            <span key={t} style={{
              padding: '2px 8px', borderRadius: '999px',
              fontSize: '0.68rem', fontWeight: 500,
              background: `${normie.color}15`,
              color: normie.color,
              border: `1px solid ${normie.color}30`,
            }}>{t}</span>
          ))}
          {normie.traits.length > 3 && (
            <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)' }}>
              +{normie.traits.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
