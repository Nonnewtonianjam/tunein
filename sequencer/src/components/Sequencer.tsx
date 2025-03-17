import { useState, useEffect, useCallback } from 'react';
import { Grid } from './Grid';
import { InstrumentPalette } from './InstrumentPalette';
import { Note, SequencerProps, SequencerState } from '../types';
import { useSequencerPlayback } from '../hooks/useSequencerPlayback';

const INITIAL_STATE: SequencerState = {
  notes: [],
  tempo: 120,
  isPlaying: false,
  currentBeat: 0,
  maxBars: 64, // 16 measures of 4/4 time
  selectedInstrument: null,
  isShiftPressed: false,
  isCtrlPressed: false,
  timeSignature: { numerator: 4, denominator: 4 },
  beatsPerMeasure: 4,
  isLooping: false,
  loopStart: 0,
  loopEnd: 16,
};

export function Sequencer({ onSave, initialNotes = [], initialTempo, maxBars }: SequencerProps) {
  console.log('Sequencer initializing with notes:', initialNotes);
  console.log('Sequencer initializing with tempo:', initialTempo);
  
  const [state, setState] = useState<SequencerState>({
    ...INITIAL_STATE,
    notes: initialNotes,
    tempo: initialTempo || INITIAL_STATE.tempo,
    maxBars: maxBars || INITIAL_STATE.maxBars,
  });

  // Update state when initialNotes or initialTempo changes
  useEffect(() => {
    console.log('initialNotes or initialTempo changed:', { initialNotes, initialTempo });
    
    if (initialNotes && Array.isArray(initialNotes)) {
      console.log('Updating state with new notes:', initialNotes);
      
      // Validate each note in the array
      const validNotes = initialNotes.filter(note => 
        note && 
        typeof note === 'object' &&
        typeof note.x === 'number' && 
        typeof note.y === 'number' && 
        typeof note.instrument === 'string'
      );
      
      if (validNotes.length !== initialNotes.length) {
        console.warn(`Filtered out ${initialNotes.length - validNotes.length} invalid notes`);
      }
      
      // Force a complete state update with the new notes
      setState(prev => {
        console.log('Setting state with notes:', validNotes);
        return {
          ...prev,
          notes: [...validNotes], // Create a new array to ensure React detects the change
          tempo: initialTempo || prev.tempo
        };
      });
      
      console.log('State updated with notes:', validNotes);
      
      // Force a re-render after a short delay to ensure the state has updated
      setTimeout(() => {
        console.log('Checking notes after timeout');
        setState(prev => {
          console.log('Current notes in state:', prev.notes);
          if (prev.notes.length === 0 && validNotes.length > 0) {
            console.log('Notes not set correctly, trying again');
            return {
              ...prev,
              notes: [...validNotes]
            };
          }
          return prev;
        });
      }, 100);
    }
  }, [initialNotes, initialTempo]);

  // Add a separate effect to log state changes
  useEffect(() => {
    console.log('Sequencer state updated:', state);
    console.log('Sequencer notes in state:', state.notes);
    console.log('Sequencer notes length:', state.notes.length);
    
    if (state.notes.length > 0) {
      console.log('First note in sequencer state:', state.notes[0]);
    } else {
      console.warn('Sequencer state has no notes');
    }
  }, [state]);

  const handleBeatChange = useCallback((beat: number) => {
    setState(prev => {
      // If looping is enabled and we've reached the end of the loop
      if (prev.isLooping && beat >= prev.loopEnd) {
        return { ...prev, currentBeat: prev.loopStart };
      }
      return { ...prev, currentBeat: beat };
    });
  }, []);

  useSequencerPlayback({
    notes: state.notes,
    tempo: state.tempo,
    isPlaying: state.isPlaying,
    maxBars: state.maxBars,
    onBeatChange: handleBeatChange,
    beatsPerMeasure: state.beatsPerMeasure,
    isLooping: state.isLooping,
    loopStart: state.loopStart,
    loopEnd: state.loopEnd,
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setState(prev => ({ ...prev, isShiftPressed: true }));
    } else if (e.key === 'Control') {
      setState(prev => ({ ...prev, isCtrlPressed: true }));
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setState(prev => ({ ...prev, isShiftPressed: false }));
    } else if (e.key === 'Control') {
      setState(prev => ({ ...prev, isCtrlPressed: false }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handlePlay = () => {
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const handleStop = () => {
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentBeat: prev.isLooping ? prev.loopStart : 0 
    }));
  };

  const handleClear = () => {
    setState(prev => ({ 
      ...prev, 
      notes: [], 
      isPlaying: false, 
      currentBeat: prev.isLooping ? prev.loopStart : 0 
    }));
  };

  const handleTempoChange = (newTempo: number) => {
    setState(prev => ({ ...prev, tempo: newTempo }));
  };

  const handleLoopToggle = () => {
    setState(prev => ({ 
      ...prev, 
      isLooping: !prev.isLooping,
      currentBeat: !prev.isLooping ? prev.loopStart : prev.currentBeat
    }));
  };

  const handleLoopRangeChange = (start: number, end: number) => {
    setState(prev => ({ 
      ...prev, 
      loopStart: start, 
      loopEnd: end,
      currentBeat: prev.currentBeat < start ? start : prev.currentBeat
    }));
  };

  const handleInstrumentSelect = (instrument: string) => {
    setState(prev => ({ ...prev, selectedInstrument: instrument }));
  };

  const handleTimeSignatureChange = (numerator: number, denominator: number) => {
    // Calculate new maxBars based on time signature
    const beatsPerMeasure = numerator;
    const measuresCount = 16; // Keep constant number of measures
    const newMaxBars = measuresCount * beatsPerMeasure;

    // Adjust notes to fit new time signature
    const adjustedNotes = state.notes.filter(note => note.x < newMaxBars);

    setState(prev => ({
      ...prev,
      timeSignature: { numerator, denominator },
      beatsPerMeasure,
      maxBars: newMaxBars,
      notes: adjustedNotes,
      currentBeat: 0,
      isPlaying: false,
    }));
  };

  const handleNoteAdd = (note: Note) => {
    setState(prev => ({
      ...prev,
      notes: [...prev.notes.filter(n => !(n.x === note.x && n.y === note.y)), note],
    }));
  };

  const handleNoteRemove = (x: number, y: number) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(note => !(note.x === x && note.y === y)),
    }));
  };

  const handleSave = () => {
    if (onSave) {
      console.log('Saving composition with notes and tempo:', { 
        notes: state.notes, 
        tempo: state.tempo 
      });
      onSave({ 
        notes: state.notes, 
        tempo: state.tempo 
      });
    }
  };

  return (
    <div className="sequencer" data-testid="sequencer">
      <div className="sequencer-controls">
        <button
          className={`control-button ${state.isPlaying ? 'active' : ''}`}
          onClick={state.isPlaying ? handleStop : handlePlay}
        >
          {state.isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="control-button" onClick={handleStop}>
          Stop
        </button>
        <button className="control-button" onClick={handleClear}>
          Clear
        </button>
        <button className="control-button" onClick={handleSave}>
          Save
        </button>
        <div className="tempo-control">
          <label>Tempo:</label>
          <input
            type="range"
            min="60"
            max="240"
            value={state.tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
          />
          <span data-testid="tempo-display">{state.tempo}</span>
        </div>
        <div className="loop-control">
          <label>
            <input
              type="checkbox"
              checked={state.isLooping}
              onChange={handleLoopToggle}
            />
            Loop
          </label>
          {state.isLooping && (
            <div className="loop-range">
              <input
                type="number"
                min="1"
                max={state.maxBars}
                value={state.loopStart + 1}
                onChange={(e) => handleLoopRangeChange(state.loopStart, parseInt(e.target.value) - 1)}
              />
              <span>to</span>
              <input
                type="number"
                min="1"
                max={state.maxBars}
                value={state.loopEnd + 1}
                onChange={(e) => handleLoopRangeChange(parseInt(e.target.value) - 1, state.loopEnd)}
              />
            </div>
          )}
        </div>
      </div>
      <div className="sequencer-workspace">
        <InstrumentPalette
          selectedInstrument={state.selectedInstrument}
          onSelect={handleInstrumentSelect}
          onTimeSignatureChange={handleTimeSignatureChange}
        />
        <Grid
          notes={state.notes}
          maxBars={state.maxBars}
          currentBeat={state.currentBeat}
          selectedInstrument={state.selectedInstrument}
          onNoteAdd={handleNoteAdd}
          onNoteRemove={handleNoteRemove}
          beatsPerMeasure={state.beatsPerMeasure}
        />
        {/* Debug display for notes */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={{ 
            position: 'absolute', 
            bottom: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.7)', 
            color: 'white', 
            padding: '5px', 
            borderRadius: '3px',
            fontSize: '10px',
            maxWidth: '300px',
            overflow: 'auto',
            maxHeight: '100px',
            zIndex: 1000
          }}>
            Notes: {state.notes.length > 0 ? 
              `${state.notes.length} notes` : 
              'No notes'
            }
            {state.notes.length > 0 && (
              <pre style={{ fontSize: '8px' }}>
                {JSON.stringify(state.notes.slice(0, 3), null, 2)}
                {state.notes.length > 3 && '...'}
              </pre>
            )}
          </div>
        )}
      </div>
      <div 
        data-testid="sequencer-state" 
        style={{ display: 'none' }}
      >
        {JSON.stringify({
          notes: state.notes,
          tempo: state.tempo,
          isPlaying: state.isPlaying,
          currentBeat: state.currentBeat
        })}
      </div>
    </div>
  );
}