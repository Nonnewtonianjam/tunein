# TuneIn Music Sequencer (Webroot Version)

This is the React implementation of the TuneIn Music Sequencer that runs directly from the webroot directory.

## Project Structure

```
webroot/
├── src/
│   ├── components/
│   │   ├── Grid.jsx           # Grid component for displaying and interacting with notes
│   │   ├── InstrumentPalette.jsx # Component for selecting instruments
│   │   └── Sequencer.jsx      # Main sequencer component
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Entry point for React
│   ├── types.js               # Type definitions using JSDoc
│   └── index.css              # Global styles
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
└── sequencer.html             # HTML entry point
```

## Development

To run the development server:

```
cd webroot
npm install
npm start
```

## Deployment

To build for production:

```
cd webroot
npm run build
```

## Integration with Devvit

The sequencer communicates with the parent Devvit application using the window.postMessage API. The expected data format for compositions is:

```javascript
{
  notes: Note[], // Array of note objects with x, y, instrument properties
  tempo: number  // Tempo value (default: 120)
}
```

Messages are wrapped in the Devvit message format:

```javascript
{
  type: 'devvit-message',
  data: {
    message: {
      type: 'save',
      payload: {
        notes: [...],
        tempo: 120
      }
    }
  }
}
```

## Features

- Interactive grid for placing and removing notes
- Control panel for tempo, playback, and looping
- Instrument palette for selecting different instruments
- Debug panel for monitoring state and performance
- Fallback visualization for notes
