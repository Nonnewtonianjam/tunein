import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Log that we're starting up
console.log('Sequencer WebView starting up in webroot implementation');

// Create the root element
const root = ReactDOM.createRoot(
  document.getElementById('root')
);

// Check if the root exists
if (!document.getElementById('root')) {
  console.error('Root element not found! Creating one...');
  const rootDiv = document.createElement('div');
  rootDiv.id = 'root';
  document.body.appendChild(rootDiv);
}

// Ensure the root element is visible
const rootEl = document.getElementById('root');
if (rootEl) {
  rootEl.style.display = 'block';
  rootEl.style.visibility = 'visible';
  rootEl.style.opacity = '1';
  rootEl.style.width = '100%';
  rootEl.style.height = '100%';
  console.log('Root element styles enforced for visibility');
}

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Apply global visibility fix
document.body.style.visibility = 'visible';
document.body.style.opacity = '1';
document.body.style.backgroundColor = '#ffffff';

// Send a ready message to the parent window
console.log('Sequencer WebView loaded, sending ready message');

// First send a simple ready message
try {
  window.parent.postMessage('ready', '*');
  console.log('Sent simple ready message');
} catch (e) {
  console.error('Error sending simple ready message:', e);
}

// Send a more robust ready message with retry
function sendReadyMessage(retryCount = 0) {
  try {
    // Then send a more structured INIT message that follows Devvit's expected format
    window.parent.postMessage({
      type: 'INIT',
      payload: {
        ready: true,
        timestamp: Date.now()
      }
    }, '*');
    
    // Also send in Devvit format
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
    
    console.log('Sent structured INIT messages');
  } catch (e) {
    console.error('Error sending structured INIT message:', e);
    if (retryCount < 5) {
      // Retry after a delay
      setTimeout(() => sendReadyMessage(retryCount + 1), 1000);
    }
  }
}

// Send ready message and retry if needed
sendReadyMessage();

// Log to confirm messages were sent
console.log('Ready messages sent to parent window');

// Track when we started
const startTime = Date.now();

// Send periodic heartbeat to confirm the connection
setInterval(() => {
  try {
    window.parent.postMessage({
      type: 'heartbeat',
      uptime: Date.now() - startTime,
      timestamp: Date.now()
    }, '*');
  } catch (e) {
    console.error('Error sending heartbeat:', e);
  }
}, 10000); // Every 10 seconds

// Listen for messages from parent window
window.addEventListener('message', (event) => {
  // Log all incoming messages
  console.log('Received message in sequencer main.jsx:', event.data);
  
  // Forward the message to the App component
  window.dispatchEvent(new CustomEvent('app-message', { detail: event.data }));
  
  // If this is a "load" message, log it specially
  if (event.data && 
     ((event.data.type === 'load') || 
      (event.data.type === 'devvit-message' && event.data.data && event.data.data.message && event.data.data.message.type === 'load'))) {
    console.log('LOAD MESSAGE RECEIVED:', JSON.stringify(event.data, null, 2));
  }
});
