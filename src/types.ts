export interface Instrument {
  type: string;
  x: number;
  y: number;
  duration: number;
}

export interface Composition {
  tempo: number;
  instruments: Instrument[];
  theme: string;
  parentPostId: string | null;
}

export interface CompositionData {
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