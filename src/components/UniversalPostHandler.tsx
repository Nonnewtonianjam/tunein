import { Context } from '@devvit/public-api';
import { CompositionService } from '../services/compositionService';
import { SequencerPost } from './SequencerPost';
import { MusicPlayerPost } from './MusicPlayerPost';
import { Devvit } from '@devvit/public-api';

/**
 * Universal post handler that determines which component to render based on stored data
 */
export const UniversalPostHandler = async (context: Context) => {
  const compositionService = new CompositionService(context);
  
  try {
    // First try loading from the new API
    const compositionData = await compositionService.loadComposition();
    
    // Check if this is a music player post
    if (compositionData && compositionData.isMusicPlayer) {
      console.log('Rendering MusicPlayerPost for player post');
      return <MusicPlayerPost context={context} />;
    }
  } catch (e) {
    console.error('Error determining post type:', e);
  }
  
  // Try the fallback method
  try {
    // Get saved composition data using the legacy method
    const savedComposition = await compositionService.load(context.postId!);
    
    // If this is a music player post (has isMusicPlayer flag), render the player
    if (savedComposition && savedComposition.isMusicPlayer) {
      console.log('Rendering MusicPlayerPost based on fallback method');
      return <MusicPlayerPost context={context} />;
    }
  } catch (e) {
    console.error('Error using fallback method:', e);
  }
  
  // Default to sequencer if we can't determine or if no player flag is set
  console.log('Defaulting to SequencerPost');
  return <SequencerPost context={context} />;
};
