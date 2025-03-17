import { Context } from '@devvit/public-api';
import { Note, Composition, SavedComposition } from '../types';

/**
 * Service for handling composition data operations with Redis
 */
export class CompositionService {
  constructor(private context: Context) {}

  /**
   * Get a saved composition from Redis
   */
  async getSavedComposition(postId: string): Promise<Composition | null> {
    try {
      const data = await this.context.redis.get(`composition:${postId}`);
      if (!data) return null;
      
      const savedData: SavedComposition = JSON.parse(data);
      
      // Handle different data formats
      let notes: Note[] = [];
      let tempo = 120; // Default tempo
      
      // Extract notes from various possible formats
      if (Array.isArray(savedData.composition)) {
        notes = this.validateNotes(savedData.composition);
      } else if (savedData.composition && typeof savedData.composition === 'object') {
        if (Array.isArray(savedData.composition.notes)) {
          notes = this.validateNotes(savedData.composition.notes);
          
          // If tempo is in the composition object, use it
          if (typeof savedData.composition.tempo === 'number') {
            tempo = savedData.composition.tempo;
          }
        }
      }
      
      // Get tempo from the top level if available
      if (typeof savedData.tempo === 'number') {
        tempo = savedData.tempo;
      }
      
      console.log('Processed notes from Redis:', notes);
      console.log('Processed tempo from Redis:', tempo);
      
      // Return in the standard format
      return {
        notes,
        tempo,
        name: savedData.name || 'My Music Composition',
        createdAt: savedData.createdAt || new Date().toISOString(),
        originalPostId: savedData.originalPostId,
        isMusicPlayer: savedData.isMusicPlayer
      };
    } catch (error) {
      console.error('Error getting saved composition:', error);
      return null;
    }
  }

  /**
   * Save a composition to Redis
   */
  async saveComposition(
    postId: string, 
    notes: Note[], 
    tempo: number, 
    name: string = 'My Music Composition'
  ): Promise<boolean> {
    try {
      const compositionKey = `composition:${postId}`;
      await this.context.redis.set(
        compositionKey,
        JSON.stringify({
          postId,
          composition: notes,
          tempo,
          name,
          createdAt: new Date().toISOString(),
        })
      );
      return true;
    } catch (error) {
      console.error('Error saving composition:', error);
      return false;
    }
  }

  /**
   * Create a new post with the saved composition
   */
  async createMusicPlayerPost(
    notes: Note[], 
    tempo: number, 
    name: string = 'My Music Composition',
    originalPostId?: string
  ): Promise<string | null> {
    try {
      // Create a new post with the saved composition
      const subreddit = await this.context.reddit.getCurrentSubreddit();
      const post = await this.context.reddit.submitPost({
        title: `🎵 ${name}`,
        subredditName: subreddit.name,
        preview: (
          <vstack padding="medium" alignment="middle center">
            <text size="xlarge">🎵 {name}</text>
            <text>Loading your saved music sequencer...</text>
          </vstack>
        )
      });

      // Save the composition data to Redis with the new post ID as key
      await this.context.redis.set(
        `composition:${post.id}`,
        JSON.stringify({
          postId: post.id,
          composition: notes,
          tempo,
          name,
          createdAt: new Date().toISOString(),
          originalPostId: originalPostId || this.context.postId,
          isMusicPlayer: true, // Flag to identify this as a music player post
        })
      );

      return post.id;
    } catch (error) {
      console.error('Error creating music player post:', error);
      return null;
    }
  }

  private validateNotes(notes: any[]): Note[] {
    return notes.filter((note: any) => 
      note && 
      typeof note === 'object' &&
      typeof note.x === 'number' && 
      typeof note.y === 'number' && 
      typeof note.instrument === 'string'
    );
  }
}
