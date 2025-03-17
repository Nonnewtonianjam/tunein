// React is needed for JSX
/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sequencer } from '../components/Sequencer';
import { Note } from '../types';

// Mock the SoundManager to avoid actual sound playback during tests
jest.mock('../utils/SoundManager', () => ({
  soundManager: {
    playSound: jest.fn(),
  },
}));

describe('Sequencer Component', () => {
  // Test data that mimics what we receive from Devvit
  const testNotes: Note[] = [
    { x: 1, y: 2, instrument: 'mario' },
    { x: 2, y: 6, instrument: 'mario' },
    { x: 4, y: 3, instrument: 'mario' },
    { x: 5, y: 6, instrument: 'mario' },
    { x: 7, y: 9, instrument: 'mario' },
    { x: 4, y: 8, instrument: 'mario' }
  ];
  
  const testTempo = 120;

  // Mock the onSave callback
  const mockOnSave = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should initialize with provided notes and tempo', () => {
    // Render the Sequencer with our test data
    render(
      <Sequencer 
        initialNotes={testNotes} 
        initialTempo={testTempo} 
        onSave={mockOnSave}
      />
    );

    // Since the grid is rendered on a canvas, we can't directly query for notes
    // Instead, we'll check if the component renders without errors
    expect(screen.getByTestId('sequencer')).toBeInTheDocument();
    
    // We can also check if the tempo display shows the correct value
    expect(screen.getByTestId('tempo-display')).toHaveTextContent('120');
  });

  test('should update state when initialNotes change', async () => {
    // Create a container to hold our component
    const { rerender } = render(
      <Sequencer 
        initialNotes={[]} 
        initialTempo={testTempo} 
        onSave={mockOnSave}
      />
    );

    // Initially, there should be no notes
    const initialSequencerState = JSON.parse(screen.getByTestId('sequencer-state').textContent || '{}');
    expect(initialSequencerState.notes).toHaveLength(0);

    // Now rerender with our test notes
    rerender(
      <Sequencer 
        initialNotes={testNotes} 
        initialTempo={testTempo} 
        onSave={mockOnSave}
      />
    );

    // Wait for state updates to propagate
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check if the state was updated with our test notes
    const updatedSequencerState = JSON.parse(screen.getByTestId('sequencer-state').textContent || '{}');
    expect(updatedSequencerState.notes).toHaveLength(testNotes.length);
    expect(updatedSequencerState.notes).toEqual(expect.arrayContaining(testNotes));
  });

  test('should correctly handle the Devvit data format', async () => {
    // This is the exact format we receive from Devvit
    const devvitData = {
      notes: [
        { x: 1, y: 2, instrument: 'mario' },
        { x: 2, y: 6, instrument: 'mario' },
        { x: 4, y: 3, instrument: 'mario' },
        { x: 5, y: 6, instrument: 'mario' },
        { x: 7, y: 9, instrument: 'mario' },
        { x: 4, y: 8, instrument: 'mario' }
      ],
      tempo: 120
    };

    // Render the Sequencer with our Devvit data
    render(
      <Sequencer 
        initialNotes={devvitData.notes} 
        initialTempo={devvitData.tempo} 
        onSave={mockOnSave}
      />
    );

    // Wait for state updates to propagate
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check if the state was updated with our Devvit data
    const sequencerState = JSON.parse(screen.getByTestId('sequencer-state').textContent || '{}');
    expect(sequencerState.notes).toHaveLength(devvitData.notes.length);
    expect(sequencerState.tempo).toBe(devvitData.tempo);
    
    // Verify each note was correctly added to the state
    devvitData.notes.forEach(note => {
      expect(sequencerState.notes).toContainEqual(expect.objectContaining({
        x: note.x,
        y: note.y,
        instrument: note.instrument
      }));
    });
  });
});
