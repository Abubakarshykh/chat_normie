'use client';
import { useEffect, useState, useRef } from 'react';
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
}

interface BattleLog {
  round: number;
  message: string;
  attacker: 'left' | 'right';
  damage: number;
}

export default function BattlePage() {
  const { normies } = useWorldStore();
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');
  const [leftStats, setLeftStats] = useState<CombatantStats | null>(null);
  const [rightStats, setRightStats] = useState<CombatantStats | null>(null);

  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [isBattling, setIsBattling] = useState(false);
  const [winner, setWinner] = useState<'left' | 'right' | 'draw' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (normies.length >= 2) {
      if (!leftId) setLeftId(normies[0].id);
      if (!rightId) setRightId(normies[1].id);
    }
  }, [normies]);

  const calculateStats = async (normie: any): Promise<CombatantStats> => {
    const pixelsRes = await fetch(`https://api.normies.art/normie/${normie.tokenId || normie.id}/pixels`);
    let pixels = '';
    if (pixelsRes.ok) {
      pixels = await pixelsRes.text();
    }

    const infoRes = await fetch(`https://api.normies.art/normie/${normie.tokenId || normie.id}/canvas/info`);
    let isCustomized = false;
    if (infoRes.ok) {
      const data = await infoRes.json();
      isCustomized = !!data.customized;
    }

    // fallback if pixel data missing
    if (pixels.length < 1600) {
      pixels = Array(1600).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('');
    }

    const health = (pixels.match(/1/g) || []).length;
    let attack = (pixels.substring(0, 800).match(/1/g) || []).length;
    const defense = (pixels.substring(800).match(/1/g) || []).length;

    if (isCustomized) {
      attack = Math.floor(attack * 1.2);
    }

    return {
      id: normie.id,
      name: normie.name,
      imageUrl: normie.imageUrl || `https://api.normies.art/normie/${normie.tokenId || normie.id}/image.png`,
      color: normie.color || '#7c3aed',
      maxHealth: health,
      health,
      attack,
      defense,
      isCustomized,
    };
  };

  const startBattle = async () => {
    if (leftId === rightId) {
      alert("Please select two different Normies to battle!");
      return;
    }

    setLoading(true);
    setLogs([]);
    setWinner(null);

    try {
      const leftNormie = normies.find(n => n.id === leftId);
      const rightNormie = normies.find(n => n.id === rightId);

      if (!leftNormie || !rightNormie) throw new Error("Normie not found");

      const lStats = await calculateStats(leftNormie);
      await new Promise(r => setTimeout(r, 100)); // Delay for rate limit
      const rStats = await calculateStats(rightNormie);

      setLeftStats(lStats);
      setRightStats(rStats);

      setIsBattling(true);

      // Simulate Battle
      let lHealth = lStats.health;
      let rHealth = rStats.health;
      let round = 1;
      const battleLogs: BattleLog[] = [];
      let turn: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';

      while (lHealth > 0 && rHealth > 0 && round <= 50) {
        if (turn === 'left') {
          const dmg = Math.max(1, lStats.attack - rStats.defense);
          rHealth -= dmg;
          battleLogs.push({ round, message: `${lStats.name} attacks for ${dmg} damage!`, attacker: 'left', damage: dmg });
          turn = 'right';
        } else {
          const dmg = Math.max(1, rStats.attack - lStats.defense);
          lHealth -= dmg;
          battleLogs.push({ round, message: `${rStats.name} attacks for ${dmg} damage!`, attacker: 'right', damage: dmg });
          turn = 'left';
        }
        round++;
      }

      // Animate logs
      for (let i = 0; i < battleLogs.length; i++) {
        await new Promise(r => setTimeout(r, 600)); // 600ms per log
        setLogs(prev => [...prev, battleLogs[i]]);

        if (battleLogs[i].attacker === 'left') {
          setRightStats(prev => prev ? { ...prev, health: Math.max(0, prev.health - battleLogs[i].damage) } : prev);
        } else {
          setLeftStats(prev => prev ? { ...prev, health: Math.max(0, prev.health - battleLogs[i].damage) } : prev);
        }
      }

      setIsBattling(false);
      if (lHealth <= 0 && rHealth <= 0) setWinner('draw');
      else if (lHealth <= 0) setWinner('right');
      else if (rHealth <= 0) setWinner('left');
      else setWinner(lHealth > rHealth ? 'left' : 'right');

    } catch (e) {
      console.error(e);
      alert("Failed to start battle. Check console for details.");
    } finally {
      setLoading(false);
      setIsBattling(false);
    }
  };

  const resetBattle = () => {
    setLeftStats(null);
    setRightStats(null);
    setLogs([]);
    setWinner(null);
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>

      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', marginBottom: '16px' }}>
          ⚔️ Pixel <span className="gradient-text-drama">Wars</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Two Normies enter. One leaves. Stats are derived directly from their 40x40 pixel bitmaps.
        </p>
      </div>

      {!leftStats || !rightStats ? (
        <div className="glass-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ textAlign: 'center', color: 'var(--accent-purple)' }}>Fighter 1</h3>
              <select className="input-field" value={leftId} onChange={(e) => setLeftId(e.target.value)}>
                {normies.map(n => <option key={n.id} value={n.id}>{n.avatar} {n.name}</option>)}
              </select>
              <div style={{
                height: '200px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {leftId && normies.find(n => n.id === leftId)?.imageUrl ? (
                  <img src={normies.find(n => n.id === leftId)?.imageUrl ?? ''} alt="Normie 1" style={{ height: '100%', imageRendering: 'pixelated' }} />
                ) : <span style={{ fontSize: '4rem' }}>{normies.find(n => n.id === leftId)?.avatar}</span>}
              </div>
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-red)' }}>VS</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ textAlign: 'center', color: 'var(--accent-cyan)' }}>Fighter 2</h3>
              <select className="input-field" value={rightId} onChange={(e) => setRightId(e.target.value)}>
                {normies.map(n => <option key={n.id} value={n.id}>{n.avatar} {n.name}</option>)}
              </select>
              <div style={{
                height: '200px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {rightId && normies.find(n => n.id === rightId)?.imageUrl ? (
                  <img src={normies.find(n => n.id === rightId)?.imageUrl ?? ''} alt="Normie 2" style={{ height: '100%', imageRendering: 'pixelated' }} />
                ) : <span style={{ fontSize: '4rem' }}>{normies.find(n => n.id === rightId)?.avatar}</span>}
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
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Battle Arena */}
          <div className="glass-card" style={{ padding: '40px 20px', marginBottom: '24px', border: winner ? `2px solid ${winner === 'left' ? leftStats.color : rightStats.color}` : '1px solid var(--glass-border)' }}>

            {winner && (
              <div style={{ textAlign: 'center', marginBottom: '24px', animation: 'slideInUp 0.5s ease' }}>
                <h2 style={{ fontSize: '2rem', color: winner === 'left' ? leftStats.color : rightStats.color, fontWeight: 800 }}>
                  {winner === 'draw' ? 'IT\'S A DRAW!' : `${winner === 'left' ? leftStats.name : rightStats.name} WINS!`} 🏆
                </h2>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '40px', alignItems: 'center' }}>

              {/* Left Fighter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: leftStats.color }}>{leftStats.name}</div>
                <div style={{ width: '200px', height: '200px', background: 'rgba(0,0,0,0.5)', borderRadius: '16px', overflow: 'hidden', border: `4px solid ${leftStats.color}` }}>
                  <img src={leftStats.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', filter: leftStats.health <= 0 ? 'grayscale(100%)' : 'none' }} />
                </div>
                <div style={{ width: '100%', maxWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 600 }}>
                    <span>HP</span><span>{leftStats.health} / {leftStats.maxHealth}</span>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#10b981', width: `${Math.max(0, (leftStats.health / leftStats.maxHealth) * 100)}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>🗡️ ATK: {leftStats.attack}</span>
                  <span>🛡️ DEF: {leftStats.defense}</span>
                </div>
              </div>

              {/* VS */}
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-muted)' }}>VS</div>

              {/* Right Fighter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: rightStats.color }}>{rightStats.name}</div>
                <div style={{ width: '200px', height: '200px', background: 'rgba(0,0,0,0.5)', borderRadius: '16px', overflow: 'hidden', border: `4px solid ${rightStats.color}`, transform: 'scaleX(-1)' }}>
                  <img src={rightStats.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', filter: rightStats.health <= 0 ? 'grayscale(100%)' : 'none' }} />
                </div>
                <div style={{ width: '100%', maxWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 600 }}>
                    <span>HP</span><span>{rightStats.health} / {rightStats.maxHealth}</span>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#10b981', width: `${Math.max(0, (rightStats.health / rightStats.maxHealth) * 100)}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>🗡️ ATK: {rightStats.attack}</span>
                  <span>🛡️ DEF: {rightStats.defense}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Logs */}
          <div className="glass-card" style={{ padding: '24px', minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Battle Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: '8px',
                  background: log.attacker === 'left' ? `${leftStats.color}15` : `${rightStats.color}15`,
                  borderLeft: `4px solid ${log.attacker === 'left' ? leftStats.color : rightStats.color}`,
                  animation: 'fadeIn 0.3s ease'
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
              <button className="btn btn-ghost" onClick={resetBattle}>
                Fight Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
