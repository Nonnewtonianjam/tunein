import React from 'react';

/**
 * @param {Object} props
 * @param {string|null} props.selectedInstrument - The currently selected instrument
 * @param {function} props.onSelect - Callback for instrument selection
 * @returns {JSX.Element}
 */
function InstrumentPalette({ selectedInstrument, onSelect }) {
  // List of available instruments
  const instruments = [
    { id: 'mario', name: 'Mario', color: '#E7493E' },
    { id: 'piano', name: 'Piano', color: '#3E82E7' },
    { id: 'drum', name: 'Drum', color: '#3EE763' },
    { id: 'synth', name: 'Synth', color: '#E73ECB' }
  ];
  
  return (
    <div className="instrument-palette">
      <h3>Instruments</h3>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        {instruments.map(instrument => (
          <button
            key={instrument.id}
            onClick={() => onSelect(instrument.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedInstrument === instrument.id ? instrument.color : '#f8f8f8',
              color: selectedInstrument === instrument.id ? 'white' : '#333',
              border: `2px solid ${instrument.color}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: selectedInstrument === instrument.id ? 'bold' : 'normal'
            }}
          >
            {instrument.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default InstrumentPalette;
