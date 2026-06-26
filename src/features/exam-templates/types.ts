import type { EarModuleId, ExerciseLevel, ExamAnswer } from '../ear-training-pro/types';

export interface ExamSection {
  moduleId: EarModuleId;
  questionCount: number;
  level: ExerciseLevel;
  label: string;
}

export interface ExamTemplate {
  id: string;
  title: string;
  description: string;
  totalDurationMinutes: number;
  sections: ExamSection[];
}

export interface SectionResult {
  moduleId: EarModuleId;
  level: ExerciseLevel;
  label: string;
  answers: ExamAnswer[];
  score: number;  // 0-100
}

export interface MultiSectionExamResult {
  templateId: string;
  sections: SectionResult[];
  totalScore: number;     // weighted average across sections
  completedAt: string;    // ISO timestamp
  durationMs: number;
}
