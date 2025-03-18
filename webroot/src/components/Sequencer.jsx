import React, { useState, useEffect, useCallback } from 'react';
import Grid from './Grid';
import InstrumentPalette from './InstrumentPalette';
import { INITIAL_STATE } from '../types';
import { useSequencerPlayback } from '../hooks/useSequencerPlayback';

/**
 * @param {Object} props
 * @param {function({notes: Array, tempo: number}): void} [props.onSave]
 * @param {Array} [props.initialNotes]
 * @param {number} [props.initialTempo]
 * @param {number} [props.maxBars]
 * @returns {JSX.Element}
 */
function Sequencer({ onSave, initialNotes = [], initialTempo, maxBars }) {
  console.log('Sequencer initializing with notes:', initialNotes);
  console.log('Sequencer initializing with tempo:', initialTempo);
  
  const [state, setState] = useState({
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

  const handleBeatChange = useCallback((beat) => {
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

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Shift') {
      setState(prev => ({ ...prev, isShiftPressed: true }));
    } else if (e.key === 'Control') {
      setState(prev => ({ ...prev, isCtrlPressed: true }));
    }
  }, []);

  const handleKeyUp = useCallback((e) => {
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

  const handleTempoChange = (newTempo) => {
    setState(prev => ({ ...prev, tempo: newTempo }));
  };

  const handleLoopToggle = () => {
    setState(prev => ({ 
      ...prev, 
      isLooping: !prev.isLooping,
      currentBeat: !prev.isLooping ? prev.loopStart : prev.currentBeat
    }));
  };

  const handleLoopRangeChange = (start, end) => {
    setState(prev => ({ 
      ...prev, 
      loopStart: start, 
      loopEnd: end,
      currentBeat: prev.currentBeat < start ? start : prev.currentBeat
    }));
  };

  const handleInstrumentSelect = (instrument) => {
    setState(prev => ({ ...prev, selectedInstrument: instrument }));
  };

  const handleAddNote = (note) => {
    setState(prev => {
      // Check if there's already a note at this position
      const hasNoteAtSamePosition = prev.notes.some(n => n.x === note.x && n.y === note.y);
      
      // If a note already exists at this position, don't add a new one
      if (hasNoteAtSamePosition) {
        return prev;
      }
      
      // Otherwise, add the new note
      return { 
        ...prev, 
        notes: [...prev.notes, note] 
      };
    });
  };

  const handleRemoveNote = (x, y) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(note => !(note.x === x && note.y === y))
    }));
  };

  const handleSave = () => {
    if (onSave) {
      console.log('Saving notes and tempo:', { notes: state.notes, tempo: state.tempo });
      onSave({ notes: state.notes, tempo: state.tempo });
    }
  };

  return (
    <div className="sequencer">
      <div className="sequencer-header">
        <div className="tempo-controls">
          <label htmlFor="tempo">Tempo: {state.tempo} BPM</label>
          <input
            id="tempo"
            type="range"
            min="60"
            max="240"
            value={state.tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
          />
        </div>
        
        <div className="controls">
          <button onClick={handlePlay} disabled={state.isPlaying}>
            Play
          </button>
          <button onClick={handleStop} disabled={!state.isPlaying}>
            Stop
          </button>
          <button onClick={handleClear}>
            Clear
          </button>
          <button onClick={handleSave}>
            Save
          </button>
          <div className="loop-controls">
            <button 
              onClick={handleLoopToggle}
              className={state.isLooping ? 'active' : ''}
            >
              Loop: {state.isLooping ? 'On' : 'Off'}
            </button>
            {state.isLooping && (
              <div className="loop-range">
                <label>
                  Start:
                  <input
                    type="number"
                    min="0"
                    max={state.loopEnd - 1}
                    value={state.loopStart}
                    onChange={(e) => handleLoopRangeChange(parseInt(e.target.value), state.loopEnd)}
                  />
                </label>
                <label>
                  End:
                  <input
                    type="number"
                    min={state.loopStart + 1}
                    max={state.maxBars}
                    value={state.loopEnd}
                    onChange={(e) => handleLoopRangeChange(state.loopStart, parseInt(e.target.value))}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid-container">
        <Grid
          notes={state.notes}
          currentBeat={state.currentBeat}
          maxBars={state.maxBars}
          selectedInstrument={state.selectedInstrument}
          isShiftPressed={state.isShiftPressed}
          isCtrlPressed={state.isCtrlPressed}
          onAddNote={handleAddNote}
          onRemoveNote={handleRemoveNote}
          isLooping={state.isLooping}
          loopStart={state.loopStart}
          loopEnd={state.loopEnd}
        />
      </div>
      
      <InstrumentPalette
        selectedInstrument={state.selectedInstrument}
        onSelect={handleInstrumentSelect}
      />
      
      {/* Debug info */}
      <div className="debug-info" style={{ margin: '10px 0', fontSize: '12px', fontFamily: 'monospace' }}>
        <div>Notes: {state.notes.length}</div>
        <div>Current Beat: {state.currentBeat}</div>
        <div>Selected Instrument: {state.selectedInstrument || 'None'}</div>
      </div>
      
      {/* Display notes backup */}
      <div style={{ margin: '20px 0' }}>
        <h3>Notes in state:</h3>
        <div style={{
          border: '1px solid #ccc',
          padding: '10px',
          background: '#f7f7f7',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {state.notes.length > 0 ? (
            <pre>{JSON.stringify(state.notes, null, 2)}</pre>
          ) : (
            <p>No notes</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sequencer;
