import React, { useRef, useEffect } from 'react';

/**
 * @param {Object} props
 * @param {Array} props.notes - Array of notes
 * @param {number} props.currentBeat - Current beat
 * @param {number} props.maxBars - Maximum number of bars
 * @param {string|null} props.selectedInstrument - Selected instrument
 * @param {boolean} props.isShiftPressed - Is shift key pressed
 * @param {boolean} props.isCtrlPressed - Is ctrl key pressed
 * @param {function} props.onAddNote - Callback for adding note
 * @param {function} props.onRemoveNote - Callback for removing note
 * @param {boolean} props.isLooping - Is looping enabled
 * @param {number} props.loopStart - Loop start beat
 * @param {number} props.loopEnd - Loop end beat
 * @returns {JSX.Element}
 */
function Grid({
  notes = [],
  currentBeat = 0,
  maxBars = 64,
  selectedInstrument = null,
  isShiftPressed = false,
  isCtrlPressed = false,
  onAddNote = () => {},
  onRemoveNote = () => {},
  isLooping = false,
  loopStart = 0,
  loopEnd = 16
}) {
  console.log('Grid rendering with notes:', notes);
  console.log('Current beat:', currentBeat);
  
  const gridRef = useRef(null);
  
  // Simple placeholder grid rendering
  const renderFallback = () => {
    console.log('Rendering fallback DOM grid');
    
    // Create an array of grid cells
    const rows = 8;  // 8 notes in an octave
    const cols = maxBars;  // Maximum number of beats
    
    const cellStyle = {
      width: '30px',
      height: '30px',
      border: '1px solid #ccc',
      display: 'inline-block',
      margin: '0',
      padding: '0',
      boxSizing: 'border-box',
      position: 'relative'
    };
    
    const beatIndicatorStyle = {
      backgroundColor: 'rgba(255, 255, 0, 0.3)',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1
    };
    
    const noteStyle = {
      backgroundColor: 'rgb(255, 0, 0)', // Bright red for visibility
      position: 'absolute',
      top: '1px',
      left: '1px',
      right: '1px',
      bottom: '1px',
      borderRadius: '3px',
      boxShadow: '0 0 5px rgba(0,0,0,0.5)',
      zIndex: 5 // Make sure notes are above beat indicators
    };
    
    const loopIndicatorStyle = {
      backgroundColor: 'rgba(100, 100, 255, 0.2)',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 0
    };
    
    // Render grid rows and cells
    return (
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        overflow: 'auto',
        maxWidth: '100%',
        maxHeight: '300px',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)'
      }}>
        {Array.from({ length: rows }).map((_, y) => (
          <div key={`row-${y}`} style={{ whiteSpace: 'nowrap' }}>
            {Array.from({ length: cols }).map((_, x) => {
              // Check if this cell should display a note
              const hasNote = notes.some(note => note.x === x && note.y === y);
              
              // Check if this cell is the current beat
              const isCurrentBeat = x === currentBeat;
              
              // Check if this cell is within the loop range
              const isInLoopRange = isLooping && x >= loopStart && x < loopEnd;
              
              return (
                <div 
                  key={`cell-${x}-${y}`} 
                  style={cellStyle}
                  onClick={() => {
                    if (hasNote) {
                      onRemoveNote(x, y);
                    } else if (selectedInstrument) {
                      onAddNote({ x, y, instrument: selectedInstrument });
                    }
                  }}
                >
                  {isInLoopRange && <div style={loopIndicatorStyle} />}
                  {isCurrentBeat && <div style={beatIndicatorStyle} />}
                  {hasNote && <div style={noteStyle} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid" ref={gridRef}>
      {/* Fallback DOM-based grid rendering */}
      {renderFallback()}
    </div>
  );
}

export default Grid;
