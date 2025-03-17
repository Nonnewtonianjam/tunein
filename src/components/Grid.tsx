import { useState, useCallback } from 'react';
import { GridSize, Instrument } from '../types';

interface GridProps {
  size: GridSize;
  instruments: Instrument[];
  playbackPosition: number;
}

export function Grid({ size, instruments, playbackPosition }: GridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 8); // 8 rows for different pitches
    setHoveredCell({ x, y });
  }, [size]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Handle instrument drop logic here
  }, []);

  return (
    <div 
      className="grid"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: 'repeat(8, 1fr)',
        gap: '1px',
        backgroundColor: '#2a2a2a',
        padding: '8px',
        borderRadius: '4px',
        width: '100%',
        aspectRatio: `${size}/8`
      }}
    >
      {Array.from({ length: size * 8 }).map((_, index) => {
        const x = index % size;
        const y = Math.floor(index / size);
        const instrument = instruments.find(i => i.x === x && i.y === y);
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        const isPlayhead = x === playbackPosition;

        return (
          <div
            key={index}
            className="cell"
            style={{
              backgroundColor: instrument ? '#4CAF50' : '#3a3a3a',
              border: isHovered ? '2px solid #fff' : '1px solid #444',
              borderRadius: '2px',
              position: 'relative',
              ...(isPlayhead && {
                boxShadow: 'inset 0 0 0 2px #ff5722'
              })
            }}
          />
        );
      })}
    </div>
  );
} 