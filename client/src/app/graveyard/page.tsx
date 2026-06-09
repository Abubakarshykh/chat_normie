'use client';
import { useEffect, useState } from 'react';

interface BurnedToken {
  tokenId: string;
  txHash: string;
  timestamp: string;
}

interface TokenDetail {
  burnedBy: string;
  pixels: number;
  commitId: string;
}

function SkeletonCard() {
  return (
    <div className="glass-card" style={{
      padding: '20px', textAlign: 'center',
      border: '1px solid rgba(127, 119, 221, 0.2)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: 'rgba(127,119,221,0.2)',
      }} />
      <div style={{ fontSize: '3rem', marginBottom: '8px', opacity: 0.3 }}>🪦</div>
      <div style={{ height: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px', width: '60%', margin: '0 auto 12px' }} />
      <div style={{
        width: '120px', height: '120px', margin: '0 auto 16px',
        background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1,2].map(i => (
          <div key={i} style={{ height: '14px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', width: `${50 + i * 20}%`, margin: '0 auto' }} />
        ))}
      </div>
    </div>
  );
}

function GraveCard({ token }: { token: BurnedToken }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<TokenDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (detail) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`https://api.normies.art/history/burned/${token.tokenId}`);
      const data = await res.json();
      setDetail({
        burnedBy: data.commitment?.owner || 'Unknown',
        pixels: data.commitment?.pixelCounts ? JSON.parse(data.commitment.pixelCounts)[0] : 0,
        commitId: data.commitment?.commitId || 'Unknown',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const date = token.timestamp
    ? new Date(parseInt(token.timestamp) * 1000).toLocaleDateString()
    : '—';

  return (
    <div
      className="glass-card"
      onClick={handleExpand}
      style={{
        padding: '20px', textAlign: 'center', cursor: 'pointer',
        boxShadow: '0 0 20px rgba(127, 119, 221, 0.25)',
        border: `1px solid rgba(127, 119, 221, ${expanded ? '0.5' : '0.3'})`,
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: '#7F77DD', opacity: 0.8,
      }} />
      <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🪦</div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>Normie #{token.tokenId}</h2>

      <div style={{
        width: '120px', height: '120px', margin: '0 auto 16px',
        background: 'rgba(0,0,0,0.5)', borderRadius: '12px', overflow: 'hidden',
        border: '2px solid rgba(127,119,221,0.2)',
      }}>
        <img
          src={`https://api.normies.art/history/burned/${token.tokenId}/image.png`}
          alt={`Normie #${token.tokenId}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) target.parentElement.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#475569;font-size:0.75rem">No Image</div>';
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>RIP:</span>
          <span style={{ color: 'var(--text-primary)' }}>{date}</span>
        </div>

        {!expanded && (
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'rgba(127,119,221,0.7)' }}>
            Click to reveal details ↓
          </div>
        )}

        {expanded && (
          <>
            {loadingDetail ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
                <div className="spinner" style={{ width: 18, height: 18 }} />
              </div>
            ) : detail ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pixel Count:</span>
                  <span style={{ color: '#7F77DD', fontWeight: 600 }}>{detail.pixels}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Burned By:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {detail.burnedBy.substring(0, 6)}...{detail.burnedBy.substring(detail.burnedBy.length - 4)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Commit:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>#{detail.commitId}</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Details unavailable</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function GraveyardPage() {
  const [stats, setStats] = useState<{ totalBurnedTokens: number } | null>(null);
  const [burnedTokens, setBurnedTokens] = useState<BurnedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 12;

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
      const tokens: BurnedToken[] = Array.isArray(data) ? data : (data.tokens || []);
      if (tokens.length < LIMIT) setHasMore(false);
      setBurnedTokens(prev => [...prev, ...tokens]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGraves(0); }, []);

  const loadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchGraves(nextOffset);
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', marginBottom: '16px' }}>
          ⚰️ The Pixel <span style={{ color: '#7c3aed' }}>Graveyard</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Rest in peace. Total burned: {stats ? stats.totalBurnedTokens : '...'} tokens
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '32px' }}>
        {burnedTokens.map((token, index) => (
          <GraveCard key={`${token.tokenId}-${index}`} token={token} />
        ))}
        {loading && Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
      </div>

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
