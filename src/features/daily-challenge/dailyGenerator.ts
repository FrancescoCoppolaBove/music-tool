import { INTERVALS, CHORD_TYPES, CHROMATIC_NOTES } from '../ear-training/utils/interval-data';

// Seeded RNG — Mulberry32
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

// Day #N since app launch (like Wordle)
export function getDayNumber(): number {
  const epoch = new Date('2026-01-01T00:00:00Z').getTime();
  return Math.max(1, Math.floor((Date.now() - epoch) / 86400000) + 1);
}

function dateToSeed(date: string): number {
  return parseInt(date.replace(/-/g, ''), 10);
}

type QuestionType = 'interval' | 'chord';

export interface DailyQuestion {
  type: QuestionType;
  notes: string[];          // notes to play (sequential for interval, simultaneous for chord)
  correctAnswer: string;
  options: string[];        // 4 shuffled choices
}

export interface DailyResult {
  date: string;
  completed: boolean;
  firstTryCount: number;    // answers correct on first attempt
  total: number;
  emojis: string[];         // per-question: '⭐' | '🔶' | '❌'
  completedAt: number;
}

const DAILY_INTERVALS = INTERVALS.filter(i => i.semitones >= 2 && i.semitones <= 12);
const DAILY_CHORDS = CHORD_TYPES.filter(c => c.notes.length === 3); // triads only

function transposeNote(noteWithOctave: string, semitones: number): string {
  const name = noteWithOctave.replace(/\d+$/, '');
  const octave = parseInt(noteWithOctave.match(/\d+$/)?.[0] ?? '2');
  const idx = CHROMATIC_NOTES.indexOf(name);
  const newIdx = idx + semitones;
  const newOctave = octave + Math.floor(newIdx / 12);
  return `${CHROMATIC_NOTES[((newIdx % 12) + 12) % 12]}${newOctave}`;
}

export function generateDailyQuestions(date: string = getTodayKey()): DailyQuestion[] {
  const rng = mulberry32(dateToSeed(date));
  const r = () => rng();

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const pick = <T>(arr: T[]): T => arr[Math.floor(r() * arr.length)];

  // 5 questions: 3 intervals + 2 chords, order shuffled by seed
  const types = shuffle<QuestionType>(['interval', 'interval', 'interval', 'chord', 'chord']);

  // Safe root notes — keep everything within C2-C3 range
  const safeRoots = CHROMATIC_NOTES.slice(0, 9); // C to A

  return types.map(type => {
    const rootBase = pick(safeRoots);
    const root = `${rootBase}2`;

    if (type === 'interval') {
      const interval = pick(DAILY_INTERVALS);
      const second = transposeNote(root, interval.semitones);
      const wrongOpts = shuffle(DAILY_INTERVALS.filter(i => i.name !== interval.name))
        .slice(0, 3)
        .map(i => i.name);
      return {
        type: 'interval',
        notes: [root, second],
        correctAnswer: interval.name,
        options: shuffle([interval.name, ...wrongOpts]),
      };
    } else {
      const chord = pick(DAILY_CHORDS);
      const notes = chord.notes.map(s => transposeNote(root, s));
      const wrongOpts = shuffle(DAILY_CHORDS.filter(c => c.name !== chord.name))
        .slice(0, 3)
        .map(c => c.name);
      return {
        type: 'chord',
        notes,
        correctAnswer: chord.name,
        options: shuffle([chord.name, ...wrongOpts]),
      };
    }
  });
}

export function buildShareText(result: DailyResult): string {
  const stars = result.emojis.join('');
  return `🎵 Tonic Daily #${getDayNumber()}\n${stars}\n${result.firstTryCount}/${result.total} perfect\nhttps://music-tool-project.netlify.app`;
}
