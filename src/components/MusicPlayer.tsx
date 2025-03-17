import { Context } from '@devvit/public-api';

export async function handlePlayComposition(targetId: string, context: Context) {
  const compositionData = await context.redis.get(`composition:${targetId}`);
  if (compositionData) {
    await context.ui.showForm({
      title: 'Music Player',
      fields: [{
        type: 'webview',
        name: 'player',
        height: '400px',
        url: "/sequencer.html",
        onMessage: async (message: any) => {
          if (message.type === 'ready') {
            context.ui.showToast('Loading composition...');
            try {
              const data = JSON.parse(compositionData);
              
              // Ensure we have the correct format for the sequencer
              // The sequencer expects an object with notes and tempo properties
              let notes = [];
              let tempo = 120; // Default tempo
              
              // Extract notes from various possible formats
              if (Array.isArray(data.composition)) {
                notes = data.composition;
              } else if (data.composition && typeof data.composition === 'object') {
                if (Array.isArray(data.composition.notes)) {
                  notes = data.composition.notes;
                  
                  // If tempo is in the composition object, use it
                  if (typeof data.composition.tempo === 'number') {
                    tempo = data.composition.tempo;
                  }
                }
              }
              
              // Get tempo from the top level if available
              if (typeof data.tempo === 'number') {
                tempo = data.tempo;
              }
              
              // Format the data correctly for the sequencer
              const formattedData = {
                notes: notes,
                tempo: tempo
              };
              
              console.log('Sending formatted data to player:', formattedData);
              
              context.ui.sendMessage({
                type: 'load',
                data: formattedData
              });
            } catch (error) {
              console.error('Failed to load composition:', error);
              context.ui.showToast('Failed to load composition');
            }
          }
        }
      }]
    });
  } else {
    context.ui.showToast('No composition found');
  }
}