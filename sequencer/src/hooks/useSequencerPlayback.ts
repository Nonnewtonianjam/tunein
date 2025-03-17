import { useEffect, useRef } from 'react';
import { UseSequencerPlaybackProps } from '../types';
import { soundManager } from '../utils/SoundManager';

export function useSequencerPlayback({
  notes,
  tempo,
  isPlaying,
  maxBars,
  onBeatChange,
  isLooping,
  loopStart,
  loopEnd,
}: UseSequencerPlaybackProps) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = 60000 / tempo; // Convert BPM to milliseconds
      let currentBeat = loopStart;

      const playBeat = () => {
        // Play all notes at the current beat
        notes
          .filter(note => note.x === currentBeat)
          .forEach(note => {
            soundManager.playSound(note.instrument, note.y);
          });

        // Update beat counter
        currentBeat++;
        
        // Handle looping
        if (isLooping && currentBeat >= loopEnd) {
          currentBeat = loopStart;
        } else if (!isLooping && currentBeat >= maxBars) {
          currentBeat = 0;
        }

        onBeatChange(currentBeat);
      };

      intervalRef.current = window.setInterval(playBeat, interval);

      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }
      };
    }
  }, [notes, tempo, isPlaying, maxBars, onBeatChange, isLooping, loopStart, loopEnd]);

  // Clear interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);
}