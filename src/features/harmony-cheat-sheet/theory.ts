import { Note } from 'tonal';

export const PARENT_SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  melodic: [0, 2, 3, 5, 7, 9, 11],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  harmonicMajor: [0, 2, 4, 5, 7, 8, 11],
} as const;
export type ModalFamily = keyof typeof PARENT_SCALES;
export const FAMILY_LABELS: Record<ModalFamily, string> = {
  major: 'Scala maggiore', melodic: 'Minore melodica jazz', harmonicMinor: 'Minore armonica', harmonicMajor: 'Maggiore armonica',
};

export function rotateScale(parent: readonly number[], degree: number): number[] {
  return parent.map((_, index) => (parent[(index + degree) % parent.length] - parent[degree] + 12) % 12);
}

export function modeFormula(family: ModalFamily, degree: number): string[] {
  return rotateScale(PARENT_SCALES[family], degree).map((semitones, index) => {
    const difference = semitones - PARENT_SCALES.major[index];
    return `${difference < 0 ? 'b'.repeat(-difference) : '#'.repeat(difference)}${index + 1}`;
  });
}

export function formulaNotes(formula: readonly string[], tonic = 'C'): string[] {
  return formula.map(token => {
    const [, accidentals, degreeText] = /^([b#]*)([1-7])$/.exec(token) ?? [];
    if (!degreeText) throw new Error(`Invalid scale degree: ${token}`);
    const degree = Number(degreeText);
    const delta = [...accidentals].reduce((total, mark) => total + (mark === '#' ? 1 : -1), 0);
    const perfect = [1, 4, 5].includes(degree);
    const quality = delta > 0 ? 'A'.repeat(delta) : delta === 0 ? (perfect ? 'P' : 'M') : !perfect && delta === -1 ? 'm' : 'd'.repeat(-delta - (perfect ? 0 : 1));
    return Note.transpose(tonic, `${degree}${quality}`);
  });
}

export function formatFormula(formula: readonly string[]): string {
  return formula.map(degree => degree.replace(/b/g, '♭').replace(/#/g, '♯')).join(' · ');
}
export function displayNote(note: string): string { return note.replace(/b/g, '♭').replace(/#/g, '♯'); }
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/♭/g, 'b').replace(/♯/g, '#').replace(/[‘’ō]/g, match => match === 'ō' ? 'o' : "'").toLowerCase();
}
