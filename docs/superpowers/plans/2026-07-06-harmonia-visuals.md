# Harmonia Course — Visual Diagrams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four typed diagram components (keyboard, progression chart, interval grid, circle of fifths) to the Harmonia course, rendered in a new "Visualizza" tab in LessonView.

**Architecture:** A `Visual` discriminated union type is added to `data/types.ts` and `Subsection` gets an optional `visuals?` field. Five new components live in `src/features/harmonia-course/visuals/`. LessonView grows a fifth tab that appears only when `subsection.visuals` is non-empty.

**Tech Stack:** React + TypeScript, SVG (keyboard, circle of fifths), plain JSX (progression chart, interval grid), `tonal` (already a project dependency) for deriving notes from chord/scale names.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/features/harmonia-course/data/types.ts` | Add `Visual` union, helper types, `visuals?` on `Subsection` |
| Create | `src/features/harmonia-course/visuals/KeyboardDiagram.tsx` | SVG piano keyboard, 2 octaves, N chords in parallel |
| Create | `src/features/harmonia-course/visuals/ProgressionChart.tsx` | Horizontal chord sequence with function labels |
| Create | `src/features/harmonia-course/visuals/IntervalGrid.tsx` | Degree/note/semitones table |
| Create | `src/features/harmonia-course/visuals/CircleSegment.tsx` | SVG circle of fifths wheel |
| Create | `src/features/harmonia-course/visuals/VisualRenderer.tsx` | Switch dispatcher over Visual type |
| Modify | `src/features/harmonia-course/LessonView.tsx` | Add `'visualizza'` tab + VisualRenderer |
| Modify | `src/features/harmonia-course/data/levels.ts` | Add `visuals[]` to subsections 0.1, 0.2, 4.1 |

---

## Task 1: Add Visual union type to data/types.ts

**Files:**
- Modify: `src/features/harmonia-course/data/types.ts`

- [ ] **Step 1: Open types.ts and insert the Visual union + helper types after the `ToolLink` interface (line 8)**

The full addition — insert this block between the `ToolLink` interface and the `Subsection` interface:

```typescript
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
```

- [ ] **Step 2: Add `visuals?: Visual[]` as the last field in the `Subsection` interface**

After the existing `tools: ToolLink[];` line, add:

```typescript
  visuals?: Visual[];
```

The complete `Subsection` interface should now look like:

```typescript
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
```

- [ ] **Step 3: Run build to verify no TypeScript errors**

```bash
npm run build
```

Expected: build completes with only the pre-existing chunk size warning (no TypeScript errors).

- [ ] **Step 4: Commit**

```bash
git add src/features/harmonia-course/data/types.ts
git commit -m "feat(harmonia): add Visual union type and visuals? field to Subsection"
```

---

## Task 2: KeyboardDiagram component

**Files:**
- Create: `src/features/harmonia-course/visuals/KeyboardDiagram.tsx`

- [ ] **Step 1: Create the visuals directory and KeyboardDiagram.tsx with this complete implementation**

```tsx
import { Chord } from 'tonal';
import type { ChordKeyboardSpec } from '../data/types';

const WW = 28;   // white key width
const WH = 80;   // white key height
const BW = 18;   // black key width
const BH = 50;   // black key height
const SVG_W = 14 * WW + 1;
const SVG_H = WH + 1;

const WHITE_KEYS: { note: string; idx: number }[] = [
  { note: 'C3', idx: 0 },  { note: 'D3', idx: 1 },  { note: 'E3', idx: 2 },
  { note: 'F3', idx: 3 },  { note: 'G3', idx: 4 },  { note: 'A3', idx: 5 },
  { note: 'B3', idx: 6 },  { note: 'C4', idx: 7 },  { note: 'D4', idx: 8 },
  { note: 'E4', idx: 9 },  { note: 'F4', idx: 10 }, { note: 'G4', idx: 11 },
  { note: 'A4', idx: 12 }, { note: 'B4', idx: 13 },
];

// x = (leftWhiteKeyIndex + 1) * WW - BW/2
const BLACK_KEYS: { names: string[]; x: number }[] = [
  { names: ['C#3', 'Db3'], x: 19  },
  { names: ['D#3', 'Eb3'], x: 47  },
  { names: ['F#3', 'Gb3'], x: 103 },
  { names: ['G#3', 'Ab3'], x: 131 },
  { names: ['A#3', 'Bb3'], x: 159 },
  { names: ['C#4', 'Db4'], x: 215 },
  { names: ['D#4', 'Eb4'], x: 243 },
  { names: ['F#4', 'Gb4'], x: 299 },
  { names: ['G#4', 'Ab4'], x: 327 },
  { names: ['A#4', 'Bb4'], x: 355 },
];

