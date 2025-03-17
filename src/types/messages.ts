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
      data: any;
    };
