import { useRef, useEffect, useState } from 'react';
import { Note } from '../types';
import { soundManager } from '../utils/SoundManager';

interface GridProps {
  notes: Note[];
  maxBars: number;
  currentBeat: number;
  selectedInstrument: string | null;
  onNoteAdd: (note: Note) => void;
  onNoteRemove: (x: number, y: number) => void;
  beatsPerMeasure: number;
}

const GRID_CELL_SIZE = 26; // Increased from 20 (30% bigger)
const GRID_ROWS = 13;

export function Grid({
  notes,
  maxBars,
  currentBeat,
  selectedInstrument,
  onNoteAdd,
  onNoteRemove,
  beatsPerMeasure,
}: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Debug notes array when it changes
  useEffect(() => {
    console.log('Grid received notes:', notes);
    console.log('Grid notes length:', notes.length);
    console.log('Grid notes array is array?', Array.isArray(notes));
    
    if (notes && Array.isArray(notes) && notes.length > 0) {
      console.log('First note in grid:', notes[0]);
      console.log('Sample note x:', notes[0].x);
      console.log('Sample note y:', notes[0].y);
      console.log('Sample note instrument:', notes[0].instrument);
      
      // Force a redraw of the canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawGrid(ctx, canvas, notes);
        }
      }
    } else {
      console.warn('Grid has no notes to display');
    }
  }, [notes]);
  
  // Scroll to current beat when it changes
  useEffect(() => {
    if (containerRef.current && currentBeat >= 0) {
      const scrollPosition = currentBeat * GRID_CELL_SIZE;
      containerRef.current.scrollLeft = scrollPosition;
    }
  }, [currentBeat, GRID_CELL_SIZE]);

  // Function to draw the grid and notes
  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentNotes: Note[]) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f5f5f5';  // Light gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';  // Lighter grid lines
    ctx.lineWidth = 1;

    // Draw measure numbers at the top
    for (let x = 0; x <= maxBars; x += beatsPerMeasure) {
      ctx.fillStyle = '#666666';  // Darker text for contrast
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(x / beatsPerMeasure + 1), x * GRID_CELL_SIZE + GRID_CELL_SIZE * (beatsPerMeasure / 2), 14);
    }

    // Vertical lines (bars)
    for (let x = 0; x <= maxBars; x++) {
      const isMeasureLine = x % beatsPerMeasure === 0;
      ctx.strokeStyle = isMeasureLine ? '#b0b0b0' : '#e0e0e0';  // Darker for measure lines
      ctx.lineWidth = isMeasureLine ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x * GRID_CELL_SIZE, 0);
      ctx.lineTo(x * GRID_CELL_SIZE, GRID_ROWS * GRID_CELL_SIZE);
      ctx.stroke();
    }

    // Horizontal lines (notes) with note names
    const noteNames = ['C', 'B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.strokeStyle = '#e0e0e0';  // Light grid lines
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_CELL_SIZE);
      ctx.lineTo(maxBars * GRID_CELL_SIZE, y * GRID_CELL_SIZE);
      ctx.stroke();

      // Add note names
      if (y < noteNames.length) {
        ctx.fillStyle = '#666666';  // Darker text for contrast
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(noteNames[y], 2, y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2 + 3);
      }
    }

    // Log notes before drawing
    console.log('Drawing notes on canvas:', currentNotes);
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    
    // Draw notes - make sure we're handling the array correctly
    if (currentNotes && Array.isArray(currentNotes)) {
      console.log(`Attempting to draw ${currentNotes.length} notes`);
      currentNotes.forEach((note, index) => {
        if (note && typeof note.x === 'number' && typeof note.y === 'number' && note.instrument) {
          console.log(`Drawing note ${index} at position (${note.x}, ${note.y}) with instrument ${note.instrument}`);
          // Note background
          ctx.fillStyle = '#ffffff';  // White background for notes
          ctx.fillRect(
            note.x * GRID_CELL_SIZE + 1,
            note.y * GRID_CELL_SIZE + 1,
            GRID_CELL_SIZE - 2,
            GRID_CELL_SIZE - 2
          );

          // Note border
          ctx.strokeStyle = note.instrument === selectedInstrument ? '#4a90e2' : '#999999';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            note.x * GRID_CELL_SIZE + 1,
            note.y * GRID_CELL_SIZE + 1,
            GRID_CELL_SIZE - 2,
            GRID_CELL_SIZE - 2
          );

          // Note label
          ctx.fillStyle = note.instrument === selectedInstrument ? '#4a90e2' : '#666666';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            note.instrument.charAt(0).toUpperCase(),
            note.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
            note.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2
          );
        } else {
          console.warn('Invalid note object:', note);
        }
      });
    } else {
      console.warn('Notes is not an array or is undefined:', currentNotes);
    }

    // Draw playhead
    if (currentBeat >= 0 && currentBeat < maxBars) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';  // Lighter red for playhead
      ctx.fillRect(currentBeat * GRID_CELL_SIZE, 0, GRID_CELL_SIZE, GRID_ROWS * GRID_CELL_SIZE);
      
      ctx.strokeStyle = '#ff0000';  // Red for playhead line
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((currentBeat - 1) * GRID_CELL_SIZE, 0);
      ctx.lineTo((currentBeat - 1) * GRID_CELL_SIZE, GRID_ROWS * GRID_CELL_SIZE);
      ctx.stroke();
    }

    // Draw hover position
    if (hoverPosition && selectedInstrument) {
      ctx.strokeStyle = '#4a90e2';  // Blue for hover
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoverPosition.x * GRID_CELL_SIZE,
        hoverPosition.y * GRID_CELL_SIZE,
        GRID_CELL_SIZE,
        GRID_CELL_SIZE
      );
    }
  };

  // Main render effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas dimensions are set correctly
    canvas.width = maxBars * GRID_CELL_SIZE;
    canvas.height = GRID_ROWS * GRID_CELL_SIZE;
    console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`);

    // Draw the grid and notes
    drawGrid(ctx, canvas, notes);
  }, [notes, maxBars, currentBeat, selectedInstrument, hoverPosition, beatsPerMeasure]);

  const getGridPosition = (e: React.MouseEvent | React.DragEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_CELL_SIZE);

    if (x >= 0 && x < maxBars && y >= 0 && y < GRID_ROWS) {
      return { x, y };
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    const pos = getGridPosition(e);
    if (!pos) return;

    if (e.button === 2 || !selectedInstrument) {
      onNoteRemove(pos.x, pos.y);
    } else {
      const note = {
        x: pos.x,
        y: pos.y,
        instrument: selectedInstrument,
      };
      onNoteAdd(note);
      soundManager.playSound(selectedInstrument, pos.y);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const instrument = e.dataTransfer.getData('instrument');
    if (!instrument) return;

    const pos = getGridPosition(e);
    if (!pos) return;

    const note = {
      x: pos.x,
      y: pos.y,
      instrument,
    };
    onNoteAdd(note);
    soundManager.playSound(instrument, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getGridPosition(e);
    setHoverPosition(pos);

    if (!isDraggingRef.current || !selectedInstrument || !pos) return;

    const note = {
      x: pos.x,
      y: pos.y,
      instrument: selectedInstrument,
    };
    onNoteAdd(note);
    soundManager.playSound(selectedInstrument, pos.y);
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '780px',
        height: `${GRID_ROWS * GRID_CELL_SIZE + 10}px`,
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        padding: '5px',
        borderRadius: '4px'
      }}
    >
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '3px',
        fontSize: '10px',
        zIndex: 100,
        pointerEvents: 'none',
        borderRadius: '3px'
      }}>
        Notes: {notes.length}
      </div>
      
      <canvas
        ref={canvasRef}
        width={maxBars * GRID_CELL_SIZE}
        height={GRID_ROWS * GRID_CELL_SIZE}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          handleClick(e);
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoverPosition(null);
        }}
        onMouseMove={handleMouseMove}
        style={{ 
          backgroundColor: '#f5f5f5',
          minWidth: '100%'
        }}
      />
    </div>
  );
} 