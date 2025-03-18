import React, { useState, useEffect } from 'react';
import { INITIAL_STATE } from './types';
import Sequencer from './components/Sequencer';
import './App.css';

// We'll import Sequencer once we create it
// import Sequencer from './components/Sequencer';

function App() {
  // State for notes and tempo
  const [notes, setNotes] = useState([]);
  const [tempo, setTempo] = useState(120);
  const [isLoaded, setIsLoaded] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // Function to recursively search for notes in an object
  const findNotesInMessage = (obj) => {
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

  const handleLoadMessage = (savedData) => {
    console.log('handleLoadMessage called with data:', savedData);
    
    // Handle the case where the data is directly in the format {notes: [...], tempo: number}
    if (savedData.notes && Array.isArray(savedData.notes)) {
      const validNotes = savedData.notes.filter(note => 
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
          type: 'devvit-message',
          data: {
            message: {
              type: 'notesLoaded',
              count: validNotes.length
            }
          }
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
  };

  // Add message listener effect
  useEffect(() => {
    console.log('App component mounted');
    
    // Add small delay and then add some test notes if none are loaded
    const timer = setTimeout(() => {
      if (notes.length === 0) {
        console.log('No notes loaded after delay, adding test notes');
        const testNotes = [
          { x: 0, y: 2, instrument: 'mario' },
          { x: 1, y: 3, instrument: 'mario' },
          { x: 2, y: 5, instrument: 'mario' },
          { x: 4, y: 6, instrument: 'mario' },
          { x: 5, y: 0, instrument: 'mario' }
        ];
        setNotes(testNotes);
        setForceRender(prev => prev + 1);
        setIsLoaded(true);
        
        // Try to send a message to the parent window
        try {
          window.parent.postMessage({
            type: 'devvit-message',
            data: {
              message: {
                type: 'testNotesAdded',
                count: testNotes.length
              }
            }
          }, '*');
        } catch (e) {
          console.error('Error sending testNotesAdded message:', e);
        }
      }
    }, 3000);
    
    // Add a custom event listener for messages from main.jsx
    const handleAppMessage = (event) => {
      const message = event.detail;
      console.log('App received forwarded message:', message);
      
      // Process message based on type
      if (message.type === 'devvit-message' && message.data && message.data.message) {
        console.log('Processing Devvit message:', message.data.message);
        const devvitMessage = message.data.message;
        
        if (devvitMessage.type === 'load') {
          console.log('Received load message from Devvit:', devvitMessage);
          
          // Try to find notes in the message
          const notesData = findNotesInMessage(devvitMessage);
          if (notesData) {
            console.log('Found notes data in Devvit message:', notesData);
            handleLoadMessage(notesData);
          }
        }
      } 
      else if (message.type === 'load' && message.payload) {
        console.log('Received direct load message:', message);
        handleLoadMessage(message.payload);
      }
      else {
        console.log('Received unknown message format, trying to find notes:', message);
        
        // Try to find notes in the message
        const notesData = findNotesInMessage(message);
        if (notesData) {
          console.log('Found notes data in unknown message format:', notesData);
          handleLoadMessage(notesData);
        }
      }
    };

    window.addEventListener('app-message', handleAppMessage);
    
    // Send ready message to parent
    window.parent.postMessage({ type: 'ready' }, '*');
    
    // Send init message to parent
    setTimeout(() => {
      window.parent.postMessage({ type: 'INIT' }, '*');
    }, 500); // Add a small delay to ensure the parent is ready to receive
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('app-message', handleAppMessage);
    };
  }, []);

  // Add a useEffect to periodically check if notes are loaded
  useEffect(() => {
    // If we have notes but they're not displayed, try to force a re-render
    if (notes.length > 0) {
      console.log(`We have ${notes.length} notes. Force render: ${forceRender}`);
      
      // Periodically check to make sure notes are visible
      const checkInterval = setInterval(() => {
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
        
        // Force a re-render just in case
        setForceRender(prev => prev + 1);
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(checkInterval);
    }
  }, [notes.length]);

  const handleSave = (composition) => {
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

  return (
    <div className="app">
      <Sequencer 
        initialNotes={notes}
        initialTempo={tempo}
        onSave={handleSave}
        key={`sequencer-${forceRender}`}
      />
      
      {/* Debug panel */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '300px',
        maxHeight: '300px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px 0 0 0',
        zIndex: 1000,
        overflowY: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <h3>Debug Panel</h3>
        <p>Notes count: {notes.length}</p>
        <p>Loaded: {isLoaded ? 'Yes' : 'No'}</p>
        <p>Force render count: {forceRender}</p>
        
        <button 
          onClick={() => {
            console.log('Refreshing notes');
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
        <button 
          onClick={() => {
            console.log('Force Update Notes button clicked');
            
            // Create some test notes if none exist
            if (notes.length === 0) {
              const testNotes = [
                { x: 0, y: 2, instrument: 'mario' },
                { x: 1, y: 3, instrument: 'mario' },
                { x: 2, y: 5, instrument: 'mario' },
                { x: 4, y: 6, instrument: 'mario' },
                { x: 5, y: 0, instrument: 'mario' }
              ];
              console.log('Setting test notes:', testNotes);
              setNotes(testNotes);
            } else {
              // If notes exist, create a copy to force re-render
              console.log('Re-setting existing notes:', notes);
              setNotes([...notes]);
            }
            
            // Force both re-renders for both the app and the sequencer
            setIsLoaded(true);
            setForceRender(prev => prev + 1);
            
            // Also try to send the notes to the parent as a Devvit message
            try {
              window.parent.postMessage({
                type: 'devvit-message',
                data: {
                  message: {
                    type: 'notesForceUpdated',
                    count: notes.length,
                    notes: notes // Include the actual notes in the message
                  }
                }
              }, '*');
            } catch (e) {
              console.error('Error sending notesForceUpdated message:', e);
            }
          }}
          style={{
            marginTop: '5px',
            padding: '5px',
            background: '#ff9900',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          FORCE UPDATE NOTES
        </button>
        {notes.length > 0 && (
          <div style={{ marginTop: '5px', fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
            <pre>{JSON.stringify(notes, null, 2)}</pre>
          </div>
        )}
      </div>
      
      {/* Backup direct rendering of notes */}
      {notes && Array.isArray(notes) && notes.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '780px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #333',
          zIndex: 9999, // Place it above everything
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            background: '#333',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            Backup Notes Rendering ({notes.length} notes)
          </div>
          {notes.map((note, index) => (
            <div 
              key={`backup-note-${index}`}
              style={{
                position: 'absolute',
                left: `${note.x * 30 + 1}px`,
                top: `${note.y * 30 + 45}px`, // Add 45px for the header
                width: '28px',
                height: '28px',
                backgroundColor: 'rgb(255, 0, 0)', // Bright red for visibility
                border: '2px solid black',
                boxShadow: '0 0 8px rgba(0,0,0,0.7)',
                borderRadius: '4px'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
