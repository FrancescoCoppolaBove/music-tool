import { Scale, Note } from 'tonal';
import type { ScaleMatch } from '../types/scale.types';

const NOTE_REGEX = /[A-Ga-g][b#]?/g;

// ─── Normalise note name ──────────────────────────────────────────────────────
// Simplify removes double-accidentals and normalises capitalisation.
function preferredSpelling(noteName: string): string {
  // Note.get already normalises capitalisation; just handle enharmonic swap.
  const simplified = Note.simplify(noteName);
  return simplified || noteName;
}

// ─── Parse user input into normalised note names ──────────────────────────────
export function parseNoteInput(raw: string): string[] {
  const tokens = raw.match(NOTE_REGEX) ?? [];
  const seen = new Set<number>();
  const result: string[] = [];

  for (const token of tokens) {
    const info = Note.get(token);
    if (info.empty) continue;
    const pc = info.chroma; // 0–11 pitch class
    if (pc === undefined || pc === null) continue;
    if (seen.has(pc)) continue;
    seen.add(pc);
    // Normalise to a clean spelling (capitalised, no double-accidentals)
    const name = preferredSpelling(info.name);
    result.push(name);
  }

  return result;
}

// ─── Convert Tonal interval string to W/H step ───────────────────────────────
// e.g. "2M" → "W", "2m" → "H", "3M" (whole-tone scale) → "W"
// We compute step sizes from consecutive note pitches instead.
function semitonesToStepLabel(semis: number): string {
  if (semis === 1) return 'H';
  if (semis === 2) return 'W';
  if (semis === 3) return 'W+H';
  if (semis === 4) return '2W';
  return String(semis);
}

function buildIntervalPattern(notes: string[]): string {
  if (notes.length < 2) return '';
  const steps: string[] = [];
  for (let i = 0; i < notes.length; i++) {
    const curr = Note.get(notes[i]);
    const next = Note.get(notes[(i + 1) % notes.length]);
    if (curr.empty || next.empty) continue;
    const currPc = curr.chroma ?? 0;
    const nextPc = next.chroma ?? 0;
    // Semitone step upward from current to next note (handles last→root octave wrap)
    const diff = (nextPc - currPc + 12) % 12;
    steps.push(semitonesToStepLabel(diff));
  }
  return steps.join('-');
}

// ─── Count accidentals in a list of notes ────────────────────────────────────
function countAccidentals(notes: string[]): { sharps: number; flats: number } {
  let sharps = 0;
  let flats = 0;
  for (const n of notes) {
    if (n.includes('#')) sharps++;
    if (n.includes('b') && !n.startsWith('B')) flats++;
  }
  return { sharps, flats };
}

// ─── Infer a category from the Tonal scale type name ─────────────────────────
function inferCategory(typeName: string): string {
  const t = typeName.toLowerCase();
  if (t.includes('pentatonic')) return 'Pentatonic';
  if (t.includes('blues')) return 'Blues';
  if (t.includes('bebop')) return 'Bebop';
  if (t.includes('whole tone') || t.includes('diminished') || t.includes('augmented')) return 'Symmetric';
  if (t === 'major' || t === 'minor') return 'Diatonic';
  if (
    t.includes('dorian') || t.includes('phrygian') || t.includes('lydian') ||
    t.includes('mixolydian') || t.includes('aeolian') || t.includes('locrian') ||
    t.includes('ionian')
  ) return 'Modal';
  if (t.includes('harmonic minor') || t.includes('melodic minor')) return 'Minor';
  if (t.includes('harmonic major')) return 'Major';
  if (t.includes('jazz') || t.includes('altered') || t.includes('dominant')) return 'Jazz';
  if (
    t.includes('hungarian') || t.includes('byzantine') || t.includes('neapolitan') ||
    t.includes('persian') || t.includes('japanese') || t.includes('hirajoshi') ||
    t.includes('in sen') || t.includes('enigmatic')
  ) return 'Exotic';
  return 'Other';
}

// ─── Build a ScaleMatch from a Tonal scale name and input note set ────────────
let _idCounter = 0;

function buildMatch(
  scaleName: string, // e.g. "C major", "D dorian"
  inputPcs: Set<number>,
  inputNotes: string[],
): ScaleMatch | null {
  const scaleInfo = Scale.get(scaleName);
  if (scaleInfo.empty || !scaleInfo.tonic || !scaleInfo.type) return null;

  const referenceScale: string[] = scaleInfo.notes;
  if (referenceScale.length === 0) return null;

  // Build pitch class set for the scale
  const scalePcs = new Set<number>(
    referenceScale.map(n => Note.get(n).chroma ?? -1).filter((pc): pc is number => pc >= 0),
  );

  // Matched: input notes that are in the scale
  const matchedNotes: string[] = [];
  const extraNotes: string[] = [];
  for (const n of inputNotes) {
    const pc = Note.get(n).chroma;
    if (pc !== undefined && pc !== null && scalePcs.has(pc)) {
      matchedNotes.push(n);
    } else {
      extraNotes.push(n);
    }
  }

  // Missing: scale notes not in the input
  const missingNotes: string[] = referenceScale.filter(n => {
    const pc = Note.get(n).chroma;
    return pc !== undefined && pc !== null && !inputPcs.has(pc);
  });

  const matchScore = Math.round((matchedNotes.length / inputNotes.length) * 100);
  const completeness = Math.round((matchedNotes.length / referenceScale.length) * 100);

  const category = inferCategory(scaleInfo.type);
  const intervalPattern = buildIntervalPattern(referenceScale);
  const { sharps, flats } = countAccidentals(referenceScale);

  return {
    id: String(_idCounter++),
    scaleName: scaleInfo.type
      // Capitalise first letter for display
      .replace(/^\w/, c => c.toUpperCase()),
    scaleKey: scaleInfo.type,
    root: scaleInfo.tonic,
    category,
    referenceScale,
    matchedNotes,
    missingNotes,
    extraNotes,
    matchScore,
    completeness,
    intervalPattern,
    sharps,
    flats,
  };
}

// ─── Main recognizer ──────────────────────────────────────────────────────────
export function recognizeScales(
  inputNotes: string[],
  rootNoteOverride?: string,
  maxResults = 100,
): ScaleMatch[] {
  if (inputNotes.length === 0) return [];

  _idCounter = 0;

  // Build pitch-class set from (possibly enharmonic-normalised) input
  const inputPcs = new Set<number>(
    inputNotes.map(n => Note.get(n).chroma ?? -1).filter((pc): pc is number => pc >= 0),
  );

  // Tonal's Scale.detect wants an array of note name strings.
  // Normalise input notes first (handles lowercase, double-accidentals, etc.)
  const normalised = inputNotes.map(n => preferredSpelling(Note.get(n).name)).filter(Boolean);

  // Scale.detect returns names like ["C major", "A minor", ...]
  let detected: string[] = Scale.detect(normalised);

  // If a root is specified, filter to only that root
  if (rootNoteOverride && rootNoteOverride.trim() !== '') {
    const root = rootNoteOverride.trim();
    detected = detected.filter(name => {
      const info = Scale.get(name);
      return (
        info.tonic === root ||
        Note.enharmonic(info.tonic ?? '') === root
      );
    });
  }

  const results: ScaleMatch[] = [];
  for (const scaleName of detected) {
    const match = buildMatch(scaleName, inputPcs, inputNotes);
    if (match) results.push(match);
  }

  // Scale.detect already returns best matches first for "perfect" sets.
  // For partial inputs (notes that belong to multiple scales) we also want
  // to surface high-coverage scales not listed by detect — so we supplement
  // with a broader search when fewer than maxResults are found.
  if (results.length < maxResults) {
    // Explore all 12 roots (or just the specified one)
    const roots = rootNoteOverride && rootNoteOverride.trim() !== ''
      ? [rootNoteOverride.trim()]
      : ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    // Common scale type names from Tonal
    const scaleTypes = [
      'major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
      'harmonic minor', 'melodic minor',
      'major pentatonic', 'minor pentatonic', 'blues',
      'bebop dominant', 'bebop major', 'bebop dorian',
      'whole tone', 'diminished', 'augmented',
      'dorian b2', 'lydian augmented', 'lydian dominant', 'mixolydian b6',
      'locrian #2', 'altered',
      'harmonic major', 'phrygian dominant',
      'hungarian minor', 'double harmonic major',
      'neapolitan major', 'neapolitan minor',
      'enigmatic', 'persian', 'hirajoshi', 'in sen',
    ];

    const seen = new Set(results.map(r => r.root + '|' + r.scaleKey));

    for (const root of roots) {
      for (const type of scaleTypes) {
        const name = `${root} ${type}`;
        const key = `${root}|${type}`;
        if (seen.has(key)) continue;
        const info = Scale.get(name);
        if (info.empty || info.notes.length === 0) continue;

        // Only include if at least one input note is in this scale
        const scalePcs = new Set<number>(
          info.notes.map(n => Note.get(n).chroma ?? -1).filter((pc): pc is number => pc >= 0),
        );
        const matched = [...inputPcs].filter(pc => scalePcs.has(pc)).length;
        if (matched === 0) continue;

        seen.add(key);
        const match = buildMatch(name, inputPcs, inputNotes);
        if (match) results.push(match);
      }
    }
  }

  // Sort: perfect matches first (100% match, no extras), then by matchScore desc,
  // then by completeness desc, then fewer missing notes
  results.sort((a, b) => {
    const aPerfect = a.matchScore === 100 && a.extraNotes.length === 0 ? 1 : 0;
    const bPerfect = b.matchScore === 100 && b.extraNotes.length === 0 ? 1 : 0;
    if (bPerfect !== aPerfect) return bPerfect - aPerfect;
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.completeness !== a.completeness) return b.completeness - a.completeness;
    return a.missingNotes.length - b.missingNotes.length;
  });

  return results.slice(0, maxResults);
}
