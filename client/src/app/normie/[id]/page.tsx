'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import ChatWindow from '@/components/ChatWindow';
import DramaAlert from '@/components/DramaAlert';
import * as Tone from 'tone';

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

function AncestryTab({ tokenId }: { tokenId: number | string }) {
  const [ancestors, setAncestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAncestry() {
      try {
        const res = await fetch(`https://api.normies.art/history/burns/receiver/${tokenId}`);
        const commits = await res.json();
        
        const allAncestors: any[] = [];
        for (const commit of commits) {
          const commitRes = await fetch(`https://api.normies.art/history/burns/${commit.commitId}`);
          const commitData = await commitRes.json();
          const tokens = commitData.burnedTokens || [];
          for (const burnedId of tokens) {
            allAncestors.push(burnedId);
          }
        }
        setAncestors(allAncestors);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAncestry();
  }, [tokenId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ width: 30, height: 30, margin: '0 auto' }} /></div>;

  if (ancestors.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✨</div>
        <p>This Normie carries no ghosts. Pure original pixels. 🌟</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(30,10,50,0.5)', border: '1px solid rgba(124,58,237,0.3)' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#d8b4fe' }}>🧬 DNA Ancestry</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>This Normie carries {ancestors.length} ghost(s)</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
        {ancestors.map((id, i) => (
          <div key={`${id}-${i}`} style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.8 }}>👻</div>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 8px', borderRadius: '8px', overflow: 'hidden', opacity: 0.5, mixBlendMode: 'screen' }}>
              <img src={`https://api.normies.art/history/burned/${id}/image.png`} style={{ width: '100%', height: '100%', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.8))' }} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Token #{id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NormiePage() {
  useSocket();
  const { id } = useParams<{ id: string }>();
  const [normie, setNormie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'relationships' | 'ancestry'>('chat');
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getNormie(id).then(data => { setNormie(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);

  const stopSound = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    setIsPlayingSound(false);
  };

  const playBitmapSoundscape = async () => {
    if (isPlayingSound) { stopSound(); return; }
    setIsPlayingSound(true);

    try {
      await Tone.start();
      const res = await fetch(`https://api.normies.art/normie/${normie.tokenId || normie.id}/pixels`);
      const pixels = res.ok ? await res.text() : '';

      const synth = new Tone.Synth().toDestination();
      synthRef.current = synth;

      const pixelString = pixels.length === 1600 ? pixels : Array(1600).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('');
      const rows = [];
      for (let i = 0; i < 40; i++) {
        rows.push(pixelString.substring(i * 40, (i + 1) * 40));
      }

      const now = Tone.now();
      rows.forEach((row, index) => {
        const density = (row.match(/1/g) || []).length;
        const frequency = 200 + (density / 40) * 600;
        synth.triggerAttackRelease(frequency, '80ms', now + index * 0.1);
      });

      setTimeout(() => {
        setIsPlayingSound(false);
        synthRef.current = null;
      }, 4000);

    } catch (e) {
      console.error(e);
      setIsPlayingSound(false);
    }
  };

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
            <img src={normie.imageUrl} alt={normie.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', imageRendering: 'pixelated' }} />
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '16px', border: `1px solid ${isPlayingSound ? 'var(--accent-red)' : 'var(--accent-cyan)'}`, color: isPlayingSound ? 'var(--accent-red)' : 'var(--accent-cyan)', transition: 'all 0.2s' }}
                onClick={playBitmapSoundscape}
              >
                {isPlayingSound ? '⏹️ Stop Sound' : '🎵 Play Sound'}
              </button>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>{normie.nftName}</h1>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>{normie.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left' }}>
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
        </div>

        {/* RIGHT: Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <button 
              className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('chat')}
            >💬 Chat</button>
            <button 
              className={`btn ${activeTab === 'relationships' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('relationships')}
            >🤝 Relationships</button>
            <button 
              className={`btn ${activeTab === 'ancestry' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('ancestry')}
            >🧬 Ancestry</button>
          </div>

          {activeTab === 'chat' && (
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
          )}

          {activeTab === 'relationships' && normie.relationships?.length > 0 && (
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

          {activeTab === 'ancestry' && (
            <AncestryTab tokenId={normie.tokenId || normie.id} />
          )}

          {/* Memory */}
          {normie.memory?.shortTerm?.length > 0 && (
            <div className="glass-card" style={{ padding: '20px', marginTop: '24px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Recent Memory</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {normie.memory.shortTerm.map((m: string, i: number) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${normie.color}40` }}>{m}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
