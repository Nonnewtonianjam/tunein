// Define composition data types

export interface Note {
  x: number;
  y: number;
  instrument: string;
  isSharp?: boolean;
  isFlat?: boolean;
}

export interface Composition {
  notes: Note[];
  tempo: number;
  maxBars?: number;
  name?: string;
  createdAt?: string;
  originalPostId?: string;
  isMusicPlayer?: boolean;
}

export interface SavedComposition {
  postId: string;
  composition: Note[] | Composition;
  tempo?: number;
  name?: string;
  createdAt?: string;
  originalPostId?: string;
  isMusicPlayer?: boolean;
}
