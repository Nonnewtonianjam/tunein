export interface Note {
  x: number;
  y: number;
  instrument: string;
  isSharp?: boolean;
  isFlat?: boolean;
}

export type GridSize = 1 | 4 | 8 | 16;

export interface Instrument {
  name: string;
  soundFile: string;
  icon: string;
}

export interface GridCell {
  x: number;
  y: number;
  note: Note | null;
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface SequencerState {
  notes: Note[];
  tempo: number;
  isPlaying: boolean;
  currentBeat: number;
  maxBars: number;
  selectedInstrument: string | null;
  isShiftPressed: boolean;
  isCtrlPressed: boolean;
  timeSignature: TimeSignature;
  beatsPerMeasure: number;
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
}

export interface SequencerProps {
  onSave?: (composition: { notes: Note[], tempo: number }) => void;
  initialNotes?: Note[];
  initialTempo?: number;
  maxBars?: number;
}

export interface UseSequencerPlaybackProps {
  notes: Note[];
  tempo: number;
  isPlaying: boolean;
  maxBars: number;
  onBeatChange: (beat: number) => void;
  beatsPerMeasure: number;
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
}