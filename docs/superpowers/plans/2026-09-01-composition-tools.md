# Composition Tools — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 composition-focused tools to *tonic*: Pentatonic Superimposition Map (in Scale Advisor), Guide Tone Lines (in Voice Leading Lab), Motif Lab (in Melody Architect), Form & Energy Map (in Song Architect), and Rhythmic Displacement (standalone feature).

**Architecture:** Each of the first 4 tools is appended as an expandable `<details>` section to its host feature's JSX return — no routing or global state changes needed. Rhythmic Displacement is a new standalone feature file wired into `App.tsx`. One shared utility (`parseChord`/`parseProgression`) is extracted to `musicTheory.ts` for reuse across features.

**Tech Stack:** React 18, TypeScript, Vite, `tonal` v6 (`Chord`, `Note`), existing `transposeNote`/`noteToSemitone` from `@shared/utils/musicTheory`. No test suite — validate with `npm run build` then manual browser test via `npm run dev`.

---

## File Map

| File | Change |
|---|---|
| `src/shared/utils/musicTheory.ts` | Add exported `ParsedChord`, `parseChord`, `parseProgression` |
| `src/features/scale-advisor/ScaleAdvisorFeature.tsx` | Append `PentatonicColorsSection` component + data after line 1291 (`</details>`) |
| `src/features/voice-leading/VoiceLeadingFeature.tsx` | Append `GuideToneLines` section before closing `</div>` at line 882 |
| `src/features/melody-architect/MelodyArchitectFeature.tsx` | Append `MotifLab` section before closing `</div>` at line 1125 |
| `src/features/song-architect/SongArchitectFeature.tsx` | Append `FormEnergyMap` section before closing `</div>` at line 694 |
| `src/features/rhythmic-displacement/RhythmicDisplacementFeature.tsx` | Create new file |
| `src/App.tsx` | Import + nav entry + render branch for `rhythmic-displacement` |

---

## Task 1: Extract parseChord/parseProgression to musicTheory.ts

**Files:**
- Modify: `src/shared/utils/musicTheory.ts` (append to end of file)

- [ ] **Add shared chord parsing utilities** at the end of `src/shared/utils/musicTheory.ts`:

