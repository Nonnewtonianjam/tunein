class SoundManager {
  private audioContext: AudioContext;
  private buffers: Map<string, AudioBuffer>;
  private loadPromises: Map<string, Promise<void>>;

  constructor() {
    this.audioContext = new AudioContext();
    this.buffers = new Map();
    this.loadPromises = new Map();

    // Preload available sounds
    this.loadSound('mario', '/assets/sounds/sound01.wav');
    this.loadSound('coin', '/assets/sounds/sound02.wav');
    this.loadSound('mushroom', '/assets/sounds/sound03.wav');
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (this.buffers.has(name) || this.loadPromises.has(name)) {
      return;
    }

    const loadPromise = fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.buffers.set(name, audioBuffer);
        this.loadPromises.delete(name);
      })
      .catch(error => {
        console.warn(`Failed to load sound "${name}":`, error);
        this.loadPromises.delete(name);
      });

    this.loadPromises.set(name, loadPromise);
    await loadPromise;
  }

  playSound(name: string, notePosition?: number): void {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      console.warn(`Sound "${name}" not loaded`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Apply pitch shift based on note position
    if (typeof notePosition === 'number') {
      // Map the note position (0-12) to a pitch multiplier
      // C5 (position 0) to C4 (position 12)
      // Each semitone is a multiplication by 2^(1/12)
      const semitones = notePosition; // Higher position = lower pitch
      const pitchMultiplier = Math.pow(2, -semitones / 12);
      source.playbackRate.value = pitchMultiplier;
    }

    source.connect(this.audioContext.destination);
    source.start(0);
  }

  get context(): AudioContext {
    return this.audioContext;
  }
}

export const soundManager = new SoundManager(); 