/**
 * AUDIO PLAYER UTILITY - 2 OCTAVES (C2-C3)
 * Supporta C2-B2 e C3-B3 con path assoluti
 */

// Import ottava bassa (C2-B2)
import noteC2 from '/src/assets/audio/C2.mp3';
import noteCSharp2 from '/src/assets/audio/C-sharp2.mp3';
import noteD2 from '/src/assets/audio/D2.mp3';
import noteDSharp2 from '/src/assets/audio/D-sharp2.mp3';
import noteE2 from '/src/assets/audio/E2.mp3';
import noteF2 from '/src/assets/audio/F2.mp3';
import noteFSharp2 from '/src/assets/audio/F-sharp2.mp3';
import noteG2 from '/src/assets/audio/G2.mp3';
import noteGSharp2 from '/src/assets/audio/G-sharp2.mp3';
import noteA2 from '/src/assets/audio/A2.mp3';
import noteASharp2 from '/src/assets/audio/A-sharp2.mp3';
import noteB2 from '/src/assets/audio/B2.mp3';

// Import ottava alta (C3-B3)
import noteC3 from '/src/assets/audio/C3.mp3';
import noteCSharp3 from '/src/assets/audio/C-sharp3.mp3';
import noteD3 from '/src/assets/audio/D3.mp3';
import noteDSharp3 from '/src/assets/audio/D-sharp3.mp3';
import noteE3 from '/src/assets/audio/E3.mp3';
import noteF3 from '/src/assets/audio/F3.mp3';
import noteFSharp3 from '/src/assets/audio/F-sharp3.mp3';
import noteG3 from '/src/assets/audio/G3.mp3';
import noteGSharp3 from '/src/assets/audio/G-sharp3.mp3';
import noteA3 from '/src/assets/audio/A3.mp3';
import noteASharp3 from '/src/assets/audio/A-sharp3.mp3';
import noteB3 from '/src/assets/audio/B3.mp3';

