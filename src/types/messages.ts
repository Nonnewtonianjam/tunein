// Define message types for communication between Devvit and WebView

// Define the Note type for clarity
export interface Note {
  x: number;
  y: number;
  instrument: string;
}

// Define the composition data structure
export interface CompositionData {
  notes: Note[];
  tempo: number;
}

export type WebviewToBlockMessage = 
  | { type: 'INIT' }
  | {
      type: 'save';
      data: CompositionData;
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
      payload: CompositionData;
    };
