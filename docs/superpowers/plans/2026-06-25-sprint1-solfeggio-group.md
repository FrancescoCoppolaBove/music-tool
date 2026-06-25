# Sprint 1 — Solfeggio Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Solfeggio" nav group to Tonic with three conservatory features: Ear Training Pro (Italian labels + AFAM modules + Allenamento/Esame modes), Solfeggio Cantato (Echo mode with pitchy), and Setticlavio (C-clef SVG exercises).

**Architecture:** Ear Training Pro wraps the existing `EarTrainingFeature` exercises (reusing `audio-player.ts` and `interval-data.ts`) for Allenamento mode and adds a self-contained `ExamSession` component (same data/audio, own state machine) for Esame mode. Solfeggio Cantato reuses `pitchTracker.ts` from nail-the-pitch. Setticlavio uses hand-drawn SVG with no external dependencies.

**Tech Stack:** React 18, TypeScript, Vite, existing `audio-player.ts` (MP3 pitch-shifted samples), `pitchy` (already installed), Firestore (optional, for exam saves).

---

## File map

**Modify:**
- `src/App.tsx` — new Solfeggio group, 3 new tabs, render branches, remove `ear` from Theory
- `src/features/ear-training/utils/interval-data.ts` — add `nameIT` to INTERVALS and CHORD_TYPES

**Create:**
```
src/features/ear-training-pro/
  types.ts
  EarTrainingProFeature.tsx
  components/
    ModuleSelector.tsx
    ExamSession.tsx
    ExamResults.tsx
    TonalFunctionsExercise.tsx
    CadencesEarExercise.tsx

src/features/solfeggio-cantato/
  types.ts
  SolfeggioCantatoFeature.tsx
  data/exercises.ts
  components/
    ExercisePlayer.tsx
    MicEvaluator.tsx
    SolfeggioResults.tsx

src/features/setticlavio/
  types.ts
  SetticlavioFeature.tsx
  data/exercises.ts
  components/
    CStaff.tsx
    NoteQuiz.tsx
```

---

## Task 1 — Italian labels in interval-data.ts

**Files:**
- Modify: `src/features/ear-training/utils/interval-data.ts`

- [ ] **Add `nameIT` to INTERVALS array**

Replace the existing `INTERVALS` export with:

```typescript
export const INTERVALS = [
  { semitones: 0,  name: 'Unison',              nameIT: 'Unisono',              shortName: 'P1' },
  { semitones: 1,  name: 'Minor 2nd',            nameIT: 'Seconda minore',       shortName: 'm2' },
  { semitones: 2,  name: 'Major 2nd',            nameIT: 'Seconda maggiore',     shortName: 'M2' },
  { semitones: 3,  name: 'Minor 3rd',            nameIT: 'Terza minore',         shortName: 'm3' },
  { semitones: 4,  name: 'Major 3rd',            nameIT: 'Terza maggiore',       shortName: 'M3' },
  { semitones: 5,  name: 'Perfect 4th',          nameIT: 'Quarta giusta',        shortName: 'P4' },
  { semitones: 6,  name: 'Tritone',              nameIT: 'Tritono',              shortName: 'TT' },
  { semitones: 7,  name: 'Perfect 5th',          nameIT: 'Quinta giusta',        shortName: 'P5' },
  { semitones: 8,  name: 'Minor 6th',            nameIT: 'Sesta minore',         shortName: 'm6' },
  { semitones: 9,  name: 'Major 6th',            nameIT: 'Sesta maggiore',       shortName: 'M6' },
  { semitones: 10, name: 'Minor 7th',            nameIT: 'Settima minore',       shortName: 'm7' },
  { semitones: 11, name: 'Major 7th',            nameIT: 'Settima maggiore',     shortName: 'M7' },
  { semitones: 12, name: 'Octave',               nameIT: 'Ottava',               shortName: 'P8' },
] as const;
```

- [ ] **Add `nameIT` to CHORD_TYPES array**

Replace the existing `CHORD_TYPES` export with:

```typescript
export const CHORD_TYPES = [
  { name: 'Major',               nameIT: 'Accordo maggiore',         notes: [0, 4, 7],        symbol: ''      },
  { name: 'Minor',               nameIT: 'Accordo minore',           notes: [0, 3, 7],        symbol: 'm'     },
  { name: 'Diminished',          nameIT: 'Accordo diminuito',        notes: [0, 3, 6],        symbol: 'dim'   },
  { name: 'Augmented',           nameIT: 'Accordo aumentato',        notes: [0, 4, 8],        symbol: 'aug'   },
  { name: 'Major 7th',           nameIT: 'Settima di sensibile',     notes: [0, 4, 7, 11],    symbol: 'maj7'  },
  { name: 'Dominant 7th',        nameIT: 'Settima di dominante',     notes: [0, 4, 7, 10],    symbol: '7'     },
  { name: 'Minor 7th',           nameIT: 'Settima di minore',        notes: [0, 3, 7, 10],    symbol: 'm7'    },
  { name: 'Half-diminished 7th', nameIT: 'Accordo semidiminuito',    notes: [0, 3, 6, 10],    symbol: 'm7♭5' },
];
```

- [ ] **Verify build still passes**

```bash
npm run build
```
Expected: no TypeScript errors (nameIT is additive).

- [ ] **Commit**

```bash
git add src/features/ear-training/utils/interval-data.ts
git commit -m "feat(ear-training): add Italian interval and chord names for AFAM curriculum"
```

---

## Task 2 — App.tsx: Solfeggio nav group + new tabs

**Files:**
- Modify: `src/App.tsx`

- [ ] **Add three new Tab values to the Tab union type**

Find the `type Tab = ...` declaration and add:
```typescript
  | 'eartrainingpro'
  | 'solfeggiocan'
  | 'setticlavio'
```

- [ ] **Add Solfeggio group to GROUPS array**

Insert before the `theory` group entry in the `GROUPS` array:

```typescript
{
  id: 'solfeggio',
  label: 'Solfeggio',
  icon: '🎓',
  tabs: [
    { id: 'eartrainingpro', label: 'Ear Training Pro', icon: '👂', desc: 'Intervalli, accordi, funzioni tonali — modalità Allenamento ed Esame' },
    { id: 'solfeggiocan',   label: 'Solfeggio Cantato', icon: '🎵', desc: 'Canta scale e intervalli — pitchy valuta la tua intonazione' },
    { id: 'setticlavio',    label: 'Setticlavio',       icon: '🗝️',  desc: 'Leggi note in chiave di contralto e tenore' },
  ],
},
```

- [ ] **Remove `ear` from the Theory group tabs array**

In the `theory` group, delete the entry `{ id: 'ear', label: 'Ear Training', ... }`.

- [ ] **Add three import statements** (after existing feature imports)

```typescript
import EarTrainingProFeature    from './features/ear-training-pro/EarTrainingProFeature';
import SolfeggioCantatoFeature  from './features/solfeggio-cantato/SolfeggioCantatoFeature';
import SetticlavioFeature       from './features/setticlavio/SetticlavioFeature';
```

- [ ] **Add three render branches in `<main>`**

```tsx
{activeTab === 'eartrainingpro' && <EarTrainingProFeature />}
{activeTab === 'solfeggiocan'   && <SolfeggioCantatoFeature />}
{activeTab === 'setticlavio'    && <SetticlavioFeature />}
```

