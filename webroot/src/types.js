// Note definition
// export interface Note {
//   x: number;
//   y: number;
//   instrument: string;
//   isSharp?: boolean;
//   isFlat?: boolean;
// }

// export type GridSize = 1 | 4 | 8 | 16;

// export interface Instrument {
//   name: string;
//   soundFile: string;
//   icon: string;
// }

// export interface GridCell {
//   x: number;
//   y: number;
//   note: Note | null;
// }

// export interface TimeSignature {
//   numerator: number;
//   denominator: number;
// }

// export interface SequencerState {
//   notes: Note[];
//   tempo: number;
//   isPlaying: boolean;
//   currentBeat: number;
//   maxBars: number;
//   selectedInstrument: string | null;
//   isShiftPressed: boolean;
//   isCtrlPressed: boolean;
//   timeSignature: TimeSignature;
//   beatsPerMeasure: number;
//   isLooping: boolean;
//   loopStart: number;
//   loopEnd: number;
// }

// export interface SequencerProps {
//   onSave?: (composition: { notes: Note[], tempo: number }) => void;
//   initialNotes?: Note[];
//   initialTempo?: number;
//   maxBars?: number;
// }

// Converted to JS as comments for reference
// We'll use JSDoc for type definitions in JS

/**
 * @typedef {Object} Note
 * @property {number} x
 * @property {number} y
 * @property {string} instrument
 * @property {boolean} [isSharp]
 * @property {boolean} [isFlat]
 */

/**
 * @typedef {1|4|8|16} GridSize
 */

/**
 * @typedef {Object} Instrument
 * @property {string} name
 * @property {string} soundFile
 * @property {string} icon
 */

/**
 * @typedef {Object} GridCell
 * @property {number} x
 * @property {number} y
 * @property {Note|null} note
 */

/**
 * @typedef {Object} TimeSignature
 * @property {number} numerator
 * @property {number} denominator
 */

/**
 * @typedef {Object} SequencerState
 * @property {Note[]} notes
 * @property {number} tempo
 * @property {boolean} isPlaying
 * @property {number} currentBeat
 * @property {number} maxBars
 * @property {string|null} selectedInstrument
 * @property {boolean} isShiftPressed
 * @property {boolean} isCtrlPressed
 * @property {TimeSignature} timeSignature
 * @property {number} beatsPerMeasure
 * @property {boolean} isLooping
 * @property {number} loopStart
 * @property {number} loopEnd
 */

/**
 * @typedef {Object} SequencerProps
 * @property {function({ notes: Note[], tempo: number }): void} [onSave]
 * @property {Note[]} [initialNotes]
 * @property {number} [initialTempo]
 * @property {number} [maxBars]
 */

// Constants for the initial state
export const INITIAL_STATE = {
  notes: [],
  tempo: 120,
  isPlaying: false,
  currentBeat: 0,
  maxBars: 16,
  selectedInstrument: 'mario',
  isShiftPressed: false,
  isCtrlPressed: false,
  timeSignature: { numerator: 4, denominator: 4 },
  beatsPerMeasure: 4,
  isLooping: false,
  loopStart: 0,
  loopEnd: 16
};
