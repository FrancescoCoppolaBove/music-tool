import {
  SCALE_FORMULAS,
  noteToSemitone,
  semitoneToNote,
  notePreferFlat,
  getScaleNotes,
} from '@shared/utils/musicTheory';
import type { ScaleMatch } from '../types/scale.types';

const NOTE_REGEX = /[A-G][b#]?/g;
const TWELVE_ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export function parseNoteInput(input: string): string[] {
  const matches = input.match(NOTE_REGEX) ?? [];
  const seen = new Set<number>();
  const result: string[] = [];
  for (const note of matches) {
    const s = noteToSemitone(note);
    if (s < 0 || seen.has(s)) continue;
    seen.add(s);
    result.push(note);
  }
  return result;
}

function semitoneSet(notes: string[]): Set<number> {
  const set = new Set<number>();
  for (const n of notes) {
    const s = noteToSemitone(n);
    if (s >= 0) set.add(((s % 12) + 12) % 12);
  }
  return set;
}

export function recognizeScales(
  inputNotes: string[],
  rootNoteOverride?: string,
  maxResults = 100,
): ScaleMatch[] {
  if (inputNotes.length === 0) return [];

  const inputSemitones = semitoneSet(inputNotes);
  const inputSemitoneArray = Array.from(inputSemitones);

  const roots = rootNoteOverride ? [rootNoteOverride] : TWELVE_ROOTS;

  const results: ScaleMatch[] = [];
  let id = 0;

  for (const [scaleKey, formula] of Object.entries(SCALE_FORMULAS)) {
    const scaleFormula = formula as typeof SCALE_FORMULAS[string];
    for (const root of roots) {
      const rootSemitone = noteToSemitone(root);
      if (rootSemitone < 0) continue;

      const preferFlat = notePreferFlat(root);
      const scaleIntervalSet = new Set(
        scaleFormula.intervals.map((i: number) => ((rootSemitone + i) % 12 + 12) % 12)
      );

      const matchedSemitones = inputSemitoneArray.filter(s => scaleIntervalSet.has(s));
      const extraSemitones = inputSemitoneArray.filter(s => !scaleIntervalSet.has(s));

      const matchScore = Math.round((matchedSemitones.length / inputSemitoneArray.length) * 100);
      const completeness = Math.round((matchedSemitones.length / scaleIntervalSet.size) * 100);

      if (matchScore === 0) continue;

      const referenceScale = getScaleNotes(root, scaleKey);

      const matchedNotes = matchedSemitones.map(s => {
        const inputNote = inputNotes.find(n => ((noteToSemitone(n) % 12) + 12) % 12 === s);
        return inputNote ?? semitoneToNote(s, preferFlat);
      });

      const missingNotes = referenceScale.filter(sn => {
        const ss = noteToSemitone(sn);
        return ss >= 0 && !inputSemitones.has(((ss % 12) + 12) % 12);
      });

      const extraNotes = extraSemitones.map(s => {
        const inputNote = inputNotes.find(n => ((noteToSemitone(n) % 12) + 12) % 12 === s);
        return inputNote ?? semitoneToNote(s, preferFlat);
      });

      results.push({
        id: String(id++),
        scaleName: scaleFormula.name,
        scaleKey,
        root,
        category: scaleFormula.category,
        referenceScale,
        matchedNotes,
        missingNotes,
        extraNotes,
        matchScore,
        completeness,
      });
    }
  }

  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.completeness !== a.completeness) return b.completeness - a.completeness;
    return a.missingNotes.length - b.missingNotes.length;
  });

  return results.slice(0, maxResults);
}
