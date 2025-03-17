import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize the app when the window loads
window.addEventListener('load', () => {
  // Create root element
  const root = ReactDOM.createRoot(document.getElementById('root')!)

  // Render the app
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )

  // Send ready message to parent window
  window.parent.postMessage({ type: 'ready' }, '*')
})

// Listen for messages from parent window
window.addEventListener('message', (event) => {
  // Handle any incoming messages here
  console.log('Received message:', event.data)
})
