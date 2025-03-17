import { Context } from '@devvit/public-api';
import { CompositionService } from '../services/compositionService';
import { SequencerPost } from './SequencerPost';
import { MusicPlayerPost } from './MusicPlayerPost';
import { Devvit } from '@devvit/public-api';

/**
 * Universal post handler that determines which component to render based on Redis data
 */
export const UniversalPostHandler = async (context: Context) => {
  const compositionService = new CompositionService(context);
  
  // Get saved composition data to determine post type
  const savedData = await compositionService.getSavedComposition(context.postId!);
  
  // If this is a music player post (has isMusicPlayer flag), render the player
  if (savedData && savedData.isMusicPlayer) {
    return <MusicPlayerPost context={context} />;
  }
  
  // Otherwise, render the sequencer
  return <SequencerPost context={context} />;
};
