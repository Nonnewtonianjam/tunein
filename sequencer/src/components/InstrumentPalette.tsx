import React, { useState } from 'react';
import { Instrument } from '../types';
import { soundManager } from '../utils/SoundManager';

interface InstrumentPaletteProps {
  selectedInstrument: string | null;
  onSelect: (instrument: string) => void;
  onTimeSignatureChange?: (numerator: number, denominator: number) => void;
}

// For now, we'll use a limited set of instruments based on available sounds
const INSTRUMENTS: Instrument[] = [
  { name: 'mario', soundFile: 'mario.wav', icon: 'placeholder' },
  { name: 'coin', soundFile: 'coin.wav', icon: 'placeholder' },
  { name: 'mushroom', soundFile: 'mushroom.wav', icon: 'placeholder' },
];

const TIME_SIGNATURES = [
  { numerator: 4, denominator: 4, label: '4/4' },
  { numerator: 3, denominator: 4, label: '3/4' },
  { numerator: 6, denominator: 8, label: '6/8' },
  { numerator: 2, denominator: 4, label: '2/4' },
];

export function InstrumentPalette({
  selectedInstrument,
  onSelect,
  onTimeSignatureChange,
}: InstrumentPaletteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTimeSignature, setSelectedTimeSignature] = useState('4/4');

  const handleInstrumentSelect = (instrument: string) => {
    onSelect(instrument);
    soundManager.playSound(instrument); // Preview sound
  };

  const handleDragStart = (e: React.DragEvent, instrument: string) => {
    e.dataTransfer.setData('instrument', instrument);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleTimeSignatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sig = TIME_SIGNATURES.find(ts => ts.label === e.target.value);
    if (sig && onTimeSignatureChange) {
      setSelectedTimeSignature(sig.label);
      onTimeSignatureChange(sig.numerator, sig.denominator);
    }
  };

  return (
    <div className="instrument-palette" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '4px',
      backgroundColor: '#1a1a1a',
      borderRadius: '4px'
    }}>
      {/* Selected instrument preview and instruments */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {/* Selected instrument preview */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          marginRight: '8px',
          color: '#888888',
          fontSize: '11px'
        }}>
          Selected:
          <div style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#333333',
            border: '1px solid #444444',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#ffffff'
          }}>
            {selectedInstrument ? selectedInstrument.charAt(0).toUpperCase() : 'E'}
          </div>
        </div>

        {/* Instrument buttons */}
        {INSTRUMENTS.map((instrument) => (
          <button
            key={instrument.name}
            className={`instrument-button ${selectedInstrument === instrument.name ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
            onClick={() => handleInstrumentSelect(instrument.name)}
            draggable
            onDragStart={(e) => handleDragStart(e, instrument.name)}
            onDragEnd={handleDragEnd}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selectedInstrument === instrument.name ? '#4a90e2' : '#333333',
              border: `1px solid ${selectedInstrument === instrument.name ? '#4a90e2' : '#444444'}`,
              borderRadius: '4px',
              padding: '2px',
              cursor: 'grab',
              fontSize: '11px',
              color: selectedInstrument === instrument.name ? '#ffffff' : '#888888'
            }}
          >
            {instrument.name.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>

      {/* Bottom controls: Eraser and Time Signature */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '2px',
        borderTop: '1px solid #333333'
      }}>
        {/* Eraser section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ color: '#888888', fontSize: '11px' }}>Eraser:</span>
          <button
            className={`instrument-button eraser ${selectedInstrument === null ? 'selected' : ''}`}
            onClick={() => onSelect('')}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selectedInstrument === null ? '#4a90e2' : '#333333',
              border: `1px solid ${selectedInstrument === null ? '#4a90e2' : '#444444'}`,
              borderRadius: '4px',
              padding: '2px',
              cursor: 'pointer',
              fontSize: '11px',
              color: selectedInstrument === null ? '#ffffff' : '#888888'
            }}
          >
            E
          </button>
        </div>

        {/* Time signature section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ color: '#888888', fontSize: '11px' }}>Time:</span>
          <select
            value={selectedTimeSignature}
            onChange={handleTimeSignatureChange}
            style={{
              backgroundColor: '#333333',
              border: '1px solid #444444',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '11px',
              padding: '4px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {TIME_SIGNATURES.map(ts => (
              <option key={ts.label} value={ts.label}>
                {ts.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
} 