- [ ] **Verify build passes** (feature files don't exist yet — add stub files)

Create stub files so TypeScript doesn't error:

```typescript
// src/features/ear-training-pro/EarTrainingProFeature.tsx
export default function EarTrainingProFeature() { return <div>EarTrainingPro</div>; }

// src/features/solfeggio-cantato/SolfeggioCantatoFeature.tsx
export default function SolfeggioCantatoFeature() { return <div>SolfeggioCantatoFeature</div>; }

// src/features/setticlavio/SetticlavioFeature.tsx
export default function SetticlavioFeature() { return <div>SetticlavioFeature</div>; }
```

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/App.tsx src/features/ear-training-pro/EarTrainingProFeature.tsx \
        src/features/solfeggio-cantato/SolfeggioCantatoFeature.tsx \
        src/features/setticlavio/SetticlavioFeature.tsx
git commit -m "feat(nav): add Solfeggio group with Ear Training Pro, Solfeggio Cantato, Setticlavio stubs"
```

---

## Task 3 — Ear Training Pro: types + ExamSession state

**Files:**
- Create: `src/features/ear-training-pro/types.ts`
- Create: `src/features/ear-training-pro/components/ExamResults.tsx`
- Create: `src/features/ear-training-pro/components/ExamSession.tsx`

- [ ] **Write types.ts**

```typescript
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
```

- [ ] **Write ExamResults.tsx**

```tsx
// src/features/ear-training-pro/components/ExamResults.tsx
import React from 'react';
import { ExamSessionResult, ExamAnswer } from '../types';

const MODULE_LABELS: Record<string, string> = {
  'melodic-intervals':  'Intervalli Melodici',
  'harmonic-intervals': 'Intervalli Armonici',
  'triads':             'Triadi',
  'sevenths':           'Accordi di Settima',
  'tonal-functions':    'Funzioni Tonali',
  'cadences':           'Cadenze',
};

export function ExamResults({
  result,
  onRetry,
  onBack,
}: {
  result: ExamSessionResult;
  onRetry: () => void;
  onBack: () => void;
}) {
  const scoreColor = result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor, fontFamily: "'Syne', sans-serif" }}>
          {result.score}%
        </div>
        <div style={{ fontSize: 14, color: '#8b949e', marginTop: 4 }}>
          {MODULE_LABELS[result.moduleId]} · Livello {result.level}
        </div>
        <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
          {result.answers.filter(a => a.isCorrect).length}/{result.answers.length} corrette
          · {Math.round(result.durationMs / 1000)}s
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {result.answers.map((a, i) => (
          <div
            key={a.questionId}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              background: a.isCorrect ? '#22c55e18' : '#ef444418',
              border: `1px solid ${a.isCorrect ? '#22c55e30' : '#ef444430'}`,
              borderRadius: 8, fontSize: 13,
            }}
          >
            <span style={{ color: a.isCorrect ? '#22c55e' : '#ef4444', fontWeight: 700, width: 20 }}>
              {a.isCorrect ? '✓' : '✗'}
            </span>
            <span style={{ color: '#8b949e', width: 20 }}>{i + 1}.</span>
            <span style={{ flex: 1, color: '#e6edf3' }}>{a.correct}</span>
            {!a.isCorrect && (
              <span style={{ color: '#ef4444', fontSize: 12 }}>hai detto: {a.given}</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 1, padding: '12px', background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Riprova
        </button>
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: '12px', background: '#21262d', color: '#e6edf3',
            border: '1px solid #30363d', borderRadius: 10, fontSize: 14, cursor: 'pointer',
          }}
        >
          Cambia modulo
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Write ExamSession.tsx**

```tsx
// src/features/ear-training-pro/components/ExamSession.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import { ExamQuestion, ExamAnswer, ExamSessionResult, EarModuleId, ExerciseLevel } from '../types';
import { ExamResults } from './ExamResults';

interface Props {
  moduleId: EarModuleId;
  level: ExerciseLevel;
  questions: ExamQuestion[];   // pre-generated, shuffled, length = 10
  onBack: () => void;
}

type Phase = 'question' | 'results';

export function ExamSession({ moduleId, level, questions, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('question');
  const [idx, setIdx]     = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const startTime = useRef(Date.now());
  const questionStart = useRef(Date.now());

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const q = questions[idx];

  const play = useCallback(async () => {
    if (isPlaying || !q) return;
    setIsPlaying(true);
    try {
      if (q.playMode === 'sequential') {
        await audioPlayer.playSequence(midiToNoteNames(q.notes), q.gapMs ?? 600, 0.8);
      } else {
        audioPlayer.playChord(midiToNoteNames(q.notes));
      }
    } finally {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  }, [q, isPlaying]);

  // Auto-play on new question
  useEffect(() => {
    questionStart.current = Date.now();
    play();
  }, [idx]);

  function handleAnswer(choice: string) {
    const ans: ExamAnswer = {
      questionId: q.id,
      given: choice,
      correct: q.correct,
      isCorrect: choice === q.correct,
      timeMs: Date.now() - questionStart.current,
    };
    const next = [...answers, ans];
    setAnswers(next);
    if (idx + 1 >= questions.length) {
      setPhase('results');
    } else {
      setIdx(i => i + 1);
    }
  }

  const result: ExamSessionResult = {
    moduleId, level,
    answers,
    score: answers.length ? Math.round(answers.filter(a => a.isCorrect).length / answers.length * 100) : 0,
    durationMs: Date.now() - startTime.current,
    completedAt: new Date().toISOString(),
  };

  if (phase === 'results') {
    return (
      <ExamResults
        result={result}
        onRetry={() => { setPhase('question'); setIdx(0); setAnswers([]); startTime.current = Date.now(); }}
        onBack={onBack}
      />
    );
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#8b949e' }}>
          Domanda <strong style={{ color: '#e6edf3' }}>{idx + 1}</strong> di {questions.length}
        </div>
        <div style={{ fontSize: 13, color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>
          ⏱ {mins}:{secs}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#21262d', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ width: `${(idx / questions.length) * 100}%`, height: '100%', background: '#7c3aed', borderRadius: 2, transition: 'width .3s' }} />
      </div>

      {/* Play button */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '12px 32px', background: isPlaying ? '#4b5563' : '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 14, fontWeight: 700, cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? '▶ Suono…' : '▶ Riascolta'}
        </button>
      </div>

      {/* Choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {q.choices.map(c => (
          <button
            key={c}
            onClick={() => handleAnswer(c)}
            style={{
              padding: '14px 10px', background: '#1c2128',
              border: '1px solid #30363d', borderRadius: 10,
              color: '#e6edf3', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteNames(midis: number[]): string[] {
  return midis.map(m => {
    const oct = Math.floor(m / 12) - 1;
    const pc  = m % 12;
    return `${NOTE_NAMES[pc]}${oct}`;
  });
}
```

- [ ] **Run build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/features/ear-training-pro/
git commit -m "feat(ear-training-pro): add types, ExamSession, ExamResults components"
```

---

## Task 4 — Ear Training Pro: question generators

**Files:**
- Create: `src/features/ear-training-pro/data/index.ts`

This module generates `ExamQuestion[]` for each module. All question randomisation is here.

- [ ] **Write data/index.ts**

```typescript
// src/features/ear-training-pro/data/index.ts
import { EarModuleId, ExerciseLevel, ExamQuestion } from '../types';
import { INTERVALS, CHORD_TYPES } from '../../ear-training/utils/interval-data';

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick4(correct: string, pool: string[]): string[] {
  const wrong = shuffle(pool.filter(x => x !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

// ─── Interval generators ────────────────────────────────────────────────────

const INTERVAL_HINTS: Partial<Record<string, string>> = {
  'Seconda maggiore': 'Fra Martino (prime 2 note)',
  'Terza minore':     'Greensleeves (prime 2 note)',
  'Terza maggiore':   'Oh Happy Day (prime 2 note)',
  'Quarta giusta':    'Here Comes the Bride (prime 2 note)',
  'Tritono':          'The Simpsons (prime 2 note)',
  'Quinta giusta':    'Star Wars (prime 2 note)',
  'Sesta maggiore':   'My Bonnie (prime 2 note)',
  'Settima maggiore': 'Take On Me (prime 2 note)',
  'Ottava':           'Over the Rainbow (prime 2 note)',
};

const INTERVALS_BY_LEVEL: Record<ExerciseLevel, number[]> = {
  1: [2, 3, 4, 5, 7],               // M2 m3 M3 P4 P5
  2: [1, 2, 3, 4, 5, 7, 8, 9],      // adds m2 m6 M6
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // all
};

// Root notes (MIDI): C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, Bb4=70
const ROOTS = [60, 62, 64, 65, 67, 69, 70];

function buildIntervalQuestions(level: ExerciseLevel, playMode: 'sequential' | 'simultaneous', count: number): ExamQuestion[] {
  const semiList = INTERVALS_BY_LEVEL[level];
  const allNames = semiList.map(s => INTERVALS.find(i => i.semitones === s)!.nameIT);
  const questions: ExamQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const semi   = semiList[i % semiList.length];
    const root   = ROOTS[Math.floor(Math.random() * ROOTS.length)];
    const upper  = root + semi;
    const iData  = INTERVALS.find(x => x.semitones === semi)!;
    const correct = iData.nameIT;

    questions.push({
      id:       `${playMode}-${semi}-${root}-${i}`,
      notes:    [root, upper],
      playMode,
      gapMs:    600,
      correct,
      choices:  pick4(correct, allNames),
      hint:     INTERVAL_HINTS[correct],
    });
  }
  return shuffle(questions);
}

// ─── Chord generators ───────────────────────────────────────────────────────

const CHORD_ROOTS = [60, 62, 65, 67, 69]; // C D F G A

const TRIADS_BY_LEVEL = {
  1: ['Major', 'Minor'],
  2: ['Major', 'Minor', 'Diminished', 'Augmented'],
  3: ['Major', 'Minor', 'Diminished', 'Augmented'],
};

const INVERSIONS_BY_LEVEL: Record<ExerciseLevel, number[]> = {
  1: [0],
  2: [0, 1],
  3: [0, 1, 2],
};

function buildTriadQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  const typeNames = TRIADS_BY_LEVEL[level as 1|2|3];
  const invs      = INVERSIONS_BY_LEVEL[level];
  const allLabels = typeNames.flatMap(name => {
    const t = CHORD_TYPES.find(c => c.name === name)!;
    return invs.map(inv => inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`);
  });

  const questions: ExamQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const typeName = typeNames[Math.floor(Math.random() * typeNames.length)];
    const t        = CHORD_TYPES.find(c => c.name === typeName)!;
    const inv      = invs[Math.floor(Math.random() * invs.length)];
    const root     = CHORD_ROOTS[Math.floor(Math.random() * CHORD_ROOTS.length)];
    const rotated  = rotateChord(t.notes.map(n => root + n), inv);
    const label    = inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`;

    questions.push({
      id:      `triad-${typeName}-${inv}-${root}-${i}`,
      notes:   rotated,
      playMode: 'simultaneous',
      correct: label,
      choices: pick4(label, allLabels),
    });
  }
  return shuffle(questions);
}

function buildSeventhQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  const seventhTypes = level === 1
    ? ['Dominant 7th']
    : level === 2
      ? ['Dominant 7th', 'Major 7th', 'Minor 7th']
      : ['Dominant 7th', 'Major 7th', 'Minor 7th', 'Half-diminished 7th'];
  const invs = INVERSIONS_BY_LEVEL[level];
  const allLabels = seventhTypes.flatMap(name => {
    const t = CHORD_TYPES.find(c => c.name === name)!;
    return invs.map(inv => inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`);
  });

  const questions: ExamQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const typeName = seventhTypes[Math.floor(Math.random() * seventhTypes.length)];
    const t        = CHORD_TYPES.find(c => c.name === typeName)!;
    const inv      = invs[Math.floor(Math.random() * invs.length)];
    const root     = CHORD_ROOTS[Math.floor(Math.random() * CHORD_ROOTS.length)];
    const rotated  = rotateChord(t.notes.map(n => root + n), inv);
    const label    = inv === 0 ? t.nameIT : `${t.nameIT} (${inv}° rivolto)`;

    questions.push({
      id:      `seventh-${typeName}-${inv}-${root}-${i}`,
      notes:   rotated,
      playMode: 'simultaneous',
      correct: label,
      choices: pick4(label, allLabels),
    });
  }
  return shuffle(questions);
}

function rotateChord(notes: number[], inversion: number): number[] {
  const arr = [...notes];
  for (let i = 0; i < inversion; i++) {
    arr.push(arr.shift()! + 12);
  }
  return arr;
}

// ─── Tonal functions ────────────────────────────────────────────────────────

const TONAL_LABELS = ['Tonica (I)', 'Sottodominante (IV)', 'Dominante (V)'];

// Simple: play a single chord, identify its function in C major
const TONAL_CHORDS: Record<string, number[]> = {
  'Tonica (I)':          [60, 64, 67],  // C major
  'Sottodominante (IV)': [65, 69, 72],  // F major
  'Dominante (V)':       [67, 71, 74],  // G major
};

function buildTonalFunctionQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  // Level 2-3: add dominant 7th and play in different keys
  const labels = level === 1 ? TONAL_LABELS : [...TONAL_LABELS, 'Dominante 7a (V7)'];
  const questions: ExamQuestion[] = [];

  const roots = level === 1 ? [0] : [0, 5, 7]; // C, F, G as tonic centers
  for (let i = 0; i < count; i++) {
    const label     = labels[Math.floor(Math.random() * labels.length)];
    const rootShift = roots[Math.floor(Math.random() * roots.length)];
    let notes       = (TONAL_CHORDS[label] ?? TONAL_CHORDS['Dominante (V)']).map(n => n + rootShift);
    if (label === 'Dominante 7a (V7)') notes = [67 + rootShift, 71 + rootShift, 74 + rootShift, 77 + rootShift];

    questions.push({
      id:      `tonal-${label}-${rootShift}-${i}`,
      notes,
      playMode: 'simultaneous',
      correct: label,
      choices: pick4(label, labels),
    });
  }
  return shuffle(questions);
}

// ─── Cadences ───────────────────────────────────────────────────────────────

// Each cadence is two chords: [chord1Notes, chord2Notes]. We play them sequentially.
const CADENCE_DEFS: Array<{ label: string; chord1: number[]; chord2: number[] }> = [
  { label: 'Cadenza autentica (V→I)',  chord1: [67, 71, 74],    chord2: [60, 64, 67] },
  { label: 'Cadenza plagale (IV→I)',   chord1: [65, 69, 72],    chord2: [60, 64, 67] },
  { label: 'Cadenza evitata (V→VI)',   chord1: [67, 71, 74],    chord2: [69, 72, 76] },
  { label: 'Semicadenza (I→V)',        chord1: [60, 64, 67],    chord2: [67, 71, 74] },
];

const CADENCE_LABELS = CADENCE_DEFS.map(c => c.label);

function buildCadenceQuestions(level: ExerciseLevel, count: number): ExamQuestion[] {
  const pool = level === 1 ? CADENCE_DEFS.slice(0, 2) : CADENCE_DEFS;
  const labels = pool.map(c => c.label);
  const questions: ExamQuestion[] = [];

  // Transpose by rootShift to avoid memorisation of fixed pitch
  const shifts = [0, 2, 5, 7];
  for (let i = 0; i < count; i++) {
    const def   = pool[Math.floor(Math.random() * pool.length)];
    const shift = shifts[Math.floor(Math.random() * shifts.length)];
    // Encode two chords as one flat array separated by a sentinel (999)
    const notes = [...def.chord1.map(n => n + shift), 999, ...def.chord2.map(n => n + shift)];

    questions.push({
      id:      `cadence-${def.label}-${shift}-${i}`,
      notes,
      playMode: 'sequential', // ExamSession will handle sentinel
      gapMs:    700,
      correct:  def.label,
      choices:  pick4(def.label, CADENCE_LABELS),
    });
  }
  return shuffle(questions);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function generateQuestions(moduleId: EarModuleId, level: ExerciseLevel, count = 10): ExamQuestion[] {
  switch (moduleId) {
    case 'melodic-intervals':  return buildIntervalQuestions(level, 'sequential', count);
    case 'harmonic-intervals': return buildIntervalQuestions(level, 'simultaneous', count);
    case 'triads':             return buildTriadQuestions(level, count);
    case 'sevenths':           return buildSeventhQuestions(level, count);
    case 'tonal-functions':    return buildTonalFunctionQuestions(level, count);
    case 'cadences':           return buildCadenceQuestions(level, count);
  }
}
```

- [ ] **Update ExamSession to handle cadence sentinel (999)**

In `ExamSession.tsx`, replace the `play` callback with:

```typescript
const play = useCallback(async () => {
  if (isPlaying || !q) return;
  setIsPlaying(true);
  try {
    // Cadences: notes array contains sentinel 999 separating two chords
    if (q.notes.includes(999)) {
      const sep   = q.notes.indexOf(999);
      const chord1 = midiToNoteNames(q.notes.slice(0, sep));
      const chord2 = midiToNoteNames(q.notes.slice(sep + 1));
      audioPlayer.playChord(chord1);
      await new Promise(r => setTimeout(r, (q.gapMs ?? 700) + 500));
      audioPlayer.playChord(chord2);
    } else if (q.playMode === 'sequential') {
      await audioPlayer.playSequence(midiToNoteNames(q.notes), q.gapMs ?? 600, 0.8);
    } else {
      audioPlayer.playChord(midiToNoteNames(q.notes));
    }
  } finally {
    setTimeout(() => setIsPlaying(false), 1500);
  }
}, [q, isPlaying]);
```

- [ ] **Run build**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add src/features/ear-training-pro/data/
git commit -m "feat(ear-training-pro): add question generators for all 6 modules"
```

---

## Task 5 — Ear Training Pro: ModuleSelector + EarTrainingProFeature

**Files:**
- Create: `src/features/ear-training-pro/components/ModuleSelector.tsx`
- Replace: `src/features/ear-training-pro/EarTrainingProFeature.tsx`

- [ ] **Write ModuleSelector.tsx**

```tsx
// src/features/ear-training-pro/components/ModuleSelector.tsx
import React, { useState } from 'react';
import { EarModuleId, ExerciseMode, ExerciseLevel } from '../types';

const MODULES: Array<{ id: EarModuleId; icon: string; label: string; desc: string }> = [
  { id: 'melodic-intervals',  icon: '🎵', label: 'Intervalli Melodici',  desc: 'Ascolta due note in sequenza' },
  { id: 'harmonic-intervals', icon: '🎶', label: 'Intervalli Armonici',  desc: 'Ascolta due note simultanee' },
  { id: 'triads',             icon: '🎹', label: 'Triadi',               desc: 'Maggiore, minore, dim, aug + rivolti' },
  { id: 'sevenths',           icon: '🎸', label: 'Accordi di Settima',   desc: 'Dom7, maj7, min7, semidim + rivolti' },
  { id: 'tonal-functions',    icon: '🧲', label: 'Funzioni Tonali',      desc: 'Tonica, dominante, sottodominante' },
  { id: 'cadences',           icon: '🎓', label: 'Cadenze',              desc: 'Autentica, plagale, evitata, semicadenza' },
];

interface Selection { moduleId: EarModuleId; level: ExerciseLevel; mode: ExerciseMode }

export function ModuleSelector({ onStart }: { onStart: (s: Selection) => void }) {
  const [selected, setSelected] = useState<EarModuleId>('melodic-intervals');
  const [level, setLevel]       = useState<ExerciseLevel>(1);
  const [mode, setMode]         = useState<ExerciseMode>('training');

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, color: '#e6edf3', marginBottom: 4 }}>
        Ear Training Pro
      </h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Scegli modulo, livello e modalità</p>

      {/* Module grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              padding: '12px 14px', textAlign: 'left',
              background: selected === m.id ? '#7c3aed18' : '#1c2128',
              border: `1px solid ${selected === m.id ? '#7c3aed' : '#30363d'}`,
              borderRadius: 10, cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected === m.id ? '#c4b5fd' : '#e6edf3' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Level */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
          Livello
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([1, 2, 3] as ExerciseLevel[]).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: level === l ? '#7c3aed' : '#21262d',
                border: `1px solid ${level === l ? '#7c3aed' : '#30363d'}`,
                color: level === l ? '#fff' : '#8b949e',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {l === 1 ? '1 — Base' : l === 2 ? '2 — Intermedio' : '3 — Avanzato'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {(['training', 'exam'] as ExerciseMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '14px', textAlign: 'center', borderRadius: 10,
              background: mode === m ? '#7c3aed18' : '#1c2128',
              border: `1px solid ${mode === m ? '#7c3aed' : '#30363d'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{m === 'training' ? '🏋️' : '📝'}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: mode === m ? '#c4b5fd' : '#e6edf3' }}>
              {m === 'training' ? 'Allenamento' : 'Esame'}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {m === 'training' ? 'Feedback immediato · infinito' : '10 domande · timer · report'}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart({ moduleId: selected, level, mode })}
        style={{
          width: '100%', padding: '14px', background: '#7c3aed', color: '#fff',
          border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Inizia →
      </button>
    </div>
  );
}
```

- [ ] **Replace EarTrainingProFeature.tsx**

```tsx
// src/features/ear-training-pro/EarTrainingProFeature.tsx
import React, { useState } from 'react';
import { EarModuleId, ExerciseLevel, ExerciseMode } from './types';
import { ModuleSelector } from './components/ModuleSelector';
import { ExamSession } from './components/ExamSession';
import { generateQuestions } from './data/index';

// For training mode, reuse existing exercise components
import { IntervalsExercise }       from '../ear-training/components/IntervalsExercise';
import { ChordsExercise }          from '../ear-training/components/ChordsExercise';
import { ScalesExercise }          from '../ear-training/components/ScalesExercise';

type Screen = 'selector' | 'training' | 'exam';

interface ActiveConfig { moduleId: EarModuleId; level: ExerciseLevel; mode: ExerciseMode }

export default function EarTrainingProFeature() {
  const [screen, setScreen] = useState<Screen>('selector');
  const [config, setConfig] = useState<ActiveConfig | null>(null);

  function handleStart(sel: ActiveConfig) {
    setConfig(sel);
    setScreen(sel.mode === 'exam' ? 'exam' : 'training');
  }

  function handleBack() {
    setScreen('selector');
    setConfig(null);
  }

  if (screen === 'selector' || !config) {
    return <ModuleSelector onStart={handleStart} />;
  }

  if (screen === 'exam') {
    const questions = generateQuestions(config.moduleId, config.level, 10);
    return (
      <ExamSession
        moduleId={config.moduleId}
        level={config.level}
        questions={questions}
        onBack={handleBack}
      />
    );
  }

  // Training mode — reuse existing exercises (they have full settings UI)
  return (
    <div>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handleBack}
          style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 13 }}
        >
          ← Cambia modulo
        </button>
      </div>
      <TrainingExercise moduleId={config.moduleId} />
    </div>
  );
}

function TrainingExercise({ moduleId }: { moduleId: EarModuleId }) {
  switch (moduleId) {
    case 'melodic-intervals':
    case 'harmonic-intervals':
      return <IntervalsExercise />;
    case 'triads':
    case 'sevenths':
      return <ChordsExercise />;
    case 'tonal-functions':
      // Built in Task 6
      return <div style={{ padding: 24, color: '#8b949e' }}>Tonal Functions — coming in next task</div>;
    case 'cadences':
      return <div style={{ padding: 24, color: '#8b949e' }}>Cadences Training — coming in next task</div>;
    default:
      return null;
  }
}
```

- [ ] **Run dev server and verify the Solfeggio → Ear Training Pro tab opens, module selector renders, exam mode runs 10 questions**

```bash
npm run dev
```

Navigate to Solfeggio → Ear Training Pro. Test:
1. Select Intervalli Melodici → Livello 1 → Esame → Inizia → audio plays, 4 choices appear, progress bar advances, results shown at end
2. Select Triadi → Allenamento → shows existing ChordsExercise UI

- [ ] **Commit**

```bash
git add src/features/ear-training-pro/
git commit -m "feat(ear-training-pro): ModuleSelector + feature entry wired, exam mode functional"
```

---

## Task 6 — Tonal Functions training component

**Files:**
- Create: `src/features/ear-training-pro/components/TonalFunctionsExercise.tsx`
- Modify: `src/features/ear-training-pro/EarTrainingProFeature.tsx` (replace placeholder)

- [ ] **Write TonalFunctionsExercise.tsx**

```tsx
// src/features/ear-training-pro/components/TonalFunctionsExercise.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import { useExerciseScore } from '../../../shared/hooks/useExerciseScore';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiName(midi: number): string {
  const oct = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${oct}`;
}

interface TonalQuestion {
  tonicRoot: number;     // MIDI of tonic (e.g. 60 = C4)
  tonicLabel: string;    // e.g. "Do maggiore"
  functionLabel: string; // 'Tonica (I)' | 'Dominante (V)' | 'Sottodominante (IV)'
  notes: number[];
}

const TONIC_LABELS: Record<number, string> = {
  60: 'Do', 62: 'Re', 65: 'Fa', 67: 'Sol', 69: 'La',
};

function makeQuestion(): TonalQuestion {
  const roots = [60, 62, 65, 67, 69];
  const tonic = roots[Math.floor(Math.random() * roots.length)];
  const fns = [
    { label: 'Tonica (I)',          offsets: [0, 4, 7]   },
    { label: 'Dominante (V)',       offsets: [7, 11, 14] },
    { label: 'Sottodominante (IV)', offsets: [5, 9, 12]  },
  ];
  const fn = fns[Math.floor(Math.random() * fns.length)];
  return {
    tonicRoot: tonic,
    tonicLabel: TONIC_LABELS[tonic] ?? 'Do',
    functionLabel: fn.label,
    notes: fn.offsets.map(o => tonic + o),
  };
}

const ALL_FUNCTIONS = ['Tonica (I)', 'Dominante (V)', 'Sottodominante (IV)'];

export function TonalFunctionsExercise() {
  const [q, setQ]             = useState<TonalQuestion>(() => makeQuestion());
  const [selected, setSelected] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { score, setScore, streak, setStreak } = useExerciseScore('tonal-functions');

  useEffect(() => { play(); }, [q]);

  const play = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      // First play a I-IV-V-I context in the tonic, then the target chord
      const r = q.tonicRoot;
      await audioPlayer.playChord([midiName(r), midiName(r+4), midiName(r+7)]);
      await new Promise(res => setTimeout(res, 500));
      audioPlayer.playChord(q.notes.map(midiName));
    } finally {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  }, [q, isPlaying]);

  function handleAnswer(choice: string) {
    if (selected) return;
    setSelected(choice);
    const correct = choice === q.functionLabel;
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setStreak(correct ? (prev: number) => prev + 1 : () => 0);
    setTimeout(() => { setQ(makeQuestion()); setSelected(null); }, 1200);
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          Tonalità di contesto: <strong style={{ color: '#c4b5fd' }}>{q.tonicLabel} maggiore</strong>
        </div>
        <div style={{ fontSize: 12, color: '#4b5563' }}>
          Ascolta il contesto, poi identifica la funzione dell'accordo target
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '10px 28px', background: isPlaying ? '#4b5563' : '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 13, fontWeight: 700, cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? 'Suono…' : '▶ Riascolta'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ALL_FUNCTIONS.map(fn => {
          const isSelected = selected === fn;
          const isCorrect  = fn === q.functionLabel;
          const bg = !selected ? '#1c2128'
            : isSelected && isCorrect ? '#22c55e18'
            : isSelected ? '#ef444418'
            : isCorrect && selected ? '#22c55e18'
            : '#1c2128';
          const border = !selected ? '#30363d'
            : isCorrect ? '#22c55e50' : isSelected ? '#ef444450' : '#30363d';

          return (
            <button
              key={fn}
              onClick={() => handleAnswer(fn)}
              disabled={!!selected}
              style={{
                padding: '14px 16px', background: bg,
                border: `1px solid ${border}`, borderRadius: 10,
                color: '#e6edf3', fontSize: 14, fontWeight: 600,
                cursor: selected ? 'default' : 'pointer', textAlign: 'left',
              }}
            >
              {fn}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#4b5563' }}>
        {score.total > 0 && `${score.correct}/${score.total} corrette · streak: ${streak}`}
      </div>
    </div>
  );
}
```

- [ ] **Wire TonalFunctionsExercise into TrainingExercise in EarTrainingProFeature.tsx**

Replace the tonal-functions placeholder in the `TrainingExercise` function:

```tsx
import { TonalFunctionsExercise } from './components/TonalFunctionsExercise';

// inside switch:
case 'tonal-functions':
  return <TonalFunctionsExercise />;
```

- [ ] **Test in browser**: Solfeggio → Ear Training Pro → Funzioni Tonali → Allenamento. Verify context chord plays, then target chord plays, correct answer highlighted green.

- [ ] **Commit**

```bash
git add src/features/ear-training-pro/components/TonalFunctionsExercise.tsx \
        src/features/ear-training-pro/EarTrainingProFeature.tsx
git commit -m "feat(ear-training-pro): add Tonal Functions training exercise"
```

---

## Task 7 — Solfeggio Cantato: types + exercise data

**Files:**
- Create: `src/features/solfeggio-cantato/types.ts`
- Create: `src/features/solfeggio-cantato/data/exercises.ts`

- [ ] **Write types.ts**

```typescript
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
```

- [ ] **Write data/exercises.ts** (subset of 80 — scales + intervals, enough to demo)

```typescript
// src/features/solfeggio-cantato/data/exercises.ts
import { SolfeggioExercise } from '../types';

const IT = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];

// MIDI: C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71, C5=72
function n(midi: number, durationMs = 1500): { midi: number; label: string; durationMs: number } {
  const NOTE_MAP: Record<number, string> = {
    60: 'Do', 62: 'Re', 64: 'Mi', 65: 'Fa', 67: 'Sol', 69: 'La', 71: 'Si',
    72: 'Do', 74: 'Re', 76: 'Mi', 77: 'Fa', 79: 'Sol', 81: 'La', 83: 'Si',
    57: 'La', 59: 'Si',
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
    notes: [n(67), n(69), n(71), n(72), n(74), n(76), n(78), n(79)].map(x => ({...x, label: ['Sol','La','Si','Do','Re','Mi','Fa#','Sol'][0]})),
    // re-label for G major
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
```

- [ ] **Commit**

```bash
git add src/features/solfeggio-cantato/
git commit -m "feat(solfeggio-cantato): add types and exercise library"
```

---

## Task 8 — Solfeggio Cantato: MicEvaluator + session hook

**Files:**
- Create: `src/features/solfeggio-cantato/components/MicEvaluator.tsx`

The `PitchTracker` class lives in `src/features/nail-the-pitch/pitchTracker.ts` and exports `PitchTracker`, `PitchReading`, `UNVOICED`, and `midiToFreq`. Import directly — no copy needed.

- [ ] **Write MicEvaluator.tsx**

```tsx
// src/features/solfeggio-cantato/components/MicEvaluator.tsx
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { PitchTracker, PitchReading, UNVOICED } from '../../nail-the-pitch/pitchTracker';
import { SolfeggioNote, NoteEvaluation } from '../types';

export interface MicEvaluatorHandle {
  /** Start evaluating against the given sequence of notes */
  start: (notes: SolfeggioNote[], onDone: (evals: NoteEvaluation[]) => void) => void;
  stop: () => void;
}

export const MicEvaluator = forwardRef<MicEvaluatorHandle>(function MicEvaluator(_, ref) {
  const trackerRef   = useRef<PitchTracker | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [listening, setListening] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [level, setLevel] = useState(0); // 0-1 input level indicator

  useImperativeHandle(ref, () => ({
    start: async (notes: SolfeggioNote[], onDone: (evals: NoteEvaluation[]) => void) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source   = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const tracker  = new PitchTracker();
      trackerRef.current = tracker;
      const buf      = new Float32Array(analyser.fftSize);
      const evals: NoteEvaluation[] = [];
      let noteIdx = 0;
      let noteStart = Date.now();

      setListening(true);
      setCurrentLabel(notes[0]?.label ?? '');

      // Collect frequencies for current note for durationMs, then advance
      const SAMPLE_WINDOW = 100; // ms per frame
      const readings: number[] = []; // midi values while on this note

      function frame() {
        analyser.getFloatTimeDomainData(buf);
        const reading: PitchReading = tracker.detect(buf, audioCtx.sampleRate);

        if (reading.voiced) {
          readings.push(reading.midi);
          setLevel(reading.clarity);
        }

        const elapsed = Date.now() - noteStart;
        const note    = notes[noteIdx];

        if (elapsed >= note.durationMs) {
          // Evaluate this note
          const median = medianMidi(readings);
          let ev: NoteEvaluation;
          if (median === null) {
            ev = { note, status: 'missed', centsOff: 0 };
          } else {
            const centsOff = (median - note.midi) * 100;
            const status   = Math.abs(centsOff) <= 50 ? 'correct' : centsOff > 0 ? 'sharp' : 'flat';
            ev = { note, status, centsOff: Math.round(centsOff) };
          }
          evals.push(ev);
          readings.length = 0;
          noteIdx++;
          noteStart = Date.now();

          if (noteIdx >= notes.length) {
            // Done
            stream.getTracks().forEach(t => t.stop());
            audioCtx.close();
            setListening(false);
            cancelAnimationFrame(animFrameRef.current);
            onDone(evals);
            return;
          }
          setCurrentLabel(notes[noteIdx].label);
        }

        animFrameRef.current = requestAnimationFrame(frame);
      }

      animFrameRef.current = requestAnimationFrame(frame);
    },

    stop: () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setListening(false);
    },
  }));

  if (!listening) return null;

  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: '#c4b5fd', fontFamily: "'Syne', sans-serif" }}>
        {currentLabel}
      </div>
      <div style={{ height: 6, background: '#21262d', borderRadius: 3, margin: '10px auto', maxWidth: 200, overflow: 'hidden' }}>
        <div style={{ width: `${level * 100}%`, height: '100%', background: '#22c55e', borderRadius: 3, transition: 'width .05s' }} />
      </div>
      <div style={{ fontSize: 11, color: '#4b5563' }}>🎤 In ascolto…</div>
    </div>
  );
});

function medianMidi(readings: number[]): number | null {
  if (readings.length === 0) return null;
  const sorted = [...readings].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
```

- [ ] **Commit**

```bash
git add src/features/solfeggio-cantato/components/MicEvaluator.tsx
git commit -m "feat(solfeggio-cantato): add MicEvaluator component with pitchTracker integration"
```

---

## Task 9 — Solfeggio Cantato: ExercisePlayer + Results + Feature entry

**Files:**
- Create: `src/features/solfeggio-cantato/components/ExercisePlayer.tsx`
- Create: `src/features/solfeggio-cantato/components/SolfeggioResults.tsx`
- Replace: `src/features/solfeggio-cantato/SolfeggioCantatoFeature.tsx`

- [ ] **Write ExercisePlayer.tsx**

```tsx
// src/features/solfeggio-cantato/components/ExercisePlayer.tsx
import React, { useRef, useState, useCallback } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import { SolfeggioExercise, NoteEvaluation } from '../types';
import { MicEvaluator, MicEvaluatorHandle } from './MicEvaluator';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToAudioName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

type Phase = 'idle' | 'playing-model' | 'waiting' | 'recording' | 'done';

export function ExercisePlayer({
  exercise,
  onResult,
}: {
  exercise: SolfeggioExercise;
  onResult: (evals: NoteEvaluation[]) => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const micRef = useRef<MicEvaluatorHandle>(null);

  const playModel = useCallback(async () => {
    setPhase('playing-model');
    const names = exercise.notes.map(n => midiToAudioName(n.midi));
    await audioPlayer.playSequence(names, 600, 0.8);
    setPhase('waiting');
  }, [exercise]);

  async function handleSing() {
    setPhase('recording');
    micRef.current?.start(exercise.notes, evals => {
      setPhase('done');
      onResult(evals);
    });
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{exercise.category} · {exercise.level}</div>
      <h3 style={{ fontSize: 18, color: '#e6edf3', marginBottom: 20 }}>{exercise.title}</h3>

      {/* Note pills */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {exercise.notes.map((note, i) => (
          <div
            key={i}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#21262d', border: '1px solid #30363d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: '#8b949e',
            }}
          >
            {note.label}
          </div>
        ))}
      </div>

      {phase === 'idle' && (
        <button
          onClick={playModel}
          style={{ padding: '12px 32px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          ▶ Ascolta modello
        </button>
      )}

      {phase === 'playing-model' && (
        <div style={{ fontSize: 13, color: '#8b949e' }}>Suono in corso…</div>
      )}

      {phase === 'waiting' && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={playModel}
            style={{ padding: '10px 20px', background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 100, fontSize: 13, cursor: 'pointer' }}
          >
            ▶ Riascolta
          </button>
          <button
            onClick={handleSing}
            style={{ padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            🎤 Canta
          </button>
        </div>
      )}

      {phase === 'recording' && <MicEvaluator ref={micRef} />}
    </div>
  );
}
```

- [ ] **Write SolfeggioResults.tsx**

```tsx
// src/features/solfeggio-cantato/components/SolfeggioResults.tsx
import React from 'react';
import { NoteEvaluation } from '../types';

const STATUS_COLOR: Record<string, string> = {
  correct: '#22c55e', sharp: '#f59e0b', flat: '#f59e0b', missed: '#ef4444',
};
const STATUS_LABEL: Record<string, string> = {
  correct: '✓', sharp: '↑', flat: '↓', missed: '✗',
};

export function SolfeggioResults({
  evals,
  onRetry,
  onNext,
}: {
  evals: NoteEvaluation[];
  onRetry: () => void;
  onNext: () => void;
}) {
  const correct = evals.filter(e => e.status === 'correct').length;
  const pct     = Math.round((correct / evals.length) * 100);
  const color   = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color, fontFamily: "'Syne', sans-serif" }}>{pct}%</div>
        <div style={{ fontSize: 13, color: '#8b949e' }}>{correct}/{evals.length} note corrette</div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {evals.map((e, i) => (
          <div
            key={i}
            title={e.status === 'correct' ? 'Preciso' : `${e.centsOff > 0 ? '+' : ''}${e.centsOff} cent`}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `${STATUS_COLOR[e.status]}22`,
              border: `2px solid ${STATUS_COLOR[e.status]}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontSize: 11,
            }}
          >
            <div style={{ fontWeight: 700, color: '#e6edf3' }}>{e.note.label}</div>
            <div style={{ color: STATUS_COLOR[e.status] }}>{STATUS_LABEL[e.status]}</div>
          </div>
        ))}
      </div>

      {pct < 80 && (
        <div style={{ padding: '10px 14px', background: '#f59e0b18', border: '1px solid #f59e0b30', borderRadius: 8, fontSize: 12, color: '#fcd34d', marginBottom: 16 }}>
          {evals.filter(e => e.status === 'sharp').length > 0 && 'Alcune note troppo acute. '}
          {evals.filter(e => e.status === 'flat').length > 0 && 'Alcune note troppo gravi. '}
          {evals.filter(e => e.status === 'missed').length > 0 && 'Alcune note non rilevate — canta più forte e tieni la nota.'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onRetry} style={{ flex: 1, padding: '12px', background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
          Riprova
        </button>
        <button onClick={onNext} style={{ flex: 1, padding: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Prossimo →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Replace SolfeggioCantatoFeature.tsx**

```tsx
// src/features/solfeggio-cantato/SolfeggioCantatoFeature.tsx
import React, { useState } from 'react';
import { SOLFEGGIO_EXERCISES } from './data/exercises';
import { NoteEvaluation, SolfeggioExercise } from './types';
import { ExercisePlayer } from './components/ExercisePlayer';
import { SolfeggioResults } from './components/SolfeggioResults';

type Level = 'propedeutico' | 'facile' | 'medio';
type Screen = 'selector' | 'exercise' | 'results';

export default function SolfeggioCantatoFeature() {
  const [screen, setScreen] = useState<Screen>('selector');
  const [level, setLevel]   = useState<Level>('propedeutico');
  const [idx, setIdx]       = useState(0);
  const [evals, setEvals]   = useState<NoteEvaluation[]>([]);

  const filtered = SOLFEGGIO_EXERCISES.filter(e => e.level === level);
  const exercise: SolfeggioExercise | undefined = filtered[idx % filtered.length];

  function handleResult(ev: NoteEvaluation[]) {
    setEvals(ev);
    setScreen('results');
  }

  if (screen === 'selector') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, color: '#e6edf3', marginBottom: 4 }}>Solfeggio Cantato</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Ascolta la frase, poi cantala. Pitchy valuterà la tua intonazione nota per nota.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {(['propedeutico', 'facile', 'medio'] as Level[]).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                padding: '14px 16px', textAlign: 'left',
                background: level === l ? '#7c3aed18' : '#1c2128',
                border: `1px solid ${level === l ? '#7c3aed' : '#30363d'}`,
                borderRadius: 10, cursor: 'pointer', color: '#e6edf3',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: level === l ? '#c4b5fd' : '#e6edf3', textTransform: 'capitalize' }}>{l}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {filtered.length} esercizi
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => { setIdx(0); setScreen('exercise'); }}
          style={{ width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Inizia →
        </button>
      </div>
    );
  }

  if (screen === 'exercise' && exercise) {
    return (
      <ExercisePlayer
        key={exercise.id}
        exercise={exercise}
        onResult={handleResult}
      />
    );
  }

  if (screen === 'results') {
    return (
      <SolfeggioResults
        evals={evals}
        onRetry={() => setScreen('exercise')}
        onNext={() => { setIdx(i => i + 1); setScreen('exercise'); }}
      />
    );
  }

  return null;
}
```

- [ ] **Test in browser**: Solfeggio → Solfeggio Cantato. Select Propedeutico → Inizia → audio plays → click Canta → allow microphone → sing Do Re Mi scale → results show green/yellow/red dots.

- [ ] **Commit**

```bash
git add src/features/solfeggio-cantato/
git commit -m "feat(solfeggio-cantato): complete Echo mode — ExercisePlayer, MicEvaluator, Results"
```

---

## Task 10 — Setticlavio: types + exercise data + CStaff SVG

**Files:**
- Create: `src/features/setticlavio/types.ts`
- Create: `src/features/setticlavio/data/exercises.ts`
- Create: `src/features/setticlavio/components/CStaff.tsx`

- [ ] **Write types.ts**

```typescript
// src/features/setticlavio/types.ts

export type CClefType = 'contralto' | 'tenore';

export interface SetticlavioExercise {
  id: string;
  clef: CClefType;
  level: 1 | 2 | 3;
  /** Staff position: 0 = first ledger line below, 1 = first space, 2 = first line, ... */
  staffPosition: number;
  /** The correct note name in Italian: 'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si' + accidental */
  correct: string;
  choices: string[];
}
```

- [ ] **Write data/exercises.ts**

The contralto clef puts C4 (middle C) on the third line (staffPosition = 4, 0-indexed from bottom ledger).  
The tenore clef puts C4 on the fourth line (staffPosition = 6).

```typescript
// src/features/setticlavio/data/exercises.ts
import { SetticlavioExercise } from '../types';

// Staff positions (0 = bottom ledger, 1 = 1st space, 2 = 1st line, 3 = 2nd space,
// 4 = 2nd line (middle), 5 = 3rd space, 6 = 3rd line, 7 = 4th space, 8 = 4th line, 9 = 5th space, 10 = 5th line)

// For CONTRALTO clef: C4 = staffPosition 4 (3rd line), so:
// pos 2 = 1st line = A3, pos 3 = 1st space = B3, pos 4 = 2nd line = C4,
// pos 5 = 2nd space = D4, pos 6 = 3rd line = E4, pos 7 = 3rd space = F4,
// pos 8 = 4th line = G4, pos 9 = 4th space = A4, pos 10 = 5th line = B4

const CONTRALTO_NOTE: Record<number, string> = {
  0: 'Fa', 1: 'Sol', 2: 'La', 3: 'Si', 4: 'Do', 5: 'Re',
  6: 'Mi', 7: 'Fa', 8: 'Sol', 9: 'La', 10: 'Si',
};

// For TENORE clef: C4 = staffPosition 6 (4th line), so:
// pos 2 = 1st line = E3, pos 3 = F3, pos 4 = G3, pos 5 = A3,
// pos 6 = B3/C4, pos 7 = D4, pos 8 = E4, pos 9 = F4, pos 10 = G4
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
    level: pos <= 5 ? 1 : pos <= 8 ? 2 : 3,
    staffPosition: pos,
    correct: CONTRALTO_NOTE[pos],
    choices: pick4(CONTRALTO_NOTE[pos]),
  }));
}

function buildTenore(): SetticlavioExercise[] {
  return [4, 5, 6, 7, 8, 9, 10, 4, 6, 8, 5, 7, 9].map((pos, i) => ({
    id: `te-${pos}-${i}`,
    clef: 'tenore' as const,
    level: pos <= 6 ? 1 : pos <= 8 ? 2 : 3,
    staffPosition: pos,
    correct: TENORE_NOTE[pos],
    choices: pick4(TENORE_NOTE[pos]),
  }));
}

export const SETTICLAVIO_EXERCISES: SetticlavioExercise[] = [
  ...buildContralto(),
  ...buildTenore(),
];
```

- [ ] **Write CStaff.tsx** — SVG staff with C-clef and one highlighted note

```tsx
// src/features/setticlavio/components/CStaff.tsx
import React from 'react';
import { CClefType } from '../types';

interface Props {
  clef: CClefType;
  /** Staff position 0..10 — 0 = bottom ledger, 2/4/6/8/10 = lines, 1/3/5/7/9 = spaces */
  notePosition: number;
}

const LINE_Y = [68, 56, 44, 32, 20];   // y positions for lines 1-5 (bottom to top)
const STEP_H = 6;                       // half-step between space and line

function posToY(pos: number): number {
  // pos 2 = line 1 = y 68; pos 4 = line 2 = y 56; each step = STEP_H
  return 68 - (pos - 2) * STEP_H;
}

export function CStaff({ clef, notePosition }: Props) {
  const noteY     = posToY(notePosition);
  const clefLine  = clef === 'contralto' ? LINE_Y[2] : LINE_Y[3]; // 3rd or 4th line

  // Ledger line needed if position < 2 or > 10
  const needBottomLedger = notePosition <= 1;
  const needTopLedger    = notePosition >= 11;

  return (
    <svg viewBox="0 0 360 100" style={{ width: '100%', maxWidth: 360, display: 'block', margin: '0 auto' }}>
      {/* Five staff lines */}
      {LINE_Y.map((y, i) => (
        <line key={i} x1="20" y1={y} x2="340" y2={y} stroke="#30363d" strokeWidth="1.2" />
      ))}

      {/* C-clef bracket — simplified: vertical bar + bracket indicating the clef line */}
      {/* Left bar */}
      <rect x="22" y={LINE_Y[4]} width="3" height={LINE_Y[0] - LINE_Y[4]} fill="#8b949e" />
      {/* Bracket top */}
      <path d={`M25,${clefLine - 10} C45,${clefLine - 10} 45,${clefLine} 25,${clefLine}`} fill="none" stroke="#8b949e" strokeWidth="2.5" />
      {/* Bracket bottom */}
      <path d={`M25,${clefLine + 10} C45,${clefLine + 10} 45,${clefLine} 25,${clefLine}`} fill="none" stroke="#8b949e" strokeWidth="2.5" />
      {/* Center dot */}
      <circle cx="40" cy={clefLine} r="2.5" fill="#8b949e" />
      {/* Clef label */}
      <text x="48" y={clefLine + 4} fill="#4b5563" fontSize="9" fontFamily="'DM Sans', sans-serif">
        {clef === 'contralto' ? 'C.alto' : 'Tenore'}
      </text>

      {/* Ledger lines */}
      {needBottomLedger && (
        <line x1="148" y1={LINE_Y[0] + STEP_H * 2} x2="212" y2={LINE_Y[0] + STEP_H * 2} stroke="#30363d" strokeWidth="1.2" />
      )}
      {needTopLedger && (
        <line x1="148" y1={LINE_Y[4] - STEP_H * 2} x2="212" y2={LINE_Y[4] - STEP_H * 2} stroke="#30363d" strokeWidth="1.2" />
      )}

      {/* Note head */}
      <ellipse cx="180" cy={noteY} rx="11" ry="7.5" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="1" />
      {/* Stem */}
      <line x1="191" y1={noteY} x2="191" y2={noteY - 36} stroke="#c4b5fd" strokeWidth="1.5" />
    </svg>
  );
}
```

- [ ] **Commit**

```bash
git add src/features/setticlavio/
git commit -m "feat(setticlavio): types, exercise data, and SVG CStaff component"
```

---

## Task 11 — Setticlavio: NoteQuiz + SetticlavioFeature

**Files:**
- Create: `src/features/setticlavio/components/NoteQuiz.tsx`
- Replace: `src/features/setticlavio/SetticlavioFeature.tsx`

- [ ] **Write NoteQuiz.tsx**

```tsx
// src/features/setticlavio/components/NoteQuiz.tsx
import React, { useState } from 'react';
import { SetticlavioExercise } from '../types';
import { CStaff } from './CStaff';

export function NoteQuiz({
  exercise,
  onAnswer,
}: {
  exercise: SetticlavioExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleChoice(choice: string) {
    if (selected) return;
    setSelected(choice);
    setTimeout(() => onAnswer(choice === exercise.correct), 900);
  }

  const clefLabel = exercise.clef === 'contralto' ? 'Chiave di contralto' : 'Chiave di tenore';

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {clefLabel} · Livello {exercise.level}
      </div>

      <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 12, padding: '16px 10px', marginBottom: 20 }}>
        <CStaff clef={exercise.clef} notePosition={exercise.staffPosition} />
      </div>

      <p style={{ fontSize: 13, color: '#8b949e', textAlign: 'center', marginBottom: 14 }}>
        Come si chiama questa nota?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {exercise.choices.map(choice => {
          const isSelected = selected === choice;
          const isCorrect  = choice === exercise.correct;
          const bg = !selected ? '#1c2128'
            : isSelected && isCorrect ? '#22c55e22'
            : isSelected ? '#ef444422'
            : isCorrect && !!selected ? '#22c55e22'
            : '#1c2128';
          const border = !selected ? '#30363d'
            : isCorrect ? '#22c55e60' : isSelected ? '#ef444460' : '#30363d';

          return (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={!!selected}
              style={{
                padding: '14px', background: bg, border: `1px solid ${border}`,
                borderRadius: 10, color: '#e6edf3', fontSize: 15, fontWeight: 700,
                cursor: selected ? 'default' : 'pointer',
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Replace SetticlavioFeature.tsx**

```tsx
// src/features/setticlavio/SetticlavioFeature.tsx
import React, { useState } from 'react';
import { SETTICLAVIO_EXERCISES } from './data/exercises';
import { CClefType } from './types';
import { NoteQuiz } from './components/NoteQuiz';

type Screen = 'selector' | 'exercise';

export default function SetticlavioFeature() {
  const [screen, setScreen]   = useState<Screen>('selector');
  const [clef, setClef]       = useState<CClefType>('contralto');
  const [level, setLevel]     = useState<1 | 2 | 3>(1);
  const [idx, setIdx]         = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal]     = useState(0);

  const pool = SETTICLAVIO_EXERCISES.filter(e => e.clef === clef && e.level === level);
  const exercise = pool[idx % pool.length];

  function handleAnswer(isCorrect: boolean) {
    setTotal(t => t + 1);
    if (isCorrect) setCorrect(c => c + 1);
    setIdx(i => i + 1);
  }

  if (screen === 'selector') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, color: '#e6edf3', marginBottom: 4 }}>Setticlavio</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Leggi le note nelle chiavi antiche — fondamentale per viola, violoncello, trombone e fagotto.</p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Chiave</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['contralto', 'tenore'] as CClefType[]).map(c => (
              <button key={c} onClick={() => setClef(c)} style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                background: clef === c ? '#7c3aed18' : '#1c2128',
                border: `1px solid ${clef === c ? '#7c3aed' : '#30363d'}`,
                color: clef === c ? '#c4b5fd' : '#e6edf3', fontWeight: 600, fontSize: 13,
                textTransform: 'capitalize',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Livello</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2, 3] as const).map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{
                flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                background: level === l ? '#7c3aed' : '#21262d',
                border: `1px solid ${level === l ? '#7c3aed' : '#30363d'}`,
                color: level === l ? '#fff' : '#8b949e', fontSize: 13, fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setIdx(0); setCorrect(0); setTotal(0); setScreen('exercise'); }}
          style={{ width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Inizia →
        </button>
      </div>
    );
  }

  if (!exercise) return <div style={{ padding: 24, color: '#8b949e' }}>Nessun esercizio per questa selezione.</div>;

  return (
    <div>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setScreen('selector')} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 13 }}>
          ← Cambia chiave
        </button>
        <div style={{ fontSize: 13, color: '#8b949e' }}>
          {total > 0 && `${correct}/${total} · ${Math.round(correct/total*100)}%`}
        </div>
      </div>
      <NoteQuiz
        key={`${exercise.id}-${idx}`}
        exercise={exercise}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
```

- [ ] **Test in browser**: Solfeggio → Setticlavio. Select Contralto → Livello 1 → Inizia. Verify staff renders with C-clef bracket, note appears, 4 choices, green/red feedback on answer.

- [ ] **Commit**

```bash
git add src/features/setticlavio/
git commit -m "feat(setticlavio): NoteQuiz + feature entry — Setticlavio fully functional"
```

---

## Task 12 — Final integration check + build verification

- [ ] **Run production build**

```bash
npm run build
```
Expected: no TypeScript errors, no missing imports.

- [ ] **Run lint**

```bash
npm run lint
```
Fix any max-warnings violations before continuing.

- [ ] **Manual smoke test checklist**

Start `npm run dev` and verify:
1. Nav shows: Composition / Scale / Theory / **Solfeggio** / Practice
2. Solfeggio dropdown: Ear Training Pro, Solfeggio Cantato, Setticlavio
3. Theory dropdown: no "Ear Training" entry
4. **Ear Training Pro → Esame → Intervalli Melodici L1**: 10 questions play audio, progress bar, final score
5. **Ear Training Pro → Allenamento → Triadi**: existing ChordsExercise renders
6. **Ear Training Pro → Allenamento → Funzioni Tonali**: plays context + target, 3 choices
7. **Solfeggio Cantato → Propedeutico → Scala di Do**: audio plays, mic prompt appears
8. **Setticlavio → Contralto → L1**: SVG staff with bracket, 4 note choices

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(sprint1): complete Solfeggio group — Ear Training Pro, Solfeggio Cantato, Setticlavio"
```

---

## Self-review notes

- `audioPlayer.playChord(notes: string[])` confirmed present in `audio-player.ts:203` — no velocity param, volume is auto-reduced internally.
- `audioPlayer.playSequence` is confirmed to exist (used in `IntervalsExercise`).
- The `useExerciseScore` hook signature: `useExerciseScore(key: string)` returning `{ score, setScore, streak, setStreak, bestStreak, setBestStreak }` — confirmed from `IntervalsExercise`.
- In `MicEvaluator`, `PitchTracker.detect(buffer, sampleRate)` returns `PitchReading` — confirmed from `pitchTracker.ts`.
- Sprint 2 (Dashboard Docente, multi-role auth, Prove d'esame) is a separate plan: `2026-06-25-sprint2-dashboard-docente.md`.
