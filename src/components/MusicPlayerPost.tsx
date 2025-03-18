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
      console.log('MusicPlayerPost: Received message from webview:', event);
      const msg = event as WebviewToBlockMessage;

      switch (msg.type) {
        case 'INIT':
          console.log('MusicPlayerPost: Received INIT message, sending INIT_RESPONSE');
          postMessage({
            type: 'INIT_RESPONSE',
            payload: {
              postId: context.postId!,
            },
          });
          
          // Load the saved composition
          try {
            console.log('MusicPlayerPost: Attempting to load composition data');
            
            // First try loading from new API
            let compositionData = await compositionService.loadComposition();
            
            // If that fails, try the load method as fallback
            if (!compositionData) {
              console.log('MusicPlayerPost: Using fallback load method');
              const savedComposition = await compositionService.load(context.postId!);
              
              if (savedComposition) {
                console.log('MusicPlayerPost: Loaded with fallback method:', savedComposition);
                compositionData = {
                  notes: savedComposition.notes || [],
                  tempo: savedComposition.tempo || 120
                };
              }
            }
            
            if (compositionData && compositionData.notes) {
              console.log('MusicPlayerPost: Sending loaded composition to sequencer:', compositionData);
              
              // Send in Devvit format
              postMessage({
                type: 'devvit-message',
                data: {
                  message: {
                    type: 'load',
                    payload: compositionData
                  }
                }
              });
              
              // Also try sending in the standard format after a short delay
              setTimeout(() => {
                console.log('MusicPlayerPost: Sending in standard format as fallback');
                postMessage({
                  type: 'load',
                  payload: compositionData
                });
              }, 300);
              
              // Try a third format as another fallback
              setTimeout(() => {
                console.log('MusicPlayerPost: Sending in third format as another fallback');
                postMessage({
                  type: 'load',
                  data: compositionData
                });
              }, 600);
              
              // Try direct format for backup
              setTimeout(() => {
                console.log('MusicPlayerPost: Sending direct notes array as last resort');
                postMessage({
                  type: 'load',
                  notes: compositionData.notes,
                  tempo: compositionData.tempo
                });
              }, 900);
            } else {
              console.error('MusicPlayerPost: No saved composition found for this post');
              
              // Send empty data to ensure the sequencer initializes
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
          } catch (e) {
            console.error('MusicPlayerPost: Error loading composition:', e);
            
            // Send empty data as fallback
            postMessage({
              type: 'load',
              payload: {
                notes: [],
                tempo: 120
              }
            });
          }
          break;
          
        case 'ready':
          console.log('MusicPlayerPost: Music player is ready');
          
          // When ready message is received, try sending the data again
          try {
            const readyCompositionData = await compositionService.loadComposition();
            
            if (readyCompositionData && readyCompositionData.notes) {
              console.log('MusicPlayerPost: Resending data after ready message:', readyCompositionData);
              
              // Try multiple formats when resending
              postMessage({
                type: 'devvit-message',
                data: {
                  message: {
                    type: 'load',
                    payload: readyCompositionData
                  }
                }
              });
              
              setTimeout(() => {
                postMessage({
                  type: 'load',
                  payload: readyCompositionData
                });
              }, 300);
              
              setTimeout(() => {
                postMessage({
                  type: 'load',
                  data: readyCompositionData
                });
              }, 600);
            } else {
              // Try fallback method
              const fallbackComposition = await compositionService.load(context.postId!);
              
              if (fallbackComposition) {
                const formattedData = {
                  notes: fallbackComposition.notes || [],
                  tempo: fallbackComposition.tempo || 120
                };
                
                console.log('MusicPlayerPost: Resending data after ready message (fallback):', formattedData);
                
                // Try multiple formats
                postMessage({
                  type: 'devvit-message',
                  data: {
                    message: {
                      type: 'load',
                      payload: formattedData
                    }
                  }
                });
                
                setTimeout(() => {
                  postMessage({
                    type: 'load',
                    payload: formattedData
                  });
                }, 300);
                
                setTimeout(() => {
                  postMessage({
                    type: 'load',
                    data: formattedData
                  });
                }, 600);
              } else {
                console.log('MusicPlayerPost: No data to resend after ready message');
              }
            }
          } catch (e) {
            console.error('MusicPlayerPost: Error resending data after ready message:', e);
          }
          break;
          
        case 'heartbeat':
          console.log('MusicPlayerPost: Received heartbeat from sequencer');
          break;
          
        case 'notesCheck':
        case 'notesLoaded':
        case 'notesForceUpdated':
        case 'testNotesAdded':
          console.log(`MusicPlayerPost: Received ${msg.type} message:`, msg);
          break;
          
        case 'save':
          // For player posts, we don't allow saving
          context.ui.showToast('This is a playback-only view');
          break;
          
        default:
          console.log('MusicPlayerPost: Unknown message type', msg);
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
              console.log('MusicPlayerPost: Mounting sequencer webview');
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
