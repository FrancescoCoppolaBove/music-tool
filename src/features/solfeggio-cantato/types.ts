// src/features/solfeggio-cantato/types.ts

export interface SolfeggioNote {
  midi: number;
  label: string;     // Italian solfège: 'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'
  durationMs: number;
}

export interface SolfeggioExercise {
  id: string;
  title: string;
  level: 'propedeutico' | 'facile' | 'medio';
  category: 'scala' | 'intervallo' | 'frammento';
  notes: SolfeggioNote[];
}

export interface NoteEvaluation {
  note: SolfeggioNote;
  status: 'correct' | 'sharp' | 'flat' | 'missed';
  /** Cents deviation from target, 0 if missed */
  centsOff: number;
}

export interface SolfeggioSessionResult {
  exerciseId: string;
  evaluations: NoteEvaluation[];
  accuracyPct: number;  // 0-100
}
