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
  // FIX CRITICO: Non interpretare 6/9 come slash chord!
  let bass: NoteName | undefined;
  if (symbol.includes('/')) {
    const parts = symbol.split('/');
    const afterSlash = parts[1]?.trim();

    // Controlla se dopo lo slash c'è una nota valida (A-G con optional #/b)
    // 6/9 ha "9" dopo slash (numero) → NON è slash chord
    // C/E ha "E" dopo slash (nota) → È slash chord
    if (afterSlash && /^[A-G][#♯b♭]?$/.test(afterSlash)) {
      // È un vero slash chord
      symbol = parts[0].trim();
      bass = normalizeNoteName(afterSlash) || undefined;
    }
    // Altrimenti lascia symbol intatto (es. C6/9 rimane C6/9)
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

  // ============================================================
  // CRITICAL FIX SECTION - Ordine corretto di parsing
  // ============================================================

  // --- MINOR-MAJOR 7 (mMaj7, mM7) - PRIMA di tutto! ---
  if (remainder.match(/^m(Maj7|M7|maj7)/i)) {
    result.quality = 'minor';
    result.hasSeventh = true;
    result.extensions.push('M7'); // Flag speciale per settima maggiore
    remainder = remainder.replace(/^m(Maj7|M7|maj7)/i, '');
    return finalizeChord(result, remainder);
  }

  // --- SESTA CON NONA (6/9) ---
  // FIX CRITICO: Ora symbol contiene ancora "6/9" completo
  if (remainder.match(/^6\/9/)) {
    result.extensions.push('6');
    result.extensions.push('9');
    result.hasNinth = true;
    remainder = remainder.replace(/^6\/9/, '');
    // Continua il parsing invece di return
  }

  // --- MAJOR 7TH/9/11/13 - Controlla PRIMA di minor! ---
  if (remainder.match(/^(maj(?:7|9|11|13)?|ma7|M7|Δ7|△7)/)) {
    result.quality = 'major';
    result.hasSeventh = true;

    // Estrai estensione se presente (maj9, maj11, maj13)
    const majMatch = remainder.match(/^maj(9|11|13)/);
    if (majMatch) {
      const extension = majMatch[1];
      result.extensions.push(extension);
      if (extension === '9') result.hasNinth = true;
    }

    remainder = remainder.replace(/^(maj(?:7|9|11|13)?|ma7|M7|Δ7|△7)/, '');
  }
  // --- DOMINANT 7 ---
  else if (remainder.match(/^7(?!maj|M|Δ)/)) {
    if (result.quality === 'major') {
      result.quality = 'dominant';
    }
    result.hasSeventh = true;
    remainder = remainder.replace(/^7/, '');
  }
  // --- SESTA (6) - Solo se non già processato 6/9 ---
  else if (remainder.match(/^6(?!\/)/) && !result.extensions.includes('6')) {
    result.extensions.push('6');
    remainder = remainder.replace(/^6/, '');
  }
  // --- MINOR - Controlla DOPO maj7! ---
  else if (matchAny(remainder, MUSIC_SYMBOLS.minor) && !remainder.startsWith('maj')) {
    result.quality = 'minor';
    remainder = removeFirst(remainder, MUSIC_SYMBOLS.minor);

    // FIX: Controlla se c'è 6 subito dopo m (Cm6)
    if (remainder.match(/^6(?!\/)/)) {
      result.extensions.push('6');
      remainder = remainder.replace(/^6/, '');
    }
    // Minor 7th
    else if (remainder.match(/^7/)) {
      result.hasSeventh = true;
      remainder = remainder.replace(/^7/, '');
    }
  }
  // --- MAJOR (explicit) ---
  else if (matchAny(remainder, [...MUSIC_SYMBOLS.major, ...MUSIC_SYMBOLS.delta])) {
    result.quality = 'major';
    remainder = removeFirst(remainder, [...MUSIC_SYMBOLS.major, ...MUSIC_SYMBOLS.delta]);
  }

  // ============================================================
  // ESTENSIONI (9, 11, 13) - Solo per accordi senza maj prefix
  // ============================================================

  if (remainder.match(/^(9|11|13)/)) {
    const ext = remainder.match(/^(9|11|13)/)![1];

    // NON aggiungere se già presente (da 6/9)
    if (!result.extensions.includes(ext)) {
      result.extensions.push(ext);
    }

    if (ext === '9') result.hasNinth = true;

    // Estensioni implicano settima se non già presente
    if (!result.hasSeventh) {
      result.hasSeventh = true;

      // Se quality è ancora 'major' (default), diventa 'dominant'
      if (result.quality === 'major') {
        result.quality = 'dominant';
      }
    }

    remainder = remainder.replace(/^(9|11|13)/, '');
  }

  // ============================================================
  // ALTERATIONS & ADDED TONES
  // ============================================================

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
  'Cmaj9',
  'Cmaj11',
  'Cmaj13',
  'CΔ',
  'Cm',
  'Cm7',
  'C-7',
  'C7',
  'C9',
  'C11',
  'C13',
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
  'F#m7',
  'F#7b9',
  'Gbmaj9',
  'Bb7#11/D',
  'C/E',
  'Dm7b5',
  'CmMaj7',
  'C6/9',
  'Cm6',
];
