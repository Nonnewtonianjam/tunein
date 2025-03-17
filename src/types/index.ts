// Export all types from a central location
export * from './messages';
export * from './composition';

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
