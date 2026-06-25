// src/features/ear-training-pro/types.ts

export type EarModuleId =
  | 'melodic-intervals'
  | 'harmonic-intervals'
  | 'triads'
  | 'sevenths'
  | 'tonal-functions'
  | 'cadences';

export type ExerciseMode = 'training' | 'exam';
export type ExerciseLevel = 1 | 2 | 3;

export interface ExamQuestion {
  id: string;
  /** MIDI note numbers to play */
  notes: number[];
  playMode: 'sequential' | 'simultaneous';
  /** Gap in ms between notes for sequential playback */
  gapMs?: number;
  correct: string;
  choices: string[];   // 4 items, shuffled, includes correct
  hint?: string;       // mnemonic, shown in training mode after answer
}

export interface ExamAnswer {
  questionId: string;
  given: string;
  correct: string;
  isCorrect: boolean;
  timeMs: number;
}

export interface ExamSessionResult {
  moduleId: EarModuleId;
  level: ExerciseLevel;
  answers: ExamAnswer[];
  score: number;       // 0-100
  durationMs: number;
  completedAt: string; // ISO string
}
