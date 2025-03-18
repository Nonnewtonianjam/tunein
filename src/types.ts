export interface Instrument {
  type: string;
  x: number;
  y: number;
  duration: number;
}

export interface Note {
  x: number;
  y: number;
  instrument: string;
}

export interface Composition {
  tempo: number;
  instruments: Instrument[];
  theme?: string;
  parentPostId?: string | null;
  // Adding these properties to match what's expected in the sequencer
  notes: Note[];
  name?: string;
  createdAt?: string;
  originalPostId?: string;
  isMusicPlayer?: boolean;
}

// Simplified data structure for passing between components
export interface CompositionData {
  notes: Note[];
  tempo: number;
  maxBars?: number;
}

// Original CompositionData structure - renamed to SavedCompositionData
export interface SavedCompositionData {
  postId: string;
  composition: {
    notes: Array<{
      x: number;
      y: number;
      instrument: string;
    }>;
    tempo: number;
    maxBars: number;
  };
}

export interface Theme {
  name: string;
  description: string;
  date: string;
}

export type GridSize = 1 | 4 | 8 | 16;

export interface PlaybackState {
  isPlaying: boolean;
  currentPosition: number;
}

export interface InstrumentDefinition {
  id: string;
  name: string;
  icon: string;
  soundUrl: string;
}