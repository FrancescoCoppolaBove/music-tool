export type CClefType = 'contralto' | 'tenore';

export interface SetticlavioExercise {
  id: string;
  clef: CClefType;
  level: 1 | 2 | 3;
  /** Staff position: 0 = first ledger line below, 1 = first space, 2 = first line, 3 = 2nd space, 4 = 2nd line, 5 = 3rd space, 6 = 3rd line, 7 = 4th space, 8 = 4th line, 9 = 5th space, 10 = 5th line */
  staffPosition: number;
  /** The correct note name in Italian */
  correct: string;
  choices: string[];
}
