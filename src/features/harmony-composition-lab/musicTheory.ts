import { Chord, Interval, Key, Note, Scale, ScaleType } from 'tonal';

export function getScaleMaterial(tonic: string, mode: string) {
  const scale = Scale.get(`${tonic} ${mode}`);
  const metadata = ScaleType.get(mode);
  return { ...scale, intervals: metadata.intervals };
}

export type TransposingPart = 'altoSax' | 'tenorSax' | 'trumpet';
const WRITTEN_INTERVALS: Record<TransposingPart, string> = {
  altoSax: '6M',
  tenorSax: '9M',
  trumpet: '2M',
};

export function transposeConcertToWritten(note: string, part: TransposingPart): string {
  return Note.transpose(note, WRITTEN_INTERVALS[part]);
}

export function transposeProgression(chords: string[], fromTonic: string, toTonic: string): string[] {
  const from = Note.chroma(fromTonic);
  const to = Note.chroma(toTonic);
  if (from === undefined || to === undefined) return [...chords];
  const semitones = (to - from + 12) % 12;
  const interval = Interval.fromSemitones(semitones);
  return chords.map(chord => Chord.transpose(chord, interval));
}

export function getDiatonicSeventhChords(tonic: string, mode: string): string[] {
  const notes = Scale.get(`${tonic} ${mode}`).notes;
  if (notes.length < 7) return [];
  return notes.slice(0, 7).map((root, degree) => {
    const stack = [0, 2, 4, 6].map(offset => notes[(degree + offset) % 7]);
    const intervals = stack.map(n => ((Note.chroma(n) ?? 0) - (Note.chroma(root) ?? 0) + 12) % 12);
    const signature = intervals.join(',');
    const quality = signature === '0,4,7,11' ? 'maj7' : signature === '0,3,7,10' ? 'm7'
      : signature === '0,4,7,10' ? '7' : signature === '0,3,6,10' ? 'm7b5'
        : signature === '0,3,6,9' ? 'dim7' : '7';
    const chord = Chord.get(`${root}${quality}`);
    return chord.empty ? `${root}${quality}` : chord.symbol;
  });
}

export function getKeyProfile(tonic: string, mode: 'major' | 'minor') {
  if (mode === 'major') {
    const key = Key.majorKey(tonic);
    return {
      tonic: key.tonic,
      mode,
      keySignature: formatKeySignature(key.alteration),
      relative: `${key.minorRelative} minor`,
      parallel: `${tonic} minor`,
      scale: key.scale,
      chords: key.chords,
      dominant: key.chords[4],
      subdominant: key.chords[3],
    };
  }
  const key = Key.minorKey(tonic);
  return {
    tonic: key.tonic,
    mode,
    keySignature: formatKeySignature(key.alteration),
    relative: `${key.relativeMajor} major`,
    parallel: `${tonic} major`,
    scale: key.natural.scale,
    chords: key.natural.chords,
    harmonicScale: key.harmonic.scale,
    harmonicChords: key.harmonic.chords,
    melodicScale: key.melodic.scale,
    melodicChords: key.melodic.chords,
    dominant: key.harmonic.chords[4],
    subdominant: key.natural.chords[3],
  };
}

function formatKeySignature(alteration: number): string {
  if (!alteration) return 'No sharps or flats';
  return `${Math.abs(alteration)} ${alteration > 0 ? 'sharp' : 'flat'}${Math.abs(alteration) === 1 ? '' : 's'}`;
}
