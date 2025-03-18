import { useEffect, useRef } from 'react';

/**
 * @typedef {Object} UseSequencerPlaybackProps
 * @property {Array} notes - Array of notes
 * @property {number} tempo - Tempo in BPM
 * @property {boolean} isPlaying - Is the sequencer currently playing
 * @property {number} maxBars - Maximum number of bars
 * @property {function} onBeatChange - Callback for beat changes
 * @property {number} beatsPerMeasure - Number of beats per measure
 * @property {boolean} isLooping - Is looping enabled
 * @property {number} loopStart - Loop start beat
 * @property {number} loopEnd - Loop end beat
 */

/**
 * Hook for handling sequencer playback
 * @param {UseSequencerPlaybackProps} props
 */
export function useSequencerPlayback({
  notes,
  tempo,
  isPlaying,
  maxBars,
  onBeatChange,
  beatsPerMeasure,
  isLooping,
  loopStart,
  loopEnd,
}) {
  const intervalRef = useRef(null);
  const currentBeatRef = useRef(0);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Handle changes to isPlaying
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // If the sequencer is playing, start the interval
    if (isPlaying) {
      const beatDuration = 60000 / tempo; // in milliseconds
      
      // Set up the interval
      intervalRef.current = setInterval(() => {
        // Get the current beat
        let nextBeat = currentBeatRef.current + 1;
        
        // If looping is enabled and we've reached the end of the loop,
        // go back to the loop start
        if (isLooping && nextBeat >= loopEnd) {
          nextBeat = loopStart;
        }
        // If we've reached the end of the sequence, go back to the beginning
        else if (nextBeat >= maxBars) {
          nextBeat = 0;
        }
        
        // Update the current beat
        currentBeatRef.current = nextBeat;
        
        // Call the beat change callback
        onBeatChange(nextBeat);
        
        // Play the notes at the current beat
        playNotesAtBeat(nextBeat);
      }, beatDuration);
      
      // Start playing immediately
      playNotesAtBeat(currentBeatRef.current);
    }
  }, [isPlaying, tempo, loopStart, loopEnd, isLooping, maxBars, onBeatChange]);
  
  // Function to play notes at the current beat
  const playNotesAtBeat = (beat) => {
    // For now, just log that we would play notes
    // In a full implementation, you would load and play audio files
    console.log(`Playing notes at beat ${beat}`);
    
    // Find notes at the current beat
    const notesToPlay = notes.filter(note => note.x === beat);
    
    if (notesToPlay.length > 0) {
      console.log('Notes to play:', notesToPlay);
    }
  };
}
