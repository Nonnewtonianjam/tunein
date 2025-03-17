import { useState, useEffect, useCallback } from 'react';
import { Composition, GridSize, Instrument, PlaybackState } from '../types';
import { InstrumentPalette } from './InstrumentPalette';
import { Grid } from './Grid';
import { Controls } from './Controls';

interface SequencerProps {
  initialComposition?: Composition;
  onSave: (composition: Composition) => void;
}

export function Sequencer({ initialComposition, onSave }: SequencerProps) {
  const [composition, setComposition] = useState<Composition>(initialComposition || {
    tempo: 120,
    instruments: [],
    theme: '',
    parentPostId: null,
  });

  const [gridSize, setGridSize] = useState<GridSize>(16);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentPosition: 0,
  });

  const handleInstrumentDrop = useCallback((instrument: Instrument) => {
    setComposition(prev => ({
      ...prev,
      instruments: [...prev.instruments, instrument],
    }));
  }, []);

  const handleTempoChange = useCallback((newTempo: number) => {
    setComposition(prev => ({
      ...prev,
      tempo: newTempo,
    }));
  }, []);

  const handlePlay = useCallback(() => {
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(composition);
  }, [composition, onSave]);

  useEffect(() => {
    if (playbackState.isPlaying) {
      // TODO: Implement playback logic
    }
  }, [playbackState.isPlaying, composition]);

  return (
    <div className="sequencer">
      <InstrumentPalette onDrop={handleInstrumentDrop} />
      <Grid 
        size={gridSize}
        instruments={composition.instruments}
        playbackPosition={playbackState.currentPosition}
      />
      <Controls
        tempo={composition.tempo}
        onTempoChange={handleTempoChange}
        isPlaying={playbackState.isPlaying}
        onPlay={handlePlay}
        onSave={handleSave}
        onGridSizeChange={setGridSize}
      />
    </div>
  );
} 