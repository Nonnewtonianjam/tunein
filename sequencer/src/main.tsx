import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Create the root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Send a ready message to the parent window
console.log('Sequencer WebView loaded, sending ready message');

// First send a simple ready message
window.parent.postMessage('ready', '*');

// Then send a more structured INIT message that follows Devvit's expected format
window.parent.postMessage({
  type: 'devvit-message',
  data: {
    message: {
      type: 'INIT',
      payload: {
        ready: true,
        timestamp: Date.now()
      }
    }
  }
}, '*');

// Log to confirm messages were sent
console.log('Ready messages sent to parent window');

// Listen for messages from parent window
window.addEventListener('message', (event) => {
  // Log all incoming messages
  console.log('Received message in sequencer main.tsx:', event.data);
  
  // Handle Devvit's message wrapping
  if (event.data.type === 'devvit-message' && event.data.data && event.data.data.message) {
    const devvitMessage = event.data.data.message;
    console.log('Unwrapped Devvit message in main.tsx:', devvitMessage);
    
    // Forward the unwrapped message to the App component
    window.dispatchEvent(new MessageEvent('message', { 
      data: devvitMessage
    }));
  }
})