// Strip octave number to get pitch class: "C#4" → "C#"
function pc(n: string): string {
  return n.replace(/\d+$/, '');
}

function isLit(keyNote: string, highlights: string[]): boolean {
  const kpc = pc(keyNote);
  return highlights.some(h => pc(h) === kpc);
}

function SingleKeyboard({ chord }: { chord: ChordKeyboardSpec }) {
  // If notes[] is empty, derive pitch classes from chord name via tonal
  const highlights =
    chord.notes.length > 0 ? chord.notes : Chord.get(chord.label).notes;
  const color = chord.color ?? '#7c3aed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
        {/* White keys first (render below black keys) */}
        {WHITE_KEYS.map(({ note, idx }) => (
          <rect
            key={note}
            x={idx * WW} y={0}
            width={WW - 1} height={WH}
            fill={isLit(note, highlights) ? color : '#f0f0f0'}
            stroke="#555" strokeWidth={0.5}
            rx={1}
          />
        ))}
        {/* Black keys on top */}
        {BLACK_KEYS.map(({ names, x }) => {
          const lit = names.some(n => highlights.some(h => pc(h) === pc(n)));
          return (
            <rect
              key={names[0]}
              x={x} y={0}
              width={BW} height={BH}
              fill={lit ? color : '#1a1a2e'}
              stroke="#333" strokeWidth={0.5}
              rx={1}
            />
          );
        })}
      </svg>
      <code style={{
        fontSize: 11, color: '#c4b5fd',
        background: 'rgba(124,58,237,0.12)',
        padding: '2px 8px', borderRadius: 4,
      }}>
        {chord.label}
      </code>
    </div>
  );
}

