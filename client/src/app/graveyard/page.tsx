'use client';
import { useEffect, useState } from 'react';
import DramaAlert from '@/components/DramaAlert';

interface BurnedToken {
  tokenId: number;
  burnedBy: string;
  pixels: number;
  timestamp: string;
  commitId: string;
}

export default function GraveyardPage() {
  const [stats, setStats] = useState<{ totalBurnedTokens: number } | null>(null);
  const [burnedTokens, setBurnedTokens] = useState<BurnedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  useEffect(() => {
    fetch('https://api.normies.art/history/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  const fetchGraves = async (currentOffset: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.normies.art/history/burned-tokens?limit=${LIMIT}&offset=${currentOffset}`);
      const data = await res.json();
      
      const tokens = Array.isArray(data) ? data : (data.tokens || []);
      
      if (tokens.length < LIMIT) {
        setHasMore(false);
      }
      
      // We need to fetch details for each token with a 100ms delay to avoid rate limit
      const detailedTokens: BurnedToken[] = [];
      for (const token of tokens) {
        const tokenId = typeof token === 'object' ? token.tokenId : token;
        try {
          const detailRes = await fetch(`https://api.normies.art/history/burned/${tokenId}`);
          const detail = await detailRes.json();
          detailedTokens.push({
            tokenId: detail.tokenId || tokenId,
            burnedBy: detail.burnedBy || detail.burner || 'Unknown',
            pixels: detail.pixelCount || detail.pixels || 0,
            timestamp: detail.timestamp || new Date().toISOString(),
            commitId: detail.commitId || detail.commit || 'Unknown',
          });
        } catch (e) {
          console.error(`Failed to fetch details for ${tokenId}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
      
      setBurnedTokens(prev => [...prev, ...detailedTokens]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraves(0);
  }, []);

  const loadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchGraves(nextOffset);
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      <DramaAlert />
      
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', marginBottom: '16px' }}>
          ⚰️ The Pixel <span style={{ color: '#7c3aed' }}>Graveyard</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Rest in peace. Total burned: {stats ? stats.totalBurnedTokens : '...'} tokens
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '32px' }}>
        {burnedTokens.map((token) => {
          const glowRadius = Math.max(10, Math.min(100, token.pixels / 20));
          return (
            <div key={token.tokenId} className="glass-card" style={{ 
              padding: '20px', 
              textAlign: 'center',
              boxShadow: `0 0 ${glowRadius}px rgba(127, 119, 221, 0.4)`,
              border: '1px solid rgba(127, 119, 221, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: '#7F77DD', opacity: 0.8
              }} />
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🪦</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>Normie #{token.tokenId}</h2>
              
              <div style={{ 
                width: '120px', height: '120px', margin: '0 auto 16px',
                background: 'rgba(0,0,0,0.5)', borderRadius: '12px', overflow: 'hidden',
                border: '2px solid rgba(127,119,221,0.2)'
              }}>
                <img 
                  src={`https://api.normies.art/history/burned/${token.tokenId}/image.png`} 
                  alt={`Normie #${token.tokenId}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) target.parentElement.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#475569">No Image</div>';
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>RIP:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{new Date(token.timestamp).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pixel Count:</span>
                  <span style={{ color: '#7F77DD', fontWeight: 600 }}>{token.pixels}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Burned By:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {token.burnedBy.substring(0,6)}...{token.burnedBy.substring(token.burnedBy.length-4)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      )}

      {!loading && hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <button className="btn btn-ghost" onClick={loadMore} style={{ padding: '12px 32px' }}>
            Load More Ghosts
          </button>
        </div>
      )}
      
      {!loading && !hasMore && burnedTokens.length > 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
          End of the graveyard.
        </div>
      )}
    </div>
  );
}