// Map note names to imported audio files
const NOTE_FILES: Record<string, string> = {
  // Ottava 2 (bassa)
  C2: noteC2,
  'C#2': noteCSharp2,
  Db2: noteCSharp2,
  D2: noteD2,
  'D#2': noteDSharp2,
  Eb2: noteDSharp2,
  E2: noteE2,
  F2: noteF2,
  'F#2': noteFSharp2,
  Gb2: noteFSharp2,
  G2: noteG2,
  'G#2': noteGSharp2,
  Ab2: noteGSharp2,
  A2: noteA2,
  'A#2': noteASharp2,
  Bb2: noteASharp2,
  B2: noteB2,

  // Ottava 3 (alta)
  C3: noteC3,
  'C#3': noteCSharp3,
  Db3: noteCSharp3,
  D3: noteD3,
  'D#3': noteDSharp3,
  Eb3: noteDSharp3,
  E3: noteE3,
  F3: noteF3,
  'F#3': noteFSharp3,
  Gb3: noteFSharp3,
  G3: noteG3,
  'G#3': noteGSharp3,
  Ab3: noteGSharp3,
  A3: noteA3,
  'A#3': noteASharp3,
  Bb3: noteASharp3,
  B3: noteB3,

  // Alias senza ottava (default a ottava 2 per backward compatibility)
  C: noteC2,
  'C#': noteCSharp2,
  Db: noteCSharp2,
  D: noteD2,
  'D#': noteDSharp2,
  Eb: noteDSharp2,
  E: noteE2,
  F: noteF2,
  'F#': noteFSharp2,
  Gb: noteFSharp2,
  G: noteG2,
  'G#': noteGSharp2,
  Ab: noteGSharp2,
  A: noteA2,
  'A#': noteASharp2,
  Bb: noteASharp2,
  B: noteB2,
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class AudioPlayer {
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // console.log('🎵 Audio Player initialized with 2 octaves (C2-B2, C3-B3)');
    // console.log('📁 Available notes:', Object.keys(NOTE_FILES).length, 'variations');
    // Inizializza Web Audio API per controllo gain preciso
    // this.initAudioContext();
  }

  /**
   * Inizializza Audio Context con master gain
   */
  async initAudioContext(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext!;
      this.audioContext = new AudioContextClass();

      // Sblocca l’audio con un suono muto
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.audioContext.destination);

      await this.audioContext.resume();
      console.log('🔓 Audio context unlocked');
    } catch (err: any) {
      console.warn('⚠️ Web Audio API unavailable or locked', err);
    }
  }

  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Precarica tutti i file audio
   */
  async preloadAllNotes(): Promise<void> {
    const uniqueFiles = new Set(Object.values(NOTE_FILES));

    // console.log('🔄 Preloading', uniqueFiles.size, 'audio files...');

    const loadPromises = Array.from(uniqueFiles).map(async (filePath) => {
      try {
        const audio = new Audio(filePath);
        audio.preload = 'auto';

        // Attendi che sia pronto
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', resolve, { once: true });
          audio.addEventListener('error', reject, { once: true });
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        this.audioElements.set(filePath, audio);
        // console.log('✅ Loaded:', filePath.split('/').pop());
      } catch (error: any) {
        console.error('❌ Failed to load:', filePath.split('/').pop(), error);
      }
    });

    await Promise.allSettled(loadPromises);
    console.log('✅ Preload complete!', this.audioElements.size, 'files ready');
  }

  /**
   * Riproduci una singola nota con Web Audio API per miglior controllo gain
   */
  async playNote(note: string, volume: number = 1.0): Promise<void> {
    // console.log('🎹 Playing note:', note, 'volume:', volume);

    await this.resumeAudioContext();

    const filePath = NOTE_FILES[note];
    if (!filePath) {
      console.error('❌ Note not found:', note);
      console.log(
        'Available notes:',
        Object.keys(NOTE_FILES)
          .filter((k) => !k.includes('b'))
          .slice(0, 24)
      );
      return;
    }

    let audio = this.audioElements.get(filePath);

    if (!audio) {
      // console.log('⚠️ Audio not preloaded, creating on demand');
      audio = new Audio(filePath);
      this.audioElements.set(filePath, audio);
    }

    try {
      // Usa Web Audio API se disponibile
      if (this.audioContext && this.masterGain) {
        const source = this.audioContext.createMediaElementSource(audio);
        const gainNode = this.audioContext.createGain();

        // Applica volume con gain node
        gainNode.gain.value = Math.max(0, Math.min(1, volume));

        // Connetti: source → gainNode → masterGain → destination
        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Disconnetti questo audio element da future call
        // (evita di ricreare source per stesso elemento)
        this.audioElements.delete(filePath);
      } else {
        // Fallback: volume diretto
        audio.volume = Math.max(0, Math.min(1, volume * 0.7));
      }

      audio.currentTime = 0;
      await audio.play();
      console.log('✅ Playing successfully');
    } catch (error: any) {
      // Se l'errore è che il source è già connesso, riprova con nuovo audio
      if (error.name === 'InvalidStateError') {
        console.log('♻️ Recreating audio element');
        const newAudio = new Audio(filePath);
        newAudio.volume = Math.max(0, Math.min(1, volume * 0.7));
        this.audioElements.set(filePath, newAudio);
        await newAudio.play();
      } else {
        console.error('❌ Error playing audio:', error);
      }
    }
  }

  /**
   * Riproduci sequenza di note
   */
  async playSequence(notes: string[], delayMs: number = 600, volume: number = 1.0): Promise<void> {
    for (const note of notes) {
      await this.playNote(note, volume);
      await this.delay(delayMs);
    }
  }

  /**
   * Riproduci accordo (simultaneo) con volume ridotto per evitare clipping
   */
  async playChord(notes: string[]): Promise<void> {
    // Formula migliorata: volume più conservativo
    // Per 3 note: 0.5, per 4 note: 0.43
    const volume = 0.8 / Math.sqrt(notes.length);

    // console.log(`🎼 Playing chord with ${notes.length} notes, volume: ${volume.toFixed(2)}`);

    const promises = notes.map((note) => this.playNote(note, volume));
    await Promise.all(promises);
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const audioPlayer = new AudioPlayer();
