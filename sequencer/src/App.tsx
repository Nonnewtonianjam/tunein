import React, { useState, useEffect } from 'react';
import { Sequencer } from './components/Sequencer';
import { TestSequencer } from './components/TestSequencer';
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
    }

    const handleMessage = (event: MessageEvent) => {
      console.log('Received message in sequencer:', event.data);
      
      // First check if it's a devvit-message
      if (event.data.type !== 'devvit-message') {
        console.log('Not a devvit-message, handling as direct message');
        handleDirectMessage(event.data);
        return;
      }
      
      // Extract the actual message from the devvit wrapper
      const { message } = event.data.data;
      if (!message || !message.type) {
        console.warn('Invalid devvit message format:', event.data);
        return;
      }
      
      console.log('Unwrapped devvit message:', message);
      
      // Handle the unwrapped message
      switch (message.type) {
        case 'load':
          if (message.payload) {
            console.log('Loading composition data:', message.payload);
            handleLoadMessage(message.payload);
          } else {
            console.warn('Load message missing payload');
          }
          break;
          
        case 'INIT_RESPONSE':
          console.log('Received INIT_RESPONSE:', message);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    };
    
    // Handle direct messages (non-devvit wrapped)
    const handleDirectMessage = (data: any) => {
      if (data.type === 'load' && data.payload) {
        console.log('Loading composition data from direct message:', data.payload);
        handleLoadMessage(data.payload);
      } else {
        console.warn('Unhandled direct message:', data);
      }
    };
    
    // Common handler for load messages
    const handleLoadMessage = (savedData: any) => {
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

  // Add a second useEffect to log when notes or tempo changes
  useEffect(() => {
    console.log('Notes state updated:', notes);
    console.log('Tempo state updated:', tempo);
  }, [notes, tempo]);

  const handleSave = (composition: { notes: Note[], tempo: number }) => {
    // Send the notes and tempo to the parent window in the expected format
    console.log('Saving composition:', composition);
    
    // Create the data object in the expected format
    const dataToSave = {
      type: 'save',
      data: composition
    };
    
    // Send the message to the parent window
    console.log('Sending save message to parent:', dataToSave);
    window.parent.postMessage(dataToSave, '*');
  };

  return (
    <div className="app">
      {useTestMode ? (
        <TestSequencer />
      ) : (
        <>
          <Sequencer 
            onSave={handleSave} 
            initialNotes={notes} 
            initialTempo={tempo}
            key={`sequencer-${notes.length}-${Date.now()}`} // Force re-render when notes change
          />
          
          {/* Debug panel */}
          {process.env.NODE_ENV !== 'production' && (
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
              <div>Force Render: {forceRender}</div>
              <button 
                onClick={() => {
                  console.log('Manual refresh triggered');
                  // Force a re-render by creating a new array
                  if (notes.length > 0) {
                    setNotes([...notes]);
                  } else {
                    // Create some test notes if none exist
                    setNotes([
                      { x: 0, y: 2, instrument: 'mario' },
                      { x: 2, y: 5, instrument: 'mario' },
                      { x: 5, y: 5, instrument: 'mario' }
                    ]);
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
                Manual Refresh
              </button>
              <button 
                onClick={() => {
                  console.log('Adding test notes');
                  // Add test notes
                  const testNotes = [
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
                }}
                style={{
                  marginTop: '5px',
                  marginLeft: '5px',
                  padding: '5px',
                  background: '#4caf50',
                  border: 'none',
                  borderRadius: '3px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Add Test Notes
              </button>
              {notes.length > 0 && (
                <div style={{ marginTop: '5px', fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
                  <pre>{JSON.stringify(notes, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {!isLoaded && notes.length === 0 && !useTestMode && (
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          left: '10px', 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white', 
          padding: '5px', 
          borderRadius: '3px',
          fontSize: '12px'
        }}>
          Waiting for notes data...
        </div>
      )}
    </div>
  );
}

export default App;
