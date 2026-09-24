# Melody Harmonizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Melody Harmonizer tool to Composition → Arrange that lets users input a melody step-by-step (note + chord per slot) and generates block harmony voices using Four-Way Close (4 parts) or 3-Horn Writing (3 parts with 5 sub-techniques).

**Architecture:** Self-contained feature — no backend, no global state. Pure computation lives in `harmonize.ts` (functions, no side effects). UI split into `StepSequencer.tsx` (input) and `VoiceGrid.tsx` (output). Main component wires them together. Uses `tonal`'s `Chord.get` and `Note.midi`/`Note.fromMidi`.

**Tech Stack:** React + TypeScript, tonal v4 (already installed), no new dependencies.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/features/melody-harmonizer/types.ts` | Create | Shared types: `MelodyNote`, `HarmonizationResult`, `Technique`, etc. |
| `src/features/melody-harmonizer/harmonize.ts` | Create | All computation: MIDI utils, Four-Way Close, 3-Horn, approach detection, `harmonize()` |
| `src/features/melody-harmonizer/StepSequencer.tsx` | Create | Input: add/edit/reorder note+chord slots; shows auto-detected TARGET/APPROACH badge |
| `src/features/melody-harmonizer/VoiceGrid.tsx` | Create | Output: horizontal grid (voice rows × note columns), hover tooltips, copy buttons |
| `src/features/melody-harmonizer/MelodyHarmonizerFeature.tsx` | Create | Main component: technique selector, sub-technique selector, stitches input+output |
| `src/App.tsx` | Modify | Add import, tab definition, render branch |

---

### Task 1: Types

**Files:**
- Create: `src/features/melody-harmonizer/types.ts`

- [ ] Create the file:

```typescript
// src/features/melody-harmonizer/types.ts

export type Technique = 'four-way-close' | '3-horn';

export type ThreeHornSubTechnique =
  | 'spread'
  | 'triads'
  | 'quartal'
  | 'open-fifths'
  | 'incomplete-4part';

export type NoteRole = 'target' | 'approach';

export interface MelodyNote {
  id: string;            // stable React key
  note: string;          // e.g. 'G', 'F#', 'Bb'
  chord: string;         // e.g. 'Ebmaj7', 'Bbm7'
  manualRole?: NoteRole; // undefined = auto-detect
}

export interface HarmonizedSlot {
  leadNote: string;       // original melody note name
  chord: string;
  role: NoteRole;         // resolved (auto or manual)
  voices: string[];       // [lead, v2, v3?, v4?] — note names without octave
  voiceLabels: string[];  // ['', '3rd', '7th', '5th'] — first entry is always ''
}

export interface HarmonizationResult {
  technique: Technique;
  subTechnique?: ThreeHornSubTechnique;
  slots: HarmonizedSlot[];
  voiceNames: string[];   // e.g. ['Lead', 'Voice 2', 'Voice 3', 'Voice 4']
}
```

- [ ] Run `npm run build` — expect clean compile (types only, nothing else changes)

---

### Task 2: Harmonize utilities

**Files:**
- Create: `src/features/melody-harmonizer/harmonize.ts` (utilities only for now)

- [ ] Create the file with MIDI helper functions:

```typescript
// src/features/melody-harmonizer/harmonize.ts

import { Chord, Note } from 'tonal';
import type {
  MelodyNote, NoteRole, Technique, ThreeHornSubTechnique,
  HarmonizedSlot, HarmonizationResult,
} from './types';

// ─── MIDI helpers ─────────────────────────────────────────────────────────────

// Parse note name (with or without octave) to MIDI, defaulting to octave 4.
// Accepts: 'G', 'G4', 'Bb', 'Bb5', 'F#'
function noteNameToMidi(note: string): number {
  const trimmed = note.trim();
  const hasOctave = /\d$/.test(trimmed);
  const withOctave = hasOctave ? trimmed : `${trimmed}4`;
  return Note.midi(withOctave) ?? 60;
}

