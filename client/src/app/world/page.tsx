'use client';
import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useWorldStore } from '@/store/useWorldStore';
import { api } from '@/lib/api';
import NormieCard from '@/components/NormieCard';
import DramaAlert from '@/components/DramaAlert';

export default function WorldPage() {
  useSocket();
  const { normies, setNormies, stats, setStats, loading, setLoading } = useWorldStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [lb, s] = await Promise.all([api.getLeaderboard(), api.getStats()]);
        setNormies(lb.leaderboard);
        setStats(s);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      <DramaAlert />
      <div className="page-header">
        <h1>🗺️ World <span className="gradient-text">Overview</span></h1>
        <p>All 10 Normies ranked by reputation. Click any card to chat with them.</p>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '36px' }}>
          {[
            ['🤖','Normies', stats.normieCount],
            ['💬','Interactions', stats.totalInteractions.toLocaleString()],
            ['📰','Feed Events', stats.totalFeedEvents],
            ['⚡','Tick', `#${stats.simulationTick}`],
          ].map(([icon,label,value]) => (
            <div key={label as string} className="glass-card" style={{ padding:'20px', textAlign:'center' }}>
              <div style={{ fontSize:'1.8rem', marginBottom:'8px' }}>{icon}</div>
              <div className="gradient-text" style={{ fontWeight:800, fontSize:'1.4rem', fontFamily:'var(--font-heading)' }}>{value}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}><div className="spinner" style={{ width:40, height:40 }} /></div>
      ) : (
        <>
          {normies.length >= 3 && (
            <div style={{ marginBottom:'36px' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'20px', color:'var(--text-secondary)' }}>🏆 Hall of Fame</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
                {normies.slice(0,3).map((n:any,i:number) => (
                  <div key={n.id} style={{ position:'relative' }}>
                    {i===0 && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', fontSize:'1.5rem', zIndex:1 }}>👑</div>}
                    <NormieCard normie={n} rank={i+1} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'16px', color:'var(--text-secondary)' }}>All Normies</h2>
          <div className="normies-grid">
            {normies.map((n:any,i:number) => <NormieCard key={n.id} normie={n} rank={i+1} />)}
          </div>
          <div className="glass-card" style={{ padding:'28px', textAlign:'center', marginTop:'36px' }}>
            <div style={{ fontSize:'2rem', marginBottom:'8px' }}>🕸️</div>
            <h3 style={{ fontWeight:700, marginBottom:'8px' }}>Relationship Web</h3>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:'16px' }}>Every Normie has a dynamic relationship score with every other. Click a profile to see their bonds.</p>
            <div style={{ display:'flex', justifyContent:'center', gap:'8px', flexWrap:'wrap' }}>
              {['best_friend','friend','ally','crush','neutral','rival','enemy'].map(t=>(
                <span key={t} className={`badge badge-${t}`}>{t.replace('_',' ')}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
