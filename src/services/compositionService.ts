import { Context } from '@devvit/public-api';
import { Note, Composition, SavedCompositionData, CompositionData } from '../types';

/**
 * Service for handling composition data operations with Redis
 */
export class CompositionService {
  private static readonly COMPOSITION_KEY = 'composition';

  constructor(private context: Context) {}

  /**
   * Loads a composition from storage
   */
  async load(postId: string): Promise<Composition | null> {
    try {
      const savedComposition = await this.context.kvStore.get<SavedCompositionData>(postId);
      if (!savedComposition) return null;

      const composition: Composition = {
        tempo: savedComposition.composition?.tempo || 120,
        instruments: [],
        notes: savedComposition.composition?.notes || []
      };

      return composition;
    } catch (e) {
      console.error('Error loading composition:', e);
      return null;
    }
  }

  /**
   * Saves a composition to storage
   */
  async save(postId: string, composition: Composition): Promise<boolean> {
    try {
      const savedComposition: SavedCompositionData = {
        postId,
        composition: {
          notes: composition.notes,
          tempo: composition.tempo,
          maxBars: 4 // Default maxBars
        }
      };

      await this.context.kvStore.put(postId, savedComposition);
      return true;
    } catch (e) {
      console.error('Error saving composition:', e);
      return false;
    }
  }

  /**
   * Loads a composition from storage and returns it
   */
  async loadComposition(): Promise<CompositionData | null> {
    try {
      // Add extensive logging during load
      console.log('Loading composition...');
      
      const data = await this.context.kvStore.get<CompositionData>(CompositionService.COMPOSITION_KEY);
      
      // Validate the composition data
      if (data) {
        console.log('Loaded composition from KV store:', data);
        
        // Make sure notes is present and valid
        if (!data.notes || !Array.isArray(data.notes)) {
          console.warn('Invalid composition data: notes array missing or invalid');
          return this.createDefaultComposition();
        }
        
        // Validate each note in the array
        const validNotes = data.notes.filter((note: Note) => 
          note && 
          typeof note === 'object' &&
          typeof note.x === 'number' && 
          typeof note.y === 'number' && 
          typeof note.instrument === 'string'
        );
        
        if (validNotes.length !== data.notes.length) {
          console.warn(`Filtered out ${data.notes.length - validNotes.length} invalid notes`);
          
          // Update data to only include valid notes
          data.notes = validNotes;
        }
        
        // Deep clone to ensure we're not passing references
        const safeData = JSON.parse(JSON.stringify(data)) as CompositionData;
        console.log('Returning validated composition data:', safeData);
        return safeData;
      }
      
      console.log('No composition found, creating default');
      return this.createDefaultComposition();
    } catch (e) {
      console.error('Error loading composition:', e);
      return this.createDefaultComposition();
    }
  }

  /**
   * Creates a default composition with a simple melody
   */
  private createDefaultComposition(): CompositionData {
    console.log('Creating default composition');
    
    // Create a default composition with a simple melody
    const defaultComposition: CompositionData = {
      notes: [
        { x: 0, y: 3, instrument: 'piano' },
        { x: 2, y: 2, instrument: 'piano' },
        { x: 4, y: 1, instrument: 'piano' },
        { x: 6, y: 2, instrument: 'piano' },
        { x: 8, y: 3, instrument: 'piano' },
        { x: 10, y: 3, instrument: 'piano' },
        { x: 12, y: 3, instrument: 'piano' }
      ],
      tempo: 120
    };
    
    console.log('Created default composition:', defaultComposition);
    return defaultComposition;
  }

  private validateNotes(notes: any[]): Note[] {
    return notes.filter((note: any) => 
      note && 
      typeof note.x === 'number' && 
      typeof note.y === 'number' && 
      typeof note.instrument === 'string'
    );
  }
}
