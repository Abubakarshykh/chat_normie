'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorldStore } from '@/store/useWorldStore';

const NAV_LINKS = [
  { href: '/', label: '🌍 World Feed' },
  { href: '/world', label: '🗺️ Overview' },
  { href: '/graveyard', label: '⚰️ Graveyard' },
  { href: '/battle', label: '⚔️ Battle' },
  { href: '/normode', label: '👑 Normode' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { connected, stats } = useWorldStore();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(4,4,10,0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(124,58,237,0.15)',
      height: '72px',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 0 20px rgba(124,58,237,0.4)',
          }}>🌍</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              <span className="gradient-text">Normie</span>{' '}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Life</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              AI Simulator
            </div>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                background: pathname === link.href
                  ? 'rgba(124,58,237,0.15)'
                  : 'transparent',
                color: pathname === link.href
                  ? 'var(--accent-purple)'
                  : 'var(--text-secondary)',
                border: pathname === link.href
                  ? '1px solid rgba(124,58,237,0.3)'
                  : '1px solid transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {stats && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tick #{stats.simulationTick} · {stats.totalInteractions} interactions
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '999px',
            background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: connected ? '#10b981' : '#ef4444',
              boxShadow: connected ? '0 0 8px #10b981' : '0 0 8px #ef4444',
              animation: connected ? 'pulse-glow 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: connected ? '#10b981' : '#ef4444' }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