export default function KeyboardDiagram({
  title,
  chords,
}: {
  title?: string;
  chords: ChordKeyboardSpec[];
}) {
  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {chords.map((c, i) => (
          <SingleKeyboard key={i} chord={c} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/harmonia-course/visuals/KeyboardDiagram.tsx
git commit -m "feat(harmonia): add KeyboardDiagram SVG component"
```

---

## Task 3: ProgressionChart component

**Files:**
- Create: `src/features/harmonia-course/visuals/ProgressionChart.tsx`

- [ ] **Step 1: Create ProgressionChart.tsx**

Note: the `key` field in `Visual['progression']` is the musical key (e.g. "C"), received here as `musicalKey` to avoid conflict with React's special `key` prop.

```tsx
import type { ProgressionStep } from '../data/types';

export default function ProgressionChart({
  title,
  musicalKey,
  steps,
}: {
  title?: string;
  musicalKey?: string;
  steps: ProgressionStep[];
}) {
  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      {musicalKey && (
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
          Tonalità:{' '}
          <strong style={{ color: '#8b949e' }}>{musicalKey}</strong>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {steps.flatMap((step, i) => {
          const card = (
            <div
              key={`s${i}`}
              style={{
                background: '#21262d',
                border: '1px solid #30363d',
                borderRadius: 10,
                padding: '10px 16px',
                textAlign: 'center',
                minWidth: 64,
              }}
            >
              {step.function && (
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                  {step.function}
                </div>
              )}
              <div style={{
                fontSize: 18, fontWeight: 700,
                color: '#e6edf3', fontFamily: 'monospace',
              }}>
                {step.chord}
              </div>
              {step.annotation && (
                <div style={{ fontSize: 10, color: '#c4b5fd', marginTop: 4 }}>
                  {step.annotation}
                </div>
              )}
            </div>
          );
          const arrow = i < steps.length - 1
            ? <span key={`a${i}`} style={{ color: '#4b5563', fontSize: 16 }}>→</span>
            : null;
          return arrow ? [card, arrow] : [card];
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/harmonia-course/visuals/ProgressionChart.tsx
git commit -m "feat(harmonia): add ProgressionChart component"
```

---

## Task 4: IntervalGrid component

**Files:**
- Create: `src/features/harmonia-course/visuals/IntervalGrid.tsx`

- [ ] **Step 1: Create IntervalGrid.tsx**

When `rows` is provided, it uses them directly. When `chord` is provided, it derives rows via `tonal.Chord.get()`. When `scale` + `root` are provided, it uses `tonal.Scale.get()`.

```tsx
import { Chord, Scale, Interval } from 'tonal';
import type { IntervalRow } from '../data/types';

// Maps tonal interval codes to display degree names
const INTERVAL_LABEL: Record<string, string> = {
  '1P': '1',  '2m': 'b2', '2M': '2',  '3m': 'b3', '3M': '3',
  '4P': '4',  '4A': '#4', '5d': 'b5', '5P': '5',  '5A': '#5',
  '6m': 'b6', '6M': '6',  '7m': 'b7', '7M': '7',
};

function rowBg(degree: string): string {
  if (degree === '1') return 'transparent';
  if (['b3', '3'].includes(degree)) return 'rgba(167,139,250,0.12)';
  if (['5', 'b5', '#5'].includes(degree)) return 'transparent';
  if (['b7', '7'].includes(degree)) return 'rgba(251,191,36,0.12)';
  return 'rgba(45,212,191,0.10)'; // tensions: 2, 4, 6, etc.
}

function deriveRows(chord?: string, scale?: string, root?: string): IntervalRow[] {
  if (chord) {
    const c = Chord.get(chord);
    return c.intervals.map((ivl, i) => ({
      degree: INTERVAL_LABEL[ivl] ?? ivl,
      note: c.notes[i] ?? '',
      semitones: Interval.semitones(ivl) ?? 0,
    }));
  }
  if (scale && root) {
    const s = Scale.get(`${root} ${scale}`);
    return s.intervals.map((ivl, i) => ({
      degree: INTERVAL_LABEL[ivl] ?? ivl,
      note: s.notes[i] ?? '',
      semitones: Interval.semitones(ivl) ?? 0,
    }));
  }
  return [];
}

export default function IntervalGrid({
  title,
  chord,
  scale,
  root,
  rows,
}: {
  title?: string;
  chord?: string;
  scale?: string;
  root?: string;
  rows?: IntervalRow[];
}) {
  const displayRows = rows ?? deriveRows(chord, scale, root);

  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Grado', 'Nota', 'Semitoni'].map(h => (
              <th
                key={h}
                style={{
                  textAlign: 'left', padding: '6px 12px',
                  color: '#6b7280', fontWeight: 600,
                  borderBottom: '1px solid #30363d',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr
              key={i}
              style={{
                background: rowBg(row.degree),
                borderBottom: '1px solid rgba(48,54,61,0.4)',
              }}
            >
              <td style={{
                padding: '7px 12px', color: '#e6edf3',
                fontWeight: 600, fontFamily: 'monospace',
              }}>
                {row.degree}
              </td>
              <td style={{
                padding: '7px 12px', color: '#c4b5fd', fontFamily: 'monospace',
              }}>
                {row.note}
              </td>
              <td style={{ padding: '7px 12px', color: '#8b949e' }}>
                {row.semitones}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/harmonia-course/visuals/IntervalGrid.tsx
git commit -m "feat(harmonia): add IntervalGrid component"
```

---

## Task 5: CircleSegment component

**Files:**
- Create: `src/features/harmonia-course/visuals/CircleSegment.tsx`

- [ ] **Step 1: Create CircleSegment.tsx**

The 12 notes are arranged in circle-of-fifths order (C at top, clockwise). Each wedge is an SVG path computed from the index. Notes in `highlight[]` are lit in purple; `tonic` is brighter with bold text.

```tsx
const FIFTHS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];

const CX = 120, CY = 120;
const R_OUT = 105;
const R_IN  = 60;
const TEXT_R = 82; // midpoint of annular ring

// Maps enharmonic equivalents so "Gb" matches "F#" etc.
const ENHARMONIC: Record<string, string> = {
  'F#': 'Gb', 'Gb': 'F#',
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};

function isHighlighted(note: string, list: string[]): boolean {
  return list.includes(note) || list.includes(ENHARMONIC[note] ?? '__');
}

function wedgePath(i: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const a0 = toRad(i * 30 - 90);
  const a1 = toRad((i + 1) * 30 - 90);
  const pt = (r: number, a: number) =>
    [+(CX + r * Math.cos(a)).toFixed(3), +(CY + r * Math.sin(a)).toFixed(3)] as const;
  const [x0o, y0o] = pt(R_OUT, a0);
  const [x1o, y1o] = pt(R_OUT, a1);
  const [x1i, y1i] = pt(R_IN, a1);
  const [x0i, y0i] = pt(R_IN, a0);
  return [
    `M ${x0o} ${y0o}`,
    `A ${R_OUT} ${R_OUT} 0 0 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${R_IN} ${R_IN} 0 0 0 ${x0i} ${y0i}`,
    'Z',
  ].join(' ');
}

function textPos(i: number): { x: number; y: number } {
  const angle = ((i * 30 - 90 + 15) * Math.PI) / 180;
  return {
    x: +(CX + TEXT_R * Math.cos(angle)).toFixed(3),
    y: +(CY + TEXT_R * Math.sin(angle)).toFixed(3),
  };
}

export default function CircleSegment({
  title,
  highlight,
  tonic,
}: {
  title?: string;
  highlight: string[];
  tonic?: string;
}) {
  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          width={240} height={240}
          viewBox="0 0 240 240"
          style={{ overflow: 'visible' }}
        >
          {FIFTHS.map((note, i) => {
            const isTonic = tonic
              ? note === tonic || ENHARMONIC[note] === tonic
              : false;
            const isLit = isHighlighted(note, highlight);
            const fill = isTonic
              ? '#a78bfa'
              : isLit
              ? '#7c3aed'
              : '#21262d';
            const { x, y } = textPos(i);
            return (
              <g key={note}>
                <path
                  d={wedgePath(i)}
                  fill={fill}
                  stroke="#161b22"
                  strokeWidth={2}
                />
                <text
                  x={x} y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isLit || isTonic ? '#fff' : '#6b7280'}
                  fontSize={12}
                  fontWeight={isTonic ? 700 : 400}
                  fontFamily="'DM Sans', sans-serif"
                >
                  {note}
                </text>
              </g>
            );
          })}
          {/* Cover center with dark circle */}
          <circle cx={CX} cy={CY} r={R_IN - 2} fill="#161b22" />
        </svg>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/harmonia-course/visuals/CircleSegment.tsx
git commit -m "feat(harmonia): add CircleSegment SVG component"
```

---

## Task 6: VisualRenderer dispatcher

**Files:**
- Create: `src/features/harmonia-course/visuals/VisualRenderer.tsx`

- [ ] **Step 1: Create VisualRenderer.tsx**

Note: the `key` field of `progression` visuals is passed as `musicalKey` to ProgressionChart to avoid collision with React's reserved `key` prop.

```tsx
import type { Visual } from '../data/types';
import KeyboardDiagram from './KeyboardDiagram';
import ProgressionChart from './ProgressionChart';
import IntervalGrid from './IntervalGrid';
import CircleSegment from './CircleSegment';

export default function VisualRenderer({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case 'keyboard':
      return <KeyboardDiagram title={visual.title} chords={visual.chords} />;
    case 'progression':
      return (
        <ProgressionChart
          title={visual.title}
          musicalKey={visual.key}
          steps={visual.steps}
        />
      );
    case 'interval-grid':
      return (
        <IntervalGrid
          title={visual.title}
          chord={visual.chord}
          scale={visual.scale}
          root={visual.root}
          rows={visual.rows}
        />
      );
    case 'circle-segment':
      return (
        <CircleSegment
          title={visual.title}
          highlight={visual.highlight}
          tonic={visual.tonic}
        />
      );
  }
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/harmonia-course/visuals/VisualRenderer.tsx
git commit -m "feat(harmonia): add VisualRenderer dispatcher"
```

---

## Task 7: Add Visualizza tab to LessonView

**Files:**
- Modify: `src/features/harmonia-course/LessonView.tsx`

- [ ] **Step 1: Add the VisualRenderer import at the top of LessonView.tsx**

After the existing imports (around line 3), add:

```typescript
import VisualRenderer from './visuals/VisualRenderer';
```

- [ ] **Step 2: Extend the LessonTab type (line 5)**

Change:

```typescript
type LessonTab = 'teoria' | 'esempi' | 'esercizi' | 'strumenti';
```

To:

```typescript
type LessonTab = 'teoria' | 'esempi' | 'esercizi' | 'strumenti' | 'visualizza';
```

- [ ] **Step 3: Add `visualCount` and the conditional tab entry**

Inside the component body, after the `completed` state declaration, add:

```typescript
const visualCount = subsection.visuals?.length ?? 0;
```

Then in the `tabs` array definition (currently lines 53–58), change the `const tabs` to append the visualizza tab when there are visuals:

```typescript
const tabs: { id: LessonTab; label: string; badge?: number }[] = [
  { id: 'teoria',    label: 'Teoria' },
  { id: 'esempi',    label: 'Esempi' },
  { id: 'esercizi',  label: 'Esercizi', badge: subsection.esercizi.length || undefined },
  { id: 'strumenti', label: 'Strumenti', badge: subsection.tools.length || undefined },
  ...(visualCount > 0
    ? [{ id: 'visualizza' as LessonTab, label: 'Visualizza', badge: visualCount }]
    : []),
];
```

- [ ] **Step 4: Add the Visualizza tab content**

Inside the tab content `<div>` (around line 149, after the `{activeTab === 'strumenti' && ...}` block, before the closing `</div>`), add:

```tsx
{activeTab === 'visualizza' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    {(subsection.visuals ?? []).map((v, i) => (
      <div
        key={i}
        style={{
          background: '#1c2128',
          border: '1px solid #30363d',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <VisualRenderer visual={v} />
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/harmonia-course/LessonView.tsx
git commit -m "feat(harmonia): add Visualizza tab to LessonView"
```

---

## Task 8: Populate example visuals + browser validation

**Files:**
- Modify: `src/features/harmonia-course/data/levels.ts`

This task adds `visuals[]` to 3 subsections, covering all 4 diagram types. The changes serve as both working examples and authoring templates for future subsections.

- [ ] **Step 1: Add visuals to subsection `0.1` (Suono, Altezza e Intervalli)**

Find the subsection with `id: '0.1'` (around line 11). Locate its `tools: [...]` block which ends:

```typescript
      tools: [
        { tabId: 'quiz',   label: 'Scale Degree Quiz',  icon: '🎯', desc: 'Allena il riconoscimento dei gradi e degli intervalli' },
        { tabId: 'circle', label: 'Circle of Fifths',   icon: '🔵', desc: 'Visualizza le distanze tra note e tonalità' },
      ],
```

After that `tools` block (before the `},` that closes the subsection object), add:

```typescript
      visuals: [
        {
          type: 'interval-grid',
          title: 'Tutti gli intervalli cromatici da Do',
          rows: [
            { degree: '1',   note: 'C',  semitones: 0  },
            { degree: 'b2',  note: 'Db', semitones: 1  },
            { degree: '2',   note: 'D',  semitones: 2  },
            { degree: 'b3',  note: 'Eb', semitones: 3  },
            { degree: '3',   note: 'E',  semitones: 4  },
            { degree: '4',   note: 'F',  semitones: 5  },
            { degree: '#4',  note: 'F#', semitones: 6  },
            { degree: '5',   note: 'G',  semitones: 7  },
            { degree: 'b6',  note: 'Ab', semitones: 8  },
            { degree: '6',   note: 'A',  semitones: 9  },
            { degree: 'b7',  note: 'Bb', semitones: 10 },
            { degree: '7',   note: 'B',  semitones: 11 },
          ],
        },
      ],
```

- [ ] **Step 2: Add visuals to subsection `0.2` (Scala Maggiore e Scale Minori)**

Find subsection `id: '0.2'` (around line 60). Locate its `tools: [...]` block and add after it:

```typescript
      visuals: [
        {
          type: 'circle-segment',
          title: 'Circolo delle quinte — Do maggiore',
          highlight: ['C', 'F', 'G'],
          tonic: 'C',
        },
      ],
```

- [ ] **Step 3: Add visuals to subsection `4.1` (Shell Voicings)**

Find subsection `id: '4.1'` (around line 610). Locate its `tools: [...]` block and add after it:

```typescript
      visuals: [
        {
          type: 'keyboard',
          title: 'Shell Voicings — II–V–I in Do',
          chords: [
            { label: 'Dm7 (shell)',   notes: ['D3', 'F3', 'C4']  },
            { label: 'G7 (shell)',    notes: ['G3', 'B3', 'F4']  },
            { label: 'Cmaj7 (shell)', notes: ['C3', 'E3', 'B3']  },
          ],
        },
        {
          type: 'progression',
          title: 'II–V–I in Do',
          key: 'C',
          steps: [
            { chord: 'Dm7',   function: 'IIm7' },
            { chord: 'G7',    function: 'V7'   },
            { chord: 'Cmaj7', function: 'Imaj7' },
          ],
        },
      ],
```

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: no TypeScript errors (the `visuals` type must match the `Visual` union exactly).

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Navigate to Harmonia → Livello 0 → "Suono, Altezza e Intervalli" (subsection 0.1). You should see a "Visualizza" tab badge with `1`. Click it — the interval grid should appear with 12 rows, color-coded by family.

Navigate to subsection 0.2 — "Visualizza" shows the circle of fifths with C, F, G lit in purple and C brighter as tonic.

Navigate to Livello 4 → "Shell Voicings" (subsection 4.1) — "Visualizza" has badge `2`. First card: three piano keyboards showing Dm7, G7, Cmaj7 shell voicings. Second card: II–V–I progression chart.

All other subsections (without `visuals`) should have no "Visualizza" tab and should be completely unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/features/harmonia-course/data/levels.ts
git commit -m "feat(harmonia): add example visuals to subsections 0.1, 0.2, 4.1"
```
