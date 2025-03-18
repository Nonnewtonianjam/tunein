import { useState, useEffect } from 'react';
import { Sequencer } from './components/Sequencer';
import { Note } from './types';
import './App.css';

function App() {
  // State for notes and tempo
  const [notes, setNotes] = useState<Note[]>([]);
  const [tempo, setTempo] = useState<number>(120);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [forceRender, setForceRender] = useState<number>(0);

  useEffect(() => {
    console.log('App component mounted');
    
    // Create some test notes if in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Adding test notes');
      const testNotes: Note[] = [
        { x: 0, y: 2, instrument: 'mario' },
        { x: 2, y: 5, instrument: 'mario' },
        { x: 5, y: 5, instrument: 'mario' },
        { x: 5, y: 2, instrument: 'mario' },
        { x: 7, y: 3, instrument: 'mario' },
        { x: 8, y: 7, instrument: 'mario' }
      ];
      setNotes(testNotes);
      setTempo(120);
      setIsLoaded(true);
      setForceRender(prev => prev + 1);
    }
    
    // Force test notes to be loaded after a delay
    setTimeout(() => {
      console.log('Timeout: forcing test notes');
      const forcedTestNotes: Note[] = [
        { x: 0, y: 2, instrument: 'mario' },
        { x: 1, y: 3, instrument: 'mario' },
        { x: 2, y: 5, instrument: 'mario' },
        { x: 4, y: 6, instrument: 'mario' },
        { x: 5, y: 0, instrument: 'mario' }
      ];
      setNotes(forcedTestNotes);
      setTempo(120);
      setIsLoaded(true);
      setForceRender(prev => prev + 1);
      console.log('Test notes set:', forcedTestNotes);
    }, 2000);

    // Function to recursively search for notes in an object
    const findNotesInMessage = (obj: any): any => {
      console.log('Looking for notes in object:', obj);
      
      // If the object is null or undefined, return null
      if (!obj) return null;
      
      // Check if this is directly the data we want
      if (obj.notes && Array.isArray(obj.notes)) {
        console.log('Found notes array directly in object:', obj.notes);
        return obj;
      }
      
      // Check if this is a typical payload structure
      if (obj.payload && typeof obj.payload === 'object' && obj.payload.notes && Array.isArray(obj.payload.notes)) {
        console.log('Found notes in payload:', obj.payload.notes);
        return obj.payload;
      }
      
      // Check if this is a Devvit message structure
      if (obj.type === 'devvit-message' && obj.data && obj.data.message) {
        console.log('Found Devvit message structure, checking message:', obj.data.message);
        const message = obj.data.message;
        
        // Check if this is a load message with payload
        if (message.type === 'load' && message.payload) {
          console.log('Found load message with payload:', message.payload);
          
          // Check if payload has notes
          if (message.payload.notes && Array.isArray(message.payload.notes)) {
            console.log('Found notes in load message payload:', message.payload.notes);
            return message.payload;
          }
        }
        
        // No notes found in the expected structure, try other properties
        return findNotesInMessage(message);
      }
      
      // Look through known properties where notes might exist
      const possibleProps = ['data', 'message', 'payload', 'notes'];
      for (const prop of possibleProps) {
        if (obj[prop]) {
          console.log(`Checking ${prop} property:`, obj[prop]);
          
          // If this property is an array, check if it looks like notes
          if (Array.isArray(obj[prop])) {
            // Check if this array contains objects that look like notes
            if (obj[prop].length > 0 && 
                typeof obj[prop][0] === 'object' && 
                obj[prop][0] !== null &&
                'x' in obj[prop][0] && 
                'y' in obj[prop][0] && 
                'instrument' in obj[prop][0]) {
              console.log(`Found notes array in ${prop} property:`, obj[prop]);
              return { notes: obj[prop], tempo: obj.tempo || 120 };
            }
          }
          
          // Recursively check this property
          const result = findNotesInMessage(obj[prop]);
          if (result) return result;
        }
      }
      
      // Check all other properties recursively, but avoid infinite loops
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          // Skip the properties we've already checked
          if (possibleProps.includes(key)) continue;
          
          // Skip special properties
          if (key === 'prototype' || key === '__proto__') continue;
          
          // Only proceed with object properties
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            console.log(`Checking property ${key}:`, obj[key]);
            const result = findNotesInMessage(obj[key]);
            if (result) return result;
          }
        }
      }
      
      // If we get here, we didn't find notes in the expected places
      return null;
    };

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      console.log('App received message:', event.data);
      
      // First, check if it's a Devvit message
      if (event.data.type === 'devvit-message' && event.data.data && event.data.data.message) {
        console.log('Processing Devvit message:', event.data.data.message);
        const devvitMessage = event.data.data.message;
        
        // Handle different message types
        if (devvitMessage.type === 'load') {
          console.log('Received load message from Devvit:', devvitMessage);
          
          // Try to find notes in the message
          const notesData = findNotesInMessage(devvitMessage);
          if (notesData) {
            console.log('Found notes data in Devvit message:', notesData);
            handleLoadMessage(notesData);
          } else {
            console.warn('No notes found in Devvit load message');
          }
        }
      } 
      // Handle direct messages
      else if (event.data.type === 'load') {
        console.log('Received direct load message:', event.data);
        
        // Try to find notes in the message
        const notesData = findNotesInMessage(event.data);
        if (notesData) {
          console.log('Found notes data in direct message:', notesData);
          handleLoadMessage(notesData);
        } else {
          console.warn('No notes found in direct load message');
        }
      }
      // Try to handle any other message format
      else {
        console.log('Received unknown message format, trying to find notes:', event.data);
        
        // Try to find notes in the message
        const notesData = findNotesInMessage(event.data);
        if (notesData) {
          console.log('Found notes data in unknown message format:', notesData);
          handleLoadMessage(notesData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Send ready message to parent
    window.parent.postMessage({ type: 'ready' }, '*');
    
    // Send init message to parent
    setTimeout(() => {
      window.parent.postMessage({ type: 'INIT' }, '*');
    }, 500); // Add a small delay to ensure the parent is ready to receive

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Add a useEffect to periodically check if notes are loaded
  useEffect(() => {
    // If we have notes but they're not displayed, try to force a re-render
    if (notes.length > 0) {
      console.log('Notes exist but may not be displayed, setting up periodic check');
      
      // Set up a periodic check to ensure notes are displayed
      const checkInterval = setInterval(() => {
        console.log('Periodic check: notes count =', notes.length);
        
        // Force a re-render
        setForceRender(prev => prev + 1);
        
        // Try to send a message to the parent window
        try {
          window.parent.postMessage({
            type: 'devvit-message',
            data: {
              message: {
                type: 'notesCheck',
                count: notes.length,
                timestamp: new Date().toISOString()
              }
            }
          }, '*');
        } catch (e) {
          console.error('Error sending notesCheck message:', e);
        }
      }, 2000); // Check every 2 seconds
      
      // Clean up the interval when component unmounts
      return () => clearInterval(checkInterval);
    }
  }, [notes.length]);

  // Add test notes after a delay if none are loaded
  useEffect(() => {
    if (notes.length === 0) {
      console.log('No notes loaded, will add test notes after delay');
      
      // Add test notes after a delay if none are loaded
      const timer = setTimeout(() => {
        console.log('Adding test notes');
        const testNotes: Note[] = [
          { x: 0, y: 0, instrument: 'mario' },
          { x: 1, y: 1, instrument: 'mario' },
          { x: 2, y: 2, instrument: 'mario' },
          { x: 3, y: 3, instrument: 'mario' },
          { x: 4, y: 4, instrument: 'mario' },
          { x: 5, y: 5, instrument: 'mario' }
        ];
        setNotes(testNotes);
        setForceRender(prev => prev + 1);
        setIsLoaded(true);
        
        // Try to send a message to the parent window
        try {
          window.parent.postMessage({
            type: 'testNotesAdded',
            count: testNotes.length
          }, '*');
        } catch (e) {
          console.error('Error sending testNotesAdded message:', e);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notes.length]);

  // Add a second useEffect to log when notes or tempo changes
  useEffect(() => {
    console.log('Notes state updated:', notes);
    console.log('Tempo state updated:', tempo);
  }, [notes, tempo]);

  const handleSave = (composition: { notes: Note[], tempo: number }) => {
    // Send the notes and tempo to the parent window in the expected format
    console.log('Saving composition:', composition);
    
    // Create the data object in the Devvit message format
    const dataToSave = {
      type: 'devvit-message',
      data: {
        message: {
          type: 'save',
          payload: composition
        }
      }
    };
    
    // Send the message to the parent window
    console.log('Sending save message to parent in Devvit format:', dataToSave);
    window.parent.postMessage(dataToSave, '*');
    
    // Also send in the standard format as a fallback
    setTimeout(() => {
      console.log('Sending save message in standard format as fallback');
      window.parent.postMessage({
        type: 'save',
        data: composition
      }, '*');
    }, 100);
  };

  const handleLoadMessage = (savedData: any) => {
    console.log('handleLoadMessage called with data:', savedData);
    
    try {
      // Handle the case where the data is directly in the format {notes: [...], tempo: number}
      if (savedData.notes && Array.isArray(savedData.notes)) {
        console.log('Processing notes array with length:', savedData.notes.length);
        
        // Deep clone notes to break references completely
        const deepClonedNotes = JSON.parse(JSON.stringify(savedData.notes));
        
        const validNotes = deepClonedNotes.filter((note: any) => 
          typeof note === 'object' && 
          note !== null && 
          typeof note.x === 'number' && 
          typeof note.y === 'number' && 
          typeof note.instrument === 'string'
        );
        
        console.log('Setting valid notes:', validNotes.length, 'of', savedData.notes.length);
        console.log('Notes before update:', notes.length, 'notes');
        
        // Force note rendering with multiple approaches
        
        // 1. Set state with fresh array copy
        setNotes(validNotes);
        
        // 2. Set tempo to force a render
        if (typeof savedData.tempo === 'number') {
          setTempo(savedData.tempo);
        } else {
          // Force tempo update even if it's the same value
          setTempo(prev => {
            const newTempo = prev === 120 ? 121 : 120;
            console.log(`Forcing tempo update: ${prev} -> ${newTempo}`);
            return newTempo;
          });
        }
        
        // 3. Flag that data is loaded
        setIsLoaded(true);
        
        // 4. Increment force render counter
        setForceRender(prev => prev + 1);
        
        console.log('State updates complete');
        
        // 5. Force re-render after a short delay
        setTimeout(() => {
          console.log('Delayed force update - current note count:', validNotes.length);
          // Update again to ensure rendering
          setForceRender(prev => prev + 1);
          
          // Get root element for backup rendering
          const rootElement = document.getElementById('root');
          if (rootElement) {
            console.log('Attempting direct DOM rendering as backup');
            // Try to inject notes directly into DOM
            renderNotesDirect(validNotes);
          }
          
          // Send a verification message back to parent
          try {
            window.parent.postMessage({
              type: 'devvit-message',
              data: {
                message: {
                  type: 'notesStatus',
                  payload: {
                    notesReceived: validNotes.length,
                    sequencerReady: true
                  }
                }
              }
            }, '*');
            console.log('Sent notes status message to parent');
          } catch (e) {
            console.error('Error sending status message:', e);
          }
        }, 300);
        
        if (validNotes.length !== savedData.notes.length) {
          console.warn(`Filtered out ${savedData.notes.length - validNotes.length} invalid notes`);
        }
      } else {
        console.warn('No valid notes array found in saved data');
      }
    } catch (e) {
      console.error('Error in handleLoadMessage:', e);
    }
  };

  // Add a direct DOM rendering function as a fallback
  const renderNotesDirect = (notesToRender: Note[]) => {
    console.log('Direct DOM rendering notes:', notesToRender);
    
    // Constants that match Grid.tsx
    const GRID_CELL_SIZE = 26;
    
    // Remove any existing direct renderings
    const existingContainer = document.getElementById('direct-note-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'direct-note-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1000';
    
    // Find the sequencer container - try a few selectors
    const sequencerContainer = 
      document.querySelector('.sequencer') || 
      document.querySelector('.grid-container') || 
      document.getElementById('root');
    
    if (!sequencerContainer) {
      console.error('Could not find sequencer container for direct rendering');
      return;
    }
    
    // Find the canvas
    const canvas = sequencerContainer.querySelector('canvas');
    if (!canvas) {
      console.error('Could not find canvas for direct rendering');
      return;
    }
    
    // Create notes
    notesToRender.forEach((note) => {
      const noteEl = document.createElement('div');
      noteEl.style.position = 'absolute';
      noteEl.style.left = `${note.x * GRID_CELL_SIZE + 1}px`;
      noteEl.style.top = `${note.y * GRID_CELL_SIZE + 1}px`;
      noteEl.style.width = `${GRID_CELL_SIZE - 2}px`;
      noteEl.style.height = `${GRID_CELL_SIZE - 2}px`;
      noteEl.style.backgroundColor = 'rgba(255, 0, 0, 0.7)'; // Red background for visibility
      noteEl.style.border = '2px solid #000';
      noteEl.style.borderRadius = '2px';
      noteEl.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
      noteEl.style.zIndex = '1001';
      
      // Add text label
      noteEl.textContent = note.instrument.charAt(0).toUpperCase();
      noteEl.style.display = 'flex';
      noteEl.style.alignItems = 'center';
      noteEl.style.justifyContent = 'center';
      noteEl.style.color = 'white';
      noteEl.style.fontWeight = 'bold';
      noteEl.style.fontSize = '12px';
      
      container.appendChild(noteEl);
    });
    
    // Add container next to canvas
    canvas.parentNode!.appendChild(container);
    console.log(`Added ${notesToRender.length} notes directly to DOM`);
  };

  return (
    <div className="app">
      <Sequencer 
        onSave={handleSave} 
        initialNotes={notes} 
        initialTempo={tempo}
        key={`sequencer-${notes.length}-${forceRender}`} // Force re-render when notes change
      />
      
      {/* Backup direct rendering of notes */}
      {notes && Array.isArray(notes) && notes.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '780px',
          height: '300px',
          background: '#f5f5f5',
          border: '1px solid #ccc',
          zIndex: -1 // Place it behind the sequencer
        }}>
          {notes.map((note, index) => (
            <div 
              key={`backup-note-${index}`}
              style={{
                position: 'absolute',
                left: `${note.x * 30 + 1}px`,
                top: `${note.y * 30 + 1}px`,
                width: '28px',
                height: '28px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid #4a90e2',
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Debug panel */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 9999
      }}>
        <div>Notes: {notes.length}</div>
        <div>Loaded: {isLoaded ? 'Yes' : 'No'}</div>
        <div>Last Update: {new Date().toLocaleTimeString()}</div>
        <button 
          onClick={() => {
            console.log('Manual refresh triggered');
            // Force a re-render by creating a new array
            if (notes.length > 0) {
              setNotes([...notes]);
            } else {
              // Create some test notes if none exist
              const testNotes: Note[] = [
                { x: 0, y: 2, instrument: 'mario' },
                { x: 1, y: 3, instrument: 'mario' },
                { x: 2, y: 5, instrument: 'mario' },
                { x: 4, y: 6, instrument: 'mario' },
                { x: 5, y: 0, instrument: 'mario' }
              ];
              setNotes(testNotes);
            }
            setIsLoaded(true);
            setForceRender(prev => prev + 1);
          }}
          style={{
            marginTop: '5px',
            padding: '5px',
            background: '#4a90e2',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Refresh Notes
        </button>
        <button 
          onClick={() => {
            console.log('Clearing notes');
            setNotes([]);
            setForceRender(prev => prev + 1);
          }}
          style={{
            marginTop: '5px',
            marginLeft: '5px',
            padding: '5px',
            background: '#e24a4a',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Clear Notes
        </button>
        {notes.length > 0 && (
          <div style={{ marginTop: '5px', fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
            <pre>{JSON.stringify(notes, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
