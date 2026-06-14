'use client';
import { useEffect, useState } from 'react';
import FightingBoard, { HitFlash } from '@/components/FightingBoard';
import GameModal from '@/components/GameModal';
import { useWorldStore } from '@/store/useWorldStore';

interface CombatantStats {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  maxHealth: number;
  health: number;
  attack: number;
  defense: number;
  isCustomized: boolean;
  pixels: string;
}

interface BattleLog {
  round: number;
  message: string;
  attacker: 'left' | 'right';
  damage: number;
}

export default function BattlePage() {
  const { normies } = useWorldStore();
  const [leftId, setLeftId]     = useState<string>('');
  const [rightId, setRightId]   = useState<string>('');
  const [leftStats, setLeftStats]   = useState<CombatantStats | null>(null);
  const [rightStats, setRightStats] = useState<CombatantStats | null>(null);

  const [logs, setLogs]             = useState<BattleLog[]>([]);
  const [isBattling, setIsBattling] = useState(false);
  const [winner, setWinner]         = useState<'left' | 'right' | 'draw' | null>(null);
  const [showBomb, setShowBomb]     = useState(false);
  const [loading, setLoading]       = useState(false);

  // Animation state
  const [leftAnim,  setLeftAnim]  = useState<'idle'|'lunge'|'hit'>('idle');
  const [rightAnim, setRightAnim] = useState<'idle'|'lunge'|'hit'>('idle');
  const [leftHit,   setLeftHit]   = useState<HitFlash | null>(null);
  const [rightHit,  setRightHit]  = useState<HitFlash | null>(null);

  useEffect(() => {
    if (normies.length >= 2) {
      if (!leftId)  setLeftId(normies[0].id);
      if (!rightId) setRightId(normies[1].id);
    }
  }, [normies]);

  const calculateStats = async (normie: any): Promise<CombatantStats> => {
    const pixelsRes = await fetch(`https://api.normies.art/normie/${normie.tokenId || normie.id}/pixels`);
    let pixels = '';
    if (pixelsRes.ok) pixels = await pixelsRes.text();

    const infoRes = await fetch(`https://api.normies.art/normie/${normie.tokenId || normie.id}/canvas/info`);
    let isCustomized = false;
    if (infoRes.ok) { const d = await infoRes.json(); isCustomized = !!d.customized; }

    if (pixels.length < 1600)
      pixels = Array(1600).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('');

    const health  = (pixels.match(/1/g) || []).length;
    let attack    = (pixels.substring(0, 800).match(/1/g) || []).length;
    const defense = (pixels.substring(800).match(/1/g) || []).length;
    if (isCustomized) attack = Math.floor(attack * 1.2);

    return {
      id: normie.id, name: normie.name,
      imageUrl: normie.imageUrl || `https://api.normies.art/normie/${normie.tokenId || normie.id}/image.png`,
      color: normie.color || '#7c3aed',
      maxHealth: health, health, attack, defense, isCustomized, pixels,
    };
  };

  const startBattle = async () => {
    if (leftId === rightId) { alert('Please select two different Normies!'); return; }
    setLoading(true);
    setLogs([]);
    setWinner(null);
    setLeftAnim('idle'); setRightAnim('idle');
    setLeftHit(null);    setRightHit(null);

    try {
      const leftNormie  = normies.find(n => n.id === leftId);
      const rightNormie = normies.find(n => n.id === rightId);
      if (!leftNormie || !rightNormie) throw new Error('Normie not found');

      const lStats = await calculateStats(leftNormie);
      await new Promise(r => setTimeout(r, 100));
      const rStats = await calculateStats(rightNormie);

      setLeftStats(lStats);
      setRightStats(rStats);
      setIsBattling(true);

      // --- Collect all combat logs instantly ---
      let lHealth = lStats.health;
      let rHealth = rStats.health;
      let round = 1;
      let turn: 'left'|'right' = 'left';
      const battleLogs: BattleLog[] = [];

      while (lHealth > 0 && rHealth > 0 && round <= 100) {
        if (turn === 'left') {
          const minDmg = Math.max(1, Math.ceil(rStats.maxHealth * 0.02));
          const dmg = Math.max(minDmg, lStats.attack - rStats.defense);
          rHealth -= dmg;
          battleLogs.push({ round, message: `${lStats.name} attacks for ${dmg} damage!`, attacker: 'left', damage: dmg });
          turn = 'right';
        } else {
          const minDmg = Math.max(1, Math.ceil(lStats.maxHealth * 0.02));
          const dmg = Math.max(minDmg, rStats.attack - lStats.defense);
          lHealth -= dmg;
          battleLogs.push({ round, message: `${rStats.name} attacks for ${dmg} damage!`, attacker: 'right', damage: dmg });
          turn = 'left';
        }
        round++;
      }

      // --- Replay with animations (target ≤8 s) ---
      const perRound = Math.min(400, Math.max(100, 8000 / battleLogs.length));
      let hitKey = 0;
      let liveL = lStats.health;
      let liveR = rStats.health;

      for (let i = 0; i < battleLogs.length; i++) {
        const log = battleLogs[i];
        setLogs(prev => [...prev, log]);

        // Attacker lunges
        if (log.attacker === 'left') setLeftAnim('lunge');
        else                          setRightAnim('lunge');

        await new Promise(r => setTimeout(r, 120));

        // Defender hit + health update
        if (log.attacker === 'left') {
          liveR = Math.max(0, liveR - log.damage);
          setRightAnim('hit');
          setRightHit({ damage: log.damage, key: ++hitKey });
          setRightStats(prev => prev ? { ...prev, health: liveR } : prev);
        } else {
          liveL = Math.max(0, liveL - log.damage);
          setLeftAnim('hit');
          setLeftHit({ damage: log.damage, key: ++hitKey });
          setLeftStats(prev => prev ? { ...prev, health: liveL } : prev);
        }

        await new Promise(r => setTimeout(r, Math.max(50, perRound - 120)));

        // Reset animations to idle
        setLeftAnim('idle');
        setRightAnim('idle');
      }

      // Decide winner
      const winSide: 'left'|'right'|'draw' =
        liveL <= 0 ? 'right' : liveR <= 0 ? 'left' : liveL > liveR ? 'left' : 'right';
      setWinner(winSide);
      setIsBattling(false);
      setLoading(false);

      // Show modal after final animation settles
      await new Promise(r => setTimeout(r, 700));
      setShowBomb(true);

    } catch (e) {
      console.error(e);
      alert('Failed to start battle. Check console for details.');
      setLoading(false);
      setIsBattling(false);
    }
  };

  const resetBattle = () => {
    setLeftStats(null);  setRightStats(null);
    setLogs([]);         setWinner(null);
    setShowBomb(false);
    setLeftAnim('idle'); setRightAnim('idle');
    setLeftHit(null);    setRightHit(null);
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>

      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', marginBottom: '16px' }}>
          ⚔️ Pixel <span className="gradient-text-drama">Wars</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Two Normies enter. One leaves. Stats are derived directly from their 40×40 pixel bitmaps.
        </p>
      </div>

      {!leftStats || !rightStats ? (
        /* ── Fighter Selection ── */
        <div className="glass-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>

            {/* Left picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ textAlign: 'center', color: 'var(--accent-purple)' }}>Fighter 1</h3>
              <select className="input-field" value={leftId} onChange={e => setLeftId(e.target.value)}>
                {normies.map(n => <option key={n.id} value={n.id}>{n.avatar} {n.name}</option>)}
              </select>
              <div style={{ height: '200px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {leftId && normies.find(n => n.id === leftId)?.imageUrl
                  ? <img src={normies.find(n => n.id === leftId)?.imageUrl ?? ''} alt="Normie 1" style={{ height: '100%', imageRendering: 'pixelated' }} />
                  : <span style={{ fontSize: '4rem' }}>{normies.find(n => n.id === leftId)?.avatar}</span>}
              </div>
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-red)' }}>VS</div>

            {/* Right picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ textAlign: 'center', color: 'var(--accent-cyan)' }}>Fighter 2</h3>
              <select className="input-field" value={rightId} onChange={e => setRightId(e.target.value)}>
                {normies.map(n => <option key={n.id} value={n.id}>{n.avatar} {n.name}</option>)}
              </select>
              <div style={{ height: '200px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {rightId && normies.find(n => n.id === rightId)?.imageUrl
                  ? <img src={normies.find(n => n.id === rightId)?.imageUrl ?? ''} alt="Normie 2" style={{ height: '100%', imageRendering: 'pixelated' }} />
                  : <span style={{ fontSize: '4rem' }}>{normies.find(n => n.id === rightId)?.avatar}</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button className="btn btn-danger btn-lg" onClick={startBattle} disabled={loading}>
              {loading ? 'Initializing Battle...' : '⚔️ START BATTLE ⚔️'}
            </button>
          </div>
        </div>

      ) : (
        /* ── Battle Arena ── */
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Animated arena */}
          <div className="glass-card" style={{
            padding: '24px 24px 16px',
            marginBottom: '24px',
            border: winner
              ? `2px solid ${winner === 'left' ? leftStats.color : rightStats.color}`
              : '1px solid var(--glass-border)',
          }}>
            {/* Winner banner */}
            {winner && (
              <div style={{ textAlign: 'center', marginBottom: '16px', animation: 'slideInUp 0.5s ease' }}>
                <h2 style={{ fontSize: '2rem', color: winner === 'left' ? leftStats.color : rightStats.color, fontWeight: 800 }}>
                  {winner === 'draw' ? "IT'S A DRAW!" : `${winner === 'left' ? leftStats.name : rightStats.name} WINS!`} 🏆
                </h2>
              </div>
            )}

            {/* Fighting board */}
            <FightingBoard
              left={leftStats}   right={rightStats}
              leftAnim={leftAnim}  rightAnim={rightAnim}
              leftHit={leftHit}    rightHit={rightHit}
            />

            {/* Detail stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center', marginTop: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>HP</span><span>{leftStats.health} / {leftStats.maxHealth}</span>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: leftStats.health / leftStats.maxHealth < 0.25 ? '#ef4444' : '#10b981', width: `${Math.max(0, (leftStats.health / leftStats.maxHealth) * 100)}%`, transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>🗡️ {leftStats.attack}</span><span>🛡️ {leftStats.defense}</span>
                  {leftStats.isCustomized && <span style={{ color: 'gold' }}>✨ Custom</span>}
                </div>
              </div>

              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>VS</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>{rightStats.health} / {rightStats.maxHealth}</span><span>HP</span>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: rightStats.health / rightStats.maxHealth < 0.25 ? '#ef4444' : '#10b981', width: `${Math.max(0, (rightStats.health / rightStats.maxHealth) * 100)}%`, transition: 'width 0.3s ease', marginLeft: 'auto' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', justifyContent: 'flex-end' }}>
                  {rightStats.isCustomized && <span style={{ color: 'gold' }}>✨ Custom</span>}
                  <span>🛡️ {rightStats.defense}</span><span>🗡️ {rightStats.attack}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Battle log */}
          <div className="glass-card" style={{ padding: '24px', minHeight: '200px', maxHeight: '360px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Battle Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  padding: '7px 12px', borderRadius: '8px',
                  background: log.attacker === 'left' ? `${leftStats.color}15` : `${rightStats.color}15`,
                  borderLeft: `4px solid ${log.attacker === 'left' ? leftStats.color : rightStats.color}`,
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <span style={{ fontWeight: 700, marginRight: '8px', opacity: 0.7 }}>R{log.round}</span>
                  {log.message}
                </div>
              ))}
              {isBattling && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px' }}>Battling...</div>}
            </div>
          </div>

          {winner && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={resetBattle}>Fight Again</button>
            </div>
          )}
        </div>
      )}

      {/* Winner bomb modal */}
      <GameModal isOpen={showBomb} onClose={() => setShowBomb(false)}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🧨</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
            {winner === 'left' ? leftStats?.name : rightStats?.name} won!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            The battle is over. Click close to see the results.
          </p>
        </div>
      </GameModal>
    </div>
  );
}
