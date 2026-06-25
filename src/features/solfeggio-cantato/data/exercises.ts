// src/features/solfeggio-cantato/data/exercises.ts
import { SolfeggioExercise } from '../types';

// MIDI: C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71, C5=72
function n(midi: number, durationMs = 1500): { midi: number; label: string; durationMs: number } {
  const NOTE_MAP: Record<number, string> = {
    60: 'Do', 62: 'Re', 64: 'Mi', 65: 'Fa', 67: 'Sol', 69: 'La', 71: 'Si',
    72: 'Do', 74: 'Re', 76: 'Mi', 77: 'Fa', 79: 'Sol', 81: 'La', 83: 'Si',
    57: 'La', 59: 'Si',
    61: 'Do#', 63: 'Re#', 66: 'Fa#', 68: 'Sol#', 70: 'La#',
  };
  return { midi, label: NOTE_MAP[midi] ?? '?', durationMs };
}

export const SOLFEGGIO_EXERCISES: SolfeggioExercise[] = [
  // ── Scale propedeutiche ─────────────────────────────────────────────────
  {
    id: 'scala-do-asc', title: 'Scala di Do maggiore (ascendente)',
    level: 'propedeutico', category: 'scala',
    notes: [n(60), n(62), n(64), n(65), n(67), n(69), n(71), n(72)],
  },
  {
    id: 'scala-do-desc', title: 'Scala di Do maggiore (discendente)',
    level: 'propedeutico', category: 'scala',
    notes: [n(72), n(71), n(69), n(67), n(65), n(64), n(62), n(60)],
  },
  {
    id: 'scala-sol-asc', title: 'Scala di Sol maggiore (ascendente)',
    level: 'propedeutico', category: 'scala',
    notes: [n(67), n(69), n(71), n(72), n(74), n(76), n(78), n(79)],
  },
  {
    id: 'scala-la-min-asc', title: 'Scala di La minore naturale (ascendente)',
    level: 'propedeutico', category: 'scala',
    notes: [n(69), n(71), n(72), n(74), n(76), n(77), n(79), n(81)],
  },
  // ── Intervalli cantati ──────────────────────────────────────────────────
  {
    id: 'int-seconda-m-asc', title: 'Seconda minore ascendente',
    level: 'facile', category: 'intervallo',
    notes: [n(60, 2000), n(61, 2000)],
  },
  {
    id: 'int-seconda-M-asc', title: 'Seconda maggiore ascendente',
    level: 'facile', category: 'intervallo',
    notes: [n(60, 2000), n(62, 2000)],
  },
  {
    id: 'int-terza-m-asc', title: 'Terza minore ascendente',
    level: 'facile', category: 'intervallo',
    notes: [n(60, 2000), n(63, 2000)],
  },
  {
    id: 'int-terza-M-asc', title: 'Terza maggiore ascendente',
    level: 'facile', category: 'intervallo',
    notes: [n(60, 2000), n(64, 2000)],
  },
  {
    id: 'int-quarta-asc', title: 'Quarta giusta ascendente',
    level: 'facile', category: 'intervallo',
    notes: [n(60, 2000), n(65, 2000)],
  },
  {
    id: 'int-quinta-asc', title: 'Quinta giusta ascendente',
    level: 'facile', category: 'intervallo',
    notes: [n(60, 2000), n(67, 2000)],
  },
  {
    id: 'int-terza-M-desc', title: 'Terza maggiore discendente',
    level: 'medio', category: 'intervallo',
    notes: [n(64, 2000), n(60, 2000)],
  },
  {
    id: 'int-quinta-desc', title: 'Quinta giusta discendente',
    level: 'medio', category: 'intervallo',
    notes: [n(67, 2000), n(60, 2000)],
  },
  // ── Frammenti facili ────────────────────────────────────────────────────
  {
    id: 'frag-do-mi-sol', title: 'Arpeggio Do maggiore',
    level: 'facile', category: 'frammento',
    notes: [n(60), n(64), n(67), n(72)],
  },
  {
    id: 'frag-sol-mi-do', title: 'Arpeggio discendente',
    level: 'facile', category: 'frammento',
    notes: [n(72), n(67), n(64), n(60)],
  },
  {
    id: 'frag-stepwise-up', title: 'Frammento 1 — salita per gradi',
    level: 'facile', category: 'frammento',
    notes: [n(60), n(62), n(64), n(62), n(60)],
  },
  {
    id: 'frag-stepwise-down', title: 'Frammento 2 — discesa per gradi',
    level: 'facile', category: 'frammento',
    notes: [n(67), n(65), n(64), n(62), n(60)],
  },
  {
    id: 'frag-leaps-1', title: 'Frammento 3 — salti di terza',
    level: 'medio', category: 'frammento',
    notes: [n(60), n(64), n(62), n(65), n(64)],
  },
  {
    id: 'frag-leaps-2', title: 'Frammento 4 — salto di quinta',
    level: 'medio', category: 'frammento',
    notes: [n(60), n(67), n(65), n(64), n(62), n(60)],
  },
];
