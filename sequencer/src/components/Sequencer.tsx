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
        
        // Send a confirmation message to the parent
        try {
          window.parent.postMessage({
            type: 'devvit-message',
            data: {
              message: {
                type: 'sequencerNotesUpdated',
                count: validNotes.length
              }
            }
          }, '*');
        } catch (e) {
          console.error('Error sending sequencerNotesUpdated message:', e);
        }
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
    <div className="sequencer">
      <div className="controls">
        <div className="control-group">
          <label>Tempo: {state.tempo} BPM</label>
          <input 
            type="range" 
            min="60" 
            max="240" 
            value={state.tempo} 
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
          />
        </div>
        <div className="control-group">
          <button 
            className={state.isPlaying ? 'stop' : 'play'} 
            onClick={state.isPlaying ? handleStop : handlePlay}
          >
            {state.isPlaying ? 'Stop' : 'Play'}
          </button>
          <button onClick={handleSave}>Save</button>
        </div>
        <div className="control-group instruments">
          {Object.keys(INSTRUMENTS).map(instrument => (
            <button
              key={instrument}
              className={`instrument ${state.selectedInstrument === instrument ? 'selected' : ''}`}
              onClick={() => handleInstrumentSelect(instrument)}
            >
              {instrument}
            </button>
          ))}
        </div>
      </div>
      
      <Grid 
        notes={state.notes} 
        maxBars={state.maxBars}
        currentBeat={state.currentBeat}
        selectedInstrument={state.selectedInstrument}
        onNoteAdd={handleNoteAdd}
        onNoteRemove={handleNoteRemove}
        beatsPerMeasure={state.beatsPerMeasure}
      />
      
      {/* Direct DOM-based rendering of notes as a backup */}
      <div style={{ 
        position: 'relative', 
        width: '780px',
        height: '300px',
        marginTop: '10px',
        background: '#f5f5f5',
        border: '1px solid #ccc',
        display: state.notes.length > 0 ? 'block' : 'none' // Show when notes exist
      }}>
        {state.notes.map((note, index) => (
          <div 
            key={`direct-note-${index}`}
            style={{
              position: 'absolute',
              left: `${note.x * 30 + 1}px`,
              top: `${note.y * 30 + 1}px`,
              width: '28px',
              height: '28px',
              backgroundColor: 'rgba(255, 0, 0, 0.7)', // Red for visibility
              border: '2px solid #4a90e2',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>
      
      {/* Debug display for notes */}
      <div style={{ 
        marginTop: '10px', 
        padding: '10px', 
        background: '#f0f0f0', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '12px',
        display: 'block' // Always visible for debugging
      }}>
        <div>Notes count: {state.notes.length}</div>
        <div>Current beat: {state.currentBeat}</div>
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
        <button onClick={() => {
          console.log('Current notes in state:', state.notes);
          if (initialNotes && Array.isArray(initialNotes)) {
            console.log('Initial notes:', initialNotes);
            setState(prev => ({
              ...prev,
              notes: [...initialNotes]
            }));
          }
        }}>
          Force Update Notes
        </button>
        <pre style={{ maxHeight: '100px', overflow: 'auto' }}>
          {JSON.stringify(state.notes, null, 2)}
        </pre>
      </div>
    </div>
  );
}