// Highest MIDI note with the given pitch class (0–11) that is strictly below `below`.
// midiBelow(3, 67) → 63 (Eb4 below G4=67)
// midiBelow(7, 67) → 55 (G3 below G4=67, same PC must step down an octave)
function midiBelow(pc: number, below: number): number {
  const octave = Math.floor(below / 12);
  const candidate = pc + octave * 12;
  return candidate < below ? candidate : candidate - 12;
}

// Convert MIDI to note name without octave, preferring flats.
// Note.fromMidi already returns flats (Db4, Bb3, etc.) — strip the trailing digit.
function midiToName(midi: number): string {
  return Note.fromMidi(midi).replace(/\d+$/, '');
}

// Pitch classes [0–11] of all chord tones, in chord-tone order (root, 3rd, 5th, 7th…).
// Falls back to dom7 PCs [0,4,7,10] if tonal can't parse the symbol.
function getChordPCs(chordSymbol: string): number[] {
  const chord = Chord.get(chordSymbol);
  if (!chord.notes || chord.notes.length === 0) return [0, 4, 7, 10];
  return chord.notes
    .map(n => Note.get(n).chroma)
    .filter((c): c is number => c !== undefined);
}

// Label a MIDI note as its interval role within a chord ('root', '3rd', '5th', '7th', 'tension').
function intervalLabel(midi: number, chordSymbol: string): string {
  const chord = Chord.get(chordSymbol);
  if (!chord.notes) return '';
  const NAMES = ['root', '3rd', '5th', '7th', '9th', '11th', '13th'];
  const pc = midi % 12;
  const idx = chord.notes.findIndex(n => Note.get(n).chroma === pc);
  return idx >= 0 ? (NAMES[idx] ?? `ext${idx}`) : 'tension';
}
```

- [ ] Run `npm run build` — expect clean compile

---

### Task 3: Approach note detection

**Files:**
- Modify: `src/features/melody-harmonizer/harmonize.ts`

- [ ] Add `detectRoles` after the utility functions:

```typescript
// ─── Role detection ───────────────────────────────────────────────────────────

// Returns a NoteRole per input note.
// Rules (in priority order):
//   1. n.manualRole overrides everything
//   2. Last note in sequence is always 'target'
//   3. If |currentMidi − nextMidi| ≤ 2 semitones → 'approach'
//   4. Otherwise → 'target'
export function detectRoles(notes: MelodyNote[]): NoteRole[] {
  return notes.map((n, i) => {
    if (n.manualRole) return n.manualRole;
    if (i === notes.length - 1) return 'target';
    const cur  = noteNameToMidi(n.note);
    const next = noteNameToMidi(notes[i + 1].note);
    return Math.abs(cur - next) <= 2 ? 'approach' : 'target';
  });
}
```

- [ ] Run `npm run build` — expect clean compile

---

### Task 4: Four-Way Close algorithm

**Files:**
- Modify: `src/features/melody-harmonizer/harmonize.ts`

- [ ] Add `fourWayCloseVoices` and `fourWayCloseApproach` after `detectRoles`:

```typescript
// ─── Four-Way Close ───────────────────────────────────────────────────────────

// Greedy descent: collect `count` chord-tone MIDI notes strictly below `from`.
function descend(from: number, count: number, pcs: number[]): number[] {
  const result: number[] = [];
  let cursor = from;
  while (result.length < count) {
    // midiBelow always returns < cursor, so all candidates are valid
    const candidates = pcs.map(pc => midiBelow(pc, cursor));
    const next = Math.max(...candidates);
    result.push(next);
    cursor = next;
  }
  return result;
}

