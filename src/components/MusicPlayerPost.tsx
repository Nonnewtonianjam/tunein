import { Context, useWebView } from '@devvit/public-api';
import { WebviewToBlockMessage, BlocksToWebviewMessage } from '../types';
import { CompositionService } from '../services/compositionService';

/**
 * Component for saved music player posts
 */
export const MusicPlayerPost = (context: Context) => {
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
          
          // Load the saved composition
          const savedData = await compositionService.getSavedComposition(context.postId!);
          if (savedData) {
            console.log('Loading saved composition for playback:', savedData);
            
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
            
            // Also try sending in the standard format after a short delay
            setTimeout(() => {
              console.log('Sending in standard format as fallback');
              postMessage({
                type: 'load',
                payload: formattedData
              });
            }, 500);
          } else {
            console.error('No saved composition found for this post');
          }
          break;
          
        case 'ready':
          console.log('Music player is ready');
          
          // When ready message is received, try sending the data again
          const readySavedData = await compositionService.getSavedComposition(context.postId!);
          if (readySavedData) {
            console.log('Resending data after ready message:', readySavedData);
            
            postMessage({
              type: 'load',
              payload: {
                notes: readySavedData.notes,
                tempo: readySavedData.tempo
              }
            });
          }
          break;
          
        case 'save':
          // For player posts, we don't allow saving
          context.ui.showToast('This is a playback-only view');
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
          <text size="xlarge">🎵 Music Player</text>
          <text>Listen to this music composition!</text>
          <button
            onPress={() => {
              mount();
            }}
            appearance="primary"
          >
            Play Music
          </button>
        </vstack>
      </vstack>
    </blocks>
  );
};