```typescript
// ─── Chord Parsing ───────────────────────────────────────────────────────────

export interface ParsedChord {
  root: string;
  quality: string;
  symbol: string;
}

export function parseChord(raw: string): ParsedChord | null {
  const m = raw.trim().match(/^([A-G][b#]?)(.*)$/);
  if (!m) return null;
  return { root: m[1], quality: m[2].trim(), symbol: raw.trim() };
}

export function parseProgression(text: string): ParsedChord[] {
  return text
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(parseChord)
    .filter((c): c is ParsedChord => c !== null);
}
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: no output (no TypeScript errors).

- [ ] **Commit:**

```bash
git add src/shared/utils/musicTheory.ts
git commit -m "feat(shared): export parseChord and parseProgression utilities"
```

---

## Task 2: Pentatonic Superimposition Map in Scale Advisor

**Files:**
- Modify: `src/features/scale-advisor/ScaleAdvisorFeature.tsx`

The Scale Advisor's `export default function ScaleAdvisorFeature()` closes at line 1293 with `}`. The existing outer `<div>` closes at line 1292. We'll add the new section just before that closing `</div>` (the one before the final `);`).

- [ ] **Add the pentatonic data and component** by inserting the following block immediately before the `return (` statement of `ScaleAdvisorFeature` (around line 1031). Place it after all existing helper functions/components but before `export default function ScaleAdvisorFeature()`:

```typescript
// ─── Pentatonic Superimposition ──────────────────────────────────────────────

const MINOR_PENT_INTERVALS = [0, 3, 5, 7, 10];
const MAJOR_PENT_INTERVALS = [0, 2, 4, 7, 9];

interface PentatonicEntry {
  label: string;
  rootSemitones: number;
  type: 'minor' | 'major';
  color: string;
  tip: string;
}

const PENT_MAP: Record<string, PentatonicEntry[]> = {
  maj7: [
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Lydian — #11, 9, 6. Floating, modern.', tip: 'Cory Henry / Snarky Puppy signature over maj7' },
    { label: 'Minor pent on 7th', rootSemitones: 11, type: 'minor', color: 'Rich Lydian — maj7, #11, 9. Dense extensions.', tip: 'Full lydian palette including leading-tone colour' },
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Ionian — 1, 2, 3, 5, 6. Clean, open.', tip: 'Safe classical approach, Kenny Burrell' },
  ],
  'maj7#11': [
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Core Lydian — #11, 9, 6. Bright.', tip: 'Jacob Collier, Snarky Puppy on Lydian vamps' },
    { label: 'Minor pent on 7th', rootSemitones: 11, type: 'minor', color: 'Extended Lydian — adds maj7 + #11.', tip: 'Full Lydian spectrum with leading tone' },
    { label: 'Minor pent on #4', rootSemitones: 6, type: 'minor', color: 'Outside Lydian — #11, 13, 9. Modern jazz tension.', tip: 'Advanced fusion tension over Lydian' },
  ],
  m7: [
    { label: 'Minor pent on root', rootSemitones: 0, type: 'minor', color: 'Natural minor — home sound, safe.', tip: 'Classic blues-jazz, Wes Montgomery' },
    { label: 'Minor pent on 4th', rootSemitones: 5, type: 'minor', color: 'Dorian 6th — warm, funky character note.', tip: 'Snarky Puppy dorian vamps, Herbie Hancock' },
    { label: 'Major pent on b3', rootSemitones: 3, type: 'major', color: 'Relative major — bright contrast over minor.', tip: 'Creates major-feel lift over minor chord' },
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Upper extensions — 5, b7, 1, 9, 4. Airy.', tip: 'Suspended, floating — Yussef Dayes style' },
  ],
  '7': [
    { label: 'Minor pent on 2nd', rootSemitones: 2, type: 'minor', color: 'Mixolydian extensions — 9, 11, 13. Clean.', tip: 'Classic dominant jazz sound, no clash' },
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Suspended dominant — 5, b7, 1, 9, 11.', tip: 'Funky suspended feel — Vulfpeck, The Meters' },
    { label: 'Major pent on b3', rootSemitones: 3, type: 'major', color: 'Bluesy — adds b3, 4, 5. Gritty tension.', tip: 'Blues-rock over dominant, BB King' },
    { label: 'Major pent on b7', rootSemitones: 10, type: 'major', color: 'IV pentatonic = IV over V. Soul gospel.', tip: 'Gospel/soul dominant colour, Stevie Wonder' },
  ],
  '7alt': [
    { label: 'Major pent on b2', rootSemitones: 1, type: 'major', color: 'Altered tensions — b9, #9, b13. Maximum tension.', tip: 'Coltrane altered dominant, Wayne Shorter' },
    { label: 'Minor pent on b6', rootSemitones: 8, type: 'minor', color: 'Tritone sub color — b13, b7, b9. Dark.', tip: 'Outside playing, Metheny, Scofield' },
    { label: 'Minor pent on b2', rootSemitones: 1, type: 'minor', color: 'Super-altered — b9, #9, #11, b13. Fully outside.', tip: 'Maximum alteration, free jazz tension' },
  ],
  m7b5: [
    { label: 'Minor pent on b3', rootSemitones: 3, type: 'minor', color: 'Locrian #2 — avoids b2, smooth half-dim sound.', tip: 'Half-dim jazz sound, minor ii-V-i context' },
    { label: 'Minor pent on b7', rootSemitones: 10, type: 'minor', color: 'Upper extensions — b7, 1, b3, b5. Darker.', tip: 'Darker colouring over half-diminished' },
  ],
  dim7: [
    { label: 'Minor pent on root', rootSemitones: 0, type: 'minor', color: 'Diminished base sound.', tip: 'Passing tone feel, symmetric base' },
    { label: 'Minor pent on b3', rootSemitones: 3, type: 'minor', color: 'Symmetrical shift (dim repeats every b3).', tip: 'Exploit symmetry: same harmonic result' },
    { label: 'Minor pent on tritone', rootSemitones: 6, type: 'minor', color: 'Another symmetrical axis of the dim chord.', tip: 'Dramatic shift that stays harmonically in-key' },
  ],
  sus4: [
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Open, floating — no 3rd tension.', tip: 'Modal, ambient — ECM Records sound' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'Quartal feel — 4, 5, 6, 1, 2.', tip: 'McCoy Tyner quartal voicing colour' },
  ],
  '7sus4': [
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Bright sus — 1, 2, 3, 5, 6. Open funk.', tip: 'Funk sus dominant, open feel' },
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Deep suspension — b7, 1, b3, 4. Dark sus.', tip: 'Darker suspended dominant colour' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'IV over V = float chord. Lush, suspended.', tip: 'IVmaj7/V bass = Snarky Puppy float chord' },
  ],
  maj9: [
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Lydian + 9 already voiced. Bright.', tip: 'Same as maj7 — Lydian pent is gold standard' },
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Perfect alignment — all 5 notes are chord tones or extensions.', tip: 'Every note is harmonically justified' },
  ],
  m9: [
    { label: 'Minor pent on root', rootSemitones: 0, type: 'minor', color: 'Natural minor with 9 already voiced.', tip: 'Safe home base over m9' },
    { label: 'Minor pent on 4th', rootSemitones: 5, type: 'minor', color: 'Dorian upper — 6, b7, 1, 9, 4. Full dorian palette.', tip: 'Herbie Hancock dorian approach over m9' },
  ],
  '9': [
    { label: 'Minor pent on 2nd', rootSemitones: 2, type: 'minor', color: 'Dominant 9 extensions — 9, 11, 13. Full Mixolydian.', tip: 'Complete Mixolydian pentatonic colour' },
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Suspended dominant feel.', tip: 'Funky sus over 9 chord — Ghost Note style' },
  ],
  '6': [
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Perfect — 1, 2, 3, 5, 6. All chord tones.', tip: 'No tension, complete harmonic alignment' },
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Extensions — adds 9th and #11. Lydian brightness.', tip: 'Colours a 6th chord with Lydian extensions' },
  ],
  m6: [
    { label: 'Minor pent on root', rootSemitones: 0, type: 'minor', color: 'Minor base — b3, 4, 5, b7. Safe.', tip: 'Natural minor, classic base' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'Dorian character — natural 6th is the defining note.', tip: 'The Dorian sound — essential for Dm6 (Miles Davis)' },
  ],
  add9: [
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Natural — 1, 2, 3, 5, 6. Clean and open.', tip: 'All basic chord tones covered' },
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Lydian brightness — #11, 9, 6.', tip: 'Colour an add9 with Lydian extensions' },
  ],
};

function PentatonicColorsSection({ root, quality }: { root: string; quality: string }) {
  const entries = PENT_MAP[quality];
  if (!entries || entries.length === 0) return null;

  return (
    <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
        🎸 Pentatonic Colors — superimposition guide
      </summary>
      <p style={{ margin: '10px 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
        Each pentatonic scale, played over {root}{quality}, produces a distinct harmonic colour.
        All notes shown in the current root ({root}).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => {
          const pentRoot = transposeNote(root, entry.rootSemitones);
          const intervals = entry.type === 'minor' ? MINOR_PENT_INTERVALS : MAJOR_PENT_INTERVALS;
          const notes = intervals.map(s => transposeNote(pentRoot, s)).join('  ');
          const pentLabel = `${pentRoot} ${entry.type} pentatonic`;
          return (
            <div key={i} style={{
              background: '#0d1117', border: '1px solid #21262d',
              borderRadius: 8, padding: '10px 12px',
              display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'start',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 4 }}>{pentLabel}</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', letterSpacing: 2 }}>{notes}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#e6edf3', marginBottom: 4 }}>{entry.color}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>💡 {entry.tip}</div>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
```

- [ ] **Render the section** in the `single` mode view. Find the closing `</details>` of the Theory Box section (around line 1291) — the last `</details>` before `</div>` `);` — and add the Pentatonic Colors section after it:

Find this in the return statement:
```tsx
      {/* Theory box */}
      <details style={{
```

The Theory box `</details>` is the last element in the outer `<div>`. After that closing `</details>` (line 1291), add:

```tsx
      {/* Pentatonic Colors — only in single mode */}
      {mode === 'single' && (
        <PentatonicColorsSection root={root} quality={quality} />
      )}
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: no output.

- [ ] **Browser test:** Open Scale Advisor → select `maj7` + root `C` → scroll down past the Theory box → confirm "Pentatonic Colors" `<details>` section appears with 3 rows. Check that clicking a different root (e.g. `F`) updates the note names in the table.

- [ ] **Commit:**

```bash
git add src/features/scale-advisor/ScaleAdvisorFeature.tsx
git commit -m "feat(scale-advisor): add Pentatonic Superimposition Map section"
```

---

## Task 3: Guide Tone Lines in Voice Leading Lab

**Files:**
- Modify: `src/features/voice-leading/VoiceLeadingFeature.tsx`

The outer `<div>` of `VoiceLeadingFeature` closes at line 883 (`</div>`). Add the Guide Tone Lines `<details>` block just before that closing tag.

- [ ] **Add imports** — at the top of `VoiceLeadingFeature.tsx`, the file already imports `{ Chord, Note }` from `'tonal'`. Add the shared parse utilities:

```typescript
import { parseProgression, ParsedChord } from '@shared/utils/musicTheory';
```

- [ ] **Add the Guide Tone Lines component** — paste this block anywhere before `export default function VoiceLeadingFeature()` (after the existing constants):

```typescript
// ─── Guide Tone Lines ────────────────────────────────────────────────────────

const NOTE_PC: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

function resolveAbsPitch(pc: number, prevAbs: number): number {
  const ref = Math.floor(prevAbs / 12) * 12;
  const candidates = [ref + pc - 12, ref + pc, ref + pc + 12];
  return candidates.reduce((best, c) =>
    Math.abs(c - prevAbs) < Math.abs(best - prevAbs) ? c : best
  );
}

function getGuideTones(root: string, quality: string): { third: string | null; seventh: string | null } {
  const chord = Chord.get(`${root}${quality}`);
  if (chord.empty || chord.notes.length < 3) return { third: null, seventh: null };
  return {
    third: chord.notes[1] ?? null,
    seventh: chord.notes.length >= 4 ? chord.notes[3] : null,
  };
}

function distColor(d: number): string {
  const abs = Math.abs(d);
  if (abs <= 2) return '#10b981';
  if (abs <= 4) return '#f59e0b';
  return '#ef4444';
}

function GuideToneLinesSection() {
  const [text, setText] = useState('Cmaj7 Am7 Dm7 G7');
  const [points, setPoints] = useState<Array<{
    chord: string; third: string | null; seventh: string | null;
    thirdAbs: number | null; seventhAbs: number | null;
  }>>([]);

  function analyze() {
    const chords = parseProgression(text);
    let prevThird = 64; // E4
    let prevSeventh = 59; // B3

    const resolved = chords.map(c => {
      const { third, seventh } = getGuideTones(c.root, c.quality);
      let thirdAbs: number | null = null;
      let seventhAbs: number | null = null;

      if (third) {
        const pc = NOTE_PC[third] ?? -1;
        if (pc >= 0) { thirdAbs = resolveAbsPitch(pc, prevThird); prevThird = thirdAbs; }
      }
      if (seventh) {
        const pc = NOTE_PC[seventh] ?? -1;
        if (pc >= 0) { seventhAbs = resolveAbsPitch(pc, prevSeventh); prevSeventh = seventhAbs; }
      }
      return { chord: c.symbol, third, seventh, thirdAbs, seventhAbs };
    });
    setPoints(resolved);
  }

  const allAbs = points.flatMap(p => [p.thirdAbs, p.seventhAbs]).filter((v): v is number => v !== null);
  const minAbs = allAbs.length ? Math.min(...allAbs) - 2 : 55;
  const maxAbs = allAbs.length ? Math.max(...allAbs) + 2 : 74;
  const range = maxAbs - minAbs || 1;

  const W = Math.max(360, points.length * 90);
  const H = 150;
  const TOP = 18;
  const BOT = 22;
  const plotH = H - TOP - BOT;
  const colW = W / Math.max(points.length, 1);

  function yOf(abs: number) { return TOP + (1 - (abs - minAbs) / range) * plotH; }
  function xOf(i: number)   { return colW * i + colW / 2; }

  const smoothestLine = (() => {
    if (points.length < 2) return null;
    const thirdLeaps = points.slice(0, -1)
      .map((p, i) => p.thirdAbs !== null && points[i + 1].thirdAbs !== null
        ? Math.abs(points[i + 1].thirdAbs! - p.thirdAbs!)
        : 0);
    const seventhLeaps = points.slice(0, -1)
      .map((p, i) => p.seventhAbs !== null && points[i + 1].seventhAbs !== null
        ? Math.abs(points[i + 1].seventhAbs! - p.seventhAbs!)
        : 0);
    const avgThird = thirdLeaps.reduce((a, b) => a + b, 0) / thirdLeaps.length;
    const avgSeventh = seventhLeaps.reduce((a, b) => a + b, 0) / seventhLeaps.length;
    return avgThird <= avgSeventh ? '3rd line' : '7th line';
  })();

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder="e.g. Cmaj7 Am7 Dm7 G7"
          style={{
            flex: 1, padding: '8px 12px',
            background: '#0d1117', border: '1px solid #30363d',
            borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={analyze}
          style={{
            padding: '8px 20px', background: '#7c3aed20', border: '1px solid #7c3aed',
            borderRadius: 8, cursor: 'pointer', color: '#c4b5fd', fontSize: 13, fontWeight: 600,
          }}
        >Analyze</button>
      </div>

      {points.length === 0 && (
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Enter a chord progression (space or comma separated) and press Analyze.
        </p>
      )}

      {points.length > 0 && (
        <>
          <svg width={W} height={H} style={{ overflow: 'visible', maxWidth: '100%' }}>
            {/* Grid columns */}
            {points.map((_, i) => (
              <line key={i}
                x1={xOf(i)} y1={TOP} x2={xOf(i)} y2={H - BOT}
                stroke="#21262d" strokeDasharray="3 3" />
            ))}

            {/* 3rd line */}
            {points.map((p, i) => {
              if (p.thirdAbs === null) return null;
              const next = points[i + 1];
              const y = yOf(p.thirdAbs);
              return (
                <g key={`t${i}`}>
                  {next?.thirdAbs != null && (
                    <>
                      <line
                        x1={xOf(i)} y1={y} x2={xOf(i + 1)} y2={yOf(next.thirdAbs)}
                        stroke="#7c3aed" strokeWidth={2} />
                      <text
                        x={(xOf(i) + xOf(i + 1)) / 2}
                        y={(y + yOf(next.thirdAbs)) / 2 - 5}
                        textAnchor="middle" fontSize={10}
                        fill={distColor(next.thirdAbs - p.thirdAbs)}>
                        {next.thirdAbs - p.thirdAbs > 0
                          ? `+${next.thirdAbs - p.thirdAbs}`
                          : `${next.thirdAbs - p.thirdAbs}`}
                      </text>
                    </>
                  )}
                  <circle cx={xOf(i)} cy={y} r={5} fill="#7c3aed" />
                  <text x={xOf(i)} y={y - 9} textAnchor="middle" fill="#c4b5fd" fontSize={11}>{p.third}</text>
                </g>
              );
            })}

            {/* 7th line */}
            {points.map((p, i) => {
              if (p.seventhAbs === null) return null;
              const next = points[i + 1];
              const y = yOf(p.seventhAbs);
              return (
                <g key={`s${i}`}>
                  {next?.seventhAbs != null && (
                    <>
                      <line
                        x1={xOf(i)} y1={y} x2={xOf(i + 1)} y2={yOf(next.seventhAbs)}
                        stroke="#f59e0b" strokeWidth={2} />
                      <text
                        x={(xOf(i) + xOf(i + 1)) / 2}
                        y={(y + yOf(next.seventhAbs)) / 2 + 14}
                        textAnchor="middle" fontSize={10}
                        fill={distColor(next.seventhAbs - p.seventhAbs)}>
                        {next.seventhAbs - p.seventhAbs > 0
                          ? `+${next.seventhAbs - p.seventhAbs}`
                          : `${next.seventhAbs - p.seventhAbs}`}
                      </text>
                    </>
                  )}
                  <circle cx={xOf(i)} cy={y} r={5} fill="#f59e0b" />
                  <text x={xOf(i)} y={y + 19} textAnchor="middle" fill="#fcd34d" fontSize={11}>{p.seventh}</text>
                </g>
              );
            })}

            {/* Chord labels */}
            {points.map((p, i) => (
              <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle"
                fill="#8b949e" fontSize={11} fontWeight={600}>{p.chord}</text>
            ))}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
            <span><span style={{ color: '#7c3aed' }}>●</span> 3rd</span>
            <span><span style={{ color: '#f59e0b' }}>●</span> 7th</span>
            <span><span style={{ color: '#10b981' }}>■</span> ≤2 semitones (smooth)</span>
            <span><span style={{ color: '#f59e0b' }}>■</span> 3–4 semitones</span>
            <span><span style={{ color: '#ef4444' }}>■</span> ≥5 semitones (leap)</span>
          </div>

          {smoothestLine && (
            <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              Smoothest voice: <span style={{ color: '#e6edf3', fontWeight: 600 }}>{smoothestLine}</span>
              {' '}— use as a horn counter-melody or inner keyboard line.
            </p>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Add the `<details>` wrapper** to the `return` of `VoiceLeadingFeature` just before its final `</div>` (line 882):

Find the block ending with:
```tsx
        </div>
      </div>
    </div>
  );
}
```

Insert before the outermost closing `</div>`:
```tsx
      {/* Guide Tone Lines */}
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          📊 Guide Tone Lines — voice the 3rds and 7ths across a progression
        </summary>
        <div style={{ marginTop: 14 }}>
          <GuideToneLinesSection />
        </div>
      </details>
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Browser test:** Open Voice Leading Lab → scroll to bottom → confirm "Guide Tone Lines" `<details>` section is visible. Type `Cmaj7 Am7 Dm7 G7`, click Analyze → confirm SVG appears with purple (3rd) and orange (7th) lines connecting 4 chord columns. Verify the distance labels appear on the connecting segments.

- [ ] **Commit:**

```bash
git add src/features/voice-leading/VoiceLeadingFeature.tsx src/shared/utils/musicTheory.ts
git commit -m "feat(voice-leading): add Guide Tone Lines section with SVG visualization"
```

---

## Task 4: Motif Lab in Melody Architect

**Files:**
- Modify: `src/features/melody-architect/MelodyArchitectFeature.tsx`

The outer `<div>` of `MelodyArchitectFeature` closes at line 1125. Add the Motif Lab `<details>` before that closing tag.

- [ ] **Add import** at the top of `MelodyArchitectFeature.tsx` (existing imports are `{ useState, useEffect }` from react and `{ useGlobalKey }` from context):

```typescript
import { noteToSemitone, semitoneToNote, notePreferFlat, transposeNote } from '@shared/utils/musicTheory';
```

- [ ] **Add the Motif Lab component** — paste before `export default function MelodyArchitectFeature()`:

```typescript
// ─── Motif Lab ───────────────────────────────────────────────────────────────

const DEGREE_TO_SEMI: Record<string, number> = {
  '1': 0, 'b2': 1, '2': 2, 'b3': 3, '#2': 3, '3': 4, '4': 5,
  '#4': 6, 'b5': 6, '5': 7, '#5': 8, 'b6': 8, '6': 9, 'b7': 10, '7': 11,
};

const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];

function parseDegrees(input: string, globalKey: string): { note: string; semi: number }[] {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const isNoteNames = /^[A-Ga-g][b#]?$/.test(tokens[0]);
  const keySemi = noteToSemitone(globalKey);

  if (isNoteNames) {
    return tokens
      .map(t => {
        const note = t.charAt(0).toUpperCase() + t.slice(1);
        const semi = noteToSemitone(note);
        return semi >= 0 ? { note, semi: keySemi + ((semi - keySemi + 12) % 12) } : null;
      })
      .filter((x): x is { note: string; semi: number } => x !== null);
  }

  return tokens
    .map(t => {
      const ds = DEGREE_TO_SEMI[t];
      if (ds === undefined) return null;
      const absSemi = keySemi + ds;
      const note = semitoneToNote(((absSemi % 12) + 12) % 12, notePreferFlat(globalKey));
      return { note, semi: absSemi };
    })
    .filter((x): x is { note: string; semi: number } => x !== null);
}

function invertMotif(notes: { note: string; semi: number }[], globalKey: string): { note: string; semi: number }[] {
  if (notes.length === 0) return [];
  const first = notes[0].semi;
  return notes.map(n => {
    const newSemi = first - (n.semi - first);
    return { note: semitoneToNote(((newSemi % 12) + 12) % 12, notePreferFlat(globalKey)), semi: newSemi };
  });
}

function diatonicShift(
  notes: { note: string; semi: number }[],
  keySemi: number,
  steps: number,
  globalKey: string,
): { note: string; semi: number }[] {
  return notes.map(({ semi }) => {
    const rel = ((semi - keySemi) % 12 + 12) % 12;
    let scaleIdx = MAJOR_SCALE_STEPS.indexOf(rel);
    if (scaleIdx < 0) {
      scaleIdx = MAJOR_SCALE_STEPS.reduce((bi, s, i) =>
        Math.abs(s - rel) < Math.abs(MAJOR_SCALE_STEPS[bi] - rel) ? i : bi, 0);
    }
    const newIdx = scaleIdx + steps;
    const octaveOff = Math.floor(newIdx / 7) * 12;
    const wrappedIdx = ((newIdx % 7) + 7) % 7;
    const newSemi = keySemi + MAJOR_SCALE_STEPS[wrappedIdx] + octaveOff;
    return { note: semitoneToNote(((newSemi % 12) + 12) % 12, notePreferFlat(globalKey)), semi: newSemi };
  });
}

function MotifNotePills({ notes }: { notes: { note: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {notes.map((n, i) => (
        <span key={i} style={{
          padding: '2px 10px', borderRadius: 99,
          background: '#1a1030', border: '1px solid #7c3aed',
          color: '#c4b5fd', fontSize: 13, fontWeight: 700,
        }}>{n.note}</span>
      ))}
    </div>
  );
}

interface TransformCardProps {
  title: string;
  notes: { note: string; semi?: number }[];
  tip: string;
  dimmed?: boolean;
}

function TransformCard({ title, notes, tip, dimmed }: TransformCardProps) {
  return (
    <div style={{
      background: '#0d1117', border: '1px solid #21262d',
      borderRadius: 8, padding: '10px 14px',
      opacity: dimmed ? 0.6 : 1,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', marginBottom: 6 }}>{title}</div>
      {dimmed
        ? <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
            {notes.length > 0 ? `${notes.map(n => n.note).join('  ')} (valori ritmici)` : '—'}
          </div>
        : <MotifNotePills notes={notes} />
      }
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>💡 {tip}</div>
    </div>
  );
}

function MotifLabSection() {
  const { globalKey } = useGlobalKey();
  const [input, setInput] = useState('1 3 5 b7');
  const [motif, setMotif] = useState<{ note: string; semi: number }[]>([]);
  const keySemi = noteToSemitone(globalKey);

  function analyze() {
    setMotif(parseDegrees(input, globalKey));
  }

  const inverted = invertMotif(motif, globalKey);
  const reversed = [...motif].reverse();
  const retroInverted = invertMotif(reversed, globalKey);
  const seqUp = diatonicShift(motif, keySemi, 1, globalKey);
  const seqDown = diatonicShift(motif, keySemi, -2, globalKey);

  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
        Inserisci gradi della scala (<code style={{ color: '#c4b5fd' }}>1 3 5 b7</code>) o nomi di nota
        (<code style={{ color: '#c4b5fd' }}>C E G Bb</code>) — la key globale è <strong style={{ color: '#e6edf3' }}>{globalKey}</strong>.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder="e.g. 1 3 5 b7  or  C E G Bb"
          style={{
            flex: 1, padding: '8px 12px',
            background: '#0d1117', border: '1px solid #30363d',
            borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={analyze} style={{
          padding: '8px 20px', background: '#7c3aed20', border: '1px solid #7c3aed',
          borderRadius: 8, cursor: 'pointer', color: '#c4b5fd', fontSize: 13, fontWeight: 600,
        }}>Analizza</button>
      </div>

      {motif.length === 0 && (
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Inserisci il motivo e premi Analizza.
        </p>
      )}

      {motif.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TransformCard title="Originale" notes={motif} tip="Il motivo di partenza" />
          <TransformCard title="Inversione" notes={inverted} tip="Ogni intervallo capovolto attorno alla prima nota" />
          <TransformCard title="Retrogrado" notes={reversed} tip="Suona il motivo al contrario" />
          <TransformCard title="Retrogrado Inverso" notes={retroInverted} tip="Rovescia poi capovolge — tecnica contrappuntistica" />
          <TransformCard title="Sequenza +1° (diatonica)" notes={seqUp} tip="Motivo trasportato su di un grado nella scala di " + globalKey + " maggiore" />
          <TransformCard title="Sequenza –3° (diatonica)" notes={seqDown} tip="Motivo trasportato giù di una terza diatonica" />
          <TransformCard
            title="Augmentation ×2 (stesse altezze, durata doppia)"
            notes={motif}
            tip="I valori ritmici raddoppiano — le note rimangono le stesse"
            dimmed
          />
          <TransformCard
            title="Diminution ÷2 (stesse altezze, durata dimezzata)"
            notes={motif}
            tip="I valori ritmici si dimezzano — le note rimangono le stesse"
            dimmed
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Add the `<details>` wrapper** to the `return` of `MelodyArchitectFeature` just before the final `</div>` (line 1125):

Find:
```tsx
    </div>
  );
}
```

Insert before the outermost `</div>`:
```tsx
      {/* Motif Lab */}
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          🧬 Motif Lab — inversion, retrograde, sequences
        </summary>
        <div style={{ marginTop: 14 }}>
          <MotifLabSection />
        </div>
      </details>
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Browser test:** Open Melody Architect → scroll to bottom → confirm "Motif Lab" `<details>` section. Type `1 3 5 b7` in key C → press Analizza → verify 8 cards appear. Check that the Inversione card shows `C Ab F Eb` (inverted intervals around C). Confirm that changing global key to F updates the note names.

- [ ] **Commit:**

```bash
git add src/features/melody-architect/MelodyArchitectFeature.tsx
git commit -m "feat(melody-architect): add Motif Lab with 7 compositional transformations"
```

---

## Task 5: Form & Energy Map in Song Architect

**Files:**
- Modify: `src/features/song-architect/SongArchitectFeature.tsx`

The outer `<div>` of `SongArchitectFeature` closes at line 694. Add the Form & Energy `<details>` before that closing tag.

- [ ] **Add the Form & Energy component** — paste before `export default function SongArchitectFeature()`:

```typescript
// ─── Form & Energy Map ──────────────────────────────────────────────────────

interface FormSection {
  id: string;
  name: string;
  bars: number;
  feel: string;
  energy: 1 | 2 | 3 | 4 | 5;
}

const FORM_TEMPLATES: Record<string, Omit<FormSection, 'id'>[]> = {
  AABA: [
    { name: 'A', bars: 8, feel: 'main theme', energy: 3 },
    { name: 'A', bars: 8, feel: 'main theme (varied)', energy: 4 },
    { name: 'B', bars: 8, feel: 'bridge, contrast', energy: 5 },
    { name: 'A', bars: 8, feel: 'return', energy: 3 },
  ],
  'Verse-Chorus': [
    { name: 'Intro', bars: 4, feel: 'sparse', energy: 2 },
    { name: 'Verse', bars: 8, feel: 'building', energy: 3 },
    { name: 'Chorus', bars: 8, feel: 'peak, tutti', energy: 5 },
    { name: 'Verse', bars: 8, feel: 'returning', energy: 3 },
    { name: 'Chorus', bars: 8, feel: 'peak, tutti', energy: 5 },
  ],
  'Modal Vamp': [
    { name: 'Intro', bars: 4, feel: 'sparse, open', energy: 2 },
    { name: 'Vamp', bars: 16, feel: 'modal groove', energy: 3 },
    { name: 'Peak', bars: 8, feel: 'full band', energy: 5 },
  ],
  'Through-Composed': [
    { name: 'A', bars: 8, feel: 'introduction', energy: 2 },
    { name: 'B', bars: 8, feel: 'development', energy: 3 },
    { name: 'C', bars: 8, feel: 'intensification', energy: 4 },
    { name: 'D', bars: 8, feel: 'climax', energy: 5 },
  ],
};

let _sectionId = 0;
function mkId() { return String(++_sectionId); }

function withIds(rows: Omit<FormSection, 'id'>[]): FormSection[] {
  return rows.map(r => ({ ...r, id: mkId() }));
}

function EnergyChart({ sections }: { sections: FormSection[] }) {
  if (sections.length === 0) return null;
  const W = Math.max(280, sections.length * 56);
  const H = 60;
  const barW = W / sections.length - 4;

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {sections.map((s, i) => {
        const barH = Math.max(4, (s.energy / 5) * (H - 18));
        const x = i * (W / sections.length) + 2;
        const y = H - barH - 14;
        const alpha = 0.3 + (s.energy / 5) * 0.7;
        return (
          <g key={s.id}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={`rgba(124, 58, 237, ${alpha})`} rx={3} />
            <text x={x + barW / 2} y={H - 2} textAnchor="middle"
              fill="#6b7280" fontSize={9}>{s.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

function FormEnergyMapSection() {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null);

  function addSection() {
    setSections(prev => [...prev, { id: mkId(), name: 'A', bars: 8, feel: '', energy: 3 }]);
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id));
  }

  function updateSection(id: string, field: keyof FormSection, value: string | number) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function moveSection(id: string, dir: -1 | 1) {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function applyTemplate(name: string) {
    if (sections.length > 0 && confirmTemplate !== name) {
      setConfirmTemplate(name);
      return;
    }
    setSections(withIds(FORM_TEMPLATES[name]));
    setConfirmTemplate(null);
  }

  const totalBars = sections.reduce((acc, s) => acc + (Number(s.bars) || 0), 0);

  return (
    <div>
      {/* Template buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.keys(FORM_TEMPLATES).map(name => (
          <button
            key={name}
            onClick={() => applyTemplate(name)}
            style={{
              padding: '5px 14px',
              background: confirmTemplate === name ? '#7c3aed40' : '#161b22',
              border: `1px solid ${confirmTemplate === name ? '#7c3aed' : '#30363d'}`,
              borderRadius: 8, cursor: 'pointer',
              color: confirmTemplate === name ? '#c4b5fd' : '#8b949e',
              fontSize: 12,
            }}
          >
            {confirmTemplate === name ? `⚠ Conferma: ${name}` : name}
          </button>
        ))}
        {confirmTemplate && (
          <button onClick={() => setConfirmTemplate(null)} style={{
            padding: '5px 12px', background: 'none', border: '1px solid #30363d',
            borderRadius: 8, cursor: 'pointer', color: '#6b7280', fontSize: 12,
          }}>Annulla</button>
        )}
      </div>

      {/* Table */}
      {sections.length === 0 ? (
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
          Aggiungi sezioni manualmente o scegli un template.
        </p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#6b7280' }}>
                {['', 'Sezione', 'Battute', 'Feel', 'Energia', ''].map((h, i) => (
                  <th key={i} style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((s, idx) => (
                <tr key={s.id} style={{ borderTop: '1px solid #21262d' }}>
                  {/* Move buttons */}
                  <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => moveSection(s.id, -1)} disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 12, padding: '0 2px' }}>▲</button>
                    <button onClick={() => moveSection(s.id, 1)} disabled={idx === sections.length - 1}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 12, padding: '0 2px' }}>▼</button>
                  </td>
                  {/* Name */}
                  <td style={{ padding: '4px 8px' }}>
                    <input value={s.name} onChange={e => updateSection(s.id, 'name', e.target.value)}
                      style={{ width: 60, padding: '4px 6px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 13, outline: 'none' }} />
                  </td>
                  {/* Bars */}
                  <td style={{ padding: '4px 8px' }}>
                    <input type="number" min={1} max={128} value={s.bars}
                      onChange={e => updateSection(s.id, 'bars', parseInt(e.target.value) || 1)}
                      style={{ width: 52, padding: '4px 6px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 13, outline: 'none' }} />
                  </td>
                  {/* Feel */}
                  <td style={{ padding: '4px 8px' }}>
                    <input value={s.feel} placeholder="funk pocket, sparse…"
                      onChange={e => updateSection(s.id, 'feel', e.target.value)}
                      style={{ width: 160, padding: '4px 6px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 13, outline: 'none' }} />
                  </td>
                  {/* Energy */}
                  <td style={{ padding: '4px 8px' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} onClick={() => updateSection(s.id, 'energy', v as 1|2|3|4|5)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                            color: s.energy >= v ? '#7c3aed' : '#30363d', padding: 0 }}>●</button>
                      ))}
                    </div>
                  </td>
                  {/* Delete */}
                  <td style={{ padding: '4px 8px' }}>
                    <button onClick={() => removeSection(s.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add button */}
      <button onClick={addSection} style={{
        padding: '6px 16px', background: '#161b22', border: '1px dashed #30363d',
        borderRadius: 8, cursor: 'pointer', color: '#8b949e', fontSize: 13, marginBottom: 16,
      }}>+ Sezione</button>

      {/* Energy curve */}
      {sections.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Curva energia</div>
          <EnergyChart sections={sections} />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            Totale: <span style={{ color: '#e6edf3', fontWeight: 600 }}>{totalBars} battute</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Add the `<details>` wrapper** to the `return` of `SongArchitectFeature` just before the final `</div>` (line 694):

Find:
```tsx
      </details>
    </div>
  );
}
```

Insert before the outermost `</div>`:
```tsx
      {/* Form & Energy Map */}
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          🗺 Form & Energy Map — pianifica la struttura e la curva di energia del brano
        </summary>
        <div style={{ marginTop: 14 }}>
          <FormEnergyMapSection />
        </div>
      </details>
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Browser test:** Open Song Architect → scroll to bottom → confirm Form & Energy Map section. Click "AABA" template → confirm 4 rows appear. Click energy dots on a row to change energy level → confirm SVG bar chart updates. Add a new section with "+ Sezione" → confirm it appears. Test the ▲▼ reorder buttons. Click "AABA" again when rows are present → confirm the warning button appears before replacing.

