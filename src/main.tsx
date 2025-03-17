import { Devvit, useState, Context, useWebView } from '@devvit/public-api';

// Define message types for communication between Devvit and WebView
export type WebviewToBlockMessage = 
  | { type: 'INIT' }
  | {
      type: 'save';
      data: any;
      tempo: number;
    }
  | {
      type: 'ready';
    };

export type BlocksToWebviewMessage = 
  | {
      type: 'INIT_RESPONSE';
      payload: {
        postId: string;
      };
    }
  | {
      type: 'load';
      payload: any;
    };

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Main sequencer post component
const SequencerPost = (context: Context) => {
  const getSavedComposition = async () => {
    const data = await context.redis.get(`composition:${context.postId}`);
    return data ? JSON.parse(data) : null;
  };

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
          const savedData = await getSavedComposition();
          if (savedData) {
            console.log('Loading saved composition:', savedData);
            
            // Ensure the notes array is properly formatted
            let notes = [];
            
            // Check if we have a composition array or if the notes are directly in the data
            if (Array.isArray(savedData.composition)) {
              notes = savedData.composition;
            } else if (savedData.notes && Array.isArray(savedData.notes)) {
              notes = savedData.notes;
            } else if (Array.isArray(savedData)) {
              notes = savedData;
            }
            
            // Validate each note has the required properties
            const validNotes = notes.filter((note: { x: number; y: number; instrument: string }) => 
              note && 
              typeof note === 'object' &&
              typeof note.x === 'number' && 
              typeof note.y === 'number' && 
              typeof note.instrument === 'string'
            );
            
            console.log('Valid notes after filtering:', validNotes);
            
            // Format the data correctly for the sequencer
            // The sequencer expects an object with notes and tempo properties
            const formattedData = {
              notes: validNotes,
              tempo: savedData.tempo || 120
            };
            
            console.log('Sending formatted data to sequencer:', formattedData);
            
            postMessage({
              type: 'load',
              payload: formattedData
            });
            console.log('Message sent to WebView');
          }
          break;
        case 'ready':
          console.log('Sequencer is ready');
          break;
        case 'save':
          try {
            console.log('Saving composition:', msg.data);
            console.log('Saving tempo:', (msg as any).tempo);
            
            // Default title for the composition
            const compositionName = 'My Music Composition';
            
            // Handle different data formats
            let notes = [];
            let tempo = 120; // Default tempo
            
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
            
            console.log('Processed notes for saving:', notes);
            console.log('Processed tempo for saving:', tempo);
            
            // Save the composition data to Redis with the current post ID as key
            const compositionKey = `composition:${context.postId}`;
            await context.redis.set(
              compositionKey,
              JSON.stringify({
                postId: context.postId,
                composition: notes, // Save the notes array
                tempo: tempo, // Save tempo separately
                name: compositionName,
                createdAt: new Date().toISOString(),
              })
            );

            // Create a new post with the saved composition
            const subreddit = await context.reddit.getCurrentSubreddit();
            const post = await context.reddit.submitPost({
              title: `🎵 ${compositionName}`,
              subredditName: subreddit.name,
              preview: (
                <vstack padding="medium" alignment="middle center">
                  <text size="xlarge">🎵 {compositionName}</text>
                  <text>Loading your saved music sequencer...</text>
                </vstack>
              )
            });

            // Save the composition data to Redis with the new post ID as key
            await context.redis.set(
              `composition:${post.id}`,
              JSON.stringify({
                postId: post.id,
                composition: notes, // Save the notes array
                tempo: tempo, // Save tempo separately
                name: compositionName,
                createdAt: new Date().toISOString(),
                originalPostId: context.postId,
                isMusicPlayer: true, // Flag to identify this as a music player post
              })
            );

            context.ui.showToast('Composition saved and shared!');
            context.ui.navigateTo(post.url);
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

// Component for saved music player posts
const MusicPlayerPost = (context: Context) => {
  // State for composition data
  const [compositionData] = useState(async () => {
    const data = await context.redis.get(`composition:${context.postId}`);
    return data ? JSON.parse(data) : null;
  });

  const { mount } = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
    url: 'sequencer.html',
    onMessage: async (event, { postMessage }) => {
      console.log('Received message from player webview:', event);
      const msg = event as WebviewToBlockMessage;

      switch (msg.type) {
        case 'INIT':
          console.log('Received INIT message from player, sending INIT_RESPONSE');
          postMessage({
            type: 'INIT_RESPONSE',
            payload: {
              postId: context.postId!,
            },
          });
          
          // Also send the composition data right away
          // This helps if the 'ready' message is missed
          const initData = await context.redis.get(`composition:${context.postId}`);
          if (initData) {
            try {
              const parsedInitData = JSON.parse(initData);
              console.log('Sending composition data on INIT:', parsedInitData);
              
              // Extract notes from the composition
              let notes = [];
              if (parsedInitData.composition && Array.isArray(parsedInitData.composition)) {
                notes = parsedInitData.composition;
              } else if (parsedInitData.notes && Array.isArray(parsedInitData.notes)) {
                notes = parsedInitData.notes;
              }
              
              // Validate notes
              const validNotes = notes.filter((note: any) => 
                note && 
                typeof note === 'object' &&
                typeof note.x === 'number' && 
                typeof note.y === 'number' && 
                typeof note.instrument === 'string'
              );
              
              console.log('Valid notes for player:', validNotes);
              
              // Format data for sequencer
              const formattedInitData = {
                notes: validNotes,
                tempo: typeof parsedInitData.tempo === 'number' ? parsedInitData.tempo : 120
              };
              
              console.log('Sending formatted data to player on INIT:', formattedInitData);
              
              postMessage({
                type: 'load',
                payload: formattedInitData
              });
              console.log('Message sent to WebView on INIT');
            } catch (error) {
              console.error('Error processing composition data on INIT:', error);
            }
          }
          break;
        case 'ready':
          console.log('Music player is ready, loading saved data');
          // Load the saved composition data
          const savedData = await context.redis.get(`composition:${context.postId}`);
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              console.log('Loading saved composition into player:', parsedData);
              
              // Ensure the notes array is properly formatted
              let notes = [];
              
              // Try different possible formats
              if (parsedData.composition && Array.isArray(parsedData.composition)) {
                notes = parsedData.composition;
                console.log('Found notes in parsedData.composition:', notes);
              } else if (parsedData.notes && Array.isArray(parsedData.notes)) {
                notes = parsedData.notes;
                console.log('Found notes in parsedData.notes:', notes);
              } else if (Array.isArray(parsedData)) {
                notes = parsedData;
                console.log('parsedData is directly an array of notes:', notes);
              }
              
              // Validate each note
              const validNotes = notes.filter((note: any) => 
                note && 
                typeof note === 'object' &&
                typeof note.x === 'number' && 
                typeof note.y === 'number' && 
                typeof note.instrument === 'string'
              );
              
              console.log('Valid notes after filtering:', validNotes);
              
              // Format the data correctly for the sequencer
              const formattedData = {
                notes: validNotes,
                tempo: typeof parsedData.tempo === 'number' ? parsedData.tempo : 120
              };
              
              console.log('Sending formatted data to player:', formattedData);
              
              // Send the message
              postMessage({
                type: 'load',
                payload: formattedData
              });
              console.log('Message sent to WebView');
              
              // Also try sending with a slight delay (sometimes helps with timing issues)
              setTimeout(() => {
                console.log('Sending delayed message to player');
                postMessage({
                  type: 'load',
                  payload: formattedData
                });
                console.log('Delayed message sent to WebView');
              }, 1000);
            } catch (error) {
              console.error('Error processing composition data:', error);
            }
          } else {
            console.error('No saved composition data found for post:', context.postId);
          }
          break;
        case 'save':
          // Don't allow saving from the player view
          context.ui.showToast('This is a saved composition. Create a new sequencer to save your changes.');
          break;
        default:
          console.error('Unknown message type from player', msg);
          break;
      }
    },
  });

  return (
    <blocks height="tall">
    <vstack height="100%" width="100%" alignment="center middle">
      <vstack grow padding="small" alignment="middle center">
        <text size="xlarge">🎵 Saved Music Composition</text>
        <text>Listen to this music creation!</text>
        <button
          onPress={() => {
            mount();
          }}
          appearance="primary"
        >
          Listen to Music
        </button>
      </vstack>
    </vstack>
    </blocks>
  );
};

