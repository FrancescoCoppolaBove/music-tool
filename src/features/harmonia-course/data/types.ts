import type { Tab } from '@shared/types/navigation.types';

export interface ToolLink {
  tabId: Tab;
  label: string;
  icon: string;
  desc: string;
}

export interface ChordKeyboardSpec {
  label: string;
  notes: string[];
  color?: string;
}

export interface ProgressionStep {
  chord: string;
  function?: string;
  annotation?: string;
}

export interface IntervalRow {
  degree: string;
  note: string;
  semitones: number;
}

export type Visual =
  | {
      type: 'keyboard';
      title?: string;
      chords: ChordKeyboardSpec[];
    }
  | {
      type: 'progression';
      title?: string;
      key?: string;
      steps: ProgressionStep[];
    }
  | {
      type: 'interval-grid';
      title?: string;
      chord?: string;
      scale?: string;
      root?: string;
      rows?: IntervalRow[];
    }
  | {
      type: 'circle-segment';
      title?: string;
      highlight: string[];
      tonic?: string;
    };

export interface Subsection {
  id: string;
  title: string;
  topics: string[];
  teoria: string;
  esempi: string;
  esercizi: string[];
  obiettivo: string;
  tools: ToolLink[];
  visuals?: Visual[];
}

export interface Level {
  id: number;
  phase: 1 | 2 | 3 | 4;
  title: string;
  subsections: Subsection[];
}

export const PHASE_META: Record<1 | 2 | 3 | 4, { title: string; duration: string; levelRange: string }> = {
  1: { title: 'Fondamenta Solide',                       duration: '2-3 mesi', levelRange: 'Lv 0-3' },
  2: { title: 'Linguaggio Jazz Funzionale',              duration: '3-4 mesi', levelRange: 'Lv 4-7' },
  3: { title: 'Colore Moderno e Reharmonization',        duration: '4-6 mesi', levelRange: 'Lv 8-11' },
  4: { title: 'Armonia Avanzata e Linguaggio Personale', duration: '6+ mesi',  levelRange: 'Lv 12-17' },
};

export const PROGRESS_KEY = 'tonic_harmonia_progress';

export function getCompletedLessons(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markLessonComplete(subsectionId: string): void {
  const completed = getCompletedLessons();
  completed.add(subsectionId);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
}

export function markLessonIncomplete(subsectionId: string): void {
  const completed = getCompletedLessons();
  completed.delete(subsectionId);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
}
