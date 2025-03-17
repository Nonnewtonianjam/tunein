import { Context, Devvit } from '@devvit/public-api';
import { Theme } from '../types';
import { Note } from '../types/composition';

interface CompositionData {
  postId: string;
  notes: Note[];
  tempo: number;
  name: string;
  createdAt: string;
}

export async function MusicComposition(context: Context) {
  const postId = context.postId;
  if (!postId) return null;

  // Get today's theme
  const today = new Date().toISOString().split('T')[0];
  const themeData = await context.redis.get(`theme:${today}`);
  const theme: Theme | null = themeData ? JSON.parse(themeData) : null;

  const openSequencer = async () => {
    try {
      await context.ui.showForm({
        type: 'webview',
        url: '/sequencer.html',
        height: '600px',
        onMessage: async (message: any) => {
          if (message?.type === 'save' && message?.data) {
            try {
              console.log('Received save message:', message);
              
              // Extract notes and tempo from the message
              let notes: Note[] = [];
              let tempo = 120; // Default tempo
              
              // The data could be an array of notes directly or an object with notes property
              if (Array.isArray(message.data)) {
                notes = message.data;
              } else if (message.data && typeof message.data === 'object' && Array.isArray(message.data.notes)) {
                notes = message.data.notes;
                
                // If tempo is in the data object, use it
                if (typeof message.data.tempo === 'number') {
                  tempo = message.data.tempo;
                }
              }
              
              // Get tempo from the message or use the one from data object
              if (typeof message.tempo === 'number') {
                tempo = message.tempo;
              }
              
              const composition: CompositionData = {
                postId,
                notes,
                tempo,
                name: theme?.name || 'My Music Composition',
                createdAt: new Date().toISOString()
              };
              
              console.log('Saving composition:', composition);
              
              await context.redis.set(
                `composition:${postId}`,
                JSON.stringify(composition)
              );
              context.ui.showToast('Composition saved successfully!');
            } catch (error) {
              console.error('Failed to save composition:', error);
              context.ui.showToast('Failed to save composition');
            }
          }
        }
      });
    } catch (error) {
      context.ui.showToast('Failed to open sequencer');
    }
  };

  return (
    <vstack gap="medium" padding="medium">
      {theme && (
        <vstack gap="small">
          <text size="xlarge" weight="bold">🎵 Today's Theme: {theme.name}</text>
          <text>{theme.description}</text>
        </vstack>
      )}
      
      <button 
        onPress={openSequencer}
        appearance="primary"
      >
        Create Music
      </button>
    </vstack>
  );
}