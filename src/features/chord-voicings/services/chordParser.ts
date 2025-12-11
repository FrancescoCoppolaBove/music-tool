import { NoteName, MUSIC_SYMBOLS } from '@shared/types/music.types';
import { normalizeNoteName } from '@shared/utils/musicTheory';
import { ParsedChord } from '../types/chord.types';

/**
 * Parser completo per simboli di accordi in notazione internazionale
 */
export function parseChordSymbol(symbol: string): ParsedChord | null {
  if (!symbol || symbol.trim().length === 0) {
    return null;
  }

  const original = symbol;
  symbol = symbol.trim();

  // 1. Gestisci slash chords (es. C7/G, F#m7/A)
  let bass: NoteName | undefined;
  if (symbol.includes('/')) {
    const parts = symbol.split('/');
    symbol = parts[0].trim();
    const bassNote = parts[1]?.trim();
    if (bassNote) {
      bass = normalizeNoteName(bassNote) || undefined;
    }
  }

  // 2. Estrai la root note (può essere C, C#, Db, Gb, ecc.)
  const rootMatch = symbol.match(/^([A-G][#♯b♭]?)/);
  if (!rootMatch) {
    return null;
  }

  const rootRaw = rootMatch[1];
  const root = normalizeNoteName(rootRaw);
  if (!root) {
    return null;
  }

  // 3. Rimuovi root dal simbolo
  let remainder = symbol.slice(rootRaw.length);

  // 4. Parsing del quality e extensions
  const result: ParsedChord = {
    root,
    bass,
    quality: 'major', // default
    hasSeventh: false,
    hasNinth: false,
    extensions: [],
    alterations: [],
    addedTones: [],
    suspensions: [],
    rawSymbol: original,
  };

  // --- DIMINISHED ---
  if (matchAny(remainder, MUSIC_SYMBOLS.diminished)) {
    result.quality = 'diminished';
    remainder = removeFirst(remainder, [...MUSIC_SYMBOLS.diminished, '7']);

    // dim7 o ° implica 7th diminished
    if (remainder.startsWith('7') || original.includes('dim7') || original.includes('°7')) {
      result.hasSeventh = true;
      remainder = remainder.replace(/^7/, '');
    }

    return finalizeChord(result, remainder);
  }

  // --- HALF-DIMINISHED (ø, m7b5) ---
  if (remainder.match(/^(ø7?|m7b5)/)) {
    result.quality = 'half-diminished';
    result.hasSeventh = true;
    remainder = remainder.replace(/^(ø7?|m7b5)/, '');
    return finalizeChord(result, remainder);
  }

  // --- AUGMENTED ---
  if (matchAny(remainder, MUSIC_SYMBOLS.augmented)) {
    result.quality = 'augmented';
    remainder = removeFirst(remainder, MUSIC_SYMBOLS.augmented);

    // aug7, +7
    if (remainder.startsWith('7')) {
      result.hasSeventh = true;
      remainder = remainder.replace(/^7/, '');
    }

    return finalizeChord(result, remainder);
  }

  // --- SUSPENDED (sus2, sus4, 7sus4) ---
  const susMatch = remainder.match(/^(sus2|sus4|7sus4)/);
  if (susMatch) {
    const susType = susMatch[1];
    result.suspensions.push(susType);
    remainder = remainder.replace(/^(sus2|sus4|7sus4)/, '');

    if (susType === '7sus4') {
      result.hasSeventh = true;
      result.quality = 'sus4';
    } else if (susType === 'sus2') {
      result.quality = 'sus2';
    } else {
      result.quality = 'sus4';
    }

    return finalizeChord(result, remainder);
  }

  // --- SEVENTH & EXTENSIONS (CONTROLLA PRIMA DI MINOR/MAJOR!) ---

  // ⭐ FIX CRITICO: Major 7th PRIMA di controllare minor!
  // Major 7th (maj7, M7, Δ7, ma7, △7)
  if (remainder.match(/^(maj7|ma7|M7|Δ7|△7)/)) {
    result.quality = 'major';
    result.hasSeventh = true;
    remainder = remainder.replace(/^(maj7|ma7|M7|Δ7|△7)/, '');
  }
  // Dominant 7 (solo "7" senza maj/M/Δ)
  else if (remainder.match(/^7(?!maj|M|Δ)/)) {
    if (result.quality === 'major') {
      result.quality = 'dominant';
    }
    result.hasSeventh = true;
    remainder = remainder.replace(/^7/, '');
  }
  // 6th chords
  else if (remainder.match(/^6/)) {
    result.extensions.push('6');
    remainder = remainder.replace(/^6/, '');
  }

  // --- MINOR (controlla DOPO maj7!) ---
  // ⭐ Aggiungi controllo che non sia "maj"
  else if (matchAny(remainder, MUSIC_SYMBOLS.minor) && !remainder.startsWith('maj')) {
    result.quality = 'minor';
    remainder = removeFirst(remainder, MUSIC_SYMBOLS.minor);

    // Minor 7th
    if (remainder.match(/^7/)) {
      result.hasSeventh = true;
      remainder = remainder.replace(/^7/, '');
    }
  }
  // --- MAJOR (explicit) ---
  else if (matchAny(remainder, [...MUSIC_SYMBOLS.major, ...MUSIC_SYMBOLS.delta])) {
    result.quality = 'major';
    remainder = removeFirst(remainder, [...MUSIC_SYMBOLS.major, ...MUSIC_SYMBOLS.delta]);
  }

  // Extensions: 9, 11, 13
  if (remainder.match(/^(9|11|13)/)) {
    const ext = remainder.match(/^(9|11|13)/)![1];
    result.extensions.push(ext);

    if (ext === '9') result.hasNinth = true;
    if (!result.hasSeventh && (ext === '9' || ext === '11' || ext === '13')) {
      result.hasSeventh = true; // implied
    }

    remainder = remainder.replace(/^(9|11|13)/, '');
  }

  // --- ALTERATIONS & ADDED TONES ---
  const alterationsMatch = remainder.match(/\(([^)]+)\)|([#♯b♭]\d+|add\d+)/g);
  if (alterationsMatch) {
    alterationsMatch.forEach((alt) => {
      const cleaned = alt.replace(/[()]/g, '').trim();

      const parts = cleaned.split(',').map((p) => p.trim());
      parts.forEach((part) => {
        if (part.startsWith('add')) {
          result.addedTones.push(part);
        } else if (part.match(/[#♯b♭]\d+/)) {
          result.alterations.push(part.replace(/♯/g, '#').replace(/♭/g, 'b'));
        } else if (part.match(/^\d+$/)) {
          result.extensions.push(part);
        }
      });
    });
  }

  return result;
}

// --- HELPER FUNCTIONS ---

function matchAny(str: string, patterns: string[]): boolean {
  return patterns.some((p) => str.startsWith(p));
}

function removeFirst(str: string, patterns: string[]): string {
  for (const p of patterns) {
    if (str.startsWith(p)) {
      return str.slice(p.length);
    }
  }
  return str;
}

function finalizeChord(chord: ParsedChord, remainder: string): ParsedChord {
  const alterationsMatch = remainder.match(/\(([^)]+)\)|([#♯b♭]\d+|add\d+)/g);
  if (alterationsMatch) {
    alterationsMatch.forEach((alt) => {
      const cleaned = alt.replace(/[()]/g, '').trim();
      const parts = cleaned.split(',').map((p) => p.trim());
      parts.forEach((part) => {
        if (part.startsWith('add')) {
          chord.addedTones.push(part);
        } else if (part.match(/[#♯b♭]\d+/)) {
          chord.alterations.push(part.replace(/♯/g, '#').replace(/♭/g, 'b'));
        }
      });
    });
  }

  return chord;
}

/**
 * Valida se un simbolo è parsabile
 */
export function isValidChordSymbol(symbol: string): boolean {
  return parseChordSymbol(symbol) !== null;
}

/**
 * Esempi di test
 */
export const EXAMPLE_CHORDS = [
  'C',
  'Cmaj7',
  'CΔ',
  'Cm',
  'Cm7',
  'C-7',
  'C7',
  'C7b9',
  'C7(#9,#11)',
  'Cø7',
  'Cdim7',
  'C°7',
  'C+7',
  'Caug',
  'Csus2',
  'Csus4',
  'C7sus4',
  'Cadd9',
  'Cm9',
  'C13',
  'F#m7',
  'F#7b9',
  'Gbmaj9',
  'Bb7#11/D',
  'C/E',
  'Dm7b5',
];