// Universal post handler that determines which component to render based on Redis data
const UniversalPostHandler = (context: Context) => {
  const [postType] = useState(async () => {
    const data = await context.redis.get(`composition:${context.postId}`);
    if (data) {
      const parsedData = JSON.parse(data);
      return parsedData.isMusicPlayer ? 'music_player' : 'music_sequencer';
    }
    return 'music_sequencer'; // Default to sequencer if no data found
  });

  if (postType === 'music_player') {
    return <MusicPlayerPost {...context} />;
  } else {
    return <SequencerPost {...context} />;
  }
};

// Register a single custom post type that handles both sequencer and player
Devvit.addCustomPostType({
  name: 'music_sequencer',
  description: 'Interactive music sequencer that lets you create and play music',
  height: 'tall',
  render: UniversalPostHandler
});

// Add menu item to create sequencer posts
Devvit.addMenuItem({
  location: 'subreddit',
  label: 'Create Music Sequencer',
  onPress: async (_, context) => {
    try {
      const subreddit = await context.reddit.getCurrentSubreddit();
      const post = await context.reddit.submitPost({
        title: '🎵 Music Sequencer',
        subredditName: subreddit.name,
        preview: (
          <vstack padding="medium" alignment="middle center">
            <text size="xlarge">🎵 Music Sequencer</text>
            <text>Loading your interactive music sequencer...</text>
          </vstack>
        )
      });
      
      // Initialize this as a regular sequencer post
      await context.redis.set(
        `composition:${post.id}`,
        JSON.stringify({
          postId: post.id,
          isMusicPlayer: false,
          createdAt: new Date().toISOString(),
        })
      );
      
      context.ui.showToast('Music sequencer created!');
      context.ui.navigateTo(post.url);
    } catch (error: any) {
      console.error('Failed to create sequencer:', error);
      context.ui.showToast(`Error: ${error?.message || 'Unknown error'}`);
    }
  }
});

export default Devvit;