// Returns the 3 inner-voice MIDI notes below the lead for a target note.
// Handles two edge cases:
//   (a) minor 2nd between lead and V2 → skip V2, restart descent from V2
//   (b) tension lead (non-chord-tone) causing missing 3rd or 7th → same skip
function fourWayCloseVoices(leadMidi: number, chordSymbol: string): number[] {
  const pcs = getChordPCs(chordSymbol);
  const standard = descend(leadMidi, 3, pcs);
  if (standard.length < 3) return standard;

  const [v2, v3, v4] = standard;

  // (a) Minor 2nd between lead and V2
  if (leadMidi - v2 === 1) {
    return descend(v2, 3, pcs);
  }

  // (b) Tension lead: check 3rd and 7th are present among V2/V3/V4
  const leadIsChordTone = pcs.includes(leadMidi % 12);
  if (!leadIsChordTone && pcs.length >= 4) {
    const thirdPC   = pcs[1];
    const seventhPC = pcs[3];
    const voicePCs  = [v2, v3, v4].map(m => m % 12);
    if (!voicePCs.includes(thirdPC) || !voicePCs.includes(seventhPC)) {
      return descend(v2, 3, pcs);
    }
  }

  return [v2, v3, v4];
}

// Approach voices: each inner voice moves one chromatic half-step below its target.
// targetVoices = [leadMidi, v2, v3, v4?] of the NEXT target slot.
function fourWayCloseApproach(targetVoices: number[]): number[] {
  return targetVoices.slice(1).map(v => v - 1);
}
```

- [ ] Run `npm run build` — expect clean compile
- [ ] Open browser console (`npm run dev`, any page) and verify manually:

```javascript
// Paste this to verify Four-Way Close for G4=67 on Ebmaj7
// Expected: [63, 62, 58] → [Eb4, D4, Bb3]
// (run after temporarily exporting the functions for testing)
```

---

### Task 5: 3-Horn Writing algorithms

**Files:**
- Modify: `src/features/melody-harmonizer/harmonize.ts`

- [ ] Add `threeHornVoices` after `fourWayCloseApproach`:

```typescript
// ─── 3-Horn Writing ───────────────────────────────────────────────────────────

// Returns [v2Midi, v3Midi] for a given lead + chord + sub-technique.
function threeHornVoices(
  leadMidi: number,
  chordSymbol: string,
  sub: ThreeHornSubTechnique,
): number[] {
  const pcs     = getChordPCs(chordSymbol);
  const rootPC  = pcs[0] ?? 0;
  const thirdPC = pcs[1] ?? (rootPC + 4) % 12;
  const fifthPC = pcs[2] ?? (rootPC + 7) % 12;
  const sevPC   = pcs[3] ?? (rootPC + 10) % 12;

  switch (sub) {
    case 'spread': {
      // Guide tone (7th preferred, fallback 3rd) closest below lead.
      // Root at least a P4 (5 semitones) below guide tone for the wide spread.
      const guidePC = pcs.length >= 4 ? sevPC : thirdPC;
      const v2 = midiBelow(guidePC, leadMidi);
      let   v3 = midiBelow(rootPC, v2);
      while (v2 - v3 < 5) v3 -= 12;
      return [v2, v3];
    }

    case 'triads': {
      // Stack root–3rd–5th. Lead is top voice (not necessarily a chord tone).
      // V2 = 3rd below lead, V3 = root below V2.
      const v2 = midiBelow(thirdPC, leadMidi);
      const v3 = midiBelow(rootPC, v2);
      return [v2, v3];
    }

    case 'quartal': {
      // Perfect 4ths (5 semitones) stacked below lead.
      return [leadMidi - 5, leadMidi - 10];
    }

    case 'open-fifths': {
      // V2 = P5 below lead (inner harmony), V3 = octave below lead (strong foundation).
      return [leadMidi - 7, leadMidi - 12];
    }

    case 'incomplete-4part': {
      // Four-Way Close shape but only V2 and V3 (omit V4).
      return fourWayCloseVoices(leadMidi, chordSymbol).slice(0, 2);
    }

    default:
      return [leadMidi - 4, leadMidi - 7];
  }
}
```

- [ ] Run `npm run build` — expect clean compile

---

### Task 6: Main `harmonize()` export

**Files:**
- Modify: `src/features/melody-harmonizer/harmonize.ts`

- [ ] Append the voice name resolver and main export:

```typescript
// ─── Voice names ──────────────────────────────────────────────────────────────

