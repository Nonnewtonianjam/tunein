import { useCallback } from 'react';
import { Instrument, InstrumentDefinition } from '../types';

const INSTRUMENTS: InstrumentDefinition[] = [
  {
    id: 'piano',
    name: 'Piano',
    icon: '🎹',
    soundUrl: '/sounds/piano.mp3'
  },
  {
    id: 'drum',
    name: 'Drum',
    icon: '🥁',
    soundUrl: '/sounds/drum.mp3'
  },
  {
    id: 'synth',
    name: 'Synth',
    icon: '🎛️',
    soundUrl: '/sounds/synth.mp3'
  },
  {
    id: 'bass',
    name: 'Bass',
    icon: '🎸',
    soundUrl: '/sounds/bass.mp3'
  }
];

interface InstrumentPaletteProps {
  onDrop: (instrument: Instrument) => void;
}

export function InstrumentPalette({ onDrop }: InstrumentPaletteProps) {
  const handleDragStart = useCallback((e: React.DragEvent, instrument: InstrumentDefinition) => {
    e.dataTransfer.setData('instrument', JSON.stringify({
      type: instrument.id,
      duration: 1
    }));
  }, []);

  return (
    <div className="instrument-palette" style={{
      display: 'flex',
      gap: '8px',
      padding: '16px',
      backgroundColor: '#1a1a1a',
      borderRadius: '4px',
      marginBottom: '16px'
    }}>
      {INSTRUMENTS.map(instrument => (
        <div
          key={instrument.id}
          draggable
          onDragStart={e => handleDragStart(e, instrument)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            cursor: 'grab',
            userSelect: 'none'
          }}
        >
          <span style={{ fontSize: '24px' }}>{instrument.icon}</span>
          <span style={{ marginTop: '4px', fontSize: '12px' }}>{instrument.name}</span>
        </div>
      ))}
    </div>
  );
} 