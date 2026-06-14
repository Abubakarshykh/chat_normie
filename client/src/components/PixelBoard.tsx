import React from 'react';

// Props: a string of 1600 bits ("0" or "1") representing a 40x40 bitmap
interface PixelBoardProps {
  pixels: string; // expected length 1600
  size?: number; // optional pixel size in px (default 5)
}

export default function PixelBoard({ pixels, size = 5 }: PixelBoardProps) {
  const dimension = 40; // 40x40 grid
  // Ensure we have exactly 1600 characters; pad or cut if needed
  const bits = (pixels || '').padEnd(dimension * dimension, '0').slice(0, dimension * dimension);

  const cellStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: '#7F77DD', // color for a "1" pixel
  };

  const emptyStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: 'transparent',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${dimension}, ${size}px)`,
        gap: '0px',
        background: 'rgba(0,0,0,0.05)',
        padding: '4px',
        borderRadius: '8px',
      }}
    >
      {bits.split('').map((bit, i) => (
        <div key={i} style={bit === '1' ? cellStyle : emptyStyle} />
      ))}
    </div>
  );
}
