'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useWorldStore } from '@/store/useWorldStore';
import { api } from '@/lib/api';
import DramaAlert from '@/components/DramaAlert';

export default function GodModePage() {
  useSocket();
  const { normies, setNormies, prependFeedEvent } = useWorldStore();
  const [dramaTypes, setDramaTypes] = useState<any[]>([]);
  const [selectedDrama, setSelectedDrama] = useState('');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [selectedNormie, setSelectedNormie] = useState('');
  const [mood, setMood] = useState('happy');
  const [repAmount, setRepAmount] = useState(100);
  const [logs, setLogs] = useState<string[]>([]);
  const [isTicking, setIsTicking] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [nData, dData] = await Promise.all([api.getNormies(), api.getDramaTypes()]);
        setNormies(nData.normies);
        setDramaTypes(dData.dramaTypes);
        if (dData.dramaTypes.length > 0) setSelectedDrama(dData.dramaTypes[0].type);
        if (nData.normies.length > 1) {
          setN1(nData.normies[0].id);
          setN2(nData.normies[1].id);
          setSelectedNormie(nData.normies[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const handleTriggerDrama = async () => {
    try {
      const res = await api.triggerDrama(selectedDrama);
      addLog(`Drama triggered: ${res.event.label}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const handleForceConversation = async () => {
    if (n1 === n2) {
      addLog(`Error: Cannot force conversation with the same character.`);
      return;
    }
    try {
      const res = await api.forceConversation(n1, n2);
      addLog(`Forced interaction between ${res.event.sender.name} and ${res.event.receiver.name}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const handleChangeMood = async () => {
    try {
      const res = await api.changeMood(selectedNormie, mood);
      addLog(`Changed ${res.normie}'s mood to ${res.mood}`);
      // update state
      const nData = await api.getNormies();
      setNormies(nData.normies);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const handleBoostReputation = async () => {
    try {
      await api.boostReputation(selectedNormie, repAmount);
      addLog(`Boosted reputation of normie by ${repAmount}`);
      const nData = await api.getNormies();
      setNormies(nData.normies);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const handleFastTick = async () => {
    setIsTicking(true);
    try {
      const res = await api.fastTick();
      addLog(`Forced simulation tick #${res.tick}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setIsTicking(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      <DramaAlert />
      <div className="page-header">
        <h1>👑 <span className="gradient-text">Normod</span></h1>
        <p>Take control of the simulation. Force interactions, trigger world-altering drama, adjust character moods, and control time itself.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Simulation Tick */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>⏱️ Simulation Speed</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Forcibly trigger a simulation step immediately, bypassing the wait interval.
            </p>
            <button className="btn btn-primary" onClick={handleFastTick} disabled={isTicking}>
              {isTicking ? 'Running Tick...' : '⚡ Trigger Simulation Tick'}
            </button>
          </div>

          {/* Trigger Drama */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>🎭 Inject Drama</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Choose a drama template and force two random characters to escalate their relationship status live on the feed.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select className="input-field" style={{ flex: 1 }} value={selectedDrama} onChange={e => setSelectedDrama(e.target.value)}>
                {dramaTypes.map(d => (
                  <option key={d.type} value={d.type}>{d.label}</option>
                ))}
              </select>
              <button className="btn btn-danger" onClick={handleTriggerDrama}>
                Trigger Drama
              </button>
            </div>
          </div>

          {/* Force Conversation */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>💬 Force Conversation</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Force two specific characters to exchange messages. Updates their relationship scores instantly.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <select className="input-field" style={{ flex: 1, minWidth: '150px' }} value={n1} onChange={e => setN1(e.target.value)}>
                {normies.map(n => (
                  <option key={n.id} value={n.id}>{n.avatar} {n.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>↔️</div>
              <select className="input-field" style={{ flex: 1, minWidth: '150px' }} value={n2} onChange={e => setN2(e.target.value)}>
                {normies.map(n => (
                  <option key={n.id} value={n.id}>{n.avatar} {n.name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleForceConversation}>
              Execute Forced Chat
            </button>
          </div>

          {/* Mood and Reputation Control */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>🧬 Character Control</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Directly manipulate the mood states and reputation scores of any chosen character.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select className="input-field" style={{ flex: 1 }} value={selectedNormie} onChange={e => setSelectedNormie(e.target.value)}>
                {normies.map(n => (
                  <option key={n.id} value={n.id}>{n.avatar} {n.name}</option>
                ))}
              </select>
            </div>
            
            <div className="divider" style={{ margin: '16px 0' }} />
            
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Adjust Mood</h3>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <select className="input-field" style={{ flex: 1 }} value={mood} onChange={e => setMood(e.target.value)}>
                {['happy', 'content', 'neutral', 'annoyed', 'hostile', 'furious', 'fired-up', 'calculating', 'dreamy', 'scheming', 'glitching', 'observing'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button className="btn btn-ghost" onClick={handleChangeMood}>
                Update Mood
              </button>
            </div>

            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Boost Reputation</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="number" className="input-field" style={{ flex: 1 }} value={repAmount} onChange={e => setRepAmount(Number(e.target.value))} />
              <button className="btn btn-ghost" onClick={handleBoostReputation}>
                Add Rep
              </button>
            </div>
          </div>

        </div>

        {/* Action Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '96px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
              Console Log
            </h3>
            <div style={{ background: '#020206', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '16px', minHeight: '300px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#10b981', overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Console idle. Awaiting operations...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '8px', wordBreak: 'break-all' }}>{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
