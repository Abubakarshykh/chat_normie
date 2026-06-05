'use client';
import { useEffect, useState } from 'react';
import { useWorldStore, FeedEvent } from '@/store/useWorldStore';

export default function DramaAlert() {
  const { dramaAlert } = useWorldStore();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<FeedEvent | null>(null);

  useEffect(() => {
    if (dramaAlert) {
      setCurrent(dramaAlert);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [dramaAlert]);

  if (!visible || !current) return null;

  return (
    <div className="drama-toast animate-drama" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          🔴 BREAKING DRAMA
        </span>
        <button onClick={() => setVisible(false)} style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1, cursor: 'pointer', background: 'none', border: 'none' }}>×</button>
      </div>
      {current.normie1 && current.normie2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: current.normie1.color, fontWeight: 700, fontSize: '0.9rem' }}>
            {current.normie1.avatar} {current.normie1.name}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>⚡</span>
          <span style={{ color: current.normie2.color, fontWeight: 700, fontSize: '0.9rem' }}>
            {current.normie2.avatar} {current.normie2.name}
          </span>
        </div>
      )}
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {current.label} — {current.description}
      </div>
    </div>
  );
}
