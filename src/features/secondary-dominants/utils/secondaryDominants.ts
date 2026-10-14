// src/features/secondary-dominants/utils/secondaryDominants.ts
import { Key, Chord, Note } from 'tonal';

export interface ChordInfo {
  name: string;
  notes: string[];
}

export interface DegreeData {
  degree: string;       // "II", "III", "IV", "V", "VI"
  targetChord: string;  // e.g. "Dm7"
  targetNotes: string[]; // notes of the diatonic target chord for ii-V-I playback
  secDom: ChordInfo;    // V7/X
  tritoneSub: ChordInfo; // SubV7
  iiChord: ChordInfo;   // ii of the V7/X
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Normalize enharmonically weird roots that tonal produces for theoretical keys (e.g. F# major)
const ROOT_NORMALIZE: Record<string, string> = {
  'B#': 'C',  'E#': 'F',  'Cb': 'B',  'Fb': 'E',
  'B##': 'C#', 'C##': 'D', 'D##': 'E', 'E##': 'F#',
  'F##': 'G',  'G##': 'A', 'A##': 'B',
  'Cbb': 'Bb', 'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'Eb', 'Gbb': 'F', 'Abb': 'G', 'Bbb': 'A',
};

function normalizeChordName(name: string): string {
  const m = name.match(/^([A-G][#b]{0,2})(.*)/);
  if (!m) return name;
  const root = ROOT_NORMALIZE[m[1]] ?? m[1];
  return root + m[2];
}

function normalizeNote(n: string): string {
  return ROOT_NORMALIZE[n] ?? n;
}

function buildChordInfo(name: string): ChordInfo {
  const clean = normalizeChordName(name);
  return { name: clean, notes: Chord.get(clean).notes.map(normalizeNote) };
}

function tritoneSubOf(dom7Root: string): ChordInfo {
  const raw = Note.transpose(dom7Root, '4A');
  const root = Note.enharmonic(raw) || raw;
  return buildChordInfo(root + '7');
}

function iiChordFor(dom7Root: string, targetChord: string): ChordInfo {
  const iiRoot = Note.transpose(dom7Root, '-4P');
  const type = Chord.get(targetChord).quality === 'Minor' ? 'm7b5' : 'm7';
  return buildChordInfo(iiRoot + type);
}

export function getSecondaryDominants(
  tonic: string,
  mode: 'major' | 'minor',
): DegreeData[] {
  const key = mode === 'major' ? Key.majorKey(tonic) : Key.minorKey(tonic).natural;
  const { chords, secondaryDominants } = key;

  const result: DegreeData[] = [];
  // Skip index 0 (I degree) — V/I is the regular dominant, not a secondary dominant
  for (let i = 1; i < 7; i++) {
    const sd = secondaryDominants[i];
    if (!sd) continue;
    const secDomRoot = sd.replace(/7.*/, '');
    const targetChord = chords[i];
    result.push({
      degree: ROMAN[i],
      targetChord,
      targetNotes: Chord.get(targetChord).notes,
      secDom: buildChordInfo(sd),
      tritoneSub: tritoneSubOf(secDomRoot),
      iiChord: iiChordFor(secDomRoot, targetChord),
    });
  }
  return result;
}
