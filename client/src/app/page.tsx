'use client';
import { useEffect } from 'react';
import { useWorldStore } from '@/store/useWorldStore';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import FeedEventCard from '@/components/FeedEventCard';
import DramaAlert from '@/components/DramaAlert';

export default function HomePage() {
  useSocket();
  const { normies, feed, stats, setNormies, setFeed, setStats, setLoading, loading } = useWorldStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [n, f, s] = await Promise.all([api.getNormies(), api.getFeed(40), api.getStats()]);
        setNormies(n.normies);
        setFeed(f.feed);
        setStats(s);
      } catch (e) { console.error('Load failed:', e); }
      finally { setLoading(false); }
    }
    load();
    const iv = setInterval(async () => { const s = await api.getStats().catch(() => null); if (s) setStats(s); }, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      <DramaAlert />

      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', marginBottom: '20px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#10b981', letterSpacing: '0.06em' }}>SIMULATION LIVE</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', marginBottom: '16px', lineHeight: 1.1 }}>
          <span className="gradient-text">Normie Life</span> Simulator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '560px', margin: '0 auto' }}>
          10 AI characters living, fighting, and creating drama — completely on their own.
        </p>
        {stats && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '28px', flexWrap: 'wrap' }}>
            {[['Normies', stats.normieCount], ['Interactions', stats.totalInteractions], ['Feed Events', stats.totalFeedEvents], ['Tick', `#${stats.simulationTick}`]].map(([l, v]) => (
              <div key={l as string} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }} className="gradient-text">{v}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>🌍 World Feed</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
                Live
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feed.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                  Simulation starting… first events in a few seconds
                </div>
              ) : feed.map(event => <FeedEventCard key={event.id} event={event} />)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '96px' }}>
            {stats?.topNormie && (
              <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>👑 Most Famous</div>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>{stats.topNormie.avatar}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>{stats.topNormie.name}</div>
                <div className="gradient-text" style={{ fontWeight: 800, fontSize: '1.3rem' }}>{stats.topNormie.reputation.toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>reputation</div>
              </div>
            )}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>All Normies</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {normies.map(n => (
                  <a key={n.id} href={`/normie/${n.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s', textDecoration: 'none' }}>
                    <span style={{ fontSize: '18px' }}>{n.avatar}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: n.color }}>{n.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.mood}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{n.reputation}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
