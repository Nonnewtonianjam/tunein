// React is needed for JSX
import * as React from 'react';
import { Sequencer } from './components/Sequencer';
import { Note } from './types';

// Hardcoded test data that matches the Redis format
const testData = {
  notes: [
    { x: 1, y: 2, instrument: 'mario' },
    { x: 2, y: 6, instrument: 'mario' },
    { x: 4, y: 3, instrument: 'mario' },
    { x: 5, y: 6, instrument: 'mario' },
    { x: 7, y: 9, instrument: 'mario' },
    { x: 4, y: 8, instrument: 'mario' }
  ],
  tempo: 120
};

export function TestSequencer() {
  console.log('Rendering TestSequencer with hardcoded data:', testData);
  
  const handleSave = (notes: Note[]) => {
    console.log('Save called with notes:', notes);
  };

  return (
    <div className="test-container" style={{ width: '100%', height: '100vh' }}>
      <h2>Test Sequencer with Hardcoded Data</h2>
      <button 
        onClick={() => console.log('Current test data:', testData)}
        style={{ 
          padding: '8px 16px', 
          margin: '10px 0', 
          backgroundColor: '#4a90e2', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Log Test Data
      </button>
      <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
        <Sequencer 
          initialNotes={testData.notes} 
          initialTempo={testData.tempo} 
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
