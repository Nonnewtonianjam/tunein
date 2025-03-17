import { Devvit } from '@devvit/public-api';
import { GridSize } from '../types';

interface ControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onSave: () => void;
  onGridSizeChange: (size: GridSize) => void;
}

export function Controls({
  tempo,
  onTempoChange,
  isPlaying,
  onPlay,
  onSave,
  onGridSizeChange
}: ControlsProps) {
  return (
    <hstack gap="medium" alignment="center">
      <button
        onPress={onPlay}
        appearance={isPlaying ? 'destructive' : 'primary'}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      <vstack gap="small" alignment="center">
        <text>Tempo: {tempo} BPM</text>
        <hstack gap="small">
          <button
            onPress={() => onTempoChange(Math.max(60, tempo - 5))}
            appearance="secondary"
          >
            -
          </button>
          <button
            onPress={() => onTempoChange(Math.min(200, tempo + 5))}
            appearance="secondary"
          >
            +
          </button>
        </hstack>
      </vstack>

      <vstack gap="small" alignment="center">
        <text>Grid Size: {tempo} bars</text>
        <hstack gap="small">
          <button
            onPress={() => {
              const sizes: GridSize[] = [1, 4, 8, 16];
              const currentIndex = sizes.indexOf(tempo as GridSize);
              if (currentIndex > 0) {
                onGridSizeChange(sizes[currentIndex - 1]);
              }
            }}
            appearance="secondary"
          >
            -
          </button>
          <button
            onPress={() => {
              const sizes: GridSize[] = [1, 4, 8, 16];
              const currentIndex = sizes.indexOf(tempo as GridSize);
              if (currentIndex < sizes.length - 1) {
                onGridSizeChange(sizes[currentIndex + 1]);
              }
            }}
            appearance="secondary"
          >
            +
          </button>
        </hstack>
      </vstack>

      <button
        onPress={onSave}
        appearance="primary"
      >
        Save
      </button>
    </hstack>
  );
} 