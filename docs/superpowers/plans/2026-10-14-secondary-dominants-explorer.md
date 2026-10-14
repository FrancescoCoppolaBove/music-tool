# Secondary Dominants Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Secondary Dominants Explorer feature that, given the active global key, shows all V7/X, tritone substitutions, and ii–V pairs for every diatonic degree — with interactive playback for each chord.

**Architecture:** Pure data utility (`secondaryDominants.ts`) computes `DegreeData[]` from tonal's `Key.majorKey`/`Key.minorKey` APIs. A `DegreeCard` component renders each degree with three chord rows and a sequence play button. The main feature component reads the tonic from `GlobalKeyContext` and manages a local mode toggle (major/minor).

**Tech Stack:** React, TypeScript, tonal (`Key`, `Chord`, `Note`), `@shared/utils/chordAudio` (`audioPlayer`, `voiceChord`, `playChordSequence`, `SequenceHandle`)

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/features/secondary-dominants/utils/secondaryDominants.ts` | Pure computation — no React |
| Create | `src/features/secondary-dominants/components/DegreeCard.tsx` | Single degree card with playback |
| Create | `src/features/secondary-dominants/SecondaryDominantsFeature.tsx` | Grid layout, mode toggle, entry component |
| Modify | `src/App.tsx` | Import, GROUPS entry, render branch |

---

## Task 1: Data computation utility

**Files:**
- Create: `src/features/secondary-dominants/utils/secondaryDominants.ts`

### Background

`Key.majorKey('C').secondaryDominants` → `["","A7","B7","C7","D7","E7",""]`
(index 0 = I, empty; index 6 = VII, empty; indices 1–5 are the secondary dominants)

`Key.minorKey('A').natural.secondaryDominants` → `["E7","","","A7","B7","C7","D7"]`
(index 0 = I = "E7" — this is the regular harmonic-minor dominant, skip it; indices 3–6 are true secondary dominants)

`Note.transpose(root, '-4P')` → root a perfect 4th below = the ii chord root.
`Note.enharmonic(raw) || raw` → clean flat spelling for tritone sub (D# → Eb).
`Chord.get(targetChord).quality === 'Minor'` → `m7b5` ii chord; otherwise `m7`.

- [ ] **Step 1: Create the file**

```typescript
// src/features/secondary-dominants/utils/secondaryDominants.ts
import { Key, Chord, Note } from 'tonal';

export interface ChordInfo {
  name: string;
  notes: string[];
}