- [ ] **Commit:**

```bash
git add src/features/song-architect/SongArchitectFeature.tsx
git commit -m "feat(song-architect): add Form & Energy Map section with templates and SVG curve"
```

---

## Task 6: Rhythmic Displacement standalone feature

**Files:**
- Create: `src/features/rhythmic-displacement/RhythmicDisplacementFeature.tsx`
- Modify: `src/App.tsx`

- [ ] **Create the feature file** at `src/features/rhythmic-displacement/RhythmicDisplacementFeature.tsx`:

```tsx
import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PolyMode = '3:2' | '4:3' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displacePattern(original: boolean[], offset: number): boolean[] {
  const len = original.length;
  return original.map((_, i) => original[((i - offset) % len + len) % len]);
}

function patternToString(pattern: boolean[]): string {
  return pattern.map(b => b ? '●' : '·').join(' ');
}

// ─── Polyrhythm patterns ─────────────────────────────────────────────────────

function buildPolyRows(mode: PolyMode): { label: string; cells: { active: boolean; accent?: boolean }[] }[] {
  if (mode === '3:2') {
    // 3 against 2: 6-cell LCM grid. Every 2 cells = pulse A (duplets), every 3 cells = pulse B (triplets)
    return [
      {
        label: '2 (duplets)',
        cells: [0, 1, 2, 3, 4, 5].map(i => ({ active: i % 2 === 0, accent: i % 2 === 0 })),
      },
      {
        label: '3 (triplets)',
        cells: [0, 1, 2, 3, 4, 5].map(i => ({ active: i % 3 === 0, accent: i % 3 === 0 })),
      },
    ];
  }
  if (mode === '4:3') {
    // 4 against 3: 12-cell LCM grid. Every 3 cells = pulse A (quadruplets), every 4 cells = pulse B
    return [
      {
        label: '4 (quadruplets)',
        cells: [0,1,2,3,4,5,6,7,8,9,10,11].map(i => ({ active: i % 3 === 0, accent: i % 3 === 0 })),
      },
      {
        label: '3 (triplets)',
        cells: [0,1,2,3,4,5,6,7,8,9,10,11].map(i => ({ active: i % 4 === 0, accent: i % 4 === 0 })),
      },
    ];
  }
  return [];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PatternGrid({
  cells,
  onClick,
  accent,
  color = '#7c3aed',
}: {
  cells: boolean[];
  onClick?: (i: number) => void;
  accent?: boolean[];
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {cells.map((active, i) => (
        <div
          key={i}
          onClick={() => onClick?.(i)}
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: active ? color : '#0d1117',
            border: `1px solid ${active ? color : '#30363d'}`,
            cursor: onClick ? 'pointer' : 'default',
            opacity: accent && !accent[i] ? 0.4 : 1,
            transition: 'background 0.1s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: active ? '#fff' : '#6b7280',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

const DISPLACEMENT_OPTIONS = [
  { label: '+1/16', value: 1 },
  { label: '+1/8',  value: 2 },
  { label: '+3/16', value: 3 },
  { label: '+1/4',  value: 4 },
];

const POLY_TIPS: Record<string, string> = {
  '3:2': 'Yussef Dayes / Ghost Note: 3 contro 2 crea una tensione poliritmia fondamentale nel funk africano. Il punto di coincidenza (beat 1) è il centro gravitazionale.',
  '4:3': 'Snarky Puppy / Coltrane: 4 contro 3 genera 12 micro-posizioni. Usato nei cicli Giant Steps e nelle modulazioni metriche di "The Chicken" (Jaco Pastorius).',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function RhythmicDisplacementFeature() {
  const [pattern, setPattern] = useState<boolean[]>(Array(16).fill(false));
  const [activeDisplacements, setActiveDisplacements] = useState<Set<number>>(new Set());
  const [polyMode, setPolyMode] = useState<PolyMode>(null);

  function toggleCell(i: number) {
    setPattern(prev => { const next = [...prev]; next[i] = !next[i]; return next; });
  }

  function toggleDisplacement(value: number) {
    setActiveDisplacements(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }

  function togglePoly(mode: '3:2' | '4:3') {
    setPolyMode(prev => prev === mode ? null : mode);
  }

  const polyRows = buildPolyRows(polyMode);
  const hasAnyHit = pattern.some(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Rhythmic Displacement</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Costruisci un pattern ritmico su 1 battuta (16 celle = 1/16 ciascuna), poi spostalo di varie suddivisioni
          per esplorare effetti di behind-the-beat e poliritmia.
        </p>
      </div>

      {/* Pattern builder */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
        <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 10 }}>
          Pattern (clicca per attivare/disattivare — 1 battuta in 4/4)
        </div>
        <PatternGrid cells={pattern} onClick={toggleCell} color="#7c3aed" />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setPattern(Array(16).fill(false))}
            style={{
              padding: '5px 14px', background: 'none', border: '1px solid #30363d',
              borderRadius: 8, cursor: 'pointer', color: '#6b7280', fontSize: 12,
            }}
          >Reset</button>
          {/* Preset patterns */}
          {[
            { label: 'Son Clave', p: [true,false,false,true,false,false,true,false,false,false,true,false,false,true,false,false] },
            { label: 'Funk 16th', p: [true,false,false,false,true,false,true,false,false,true,false,false,true,false,false,false] },
            { label: 'Ghost Note', p: [true,true,false,true,false,false,true,false,true,true,false,false,false,true,false,false] },
          ].map(({ label, p }) => (
            <button key={label} onClick={() => setPattern(p)}
              style={{
                padding: '5px 14px', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, cursor: 'pointer', color: '#8b949e', fontSize: 12,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Displacement controls */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
        <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 10 }}>
          Displacement — attiva uno o più offset
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DISPLACEMENT_OPTIONS.map(({ label, value }) => {
            const active = activeDisplacements.has(value);
            return (
              <button key={value} onClick={() => toggleDisplacement(value)} style={{
                padding: '7px 18px',
                background: active ? '#7c3aed20' : '#0d1117',
                border: `1px solid ${active ? '#7c3aed' : '#30363d'}`,
                borderRadius: 8, cursor: 'pointer',
                color: active ? '#c4b5fd' : '#6b7280',
                fontSize: 13, fontWeight: active ? 700 : 400,
              }}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* Displaced patterns display */}
      {(hasAnyHit || activeDisplacements.size > 0) && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
          <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 12 }}>
            Pattern e displacement
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Original */}
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Originale</div>
              <PatternGrid cells={pattern} color="#7c3aed" />
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontFamily: 'monospace', letterSpacing: 2 }}>
                {patternToString(pattern)}
              </div>
            </div>
            {/* Displaced rows */}
            {[...activeDisplacements].sort((a, b) => a - b).map(offset => {
              const displaced = displacePattern(pattern, offset);
              const optLabel = DISPLACEMENT_OPTIONS.find(o => o.value === offset)?.label ?? `+${offset}`;
              return (
                <div key={offset}>
                  <div style={{ fontSize: 11, color: '#c4b5fd', marginBottom: 6, fontWeight: 600 }}>
                    {optLabel}
                  </div>
                  <PatternGrid cells={displaced} color="#06b6d4" />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontFamily: 'monospace', letterSpacing: 2 }}>
                    {patternToString(displaced)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Polyrhythm mode */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px' }}>
        <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 600, marginBottom: 10 }}>
          Polyrhythm visualizer
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['3:2', '4:3'] as const).map(mode => (
            <button key={mode} onClick={() => togglePoly(mode)} style={{
              padding: '7px 18px',
              background: polyMode === mode ? '#06b6d420' : '#0d1117',
              border: `1px solid ${polyMode === mode ? '#06b6d4' : '#30363d'}`,
              borderRadius: 8, cursor: 'pointer',
              color: polyMode === mode ? '#67e8f9' : '#6b7280',
              fontSize: 13, fontWeight: polyMode === mode ? 700 : 400,
            }}>{mode}</button>
          ))}
        </div>

        {polyMode && (
          <div>
            {polyRows.map((row, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#67e8f9', marginBottom: 6, fontWeight: 600 }}>
                  {row.label}
                </div>
                <PatternGrid
                  cells={row.cells.map(c => c.active)}
                  accent={row.cells.map(c => c.accent ?? c.active)}
                  color="#06b6d4"
                />
              </div>
            ))}
            <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              💡 {POLY_TIPS[polyMode]}
            </p>
          </div>
        )}

        {!polyMode && (
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            Seleziona 3:2 o 4:3 per visualizzare la griglia poliritmia.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Wire into App.tsx** — add the import near the other feature imports (after line 36, ArrangementBlueprintFeature):

```typescript
import RhythmicDisplacementFeature from './features/rhythmic-displacement/RhythmicDisplacementFeature';
```

- [ ] **Add nav entry** in the GROUPS array, after `arrangement` (line 196):

```typescript
      { id: 'rhythmic-displacement', label: 'Rhythmic Displacement', icon: '⟳', desc: 'Displace a pattern by any subdivision — polyrhythm 3:2 and 4:3 visualizer', subsection: 'Arrange' },
