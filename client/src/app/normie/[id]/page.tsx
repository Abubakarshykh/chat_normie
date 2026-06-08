'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import ChatWindow from '@/components/ChatWindow';
import DramaAlert from '@/components/DramaAlert';

const STAT_COLORS: Record<string, string> = {
  charisma: '#ec4899', intelligence: '#8b5cf6',
  aggression: '#ef4444', humor: '#f59e0b', empathy: '#10b981',
};

const MOOD_EMOJI: Record<string, string> = {
  happy: '😄', content: '😊', neutral: '😐', annoyed: '😤',
  hostile: '😠', furious: '🤬', 'fired-up': '🔥', calculating: '🧮',
  dreamy: '🌙', scheming: '🤔', glitching: '⚡', observing: '👁️',
  destructive: '💥', fabulous: '✨', weary: '😮‍💨',
};

export default function NormiePage() {
  useSocket();
  const { id } = useParams<{ id: string }>();
  const [normie, setNormie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getNormie(id).then(data => { setNormie(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!normie) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
      <div>Normie not found</div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      <DramaAlert />

      {/* Back */}
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px', textDecoration: 'none' }}>
        ← Back to World Feed
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px', alignItems: 'start' }}>

        {/* LEFT: Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Avatar Card */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <img src={normie.imageUrl} alt={normie.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
            <div style={{ padding: '20px' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>{normie.nftName}</h1>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>{normie.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {normie.nftTraits?.map((trait: any) => (
                  <div key={trait.trait_type} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{trait.trait_type}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{trait.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Backstory */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Backstory</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{normie.backstory}</p>
          </div>

          {/* Stats */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {normie.stats && Object.entries(normie.stats).map(([key, val]) => (
                <div key={key} className="stat-bar-wrap">
                  <div className="stat-bar-label">
                    <span style={{ textTransform: 'capitalize' }}>{key}</span>
                    <span style={{ color: STAT_COLORS[key] || 'var(--accent-purple)', fontWeight: 700 }}>{val as number}</span>
                  </div>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill" style={{ width: `${val}%`, background: STAT_COLORS[key] || 'var(--accent-purple)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traits & Interests */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Traits</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {normie.traits?.map((t: string) => (
                <span key={t} style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: `${normie.color}15`, color: normie.color, border: `1px solid ${normie.color}30` }}>{t}</span>
              ))}
            </div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Interests</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {normie.interests?.map((i: string) => (
                <span key={i} style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>{i}</span>
              ))}
            </div>
          </div>

          {/* Memory */}
          {normie.memory?.shortTerm?.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Recent Memory</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {normie.memory.shortTerm.map((m: string, i: number) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${normie.color}40` }}>{m}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Chat + Relationships */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chat */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>💬 Chat with {normie.name}</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>They'll respond in character, based on their personality and memories.</p>
            </div>
            <ChatWindow
              normieId={normie.id}
              normieName={normie.name}
              normieAvatar={normie.avatar}
              normieColor={normie.color}
              normieMood={normie.mood}
            />
          </div>

          {/* Relationships */}
          {normie.relationships?.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>🤝 Relationships</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {normie.relationships.filter((r: any) => r.type !== 'neutral' || r.interactions > 0).slice(0, 9).map((rel: any) => rel.normie && (
                  <a key={rel.normie.id} href={`/normie/${rel.normie.id}`} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{rel.normie.avatar}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: rel.normie.color }}>{rel.normie.name}</span>
                    </div>
                    <span className={`badge badge-${rel.type}`}>{rel.type.replace('_', ' ')}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Score: {rel.score > 0 ? '+' : ''}{rel.score} · {rel.interactions} interactions
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
