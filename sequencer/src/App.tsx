import { useState, useEffect } from 'react';
import { Sequencer } from './components/Sequencer';
import { TestSequencer } from './TestSequencer';
import { Note } from './types';
import './App.css';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tempo, setTempo] = useState<number>(120);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [useTestMode, setUseTestMode] = useState<boolean>(false);

  useEffect(() => {
    // Check for test mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true') {
      console.log('Test mode enabled via URL parameter');
      setUseTestMode(true);
      return;
    }

    // Listen for messages from the parent window
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message in sequencer:', event.data);
      
      if (event.data.type === 'load' && event.data.data) {
        // Load the saved notes and tempo
        const savedData = event.data.data;
        console.log('Loading saved data in sequencer App:', savedData);
        
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
          setNotes(validNotes);
          
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
          
          if (validNotes.length !== savedData.length) {
            console.warn(`Filtered out ${savedData.length - validNotes.length} invalid notes`);
          }
        } else {
          console.warn('Invalid notes format received:', savedData);
          setNotes([]);
        }
        
        if (savedData.tempo && typeof savedData.tempo === 'number') {
          console.log('Setting tempo:', savedData.tempo);
          setTempo(savedData.tempo);
        } else {
          console.warn('Using default tempo (120)');
          setTempo(120);
        }

        setIsLoaded(true);
      } else if (event.data && !event.data.type) {
        // Direct data object without a type - assume it's in the format {notes: [...], tempo: number}
        const directData = event.data;
        console.log('Received direct data object:', directData);
        
        if (directData.notes && Array.isArray(directData.notes)) {
          const validNotes = directData.notes.filter((note: any) => 
            typeof note === 'object' && 
            note !== null && 
            typeof note.x === 'number' && 
            typeof note.y === 'number' && 
            typeof note.instrument === 'string'
          );
          
          console.log('Setting valid notes from direct data:', validNotes);
          setNotes(validNotes);
        }
        
        if (directData.tempo && typeof directData.tempo === 'number') {
          console.log('Setting tempo from direct data:', directData.tempo);
          setTempo(directData.tempo);
        }
        
        setIsLoaded(true);
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

  // Add a second useEffect to log when notes or tempo changes
  useEffect(() => {
    console.log('Notes state updated:', notes);
    console.log('Tempo state updated:', tempo);
  }, [notes, tempo]);

  const handleSave = (notes: Note[]) => {
    // Send the notes and tempo to the parent window in the expected format
    console.log('Saving notes:', notes);
    console.log('Current tempo:', tempo);
    
    // Create the data object in the expected format
    const dataToSave = {
      notes: notes,
      tempo: tempo
    };
    
    console.log('Sending formatted data to parent:', dataToSave);
    
    window.parent.postMessage({ 
      type: 'save', 
      data: notes,  // Keep the existing format for backward compatibility
      tempo: tempo  // Include tempo as a separate property
    }, '*');
  };

  return (
    <div className="app">
      {useTestMode ? (
        <TestSequencer />
      ) : (
        <Sequencer 
          onSave={handleSave} 
          initialNotes={notes} 
          initialTempo={tempo}
        />
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
