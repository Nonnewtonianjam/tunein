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

// Track when we started
const startTime = Date.now();

// Listen for messages from parent window
window.addEventListener('message', (event) => {
  // Log all incoming messages
  console.log('Received message in sequencer main.tsx:', event.data);
  
  // Check if it's a Devvit message
  if (event.data.type === 'devvit-message' && event.data.data && event.data.data.message) {
    console.log('Received Devvit message:', event.data.data.message);
    
    // Forward the Devvit message to the App component
    setTimeout(() => {
      console.log('Forwarding Devvit message to App component:', event.data.data.message);
      window.dispatchEvent(new MessageEvent('message', { 
        data: event.data.data.message,
        origin: event.origin,
        source: event.source
      }));
    }, 100);
  } else {
    // Forward the original message to the App component
    // This ensures the App component receives the message in the same format
    setTimeout(() => {
      console.log('Forwarding non-Devvit message to App component:', event.data);
      window.dispatchEvent(new MessageEvent('message', { 
        data: event.data,
        origin: event.origin,
        source: event.source
      }));
    }, 100);
  }
});

// Send a ready message in Devvit format
console.log('Sending ready message in Devvit format');
window.parent.postMessage({
  type: 'devvit-message',
  data: {
    message: {
      type: 'ready'
    }
  }
}, '*');

// Also send a ready message after a delay to ensure the parent is ready to receive
setTimeout(() => {
  console.log('Sending delayed ready message in Devvit format');
  window.parent.postMessage({
    type: 'devvit-message',
    data: {
      message: {
        type: 'ready'
      }
    }
  }, '*');
}, 1000);

// Also send an INIT message in Devvit format
setTimeout(() => {
  console.log('Sending INIT message in Devvit format');
  window.parent.postMessage({
    type: 'devvit-message',
    data: {
      message: {
        type: 'INIT'
      }
    }
  }, '*');
}, 500);

// Send periodic ready messages to handle Reddit's iframe loading behavior
let readyMessageInterval = setInterval(() => {
  console.log('Sending periodic ready message in Devvit format');
  window.parent.postMessage({
    type: 'devvit-message',
    data: {
      message: {
        type: 'ready'
      }
    }
  }, '*');
  
  // Stop after 10 seconds to avoid unnecessary messages
  if (Date.now() - startTime > 10000) {
    clearInterval(readyMessageInterval);
  }
}, 2000);