function resolveVoiceNames(technique: Technique, sub?: ThreeHornSubTechnique): string[] {
  if (technique === 'four-way-close') {
    return ['Lead', 'Voice 2', 'Voice 3', 'Voice 4'];
  }
  if (sub === 'open-fifths') return ['Lead (Tpt)', 'Harmony (P5)', 'Bass Octave'];
  return ['Lead (Tpt)', 'Alto Sax', 'Trombone'];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function harmonize(
  notes: MelodyNote[],
  technique: Technique,
  sub?: ThreeHornSubTechnique,
): HarmonizationResult {
  const roles = detectRoles(notes);

  // First pass: compute target-slot voice MIDI arrays, keyed by index
  const targetMidiMap = new Map<number, number[]>(); // index → [leadMidi, v2, v3, v4?]

  notes.forEach((n, i) => {
    if (roles[i] !== 'target') return;
    const leadMidi = noteNameToMidi(n.note);
    const inner =
      technique === 'four-way-close'
        ? fourWayCloseVoices(leadMidi, n.chord)
        : threeHornVoices(leadMidi, n.chord, sub ?? 'spread');
    targetMidiMap.set(i, [leadMidi, ...inner]);
  });

  // Second pass: build all slots (approach notes reference next target's voices)
  const slots: HarmonizedSlot[] = notes.map((n, i) => {
    const role     = roles[i];
    const leadMidi = noteNameToMidi(n.note);

    let allMidi: number[];

    if (role === 'target') {
      allMidi = targetMidiMap.get(i) ?? [leadMidi];
    } else {
      // Find the nearest next target
      let nextIdx = i + 1;
      while (nextIdx < notes.length && roles[nextIdx] === 'approach') nextIdx++;
      const targetMidi = targetMidiMap.get(nextIdx) ?? [leadMidi + 2, leadMidi - 3, leadMidi - 7];
      const approachInner =
        technique === 'four-way-close'
          ? fourWayCloseApproach(targetMidi)
          : targetMidi.slice(1).map(v => v - 1); // chromatic half-step below each target voice
      allMidi = [leadMidi, ...approachInner];
    }

    return {
      leadNote: n.note,
      chord:    n.chord,
      role,
      voices:      allMidi.map(midiToName),
      voiceLabels: allMidi.map((m, vi) => vi === 0 ? '' : intervalLabel(m, n.chord)),
    };
  });

  return {
    technique,
    subTechnique: technique === '3-horn' ? (sub ?? 'spread') : undefined,
    slots,
    voiceNames: resolveVoiceNames(technique, sub),
  };
}
```

- [ ] Run `npm run build` — expect clean compile

---

### Task 7: StepSequencer component

**Files:**
- Create: `src/features/melody-harmonizer/StepSequencer.tsx`

- [ ] Create the file:

```tsx
// src/features/melody-harmonizer/StepSequencer.tsx

import type { MelodyNote, NoteRole } from './types';
import { detectRoles } from './harmonize';

let idCounter = 0;
export function newNoteId(): string { return `note-${++idCounter}`; }

interface Props {
  notes: MelodyNote[];
  onChange: (notes: MelodyNote[]) => void;
}

export default function StepSequencer({ notes, onChange }: Props) {
  const roles = detectRoles(notes);

  function add() {
    onChange([...notes, { id: newNoteId(), note: '', chord: '' }]);
  }

  function update(id: string, field: 'note' | 'chord', value: string) {
    onChange(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
  }

  function toggleRole(id: string, current: NoteRole) {
    const next: NoteRole = current === 'target' ? 'approach' : 'target';
    onChange(notes.map(n => n.id === id ? { ...n, manualRole: next } : n));
  }

  function remove(id: string) {
    onChange(notes.filter(n => n.id !== id));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const arr = [...notes];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  }

  function moveDown(idx: number) {
    if (idx === notes.length - 1) return;
    const arr = [...notes];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {notes.map((n, i) => {
        const role      = n.manualRole ?? roles[i];
        const isApproach = role === 'approach';
        return (
          <div
            key={n.id}
            style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: '#1e293b', borderRadius: 8, padding: '8px 12px',
              border: `1px solid ${isApproach ? '#334155' : '#1e3a5f'}`,
            }}
          >
            <span style={{ color: '#475569', fontSize: 11, width: 18, textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </span>
            <input
              value={n.note}
              onChange={e => update(n.id, 'note', e.target.value)}
              placeholder="G, Bb, F#…"
              style={inputStyle(72)}
            />
            <input
              value={n.chord}
              onChange={e => update(n.id, 'chord', e.target.value)}
              placeholder="Ebmaj7, Bbm7, G7b9…"
              style={inputStyle(undefined, true)}
            />
            <button
              onClick={() => toggleRole(n.id, role)}
              title="Clicca per invertire (auto-rilevato di default)"
              style={{
                background: isApproach ? '#1e293b' : '#1e3a5f',
                border: `1px solid ${isApproach ? '#334155' : '#3b5998'}`,
                borderRadius: 4,
                color: isApproach ? '#475569' : '#60a5fa',
                padding: '2px 7px', fontSize: 9, cursor: 'pointer',
                fontFamily: 'monospace', letterSpacing: '0.05em', flexShrink: 0,
              }}
            >
              {isApproach ? 'APPROACH' : 'TARGET'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button onClick={() => moveUp(i)}   style={arrowBtn}>▲</button>
              <button onClick={() => moveDown(i)} style={arrowBtn}>▼</button>
            </div>
            <button onClick={() => remove(n.id)} style={removeBtn}>✕</button>
          </div>
        );
      })}
      <button onClick={add} style={addBtn}>+ Aggiungi nota</button>
    </div>
  );
}

function inputStyle(width?: number, flex?: boolean): React.CSSProperties {
  return {
    background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
    color: '#e2e8f0', padding: '4px 8px', fontSize: 14, fontFamily: 'monospace',
    ...(width  ? { width } : {}),
    ...(flex   ? { flex: 1 } : {}),
  };
}

const arrowBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#475569',
  cursor: 'pointer', fontSize: 9, padding: '1px 4px', lineHeight: 1,
};

const removeBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#ef4444',
  cursor: 'pointer', fontSize: 14, padding: '0 4px',
};

const addBtn: React.CSSProperties = {
  background: '#1e293b', border: '1px dashed #334155', borderRadius: 8,
  color: '#60a5fa', padding: '8px 16px', cursor: 'pointer',
  fontSize: 14, width: '100%', textAlign: 'center',
};
```

- [ ] Run `npm run build` — expect clean compile

---

### Task 8: VoiceGrid component

**Files:**
- Create: `src/features/melody-harmonizer/VoiceGrid.tsx`

- [ ] Create the file:

```tsx
// src/features/melody-harmonizer/VoiceGrid.tsx

import { useState } from 'react';
import type { HarmonizationResult } from './types';

const COLORS = ['#60a5fa', '#c4b5fd', '#6ee7b7', '#fdba74'];
const BG     = ['#1e3a5f', '#2d1b69', '#064e3b', '#431407'];

interface Props {
  result: HarmonizationResult;
}

export default function VoiceGrid({ result }: Props) {
  const [hover, setHover] = useState<{ si: number; vi: number } | null>(null);
  const { slots, voiceNames } = result;
  const voiceCount = Math.max(...slots.map(s => s.voices.length));

  function copyVoice(vi: number) {
    navigator.clipboard.writeText(
      slots.map(s => s.voices[vi] ?? '—').join(' ')
    );
  }

  function copyAll() {
    const lines = voiceNames.map((name, vi) =>
      `${name}: ${slots.map(s => s.voices[vi] ?? '—').join(' ')}`
    );
    navigator.clipboard.writeText(lines.join('\n'));
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 360 }}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            {slots.map((s, si) => (
              <th key={si} style={{ ...thStyle, textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: 10 }}>{s.chord}</div>
                {s.role === 'approach' && (
                  <div style={{ color: '#475569', fontSize: 9, fontFamily: 'monospace' }}>APR</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: voiceCount }, (_, vi) => (
            <tr key={vi}>
              <td style={{ ...tdLabel, color: COLORS[vi] ?? '#94a3b8' }}>
                {voiceNames[vi] ?? `Voice ${vi + 1}`}
              </td>
              {slots.map((s, si) => {
                const noteName   = s.voices[vi] ?? '—';
                const label      = s.voiceLabels[vi] ?? '';
                const isApproach = s.role === 'approach';
                const isHovered  = hover?.si === si && hover?.vi === vi;
                return (
                  <td
                    key={si}
                    style={{ textAlign: 'center', padding: '4px 3px', position: 'relative' }}
                    onMouseEnter={() => setHover({ si, vi })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <span style={{
                      display: 'inline-block',
                      background: BG[vi] ?? '#1e293b',
                      color: isApproach
                        ? `${COLORS[vi] ?? '#60a5fa'}88`
                        : (COLORS[vi] ?? '#e2e8f0'),
                      padding: '3px 9px', borderRadius: 4,
                      fontSize: 13, fontFamily: 'monospace',
                      fontWeight: vi === 0 ? 600 : 400,
                      border: isApproach ? `1px dashed #334155` : '1px solid transparent',
                      cursor: 'default',
                    }}>
                      {noteName}
                    </span>
                    {isHovered && (vi > 0) && label && (
                      <div style={{
                        position: 'absolute', bottom: '110%', left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1e293b', border: '1px solid #334155',
                        borderRadius: 6, padding: '4px 8px',
                        fontSize: 11, color: '#94a3b8',
                        whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none',
                      }}>
                        {noteName} = {label} of {s.chord}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {voiceNames.slice(1).map((name, i) => (
          <button key={i} onClick={() => copyVoice(i + 1)} style={copyBtn}>
            ⎘ Copia {name}
          </button>
        ))}
        <button
          onClick={copyAll}
          style={{ ...copyBtn, borderColor: '#3b5998', color: '#60a5fa' }}
        >
          ⎘ Copia tutte
        </button>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderBottom: '1px solid #1e293b',
  fontWeight: 'normal',
};

const tdLabel: React.CSSProperties = {
  padding: '4px 14px 4px 0',
  fontSize: 11, fontFamily: 'monospace',
  whiteSpace: 'nowrap', textAlign: 'right',
};

const copyBtn: React.CSSProperties = {
  background: '#1e293b', border: '1px solid #334155',
  borderRadius: 6, color: '#94a3b8',
  padding: '4px 12px', fontSize: 12, cursor: 'pointer',
};
```

- [ ] Run `npm run build` — expect clean compile

---

### Task 9: MelodyHarmonizerFeature main component

**Files:**
- Create: `src/features/melody-harmonizer/MelodyHarmonizerFeature.tsx`

- [ ] Create the file:

```tsx
// src/features/melody-harmonizer/MelodyHarmonizerFeature.tsx

import { useState } from 'react';
import type { MelodyNote, Technique, ThreeHornSubTechnique, HarmonizationResult } from './types';
import { harmonize } from './harmonize';
import StepSequencer, { newNoteId } from './StepSequencer';
import VoiceGrid from './VoiceGrid';

const SUB_TECHNIQUES: { value: ThreeHornSubTechnique; label: string; desc: string }[] = [
  { value: 'spread',           label: 'Spread',          desc: 'Root basso + guide tones (3a/7a) — voicing largo' },
  { value: 'triads',           label: 'Triads',           desc: 'Root, 3a, 5a impilate sotto la lead' },
  { value: 'quartal',          label: 'Quartal',          desc: '4e giuste sotto la lead — suono moderno' },
  { value: 'open-fifths',      label: 'Open 5ths',        desc: 'Lead + 5a armonica + ottava bassa' },
  { value: 'incomplete-4part', label: 'Incomplete 4-part', desc: 'Forma Four-Way Close con solo 2 voci interne' },
];

const TECHNIQUE_DESC: Record<Technique, string> = {
  'four-way-close': '4 parti in moto parallelo, range ≤ 1 ottava — classico Berklee / big band.',
  '3-horn':         'Melodia + 2 voci. Seleziona la sub-tecnica per diversi colori armonici.',
};

export default function MelodyHarmonizerFeature() {
  const [notes,     setNotes]     = useState<MelodyNote[]>([]);
  const [technique, setTechnique] = useState<Technique>('four-way-close');
  const [sub,       setSub]       = useState<ThreeHornSubTechnique>('spread');
  const [result,    setResult]    = useState<HarmonizationResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const validNotes = notes.filter(n => n.note.trim() && n.chord.trim());

  function handleHarmonize() {
    if (validNotes.length === 0) {
      setError('Aggiungi almeno una nota con il suo accordo.');
      return;
    }
    try {
      setResult(harmonize(validNotes, technique, technique === '3-horn' ? sub : undefined));
      setError(null);
    } catch {
      setError('Errore nel calcolo. Verifica i nomi delle note e degli accordi (es. G, Bb, F# / Ebmaj7, Bbm7).');
    }
  }

  function handleTechnique(t: Technique) {
    setTechnique(t);
    setResult(null);
  }

  function handleSub(s: ThreeHornSubTechnique) {
    setSub(s);
    setResult(null);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', color: '#e2e8f0' }}>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Melody Harmonizer</h1>
      <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>
        Armonizza una melodia nota per nota — Four-Way Close e 3-Horn Writing
      </p>

      {/* Technique selector */}
      <section style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Tecnica</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {(['four-way-close', '3-horn'] as Technique[]).map(t => (
            <button
              key={t}
              onClick={() => handleTechnique(t)}
              style={pillBtn(technique === t, '#1e3a5f', '#3b5998', '#60a5fa')}
            >
              {t === 'four-way-close' ? 'Four-Way Close' : '3-Horn Writing'}
            </button>
          ))}
        </div>
        <p style={{ color: '#475569', fontSize: 12, fontStyle: 'italic', margin: 0 }}>
          {TECHNIQUE_DESC[technique]}
        </p>
      </section>

      {/* Sub-technique (3-horn only) */}
      {technique === '3-horn' && (
        <section style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Sub-tecnica</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUB_TECHNIQUES.map(s => (
              <button
                key={s.value}
                onClick={() => handleSub(s.value)}
                title={s.desc}
                style={pillBtn(sub === s.value, '#2d1b69', '#5b21b6', '#c4b5fd')}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step sequencer */}
      <section style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Melodia</div>
        <StepSequencer notes={notes} onChange={n => { setNotes(n); setResult(null); }} />
      </section>

      {/* Quick-fill example (empty state helper) */}
      {notes.length === 0 && (
        <button
          onClick={() => setNotes([
            { id: newNoteId(), note: 'G',  chord: 'Ebmaj7' },
            { id: newNoteId(), note: 'F',  chord: 'Ebmaj7' },
            { id: newNoteId(), note: 'A',  chord: 'Bbm7'   },
            { id: newNoteId(), note: 'Eb', chord: 'Abmaj7' },
          ])}
          style={{ ...ghostBtn, marginBottom: 16 }}
        >
          Carica esempio (G F A Eb / Ebmaj7 → Bbm7 → Abmaj7)
        </button>
      )}

      {/* Harmonize */}
      <button
        onClick={handleHarmonize}
        disabled={validNotes.length === 0}
        style={{
          background: '#1e3a5f', border: '1px solid #3b5998',
          borderRadius: 8, color: '#60a5fa',
          padding: '10px 28px', cursor: 'pointer',
          fontSize: 15, fontWeight: 600, marginBottom: 20,
          opacity: validNotes.length === 0 ? 0.45 : 1,
        }}
      >
        Armonizza
      </button>

      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {/* Result */}
      {result && (
        <section>
          <div style={{ ...labelStyle, marginBottom: 12 }}>
            Risultato —{' '}
            {result.technique === 'four-way-close'
              ? 'Four-Way Close'
              : `3-Horn · ${result.subTechnique}`}
          </div>
          <VoiceGrid result={result} />
        </section>
      )}
    </div>
  );
}

// ─── Shared micro-styles ──────────────────────────────────────────────────────

function pillBtn(
  active: boolean,
  activeBg: string,
  activeBorder: string,
  activeColor: string,
): React.CSSProperties {
  return {
    background: active ? activeBg : '#1e293b',
    border: `1px solid ${active ? activeBorder : '#334155'}`,
    borderRadius: 8,
    color: active ? activeColor : '#94a3b8',
    padding: '7px 15px', cursor: 'pointer', fontSize: 13,
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
};

const ghostBtn: React.CSSProperties = {
  background: 'none', border: '1px dashed #334155',
  borderRadius: 8, color: '#475569',
  padding: '6px 14px', cursor: 'pointer', fontSize: 12,
};
```

- [ ] Run `npm run build` — expect clean compile

---

### Task 10: Wire up in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] Add the import after the other feature imports at the top of `src/App.tsx`:

```typescript
import MelodyHarmonizerFeature from './features/melody-harmonizer/MelodyHarmonizerFeature';
```

- [ ] In the `GROUPS` array in `src/App.tsx`, find the `composition` group (id `'composition'`). Inside it, after the `melody` entry (which has `id: 'melody'`), add:

```typescript
{ id: 'mel-harm', label: 'Melody Harmonizer', icon: '🎼', desc: 'Armonizza una melodia nota per nota — Four-Way Close e 3-Horn Writing', subsection: 'Arrange' },
```

- [ ] In the `<main>` render section of `src/App.tsx`, after the branch `{activeTab === 'melody' && <MelodyArchitectFeature />}`, add:

```typescript
{activeTab === 'mel-harm' && <MelodyHarmonizerFeature />}
```

- [ ] Run `npm run build` — must compile clean with no TypeScript errors
- [ ] Run `npm run dev` and open http://localhost:3000
- [ ] Navigate to Composizione → Arrange → Melody Harmonizer
- [ ] Click "Carica esempio" to pre-fill G/F/A/Eb with Ebmaj7→Bbm7→Abmaj7
- [ ] Verify:
  - F auto-shows APPROACH badge (G→F is stepwise)
  - Click "Armonizza" → grid shows 4 rows
  - Lead row: G, F, A, Eb
  - Voice 2 row for G/Ebmaj7: Eb
  - Voice 3 row for G/Ebmaj7: D
  - Voice 4 row for G/Ebmaj7: Bb
  - F column is visually desaturated (approach)
  - Hover over a Voice 2 TARGET cell shows tooltip with interval label
  - ⎘ Copia tutte copies multi-line text to clipboard
- [ ] Switch to 3-Horn Writing → Quartal → re-harmonize → grid shows 3 rows with quartal intervals
- [ ] Commit:

```bash
git add src/features/melody-harmonizer/ src/App.tsx
git commit -m "feat(composition): add Melody Harmonizer — Four-Way Close + 3-Horn Writing"
```
