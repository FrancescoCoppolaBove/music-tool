import type { ExamTemplate } from '../types';

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: 'base',
    title: 'Prova Base',
    description: '5 intervalli melodici + 5 triadi — livello 1. Circa 10 minuti.',
    totalDurationMinutes: 10,
    sections: [
      { moduleId: 'melodic-intervals', questionCount: 5, level: 1, label: 'Intervalli melodici' },
      { moduleId: 'triads',            questionCount: 5, level: 1, label: 'Triadi' },
    ],
  },
  {
    id: 'intermedio',
    title: 'Prova Intermedia',
    description: '5 intervalli armonici L2 + 5 settime L2 + 3 cadenze. Circa 15 minuti.',
    totalDurationMinutes: 15,
    sections: [
      { moduleId: 'harmonic-intervals', questionCount: 5, level: 2, label: 'Intervalli armonici' },
      { moduleId: 'sevenths',           questionCount: 5, level: 2, label: 'Accordi di settima' },
      { moduleId: 'cadences',           questionCount: 3, level: 2, label: 'Cadenze' },
    ],
  },
  {
    id: 'avanzato',
    title: 'Prova Avanzata',
    description: '3 intervalli armonici + 3 settime L3 + 4 funzioni tonali. Circa 20 minuti.',
    totalDurationMinutes: 20,
    sections: [
      { moduleId: 'harmonic-intervals', questionCount: 3, level: 3, label: 'Intervalli armonici' },
      { moduleId: 'sevenths',           questionCount: 3, level: 3, label: 'Accordi di settima' },
      { moduleId: 'tonal-functions',    questionCount: 4, level: 3, label: 'Funzioni tonali' },
    ],
  },
];
