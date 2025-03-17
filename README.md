# Reddit MIDI Sequencer

A Reddit-integrated MIDI sequencer built with Devvit, allowing users to compose and share music directly within Reddit posts. Inspired by the Mario Paint music sequencer, this app provides an intuitive interface for creating short musical pieces.

## Features

### 🎼 Webview-Based MIDI Sequencer
- Drag-and-drop interface for placing instruments
- Multiple instrument types (piano, drums, synth, bass)
- Adjustable tempo and note duration
- Grid sizes from 1 to 16 bars
- Real-time playback using Tone.js

### 📅 Daily Themes & Voting
- New randomized theme each day
- Upvote your favorite compositions
- Daily leaderboard of top tracks
- Themed composition challenges

### 🔄 Remix System
- Build upon existing compositions
- Track remix chains through parentPostId
- Create variations of popular tracks

### 🗄️ Data Storage
- Redis-based storage for compositions
- Efficient data structure for musical data
- Theme persistence and management

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Grid.tsx
│   │   ├── Controls.tsx
│   │   ├── InstrumentPalette.tsx
│   │   └── Sequencer.tsx
│   ├── types.ts
│   └── main.tsx
├── public/
│   └── sequencer.html
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the BSD-3-Clause License. 