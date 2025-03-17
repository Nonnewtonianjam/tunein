import { Context, useWebView } from '@devvit/public-api';
import { WebviewToBlockMessage, BlocksToWebviewMessage } from '../types';
import { CompositionService } from '../services/compositionService';

/**
 * Main sequencer post component
 */
export const SequencerPost = (context: Context) => {
  const compositionService = new CompositionService(context);

  const { mount } = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
    url: 'sequencer.html',
    onMessage: async (event, { postMessage }) => {
      console.log('Received message from webview:', event);
      const msg = event as WebviewToBlockMessage;

      switch (msg.type) {
        case 'INIT':
          console.log('Received INIT message, sending INIT_RESPONSE');
          postMessage({
            type: 'INIT_RESPONSE',
            payload: {
              postId: context.postId!,
            },
          });
          
          // If we have saved data, load it
          const savedData = await compositionService.getSavedComposition(context.postId!);
          if (savedData) {
            console.log('Loading saved composition:', savedData);
            
            // Format the data correctly for the sequencer
            const formattedData = {
              notes: savedData.notes,
              tempo: savedData.tempo
            };
            
            console.log('Sending formatted data to sequencer:', formattedData);
            
            // Send in Devvit format
            postMessage({
              type: 'devvit-message',
              data: {
                message: {
                  type: 'load',
                  payload: formattedData
                }
              }
            });
          } else {
            console.log('No saved composition found, sending empty data');
            // Send empty data to initialize the sequencer in Devvit format
            postMessage({
              type: 'devvit-message',
              data: {
                message: {
                  type: 'load',
                  payload: {
                    notes: [],
                    tempo: 120
                  }
                }
              }
            });
          }
          break;
          
        case 'ready':
          console.log('Sequencer is ready');
          break;
          
        case 'save':
          try {
            console.log('Saving composition:', msg);
            
            // Handle different data formats
            let notes = [];
            let tempo = 120; // Default tempo
            
            // Check if this is a Devvit-wrapped message
            if (msg.type === 'devvit-message' && msg.data && msg.data.message) {
              console.log('Processing Devvit-wrapped save message format');
              const devvitMsg = msg.data.message;
              if (devvitMsg.type === 'save') {
                console.log('Processing standard save message format');
                
                // The data could be an array of notes directly or an object with notes property
                if (Array.isArray(devvitMsg.payload)) {
                  notes = devvitMsg.payload;
                } else if (devvitMsg.payload && typeof devvitMsg.payload === 'object' && Array.isArray(devvitMsg.payload.notes)) {
                  notes = devvitMsg.payload.notes;
                  
                  // If tempo is in the data object, use it
                  if (typeof devvitMsg.payload.tempo === 'number') {
                    tempo = devvitMsg.payload.tempo;
                  }
                }
                
                // Get tempo from the message or use the one from data object
                if (typeof (devvitMsg as any).tempo === 'number') {
                  tempo = (devvitMsg as any).tempo;
                }
              }
            } else if (msg.type === 'save' && msg.data) {
              console.log('Processing standard save message format');
              
              // The data could be an array of notes directly or an object with notes property
              if (Array.isArray(msg.data)) {
                notes = msg.data;
              } else if (msg.data && typeof msg.data === 'object' && Array.isArray(msg.data.notes)) {
                notes = msg.data.notes;
                
                // If tempo is in the data object, use it
                if (typeof msg.data.tempo === 'number') {
                  tempo = msg.data.tempo;
                }
              }
              
              // Get tempo from the message or use the one from data object
              if (typeof (msg as any).tempo === 'number') {
                tempo = (msg as any).tempo;
              }
            }
            
            console.log('Processed notes for saving:', notes);
            console.log('Processed tempo for saving:', tempo);
            
            // Save the composition
            const saved = await compositionService.saveComposition(
              context.postId!,
              notes,
              tempo
            );
            
            if (saved) {
              // Create a new post with the saved composition
              const newPostId = await compositionService.createMusicPlayerPost(
                notes,
                tempo,
                'My Music Composition',
                context.postId
              );
              
              if (newPostId) {
                context.ui.showToast('Composition saved and shared!');
                
                // Navigate to the new post
                const post = await context.reddit.getPostById(newPostId);
                if (post) {
                  context.ui.navigateTo(post.url);
                }
              } else {
                context.ui.showToast('Composition saved but sharing failed');
              }
            } else {
              context.ui.showToast('Failed to save composition');
            }
          } catch (error) {
            console.error('Error saving composition:', error);
            context.ui.showToast('Failed to save composition');
          }
          break;
          
        default:
          console.error('Unknown message type', msg);
          break;
      }
    },
  });

  return (
    <blocks height="tall">
      <vstack height="100%" width="100%" alignment="center middle">
        <vstack grow padding="small" alignment="middle center">
          <text size="xlarge">🎵 Music Sequencer</text>
          <text>Create and play music right in Reddit!</text>
          <button
            onPress={() => {
              mount();
            }}
            appearance="primary"
          >
            Create Music
          </button>
        </vstack>
      </vstack>
    </blocks>
  );
};
