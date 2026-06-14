'use client';
import React, { useEffect } from 'react';

export interface HitFlash { damage: number; key: number; }

export interface Combatant {
  imageUrl?: string | null;
  name?: string;
  color?: string;
  health?: number;
  maxHealth?: number;
}

export interface FightingBoardProps {
  left: Combatant;
  right: Combatant;
  leftAnim?: 'idle' | 'lunge' | 'hit';
  rightAnim?: 'idle' | 'lunge' | 'hit';
  leftHit?: HitFlash | null;
  rightHit?: HitFlash | null;
}

const STYLE_ID = 'fb-keyframes';

function getAnimStyle(side: 'left' | 'right', anim: 'idle' | 'lunge' | 'hit'): React.CSSProperties {
  const base: React.CSSProperties = { transform: side === 'right' ? 'scaleX(-1)' : 'scaleX(1)' };
  if (anim === 'lunge') return { ...base, animation: side === 'left' ? 'fbLungeR 0.2s ease-out forwards' : 'fbLungeL 0.2s ease-out forwards' };
  if (anim === 'hit')   return { ...base, animation: side === 'left' ? 'fbShakeL 0.2s ease forwards'     : 'fbShakeR 0.2s ease forwards' };
  return base;
}

export default function FightingBoard({ left, right, leftAnim = 'idle', rightAnim = 'idle', leftHit, rightHit }: FightingBoardProps) {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.innerHTML = `
      @keyframes fbLungeR { 0%{transform:scaleX(1) translateX(0)} 40%{transform:scaleX(1) translateX(80px)} 100%{transform:scaleX(1) translateX(0)} }
      @keyframes fbLungeL { 0%{transform:scaleX(-1) translateX(0)} 40%{transform:scaleX(-1) translateX(-80px)} 100%{transform:scaleX(-1) translateX(0)} }
      @keyframes fbShakeL { 0%{transform:scaleX(1) translateX(0)} 20%{transform:scaleX(1) translateX(-14px)} 50%{transform:scaleX(1) translateX(10px)} 75%{transform:scaleX(1) translateX(-6px)} 100%{transform:scaleX(1) translateX(0)} }
      @keyframes fbShakeR { 0%{transform:scaleX(-1) translateX(0)} 20%{transform:scaleX(-1) translateX(14px)} 50%{transform:scaleX(-1) translateX(-10px)} 75%{transform:scaleX(-1) translateX(6px)} 100%{transform:scaleX(-1) translateX(0)} }
      @keyframes fbFloat  { 0%{opacity:1;transform:translateY(0) scale(1)} 40%{opacity:1;transform:translateY(-28px) scale(1.3)} 100%{opacity:0;transform:translateY(-60px) scale(0.8)} }
    `;
    document.head.appendChild(el);
    return () => { document.getElementById(STYLE_ID)?.remove(); };
  }, []);

  const leftHp  = Math.max(0, ((left.health  ?? 0) / (left.maxHealth  ?? 1)) * 100);
  const rightHp = Math.max(0, ((right.health ?? 0) / (right.maxHealth ?? 1)) * 100);

  const Fighter = ({
    combatant, side, anim, hit,
  }: { combatant: Combatant; side: 'left' | 'right'; anim: 'idle'|'lunge'|'hit'; hit?: HitFlash|null }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 5 }}>
      {/* Floating damage */}
      <div style={{ position: 'relative', height: '28px', width: '120px', display: 'flex', justifyContent: 'center' }}>
        {hit && (
          <div key={hit.key} style={{
            position: 'absolute', top: 0,
            fontSize: '1.5rem', fontWeight: 900, color: '#ef4444',
            textShadow: '0 0 12px #ef4444',
            animation: 'fbFloat 0.8s ease-out forwards',
            pointerEvents: 'none',
          }}>-{hit.damage}</div>
        )}
      </div>

      {/* Sprite */}
      <div style={{ ...getAnimStyle(side, anim), display: 'inline-block' }}>
        <img
          src={combatant.imageUrl ?? ''}
          alt={combatant.name ?? ''}
          style={{
            width: 130, height: 130,
            objectFit: 'cover',
            imageRendering: 'pixelated',
            borderRadius: 12,
            border: `3px solid ${combatant.color ?? '#7c3aed'}`,
            boxShadow: `0 0 24px ${combatant.color ?? '#7c3aed'}66`,
            filter: (combatant.health ?? 1) <= 0 ? 'grayscale(100%)' : 'none',
          }}
        />
      </div>

      {/* Name + HP */}
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: combatant.color ?? '#7c3aed' }}>{combatant.name}</div>
      <div style={{ width: 120, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: leftHp < 25 ? '#ef4444' : '#10b981', width: `${side === 'left' ? leftHp : rightHp}%`, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: 260,
      background: 'linear-gradient(180deg,rgba(10,5,35,0.95) 0%,rgba(20,10,55,0.97) 65%,rgba(8,4,24,1) 100%)',
      borderRadius: 16,
      border: '1px solid rgba(124,58,237,0.35)',
      boxShadow: 'inset 0 0 60px rgba(124,58,237,0.08)',
      overflow: 'hidden',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '20px 48px 20px',
    }}>
      {/* Arena ground ellipse */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 50, zIndex: 0 }} viewBox="0 0 1000 50" preserveAspectRatio="none">
        <ellipse cx="500" cy="48" rx="460" ry="16" fill="rgba(124,58,237,0.10)" />
        <ellipse cx="500" cy="48" rx="460" ry="16" fill="none" stroke="rgba(124,58,237,0.30)" strokeWidth="1" />
      </svg>

      {/* Background scanlines for game feel */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,#fff 3px,#fff 4px)',
        pointerEvents: 'none',
      }} />

      <Fighter combatant={left}  side="left"  anim={leftAnim}  hit={leftHit}  />

      {/* Center sword icon */}
      <div style={{ fontSize: '2.2rem', zIndex: 10, filter: 'drop-shadow(0 0 14px rgba(239,68,68,0.9))', userSelect: 'none', paddingBottom: 40 }}>⚔️</div>

      <Fighter combatant={right} side="right" anim={rightAnim} hit={rightHit} />
    </div>
  );
}
