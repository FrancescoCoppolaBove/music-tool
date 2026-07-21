/**
 * AUDIO PLAYER — C2-C3 samples with pitch-shift extension to C1-C6
 * AudioBuffers are decoded once and cached; notes outside C2-B3 are pitch-shifted.
 */

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

const NOTE_FILES: Record<string, string> = {
  // Octave 2
  C2: noteC2, 'C#2': noteCSharp2, Db2: noteCSharp2,
  D2: noteD2, 'D#2': noteDSharp2, Eb2: noteDSharp2,
  E2: noteE2, F2: noteF2,
  'F#2': noteFSharp2, Gb2: noteFSharp2,
  G2: noteG2, 'G#2': noteGSharp2, Ab2: noteGSharp2,
  A2: noteA2, 'A#2': noteASharp2, Bb2: noteASharp2,
  B2: noteB2,
  // Octave 3
  C3: noteC3, 'C#3': noteCSharp3, Db3: noteCSharp3,
  D3: noteD3, 'D#3': noteDSharp3, Eb3: noteDSharp3,
  E3: noteE3, F3: noteF3,
  'F#3': noteFSharp3, Gb3: noteFSharp3,
  G3: noteG3, 'G#3': noteGSharp3, Ab3: noteGSharp3,
  A3: noteA3, 'A#3': noteASharp3, Bb3: noteASharp3,
  B3: noteB3,
  // No-octave aliases (default to octave 2, backward compat)
  C: noteC2, 'C#': noteCSharp2, Db: noteCSharp2,
  D: noteD2, 'D#': noteDSharp2, Eb: noteDSharp2,
  E: noteE2, F: noteF2,
  'F#': noteFSharp2, Gb: noteFSharp2,
  G: noteG2, 'G#': noteGSharp2, Ab: noteGSharp2,
  A: noteA2, 'A#': noteASharp2, Bb: noteASharp2,
  B: noteB2,
};

// Enharmonic equivalents that might not be in NOTE_FILES
const ENHARMONIC: Record<string, string> = {
  'Cb': 'B', 'Fb': 'E', 'E#': 'F', 'B#': 'C',
};

/**
 * Resolve any note (e.g. "C4", "Bb5", "F#1") to a sample file + playbackRate.
 * Notes outside C2-B3 are pitch-shifted from the nearest available octave.
 */
function resolveNote(note: string): { filePath: string; playbackRate: number } | null {
  if (NOTE_FILES[note]) return { filePath: NOTE_FILES[note], playbackRate: 1.0 };

  const m = note.match(/^([A-G][b#]?)(\d+)$/);
  if (!m) return null;

  let name = m[1];
  const targetOctave = parseInt(m[2]);

  // Normalize rare enharmonics (Cb, E#, etc.)
  if (ENHARMONIC[name]) name = ENHARMONIC[name];

  // Pick nearest sample octave: prefer octave 3 for higher, octave 2 for lower
  const sampleOctave = targetOctave >= 3 ? 3 : 2;
  const sampleKey = `${name}${sampleOctave}`;

  if (NOTE_FILES[sampleKey]) {
    return {
      filePath: NOTE_FILES[sampleKey],
      playbackRate: Math.pow(2, targetOctave - sampleOctave),
    };
  }

  return null;
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext; }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  async initAudioContext(): Promise<void> {
    if (this.audioContext) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext!;
      this.audioContext = new AudioContextClass();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.audioContext.destination);

      const unlockAudio = async () => {
        try {
          if (this.audioContext?.state === 'suspended') await this.audioContext.resume();
          if (this.audioContext) {
            const buf = this.audioContext.createBuffer(1, 1, 22050);
            const src = this.audioContext.createBufferSource();
            src.buffer = buf;
            src.connect(this.audioContext.destination);
            src.start(0);
          }
          window.removeEventListener('touchstart', unlockAudio);
          window.removeEventListener('click', unlockAudio);
        } catch { /* ignore */ }
      };

      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('click', unlockAudio, { once: true });
    } catch { /* Web Audio unavailable */ }
  }

  async resumeAudioContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') await this.audioContext.resume();
  }

  /** Decode an MP3 file into an AudioBuffer and cache it. */
  private async getBuffer(filePath: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(filePath)) return this.bufferCache.get(filePath)!;
    if (!this.audioContext) return null;
    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bufferCache.set(filePath, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  /** Preload and decode all 24 sample files into the buffer cache. */
  async preloadAllNotes(): Promise<void> {
    await this.initAudioContext();
    const uniqueFiles = new Set(Object.values(NOTE_FILES));
    await Promise.allSettled(Array.from(uniqueFiles).map(f => this.getBuffer(f)));
  }

  /**
   * Play any note (C1-C6) at a given volume.
   * Notes outside C2-B3 are pitch-shifted from the nearest sample.
   */
  async playNote(note: string, volume = 1.0): Promise<void> {
    await this.resumeAudioContext();

    const resolved = resolveNote(note);
    if (!resolved) {
      console.error('Note not found:', note);
      return;
    }

    const { filePath, playbackRate } = resolved;

    if (this.audioContext && this.masterGain) {
      const buffer = await this.getBuffer(filePath);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      this.activeSources.add(source);
      source.onended = () => this.activeSources.delete(source);

      source.start(0);
    } else {
      // HTML5 Audio fallback
      const audio = new Audio(filePath);
      audio.volume = Math.max(0, Math.min(1, volume * 0.7));
      await audio.play();
    }
  }

  /** Play notes sequentially with a delay between each. */
  async playSequence(notes: string[], delayMs = 600, volume = 1.0): Promise<void> {
    for (const note of notes) {
      await this.playNote(note, volume);
      await this.delay(delayMs);
    }
  }

  /** Play all notes simultaneously (chord). Volume auto-reduced to prevent clipping. */
  async playChord(notes: string[]): Promise<void> {
    const volume = 0.8 / Math.sqrt(notes.length);
    await Promise.all(notes.map(note => this.playNote(note, volume)));
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Stop all active audio sources. */
  stopAll(): void {
    this.activeSources.forEach(src => {
      try { src.stop(); } catch { /* already stopped */ }
    });
    this.activeSources.clear();
  }
}

export const audioPlayer = new AudioPlayer();