export interface DegreeData {
  degree: string;       // "II", "III", "IV", "V", "VI"
  targetChord: string;  // e.g. "Dm7"
  targetNotes: string[]; // notes of the diatonic target chord for ii-V-I playback
  secDom: ChordInfo;    // V7/X
  tritoneSub: ChordInfo; // SubV7
  iiChord: ChordInfo;   // ii of the V7/X
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function buildChordInfo(name: string): ChordInfo {
  return { name, notes: Chord.get(name).notes };
}

function tritoneSubOf(dom7Root: string): ChordInfo {
  const raw = Note.transpose(dom7Root, '4A');
  const root = Note.enharmonic(raw) || raw;
  return buildChordInfo(root + '7');
}

function iiChordFor(dom7Root: string, targetChord: string): ChordInfo {
  const iiRoot = Note.transpose(dom7Root, '-4P');
  const type = Chord.get(targetChord).quality === 'Minor' ? 'm7b5' : 'm7';
  return buildChordInfo(iiRoot + type);
}

export function getSecondaryDominants(
  tonic: string,
  mode: 'major' | 'minor',
): DegreeData[] {
  const key = mode === 'major' ? Key.majorKey(tonic) : Key.minorKey(tonic).natural;
  const { chords, secondaryDominants } = key;

  const result: DegreeData[] = [];
  // Skip index 0 (I degree) — V/I is the regular dominant, not a secondary dominant
  for (let i = 1; i < 7; i++) {
    const sd = secondaryDominants[i];
    if (!sd) continue;
    const secDomRoot = sd.replace(/7.*/, '');
    const targetChord = chords[i];
    result.push({
      degree: ROMAN[i],
      targetChord,
      targetNotes: Chord.get(targetChord).notes,
      secDom: buildChordInfo(sd),
      tritoneSub: tritoneSubOf(secDomRoot),
      iiChord: iiChordFor(secDomRoot, targetChord),
    });
  }
  return result;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no TypeScript errors related to `secondaryDominants.ts`. Other unrelated errors are fine.

- [ ] **Step 3: Commit**

```bash
git add src/features/secondary-dominants/utils/secondaryDominants.ts
git commit -m "feat(secondary-dominants): add data computation utility"
```

---

## Task 2: DegreeCard component

**Files:**
- Create: `src/features/secondary-dominants/components/DegreeCard.tsx`

Each card shows one diatonic degree with three chord rows (V7/X in yellow, SubV in teal, ii–V in pink) and a footer button that plays the full ii–V–I cadence in sequence.

`DegreeCard` owns its audio calls directly. It stores a `SequenceHandle` ref to stop any ongoing sequence before starting a new one. `playingRow` local state tracks which row is highlighted.

- [ ] **Step 1: Create the file**

```tsx
// src/features/secondary-dominants/components/DegreeCard.tsx
import { useRef, useState } from 'react';
import {
  audioPlayer,
  voiceChord,
  playChordSequence,
  type SequenceHandle,
} from '@shared/utils/chordAudio';
import type { DegreeData } from '../utils/secondaryDominants';

interface Props {
  data: DegreeData;
}

export function DegreeCard({ data }: Props) {
  const [playingRow, setPlayingRow] = useState<string | null>(null);
  const seqRef = useRef<SequenceHandle | null>(null);

  function stopCurrent() {
    seqRef.current?.stop();
    seqRef.current = null;
    audioPlayer.stopAll();
    setPlayingRow(null);
  }

  async function playSingle(rowId: string, notes: string[]) {
    stopCurrent();
    setPlayingRow(rowId);
    await audioPlayer.playChord(voiceChord(notes));
    setPlayingRow(null);
  }

  function playSeq(rowId: string, chords: { notes: string[] }[]) {
    stopCurrent();
    setPlayingRow(rowId);
    seqRef.current = playChordSequence(chords, 100, undefined, () => {
      setPlayingRow(null);
      seqRef.current = null;
    });
  }

  const { degree, targetChord, targetNotes, secDom, tritoneSub, iiChord } = data;

  const baseCard: React.CSSProperties = {
    background: '#13132b',
    border: '1px solid #2a2a50',
    borderRadius: 12,
    overflow: 'hidden',
  };

  const header: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#1a1a3a',
    borderBottom: '1px solid #2a2a50',
  };

  const degreeBadge: React.CSSProperties = {
    background: '#7c6af7',
    color: 'white',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    flexShrink: 0,
  };

  const cardBody: React.CSSProperties = {
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    borderRadius: 7,
    background: '#1c1c38',
  };

  function playBtnStyle(active: boolean): React.CSSProperties {
    return {
      background: active ? '#7c6af7' : '#252550',
      border: `1px solid ${active ? '#7c6af7' : '#3a3a70'}`,
      color: active ? 'white' : '#aaa',
      width: 26,
      height: 26,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: 10,
      flexShrink: 0,
    };
  }

  return (
    <div style={baseCard}>
      <div style={header}>
        <div style={degreeBadge}>{degree}</div>
        <span style={{ color: '#e0e0e0', fontWeight: 'bold', fontSize: 15 }}>{targetChord}</span>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: 0.5 }}>target</span>
      </div>

      <div style={cardBody}>
        {/* V7/X row */}
        <div style={rowStyle}>
          <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, width: 44, flexShrink: 0, color: '#f7c948' }}>
            V/{degree}
          </span>
          <span style={{ fontSize: 14, fontWeight: 'bold', flex: 1, color: '#f7c948' }}>{secDom.name}</span>
          <span style={{ fontSize: 10, color: '#555', marginRight: 4 }}>{secDom.notes.join(' ')}</span>
          <button style={playBtnStyle(playingRow === 'secdom')} onClick={() => void playSingle('secdom', secDom.notes)}>▶</button>
        </div>

        {/* Tritone sub row */}
        <div style={rowStyle}>
          <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, width: 44, flexShrink: 0, color: '#6af7c9' }}>
            SubV
          </span>
          <span style={{ fontSize: 14, fontWeight: 'bold', flex: 1, color: '#6af7c9' }}>{tritoneSub.name}</span>
          <span style={{ fontSize: 10, color: '#555', marginRight: 4 }}>{tritoneSub.notes.join(' ')}</span>
          <button style={playBtnStyle(playingRow === 'tritone')} onClick={() => void playSingle('tritone', tritoneSub.notes)}>▶</button>
        </div>

        {/* ii–V row */}
        <div style={rowStyle}>
          <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, width: 44, flexShrink: 0, color: '#f796c0' }}>
            ii–V
          </span>
          <span style={{ fontSize: 13, fontWeight: 'bold', flex: 1, color: '#f796c0' }}>{iiChord.name} – {secDom.name}</span>
          <button
            style={playBtnStyle(playingRow === 'iiv')}
            onClick={() => playSeq('iiv', [{ notes: iiChord.notes }, { notes: secDom.notes }])}
          >▶</button>
        </div>
      </div>

      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          margin: '0 14px 10px',
          padding: 7,
          background: playingRow === 'seq' ? '#1a1a50' : '#1a1a38',
          border: `1px dashed ${playingRow === 'seq' ? '#7c6af7' : '#333'}`,
          borderRadius: 7,
          color: playingRow === 'seq' ? '#aaa' : '#555',
          fontSize: 11,
          cursor: 'pointer',
          width: 'calc(100% - 28px)',
        }}
        onClick={() => playSeq('seq', [
          { notes: iiChord.notes },
          { notes: secDom.notes },
          { notes: targetNotes },
        ])}
      >
        ▶ suona ii–V–I verso {targetChord}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors in `DegreeCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/secondary-dominants/components/DegreeCard.tsx
git commit -m "feat(secondary-dominants): add DegreeCard component"
```

---

## Task 3: Main feature component

**Files:**
- Create: `src/features/secondary-dominants/SecondaryDominantsFeature.tsx`

`GlobalKeyContext` exposes only `globalKey` (the tonic string, e.g. `"C"`). Mode (major/minor) is local state with a toggle button pair. The component calls `getSecondaryDominants(globalKey, mode)` on every render — the function is fast and pure, no memoisation needed.

- [ ] **Step 1: Create the file**

```tsx
// src/features/secondary-dominants/SecondaryDominantsFeature.tsx
import { useState } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { getSecondaryDominants } from './utils/secondaryDominants';
import { DegreeCard } from './components/DegreeCard';

export default function SecondaryDominantsFeature() {
  const { globalKey } = useGlobalKey();
  const [mode, setMode] = useState<'major' | 'minor'>('major');

  const degrees = getSecondaryDominants(globalKey, mode);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        padding: '12px 16px',
        background: '#12122a',
        borderRadius: 10,
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#777', fontSize: 13 }}>Tonalità:</span>
        <span style={{
          background: '#7c6af7',
          color: 'white',
          padding: '4px 14px',
          borderRadius: 20,
          fontWeight: 'bold',
          fontSize: 15,
        }}>
          {globalKey}
        </span>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          {(['major', 'minor'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 14px',
                borderRadius: 20,
                border: `1px solid ${mode === m ? '#7c6af7' : '#333'}`,
                background: mode === m ? '#2a2050' : 'transparent',
                color: mode === m ? '#c4b5fd' : '#666',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: mode === m ? 'bold' : 'normal',
              }}
            >
              {m === 'major' ? 'Maggiore' : 'Minore'}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', color: '#444', fontSize: 11 }}>
          {degrees.length} dominanti secondarie
        </span>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {degrees.map(d => (
          <DegreeCard key={d.degree} data={d} />
        ))}
      </div>

      {degrees.length === 0 && (
        <p style={{ color: '#555', textAlign: 'center', marginTop: 40 }}>
          Nessuna dominante secondaria per questa tonalità.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors in `SecondaryDominantsFeature.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/secondary-dominants/SecondaryDominantsFeature.tsx
git commit -m "feat(secondary-dominants): add main feature component"
```

---

## Task 4: Wire into App.tsx navigation

**Files:**
- Modify: `src/App.tsx`

Three changes: (1) add import at the top, (2) add tab entry to `GROUPS`, (3) add render branch in `<main>`.

- [ ] **Step 1: Add import**

Open `src/App.tsx`. After line 38 (the last existing feature import), add:

```tsx
import SecondaryDominantsFeature from './features/secondary-dominants/SecondaryDominantsFeature';
```

- [ ] **Step 2: Add tab to GROUPS**

In `GROUPS`, inside the `'composition'` group (starts at line 182), the `tabs` array has `subsection: 'Harmony'` entries. Add the new tab after the `'analysis'` entry (currently line 192):

```ts
{ id: 'secondary-dominants', label: 'Secondary Dominants', icon: '🎯', desc: 'Dominanti secondarie, tritone sub e ii–V per ogni grado della tonalità', subsection: 'Harmony' },
```

The result around that area should look like:

```ts
{ id: 'analysis',             label: 'Harmonic Analysis',   icon: '🔬', desc: 'Analyse key, Roman numerals & chord function',                     subsection: 'Harmony' },
{ id: 'secondary-dominants',  label: 'Secondary Dominants', icon: '🎯', desc: 'Dominanti secondarie, tritone sub e ii–V per ogni grado della tonalità', subsection: 'Harmony' },
{ id: 'landing',              label: 'Chord Landing',        icon: '🎯', desc: 'Find the best way to approach any target chord',                   subsection: 'Harmony' },
```

- [ ] **Step 3: Add render branch**

In `src/App.tsx`, find the line:
```tsx
{activeTab === 'analysis'      && <HarmonicAnalysisFeature />}
```

Add immediately after it:
```tsx
{activeTab === 'secondary-dominants' && <SecondaryDominantsFeature />}
```

- [ ] **Step 4: Full build check**

```bash
npm run build
```

Expected: build completes with 0 TypeScript errors and 0 lint warnings.

- [ ] **Step 5: Browser smoke test**

```bash
npm run dev
```

1. Open http://localhost:3000
2. Navigate to Composition → Harmony → Secondary Dominants
3. Verify 5 cards appear for C major (II, III, IV, V, VI)
4. Click ▶ on any chord row → sound plays
5. Click "suona ii–V–I" on any card → three-chord cadence plays in sequence
6. Switch to Minore → cards update (4 entries for C minor: IV, V, VI, VII)
7. Change global key (e.g. to G) → all cards update automatically

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(secondary-dominants): wire feature into navigation"
```