```

- [ ] **Add render branch** in the `<main>` section. Find `{activeTab === 'arrangement' && <ArrangementBlueprintFeature />}` and add immediately after:

```tsx
        {activeTab === 'rhythmic-displacement' && <RhythmicDisplacementFeature />}
```

- [ ] **Build check:**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: no output.

- [ ] **Browser test:** Open the app → Composition nav group → confirm "Rhythmic Displacement" appears in the Arrange subsection. Click it → confirm the full page loads. Click grid cells to activate a pattern → select "+1/16" displacement → confirm the displaced row appears below with cyan cells. Load the "Son Clave" preset → activate +1/16 and +1/4 → verify both displaced versions appear. Toggle "3:2" polyrhythm → verify the 6-cell grid appears with two rows.

- [ ] **Commit:**

```bash
git add src/features/rhythmic-displacement/RhythmicDisplacementFeature.tsx src/App.tsx
git commit -m "feat(composition): add Rhythmic Displacement standalone feature with polyrhythm visualizer"
```

---

## Self-Review Checklist

- [x] All 5 spec features have a task
- [x] `ParsedChord`, `parseChord`, `parseProgression` exported in Task 1, imported in Task 3 (Guide Tone Lines) — `MotifLabSection` in Task 4 uses `noteToSemitone`/`semitoneToNote` which are already exported from `musicTheory.ts`
- [x] `transposeNote` is already imported in `ScaleAdvisorFeature.tsx` (line 4) — Task 2 uses it without adding a new import
- [x] `VoiceLeadingFeature` imports `{ Chord, Note }` from tonal already — Task 3 adds only the `parseProgression` import
- [x] `MelodyArchitectFeature` imports `{ Scale, Note }` — Task 4 needs to add `{ noteToSemitone, semitoneToNote, notePreferFlat, transposeNote }` from `@shared/utils/musicTheory`
- [x] Displacement offsets: 1, 2, 3, 4 cells (1/16, 1/8, 3/16, 1/4) — no duplicates
- [x] All `useGlobalKey` calls are inside function components (not in module scope)
- [x] No audio playback added (all features are visual/text only, matching spec)
- [x] No Firebase usage added
- [x] `RhythmicDisplacementFeature.tsx` filename is correct (no typo)
