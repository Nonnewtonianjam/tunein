import { Context, useWebView } from '@devvit/public-api';
import { WebviewToBlockMessage, BlocksToWebviewMessage } from '../types';
import { CompositionService } from '../services/compositionService';
import { useEffect } from 'react';

/**
 * Main sequencer post component
 */
export const SequencerPost = (context: Context) => {
  const compositionService = new CompositionService(context);

  useEffect(() => {
    // Log when component mounts
    console.log('SequencerPost mounted, ready for messages');
    
    // Set up debugging listeners if in browser environment
    if (typeof globalThis !== 'undefined') {
      try {
        // Debug logging
        (globalThis as any).addEventListener?.('devvit-storage-update', (event: any) => {
          console.log('Devvit storage update:', event);
        });
        
        // Debug logging for any errors
        (globalThis as any).addEventListener?.('error', (event: any) => {
          console.error('Global error caught in SequencerPost:', event.error);
        });
      } catch (e) {
        console.error('Error setting up debug listeners:', e);
      }
    }
  }, []);

  const { mount } = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
    url: 'sequencer.html',
    onMessage: async (event, { postMessage }) => {
      console.log('Received message from webview:', event);
      const msg = event as WebviewToBlockMessage;

      // Function to process and format data to be sent to the sequencer
      const processAndSendData = (data: any) => {
        console.log('Processing and sending composition data to sequencer:', data);
        
        try {
          // Ensure notes is an array
          const notes = Array.isArray(data.notes) ? data.notes : [];
          
          // Validate that notes have the required properties
          const validNotes = notes.filter((note: any) => 
            note && 
            typeof note === 'object' && 
            typeof note.x === 'number' && 
            typeof note.y === 'number' && 
            typeof note.instrument === 'string'
          );
          
          if (validNotes.length !== notes.length) {
            console.warn(`Filtered out ${notes.length - validNotes.length} invalid notes`);
          }
          
          // Create a formatted payload that matches the expected format
          const formattedData = {
            notes: validNotes,
            tempo: typeof data.tempo === 'number' ? data.tempo : 120
          };
          
          console.log('Formatted data to send to sequencer:', formattedData);
          
          // Send the data in multiple formats to ensure it's received
          
          // Format 1: Direct message
          postMessage(formattedData);
          
          // Format 2: Wrapped in type
          postMessage({
            type: 'load',
            payload: formattedData
          });
          
          // Format 3: Wrapped in devvit-message format
          postMessage({
            type: 'devvit-message',
            data: {
              message: {
                type: 'load',
                payload: formattedData
              }
            }
          });
          
          // Format 4: Use custom event for direct DOM access
          // This bypasses potential React re-rendering issues
          if (postMessage) {
            const appMessageEvent = new CustomEvent('app-message', {
              detail: {
                type: 'load',
                payload: formattedData
              }
            });
            
            // Dispatch the event to the sequencer's window
            postMessage(appMessageEvent);
            console.log('Dispatched app-message event to sequencer');
          }
          
          return true;
        } catch (e) {
          console.error('Error processing and sending data to sequencer:', e);
          return false;
        }
      };

      switch (msg.type) {
        case 'INIT':
          console.log('Received INIT message, sending INIT_RESPONSE');
          // Send response in multiple formats to ensure it's received
          postMessage({
            type: 'INIT_RESPONSE',
            payload: {
              postId: context.postId!,
            },
          });
          
          // Try to load composition data
          try {
            console.log('Loading composition data for post:', context.postId);
            
            // First try loading from new API
            let compositionData = await compositionService.loadComposition();
            
            // If that fails, try loading from the old method (compatibility)
            if (!compositionData) {
              console.log('Using fallback load method');
              const savedComposition = await compositionService.load(context.postId!);
              
              if (savedComposition) {
                console.log('Loaded composition with fallback method:', savedComposition);
                compositionData = {
                  notes: savedComposition.notes,
                  tempo: savedComposition.tempo
                };
              }
            }
            
            if (compositionData && compositionData.notes) {
              console.log('Sending loaded composition to sequencer:', compositionData);
              processAndSendData(compositionData);
            } else {
              console.log('No saved composition found, sending empty data');
              
              // Send empty data to initialize the sequencer in multiple formats
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
              
              // Also send in simpler format with a delay
              setTimeout(() => {
                console.log('Sending empty data in standard format as backup');
                postMessage({
                  type: 'load',
                  payload: {
                    notes: [],
                    tempo: 120
                  }
                });
              }, 300);
              
              // Send additional format as another backup
              setTimeout(() => {
                console.log('Sending empty data in alternate format as another backup');
                postMessage({
                  type: 'load',
                  data: {
                    notes: [],
                    tempo: 120
                  }
                });
              }, 600);
            }
          } catch (e) {
            console.error('Error loading composition:', e);
            
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
          console.log('Sequencer is ready, resending data');
          
          // When we get a ready message, try sending the data again
          try {
            const readyCompositionData = await compositionService.loadComposition();
            
            if (readyCompositionData && readyCompositionData.notes) {
              console.log('Resending data after ready message:', readyCompositionData);
              
              // Send in multiple formats
              processAndSendData(readyCompositionData);
            } else {
              // Try fallback method
              const fallbackComposition = await compositionService.load(context.postId!);
              
              if (fallbackComposition) {
                const formattedData = {
                  notes: fallbackComposition.notes,
                  tempo: fallbackComposition.tempo
                };
                
                console.log('Resending data after ready message (fallback):', formattedData);
                processAndSendData(formattedData);
              } else {
                console.log('No data to resend after ready message');
              }
            }
          } catch (e) {
            console.error('Error resending data after ready message:', e);
          }
          break;
          
        case 'heartbeat':
          console.log('Received heartbeat from sequencer');
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
            
            // Create composition object with the extracted data
            const composition = {
              notes,
              tempo,
              instruments: [],   // Required field by Composition interface
              theme: 'default'   // Required field by Composition interface
            };
            
            // Save the composition with the updated API
            const saved = await compositionService.save(context.postId!, composition);
            
            if (saved) {
              context.ui.showToast('Composition saved successfully!');
              
              // Send confirmation back to the sequencer
              postMessage({
                type: 'devvit-message',
                data: {
                  message: {
                    type: 'saveSuccess',
                    postId: context.postId
                  }
                }
              });
            } else {
              context.ui.showToast('Failed to save composition');
            }
          } catch (error) {
            console.error('Error saving composition:', error);
            context.ui.showToast('Failed to save composition');
          }
          break;
          
        case 'notesCheck':
        case 'notesLoaded':
        case 'notesForceUpdated':
        case 'testNotesAdded':
          console.log(`Received ${msg.type} message:`, msg);
          break;
          
        default:
          console.log('Unknown message type', msg);
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
              console.log('Mounting sequencer webview');
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
