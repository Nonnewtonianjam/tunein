// This script can be used to directly test the sequencer with hardcoded data

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

/**
 * This function simulates sending data to the sequencer
 * You can call this from the browser console when testing
 */
export function sendTestDataToSequencer() {
  console.log('Sending test data to sequencer:', testData);
  
  // If running in an iframe, send message to parent
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'load',
      data: testData
    }, '*');
  } else {
    // If running directly, dispatch a custom event
    const event = new CustomEvent('sequencer-test-data', { 
      detail: { type: 'load', data: testData } 
    });
    window.dispatchEvent(event);
    
    // Also log instructions for manual testing
    console.log('Test data ready. To manually test in React components:');
    console.log('1. Access the Sequencer component');
    console.log('2. Call setState with the test data');
    console.log('Example: sequencerRef.current.setState(prev => ({ ...prev, notes: testData.notes, tempo: testData.tempo }))');
  }
  
  return testData;
}

// Export the test data for direct use
export { testData };

// Log a message when the script is loaded
console.log('Test script loaded. Call sendTestDataToSequencer() to test.');
