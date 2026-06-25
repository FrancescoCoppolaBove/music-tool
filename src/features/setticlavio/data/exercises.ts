import { SetticlavioExercise } from '../types';

// Staff positions: 0=ledger below, 1=1st space, 2=1st line, 3=2nd space,
// 4=2nd line, 5=3rd space, 6=3rd line, 7=4th space, 8=4th line, 9=5th space, 10=5th line

// CONTRALTO clef: C4 = 3rd line = staffPosition 4 (counting from 0-indexed bottom ledger)
// pos 2 = 1st line = La3, pos 3 = 1st space = Si3, pos 4 = 2nd line = Do4 (C clef!),
// pos 5 = 2nd space = Re4, pos 6 = 3rd line = Mi4, pos 7 = 3rd space = Fa4,
// pos 8 = 4th line = Sol4, pos 9 = 4th space = La4, pos 10 = 5th line = Si4
const CONTRALTO_NOTE: Record<number, string> = {
  0: 'Fa', 1: 'Sol', 2: 'La', 3: 'Si', 4: 'Do', 5: 'Re',
  6: 'Mi', 7: 'Fa', 8: 'Sol', 9: 'La', 10: 'Si',
};

// TENORE clef: C4 = 4th line = staffPosition 6
// pos 2 = 1st line = Mi3, pos 3 = Fa3, pos 4 = Sol3, pos 5 = La3,
// pos 6 = 4th line = Si3/Do4 (C clef position), pos 7 = Do4, pos 8 = Re4, pos 9 = Mi4, pos 10 = Fa4
// Using plan's mapping:
const TENORE_NOTE: Record<number, string> = {
  0: 'Re', 1: 'Mi', 2: 'Mi', 3: 'Fa', 4: 'Sol', 5: 'La',
  6: 'Si', 7: 'Do', 8: 'Re', 9: 'Mi', 10: 'Fa',
};

const ALL_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];

function pick4(correct: string): string[] {
  const wrong = ALL_NOTES.filter(n => n !== correct);
  const shuffled = [...wrong].sort(() => Math.random() - 0.5).slice(0, 3);
  return [...shuffled, correct].sort(() => Math.random() - 0.5);
}

function buildContralto(): SetticlavioExercise[] {
  return [2, 3, 4, 5, 6, 7, 8, 9, 10, 2, 4, 6, 8].map((pos, i) => ({
    id: `ca-${pos}-${i}`,
    clef: 'contralto' as const,
    level: (pos <= 5 ? 1 : pos <= 8 ? 2 : 3) as 1 | 2 | 3,
    staffPosition: pos,
    correct: CONTRALTO_NOTE[pos],
    choices: pick4(CONTRALTO_NOTE[pos]),
  }));
}

function buildTenore(): SetticlavioExercise[] {
  return [4, 5, 6, 7, 8, 9, 10, 4, 6, 8, 5, 7, 9].map((pos, i) => ({
    id: `te-${pos}-${i}`,
    clef: 'tenore' as const,
    level: (pos <= 6 ? 1 : pos <= 8 ? 2 : 3) as 1 | 2 | 3,
    staffPosition: pos,
    correct: TENORE_NOTE[pos],
    choices: pick4(TENORE_NOTE[pos]),
  }));
}

export const SETTICLAVIO_EXERCISES: SetticlavioExercise[] = [
  ...buildContralto(),
  ...buildTenore(),
];
