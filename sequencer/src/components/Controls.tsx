import { useState } from 'react';
import { GridSize } from '../types';

interface ControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onSave: () => void;
  onClear: () => void;
  onGridSizeChange: (size: GridSize) => void;
  maxBars: number;
  isLooping?: boolean;
  onLoopToggle?: () => void;
  loopStart?: number;
  loopEnd?: number;
  onLoopRangeChange?: (start: number, end: number) => void;
}

function ConfirmationModal({ isOpen, onConfirm, onCancel }: { 
  isOpen: boolean; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Clear All Notes?</h3>
        <p style={{ margin: '0 0 20px 0', color: '#666' }}>
          This will delete all notes in your sequence. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            className="button secondary"
            style={{ minWidth: '80px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="button destructive"
            style={{ minWidth: '80px' }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export function Controls({
  tempo,
  onTempoChange,
  isPlaying,
  onPlay,
  onSave,
  onClear,
  onGridSizeChange,
  maxBars
}: ControlsProps) {
  const [showClearModal, setShowClearModal] = useState(false);

  const handleClearClick = () => {
    setShowClearModal(true);
  };

  const handleClearConfirm = () => {
    setShowClearModal(false);
    onClear();
  };

  return (
    <>
      <div className="controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
        <div className="control-group">
          <button
            onClick={onPlay}
            className={`button ${isPlaying ? 'destructive' : 'primary'}`}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>

        <div className="control-group">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onTempoChange(Math.max(60, tempo - 5))}
              className="button secondary"
            >
              -
            </button>
            <button
              onClick={() => onTempoChange(Math.min(200, tempo + 5))}
              className="button secondary"
            >
              +
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>{tempo} BPM</div>
        </div>

        <div className="control-group">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                const sizes: GridSize[] = [4, 8, 16];
                const currentIndex = sizes.indexOf(maxBars / 4 as GridSize);
                if (currentIndex > 0) {
                  onGridSizeChange(sizes[currentIndex - 1]);
                }
              }}
              className="button secondary"
            >
              -
            </button>
            <button
              onClick={() => {
                const sizes: GridSize[] = [4, 8, 16];
                const currentIndex = sizes.indexOf(maxBars / 4 as GridSize);
                if (currentIndex < sizes.length - 1) {
                  onGridSizeChange(sizes[currentIndex + 1]);
                }
              }}
              className="button secondary"
            >
              +
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>{maxBars / 4} measures</div>
        </div>

        <div className="control-group">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleClearClick}
              className="button destructive"
            >
              Clear
            </button>
            <button
              onClick={onSave}
              className="button primary"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showClearModal}
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearModal(false)}
      />
    </>
  );
} 