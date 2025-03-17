import React, { useState, useEffect } from 'react';
import { Sequencer } from './components/Sequencer';
import { Note } from './types';
import './App.css';

// Use test mode for local development
const useTestMode = false;

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

    // Function to find notes in a message, regardless of structure
    const findNotesInMessage = (message: any): any => {
      console.log('Searching for notes in message:', message);
      
      // If message is null or not an object, return null
      if (!message || typeof message !== 'object') {
        return null;
      }
      
      // Check if message has a notes property that is an array
      if (message.notes && Array.isArray(message.notes)) {
        console.log('Found notes directly in message:', message.notes);
        return message;
      }
      
      // Check if message has a payload property with notes
      if (message.payload && typeof message.payload === 'object') {
        if (message.payload.notes && Array.isArray(message.payload.notes)) {
          console.log('Found notes in message.payload:', message.payload.notes);
          return message.payload;
        }
      }
      
      // Check if message has a data property with notes
      if (message.data && typeof message.data === 'object') {
        if (message.data.notes && Array.isArray(message.data.notes)) {
          console.log('Found notes in message.data:', message.data.notes);
          return message.data;
        }
        
        // Recursively check data.message if it exists
        if (message.data.message && typeof message.data.message === 'object') {
          const result = findNotesInMessage(message.data.message);
          if (result) return result;
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
    
    // Handle the case where the data is directly in the format {notes: [...], tempo: number}
    if (savedData.notes && Array.isArray(savedData.notes)) {
      const validNotes = savedData.notes.filter((note: any) => 
        typeof note === 'object' && 
        note !== null && 
        typeof note.x === 'number' && 
        typeof note.y === 'number' && 
        typeof note.instrument === 'string'
      );
      
      console.log('Setting valid notes:', validNotes);
      console.log('Notes before update:', notes);
      setNotes(validNotes);
      console.log('Notes after update function call:', notes); // This will still show old value due to closure
      
      // Force a re-render by setting a state flag
      setIsLoaded(true);
      setForceRender(prev => prev + 1);
      
      if (validNotes.length !== savedData.notes.length) {
        console.warn(`Filtered out ${savedData.notes.length - validNotes.length} invalid notes`);
      }
      
      // Send a message to confirm notes were loaded
      try {
        window.parent.postMessage({
          type: 'notesLoaded',
          count: validNotes.length
        }, '*');
      } catch (e) {
        console.error('Error sending notesLoaded message:', e);
      }
    } else if (Array.isArray(savedData)) {
      // Try to handle the case where notes might be the entire data object
      const validNotes = savedData.filter((note: any) => 
        typeof note === 'object' && 
        note !== null &&
        typeof note.x === 'number' && 
        typeof note.y === 'number' && 
        typeof note.instrument === 'string'
      );
      
      console.log('Detected notes array directly in data, using it:', validNotes);
      setNotes(validNotes);
      
      // Force a re-render by setting a state flag
      setIsLoaded(true);
      setForceRender(prev => prev + 1);
      
      if (validNotes.length !== savedData.length) {
        console.warn(`Filtered out ${savedData.length - validNotes.length} invalid notes`);
      }
      
      // Send a message to confirm notes were loaded
      try {
        window.parent.postMessage({
          type: 'notesLoaded',
          count: validNotes.length
        }, '*');
      } catch (e) {
        console.error('Error sending notesLoaded message:', e);
      }
    } else {
      console.warn('Invalid notes format received:', savedData);
      // Add test notes as fallback
      const testNotes: Note[] = [
        { x: 0, y: 2, instrument: 'mario' },
        { x: 2, y: 5, instrument: 'mario' },
        { x: 5, y: 5, instrument: 'mario' }
      ];
      console.log('Using fallback test notes:', testNotes);
      setNotes(testNotes);
      
      // Send a message to confirm fallback notes were loaded
      try {
        window.parent.postMessage({
          type: 'notesLoaded',
          count: testNotes.length,
          fallback: true
        }, '*');
      } catch (e) {
        console.error('Error sending notesLoaded message:', e);
      }
    }
    
    if (savedData.tempo && typeof savedData.tempo === 'number') {
      console.log('Setting tempo:', savedData.tempo);
      setTempo(savedData.tempo);
    } else {
      console.warn('Using default tempo (120)');
      setTempo(120);
    }

    // Force a re-render by setting a state flag
    setIsLoaded(true);
    setForceRender(prev => prev + 1);
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
