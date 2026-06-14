import React, { ReactNode } from 'react';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function GameModal({ isOpen, onClose, children }: GameModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          minWidth: '280px',
          maxWidth: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
