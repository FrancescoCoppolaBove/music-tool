# Chord Landing Planner v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 Berklee approach cards and an optional "From chord" Journey Analysis mode to `ChordLandingFeature.tsx`, with zero regressions when no source chord is set.

**Architecture:** Single-file modification — all changes live in `src/features/chord-landing/ChordLandingFeature.tsx` (currently 1099 lines). New data goes in `APPROACHES`, new logic in helper functions after line 580, new UI in the component body after the Target selector. No new files, no new dependencies.

**Tech Stack:** React, TypeScript, Tonal.js (`Note.transpose`, `Note.midi`), inline styles.

---

## File map

| File | What changes |
|---|---|
| `src/features/chord-landing/ChordLandingFeature.tsx:543` | Insert 8 new `Approach` objects before `];` |
| `src/features/chord-landing/ChordLandingFeature.tsx:573-580` | Modify `getChain()` signature + chain type |
| `src/features/chord-landing/ChordLandingFeature.tsx:599-642` | Update `ChordChainViz` prop + render `isSource` item |
| `src/features/chord-landing/ChordLandingFeature.tsx:644-650` | Add `sourceChord?` + `isHighlight?` props to `ApproachCard` |
| `src/features/chord-landing/ChordLandingFeature.tsx:651` | Pass `sourceChord` to `getChain()` inside `ApproachCard` |
| `src/features/chord-landing/ChordLandingFeature.tsx:655-662` | Add highlight gold border when `isHighlight` |
| `src/features/chord-landing/ChordLandingFeature.tsx:799-813` | Add 3 new state vars + 3 new useMemo computations |
| `src/features/chord-landing/ChordLandingFeature.tsx:947` | Insert `FromChordPanel` + `JourneyAnalysisBanner` blocks |
| `src/features/chord-landing/ChordLandingFeature.tsx:1066-1074` | Pass `sourceChord` to main `ApproachCard` renders |

After the helper functions section (after `getJourneyHighlights`, line ~600) add:
- `interface JourneyAnalysis` (new type)
- `journeyInterval()` (pure)
- `analyzeJourney()` (pure)
- `getJourneyHighlights()` (pure)

---

### Task 1: Add 8 Berklee approach cards

**Files:**
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx:542` (insert before closing `];`)

Intervals are measured FROM the target root going UP (same convention as existing approaches).
Tonal note: `Note.transpose('C', '3m')` = Eb, `Note.transpose('C', '6m')` = Ab, `Note.transpose('C', '4A')` = F#.

- [ ] **Step 1: Insert new approaches before the `];` that closes APPROACHES (line 543)**

Find this exact line:
```typescript
  {
    id: 'ii-V-of-iii-surprise',
```
And insert the following block AFTER the closing `},` of that entry, before `];`:

```typescript
  // ── Berklee method additions (Mulholland/Hojnacki + Ted Pease) ───────────────
  {
    id: 'chromatic-mediant-bIII',
    name: 'Chromatic Mediant (bIIImaj7 → I)',
    complexity: 2,
    steps: [{ interval: '3m', quality: 'maj7', role: 'bIIImaj7 (chromatic mediant)' }],
    moods: ['cinematic', 'modal', 'jazz'],
    genres: ['Film Score', 'Modern Jazz', 'Contemporary', 'Fusion'],
    theory: 'La mediante cromatica bIIImaj7 (Ebmaj7 → Cmaj7) risolve per moto cromatico parallelo senza tensione di tritono. La sua forza viene dalla relazione di "constant structure" — stesso voicing spostato di una terza minore. Non è un dominante: la sorpresa è armonica, non di tensione. (Mulholland/Hojnacki, cap. 10 — Constant Structures)',
    tip: 'Mantieni la stessa forma di voicing e scendila di tre semitoni. Ebmaj7 → Cmaj7 suona sorprendentemente naturale nonostante la relazione non-diatonica. Funziona meglio a tempi lenti in contesti cinematografici o modali.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'bVI-direct',
    name: 'bVI Direct → I (Modal Interchange)',
    complexity: 2,
    steps: [{ interval: '6m', quality: '', role: 'bVI (parallel minor)' }],
    moods: ['cinematic', 'gospel', 'r&b', 'modal'],
    genres: ['Film Score', 'Gospel', 'R&B', 'Soul', 'Neo-Soul'],
    theory: 'L\'accordo bVI (Ab → C) prestato dal minore parallelo risolve direttamente alla tonica senza passare per V7. Diverso da "bVImaj7 → V7 (Cinematic)": qui la risoluzione è diretta, nessuna tensione dominante intermedia. Il bVI "galleggia" sulla tonica con sapore modale. (Mulholland/Hojnacki cap. 5 — Modal Interchange)',
    tip: 'Funziona sia con triade (Ab → C) che con bVImaj7 (Abmaj7 → Cmaj7) o bVImaj9. In R&B spesso è bVI → I sul cambio di sezione. Prova Abmaj9 → Cmaj9 per massimo colore.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'extended-dom-skip',
    name: 'Extended Dominant V7/V → I (Bypassa V)',
    complexity: 2,
    steps: [{ interval: '2M', quality: '7', role: 'V7/V (extended dominant)' }],
    moods: ['jazz', 'bluesy', 'gospel'],
    genres: ['Jazz', 'Blues', 'Gospel', 'Bebop'],
    theory: 'Il dominante secondario V7/V (D7 in C) normalmente risolve a V (G7), poi a I. Qui si bypassa V e si risolve direttamente su I — una "deceptive extension". D7 → C bypassa G7. La tensione del tritono (F#-C in D7) risolve comunque soddisfacentemente su C. (Mulholland/Hojnacki cap. 2 — Extended Dominants)',
    tip: 'L\'effetto è di un dominante "da lontano" che arriva prima del previsto. Tienilo brevissimo — un beat o meno. Se lo tieni più lungo, l\'orecchio si aspetta G7 e la mancata risoluzione intermedia diventa straniante anziché fluida.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'modal-interchange-chain',
    name: 'Modal Interchange Chain (bVI → bVII → I)',
    complexity: 2,
    steps: [
      { interval: '6m', quality: '', role: 'bVI (parallel minor)' },
      { interval: '7m', quality: '', role: 'bVII (parallel minor)' },
    ],
    moods: ['r&b', 'cinematic', 'modal', 'jazz'],
    genres: ['R&B', 'Soul', 'Pop', 'Film Score', 'Gospel'],
    theory: 'Due accordi prestati dal minore parallelo (bVI e bVII) salgono per gradi interi verso I. Ab → Bb → C è la cifra stilistica di soul, R&B e pop moderno. bVI = accordo eolio/frigio, bVII = accordo dorico/misto. Creano slancio ascendente verso la tonica. (Mulholland/Hojnacki cap. 5 + Pease cap. 2)',
    tip: 'Il ritmo è cruciale: bVI per un beat, bVII sul mezzo beat, I sul 1 successivo. "Let It Be" (Beatles) usa Ab → Bb → C come pattern centrale. Funziona con triadi (Ab → Bb → C) o accordi estesi (Abmaj9 → Bb9 → Cmaj9).',
    worksFor: ['major', 'any'],
  },
  {
    id: 'full-extended-ii-V',
    name: 'Full Extended ii-V (ii/V → V/V → V → I)',
    complexity: 3,
    steps: [
      { interval: '6M', quality: 'm7', role: 'ii7/V (ii del dom. secondario)' },
      { interval: '2M', quality: '7',  role: 'V7/V (dominante secondario)' },
      { interval: '5P', quality: '7',  role: 'V7' },
    ],
    moods: ['jazz', 'classical'],
    genres: ['Jazz Standards', 'Bossa Nova', 'Bebop', 'Swing'],
    theory: 'Catena estesa: ii/V → V/V → V → I. In C: Am7 → D7 → G7 → C. Am7 è il ii7 di D7, quindi sono due ii-V concatenati. A differenza del "ragtime-VI-ii-V" che usa VI7 dominante, Am7 è diatonico — più morbido. Ogni anello usa il tritono del successivo come leading tone. (Mulholland/Hojnacki cap. 2 — Extended Dominants)',
    tip: 'È la catena di Autumn Leaves e decine di standard. A 4 battute: un accordo per battuta. A 2 battute: Am7 e D7 in mezza battuta, poi G7 e C. Prova Am9 → D7(9,13) → G7(b9,b13) → Cmaj9 per la versione bebop.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'subV-of-V',
    name: 'SubV of V → V → I',
    complexity: 3,
    steps: [
      { interval: '2m', quality: '7', role: 'bII7 (SubV di G7, tritone sub)' },
      { interval: '5P', quality: '7', role: 'V7' },
    ],
    moods: ['jazz', 'chromatic', 'cinematic'],
    genres: ['Bebop', 'Post-Bop', 'Jazz Ballad', 'Film Score'],
    theory: 'Il tritono sub di G7 (Db7) risolve a G7 poi a I. Db7 scende cromaticamente a G (Db→C mezzo tono, Ab→G mezzo tono) — doppia risoluzione cromatica. Bass line: Db → G → C — salto di tritono poi quarta perfetta. (Mulholland/Hojnacki cap. 3 — Substitute Dominants)',
    tip: 'La bass line Db → G → C è la firma di questo approccio. Diverso dal "tritone-ii-V" già in database (che bypassa V7): qui si passa per G7 prima di C. Il salto di tritono nel basso seguito dalla quarta è molto caratteristico del bebop.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'lydian-tritone',
    name: 'Lydian Tritone (#IVmaj7 → I)',
    complexity: 3,
    steps: [{ interval: '4A', quality: 'maj7', role: '#IVmaj7 (lydian tritone)' }],
    moods: ['modal', 'experimental', 'jazz', 'cinematic'],
    genres: ['Contemporary Jazz', 'Film Score', 'Experimental', 'Modal Jazz'],
    theory: 'F#maj7 → Cmaj7: stessa qualità, radici a distanza di tritono. Nessuna tensione interna (entrambi sono accordi maggiori) — la forza viene dalla relazione cromatica esterna. F# è il #4 di C (Lidio). Risoluzione per tritono senza funzione dominante: effetto ambiguo, cinematografico. (Mulholland/Hojnacki cap. 10 — Constant Structures)',
    tip: 'Lascia risuonare il F#maj7 a lungo — senza tensione interna è stabile. Il potere è nella sorpresa della risoluzione per tritono. Funziona meglio in contesti modali o cinematografici. Jacob Collier usa molto questo tipo di relazione armonica per terza o tritono.',
    worksFor: ['major', 'any'],
  },
  {
    id: 'symmetric-dominant',
    name: 'Symmetric Dominant V7(b9,#9,#11,13) → I',
    complexity: 3,
    steps: [{ interval: '5P', quality: '7', role: 'V7(b9,#9,#11,13) — symmetric dom.' }],
    moods: ['jazz', 'chromatic', 'gospel'],
    genres: ['Jazz', 'Gospel', 'Bebop', 'Fusion'],
    theory: 'La symmetric dominant scale (Mixolydian b9, #9, #11, 13) combina tensioni alterate (b9, #9) con la tredicesima diatonica (T13). Il T13 di V7 è un common tone con la terza di I (T13 di G7 = E = 3 di Cmaj7) — un ponte melodico incorporato nell\'accordo. Maximum tonal tension with major resolution. (Mulholland/Hojnacki cap. 1 — Symmetric Dominant Scale)',
    tip: 'Voicing ideale: b7 e 3 come shell, poi b9/#9 in voce intermedia, #11 e 13 in alto. In C: G7(b9,#9,#11,13) = G, F, B, Ab/Bb, C#, E. Il pattern half-whole è simmetrico — lo stesso voicing funziona in 4 trasposizioni (ogni mezzo tono del tritono).',
    worksFor: ['major', 'any'],
  },
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: build completes without TypeScript errors.

- [ ] **Step 3: Verify new cards appear in browser**

Start dev server (`npm run dev`), open Chord Landing Planner, set target to `Cmaj7`. Confirm you can see:
- "Chromatic Mediant (bIIImaj7 → I)" — chain shows `Ebmaj7 → Cmaj7`
- "bVI Direct → I" — chain shows `Ab → Cmaj7`
- "Lydian Tritone (#IVmaj7 → I)" — chain shows `F#maj7 → Cmaj7`
- "SubV of V → V → I" — chain shows `Db7 → G7 → Cmaj7`

- [ ] **Step 4: Commit**

```bash
git add src/features/chord-landing/ChordLandingFeature.tsx
git commit -m "feat(chord-landing): add 8 Berklee approach cards (Mulholland/Hojnacki + Pease)"
```

---

### Task 2: Journey helper functions + getChain + ChordChainViz

**Files:**
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx:545-597` (helper functions section)
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx:599-642` (ChordChainViz)

- [ ] **Step 1: Add `JourneyAnalysis` interface after `interface Approach` (after line 29)**

Find:
```typescript
interface Approach {
  id: string;
  name: string;
  complexity: 1 | 2 | 3 | 4 | 5;
  steps: ChordStep[];        // chords leading TO the target (not including it)
  moods: string[];
  genres: string[];
  theory: string;
  tip: string;
  worksFor: string[];        // 'major', 'minor', 'dominant', 'any'
}
```

Replace with:
```typescript
interface Approach {
  id: string;
  name: string;
  complexity: 1 | 2 | 3 | 4 | 5;
  steps: ChordStep[];        // chords leading TO the target (not including it)
  moods: string[];
  genres: string[];
  theory: string;
  tip: string;
  worksFor: string[];        // 'major', 'minor', 'dominant', 'any'
}

interface JourneyAnalysis {
  role: string;
  label: string;
  highlightIds: string[];
}
```

- [ ] **Step 2: Replace `getChain()` with an updated version that accepts optional `sourceChord`**

Find (line ~573):
```typescript
function getChain(approach: Approach, targetRoot: string, targetQuality: string): { chord: string; role: string; isTarget: boolean }[] {
  const steps = approach.steps.map(step => {
    const root = Note.transpose(targetRoot, step.interval) || targetRoot;
    return { chord: root + step.quality, role: step.role, isTarget: false };
  });
  steps.push({ chord: targetRoot + (targetQuality || ''), role: 'Target', isTarget: true });
  return steps;
}
```

Replace with:
```typescript
function getChain(
  approach: Approach,
  targetRoot: string,
  targetQuality: string,
  sourceChord?: string,
): { chord: string; role: string; isTarget: boolean; isSource?: boolean }[] {
  const steps = approach.steps.map(step => {
    const root = Note.transpose(targetRoot, step.interval) || targetRoot;
    return { chord: root + step.quality, role: step.role, isTarget: false };
  });
  steps.push({ chord: targetRoot + (targetQuality || ''), role: 'Target', isTarget: true });
  if (sourceChord) {
    return [{ chord: sourceChord, role: 'From', isTarget: false, isSource: true }, ...steps];
  }
  return steps;
}
```

- [ ] **Step 3: Add journey helper functions after `complexityDots` (after line ~596)**

Find:
```typescript
// ─── Sub-components ────────────────────────────────────────────────────────────
function ChordChainViz
```

Insert immediately BEFORE that line:

```typescript
// ─── Journey helpers ───────────────────────────────────────────────────────────
function journeyInterval(fromRoot: string, toRoot: string): number {
  const from = Note.midi(fromRoot + '4') ?? 0;
  const to = Note.midi(toRoot + '4') ?? 0;
  return (to - from + 12) % 12;
}

function analyzeJourney(interval: number): JourneyAnalysis {
  const map: Record<number, JourneyAnalysis> = {
    5:  { role: 'V — dominante',              label: 'sei già il dominante — movimento più forte della musica tonale.',                          highlightIds: ['vsus4-alone', 'vsus4-then-V7', 'float-chord', 'perfect-cadence', 'altered-ii-V', 'vsusb9-then-V7alt'] },
    10: { role: 'ii — sopratonica',            label: 'sei il ii di destinazione — completa la ii-V.',                                           highlightIds: ['basic-ii-V', 'altered-ii-V', 'tritone-ii-V', 'vsusb9-then-V7alt', 'ii-dim-V-minor'] },
    7:  { role: 'IV — sottodominante',         label: 'movimento plagale — sei il subdominante della destinazione.',                              highlightIds: ['pop-IV-V', 'backdoor-ii-V', 'gospel-dim', 'minor-plagal', 'secondary-subdominant'] },
    2:  { role: 'bVII — backdoor',             label: 'un tono sopra la destinazione — territorio backdoor.',                                    highlightIds: ['backdoor', 'backdoor-ii-V', 'float-chord', 'float-chord-altered', 'modal-interchange-chain'] },
    4:  { role: 'bVI — interscambio modale',   label: 'accordo del minore parallelo — risoluzione cromatica per terza.',                         highlightIds: ['bVI-V7', 'bVI-direct', 'modal-interchange-chain'] },
    11: { role: 'bII — Napoletano/SubV',       label: 'tritono con la destinazione — territorio SubV e Napoletano.',                             highlightIds: ['tritone-sub', 'relative-ii-of-subv', 'phrygian', 'subV-of-V'] },
    1:  { role: 'VII — sensibile',             label: 'mezzo tono sotto la destinazione — sensibile o ghost chord.',                             highlightIds: ['dim-leading', 'half-step-chromatic'] },
    3:  { role: 'VI — mediante relativa',      label: 'area della mediante relativa — deceptive resolution zone.',                               highlightIds: ['ragtime-VI-ii-V', 'full-chain-of-5ths', 'minor-to-major'] },
    9:  { role: 'bIII — mediante cromatica',   label: 'terza minore sopra — territorio Coltrane e constant structures.',                         highlightIds: ['coltrane-fragment', 'chromatic-mediant-bIII', 'chromatic-descent'] },
    6:  { role: '#IV — tritono',               label: 'simmetria di tritono — lydian approach o oscillazione armonica.',                         highlightIds: ['tritone-oscillation', 'lydian-tritone', 'superimposed-chain'] },
    8:  { role: 'III — mediante maggiore',     label: 'relazione per terza maggiore — area della catena di quinte.',                             highlightIds: ['full-chain-of-5ths', 'ii-V-of-iii-surprise'] },
    0:  { role: 'Stessa radice',               label: 'stessa radice, qualità diversa — cambio di colore sulla stessa nota.',                    highlightIds: ['secondary-subdominant', 'minor-plagal', 'vsus4-alone'] },
  };
  return map[interval] ?? map[0];
}

function getJourneyHighlights(approaches: Approach[], highlightIds: string[]): Approach[] {
  return highlightIds
    .map(id => approaches.find(a => a.id === id))
    .filter((a): a is Approach => a !== undefined)
    .slice(0, 5);
}

```

- [ ] **Step 4: Update `ChordChainViz` to handle `isSource` items**

Find:
```typescript
function ChordChainViz({ chain, accentColor }: {
  chain: { chord: string; role: string; isTarget: boolean }[];
  accentColor: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {chain.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: item.isTarget ? accentColor : '#1c2128',
              border: `1px solid ${item.isTarget ? accentColor : '#30363d'}`,
              fontFamily: "'DM Mono', monospace",
              fontSize: 15,
              fontWeight: 500,
              color: item.isTarget ? '#fff' : '#e6edf3',
              letterSpacing: '-0.3px',
              boxShadow: item.isTarget ? `0 0 12px ${accentColor}55` : 'none',
              minWidth: 52,
              textAlign: 'center',
            }}>
              {item.chord}
            </div>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: item.isTarget ? accentColor : '#6b7280',
              letterSpacing: '0.5px',
            }}>
              {item.role}
            </span>
          </div>
          {i < chain.length - 1 && (
            <span style={{ color: '#4b5563', fontSize: 16, marginBottom: 14 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

Replace with:
```typescript
function ChordChainViz({ chain, accentColor }: {
  chain: { chord: string; role: string; isTarget: boolean; isSource?: boolean }[];
  accentColor: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {chain.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: item.isSource ? '#1c2128' : item.isTarget ? accentColor : '#1c2128',
              border: `1px solid ${item.isSource ? '#f59e0b44' : item.isTarget ? accentColor : '#30363d'}`,
              fontFamily: "'DM Mono', monospace",
              fontSize: 15,
              fontWeight: 500,
              color: item.isSource ? '#f59e0b' : item.isTarget ? '#fff' : '#e6edf3',
              letterSpacing: '-0.3px',
              boxShadow: item.isTarget ? `0 0 12px ${accentColor}55` : 'none',
              minWidth: 52,
              textAlign: 'center',
            }}>
              {item.chord}
            </div>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: item.isSource ? '#f59e0b' : item.isTarget ? accentColor : '#6b7280',
              letterSpacing: '0.5px',
            }}>
              {item.role}
            </span>
          </div>
          {i < chain.length - 1 && (
            <span style={{ color: '#4b5563', fontSize: 16, marginBottom: 14 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/chord-landing/ChordLandingFeature.tsx
git commit -m "feat(chord-landing): add journey helpers + getChain source support + ChordChainViz isSource"
```

---

### Task 3: ApproachCard updates + state + From Chord panel

**Files:**
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx:644-795` (ApproachCard)
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx:799-813` (state + useMemos)
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx:947` (insert FromChordPanel after target selector)

- [ ] **Step 1: Update `ApproachCard` to accept `sourceChord` + `isHighlight` props**

Find:
```typescript
function ApproachCard({ approach, targetRoot, targetQuality, isExpanded, onToggle }: {
  approach: Approach;
  targetRoot: string;
  targetQuality: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const chain = getChain(approach, targetRoot, targetQuality);
  const color = COMPLEXITY_COLORS[approach.complexity];

  return (
    <div style={{
      background: '#161b22',
      border: `1px solid ${isExpanded ? color + '55' : '#21262d'}`,
      borderLeft: `3px solid ${color}`,
```

Replace with:
```typescript
function ApproachCard({ approach, targetRoot, targetQuality, sourceChord, isHighlight, isExpanded, onToggle }: {
  approach: Approach;
  targetRoot: string;
  targetQuality: string;
  sourceChord?: string;
  isHighlight?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const chain = getChain(approach, targetRoot, targetQuality, sourceChord);
  const color = COMPLEXITY_COLORS[approach.complexity];

  return (
    <div style={{
      background: '#161b22',
      border: `1px solid ${isExpanded ? color + '55' : isHighlight ? '#f59e0b33' : '#21262d'}`,
      borderLeft: `3px solid ${isHighlight ? '#f59e0b' : color}`,
```

- [ ] **Step 2: Add `★ Journey` badge in the card header when `isHighlight` is true**

Find (inside `ApproachCard`, in the card header section):
```typescript
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#6b7280',
              background: '#1c2128',
              border: '1px solid #30363d',
              borderRadius: 4,
              padding: '2px 7px',
            }}>
              {approach.steps.length} {approach.steps.length === 1 ? 'step' : 'steps'}
            </span>
```

Replace with:
```typescript
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#6b7280',
              background: '#1c2128',
              border: '1px solid #30363d',
              borderRadius: 4,
              padding: '2px 7px',
            }}>
              {approach.steps.length} {approach.steps.length === 1 ? 'step' : 'steps'}
            </span>
            {isHighlight && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: '#f59e0b',
                background: '#f59e0b18',
                border: '1px solid #f59e0b40',
                borderRadius: 4,
                padding: '2px 7px',
              }}>
                ★ Journey
              </span>
            )}
```

- [ ] **Step 3: Add 3 new state variables after existing state declarations**

Find:
```typescript
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
```

Replace with:
```typescript
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [fromRoot, setFromRoot] = useState('D');
  const [fromQuality, setFromQuality] = useState('m7');

  const filtered = useMemo(
```

- [ ] **Step 4: Add journey useMemos after the `filtered` useMemo**

Find:
```typescript
  const targetChord = targetRoot + targetQuality;
  const targetCat = getTargetCategory(targetQuality);
```

Replace with:
```typescript
  const journeyActive = sourceOpen && !!fromRoot;

  const journey = useMemo((): JourneyAnalysis | null => {
    if (!journeyActive) return null;
    const interval = journeyInterval(fromRoot, targetRoot);
    return analyzeJourney(interval);
  }, [journeyActive, fromRoot, targetRoot]);

  const journeyHighlights = useMemo(() => {
    if (!journey) return [];
    return getJourneyHighlights(APPROACHES, journey.highlightIds);
  }, [journey]);

  const targetChord = targetRoot + targetQuality;
  const targetCat = getTargetCategory(targetQuality);
```

- [ ] **Step 5: Insert `FromChordPanel` block after the closing `</div>` of the Target Chord selector**

Find (the closing of the target chord selector section):
```typescript
      </div>

      {/* Filters */}
```

Replace with:
```typescript
      </div>

      {/* From Chord panel */}
      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 10,
        marginBottom: 20,
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setSourceOpen(o => !o)}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: '#8b949e',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              From Chord
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: '#4b5563',
              border: '1px solid #30363d',
              borderRadius: 4,
              padding: '1px 6px',
            }}>
              optional
            </span>
            {sourceOpen && fromRoot && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: '#f59e0b',
                fontWeight: 500,
              }}>
                {fromRoot}{fromQuality}
              </span>
            )}
          </div>
          <span style={{ color: '#6b7280', fontSize: 12 }}>
            {sourceOpen ? '▲' : '▼'}
          </span>
        </button>

        {sourceOpen && (
          <div style={{ padding: '0 24px 20px', borderTop: '1px solid #21262d' }}>
            <div style={{
              display: 'inline-block',
              background: '#f59e0b',
              borderRadius: 8,
              padding: '8px 20px',
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              color: '#000',
              letterSpacing: '-0.5px',
              margin: '18px 0',
              boxShadow: '0 0 20px #f59e0b55',
            }}>
              {fromRoot}{fromQuality}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>ROOT</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {NOTES.map(n => (
                  <button
                    key={n}
                    onClick={() => setFromRoot(n)}
                    style={{
                      ...btnStyle(fromRoot === n, '#f59e0b'),
                      minWidth: 40,
                      textAlign: 'center',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>QUALITY</div>
              {(['major', 'minor', 'dominant', 'suspended', 'halfdiminished', 'diminished', 'augmented'] as const).map(cat => {
                const catQualities = QUALITIES.filter(q => q.cat === cat);
                if (!catQualities.length) return null;
                const catColor =
                  cat === 'major' ? '#10b981' :
                  cat === 'minor' ? '#06b6d4' :
                  cat === 'dominant' ? '#f59e0b' :
                  cat === 'suspended' ? '#a78bfa' :
                  '#ef4444';
                return (
                  <div key={cat} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: catColor, minWidth: 80, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {CAT_LABELS[cat] ?? cat}
                    </span>
                    {catQualities.map(q => (
                      <button
                        key={q.value}
                        onClick={() => setFromQuality(q.value)}
                        style={btnStyle(fromQuality === q.value, catColor)}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
```

- [ ] **Step 6: Verify build + browser test of From Chord panel**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

In the browser:
1. Open Chord Landing Planner
2. Click "From Chord ▼" — panel opens, shows root + quality selectors in amber
3. Select root D, quality m7 — chord preview shows "Dm7" in amber
4. Close panel — chord landing cards are unchanged (no regressions)
5. Reopen panel — D and m7 are still selected

- [ ] **Step 7: Commit**

```bash
git add src/features/chord-landing/ChordLandingFeature.tsx
git commit -m "feat(chord-landing): add From Chord collapsible panel with state"
```

---

### Task 4: Journey Analysis Banner + wire up ApproachCard source chord

**Files:**
- Modify: `src/features/chord-landing/ChordLandingFeature.tsx` — insert JourneyAnalysisBanner after FromChordPanel, update ApproachCard call sites

- [ ] **Step 1: Insert `JourneyAnalysisBanner` after the FromChordPanel block and before Filters**

Find:
```typescript
      {/* Filters */}
      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 10,
        padding: '18px 24px',
        marginBottom: 20,
```

Insert immediately BEFORE that block:
```typescript
      {/* Journey Analysis Banner */}
      {journeyActive && journey && (
        <div style={{
          background: '#161b22',
          border: '1px solid #f59e0b44',
          borderLeft: '3px solid #f59e0b',
          borderRadius: 10,
          padding: '20px 24px',
          marginBottom: 20,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 16,
              fontWeight: 500,
              color: '#f59e0b',
            }}>
              {fromRoot}{fromQuality}
            </span>
            <span style={{ color: '#4b5563', fontSize: 20 }}>──→</span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 16,
              fontWeight: 500,
              color: '#7c3aed',
            }}>
              {targetChord || targetRoot}
            </span>
          </div>

          {/* Role + description */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#f59e0b',
              background: '#f59e0b18',
              border: '1px solid #f59e0b30',
              borderRadius: 4,
              padding: '2px 8px',
              flexShrink: 0,
            }}>
              {journey.role}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#8b949e',
              fontStyle: 'italic',
            }}>
              {fromRoot}{fromQuality} — {journey.label}
            </span>
          </div>

          {/* Journey Highlights label */}
          {journeyHighlights.length > 0 && (
            <>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: '#f59e0b',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>
                ★ Journey Highlights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {journeyHighlights.map(approach => (
                  <ApproachCard
                    key={approach.id}
                    approach={approach}
                    targetRoot={targetRoot}
                    targetQuality={targetQuality}
                    sourceChord={`${fromRoot}${fromQuality}`}
                    isHighlight
                    isExpanded={expandedId === approach.id}
                    onToggle={() => setExpandedId(expandedId === approach.id ? null : approach.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

```

- [ ] **Step 2: Pass `sourceChord` to all main ApproachCard renders**

Find:
```typescript
          {filtered.map(approach => (
            <ApproachCard
              key={approach.id}
              approach={approach}
              targetRoot={targetRoot}
              targetQuality={targetQuality}
              isExpanded={expandedId === approach.id}
              onToggle={() => setExpandedId(expandedId === approach.id ? null : approach.id)}
            />
          ))}
```

Replace with:
```typescript
          {filtered.map(approach => (
            <ApproachCard
              key={approach.id}
              approach={approach}
              targetRoot={targetRoot}
              targetQuality={targetQuality}
              sourceChord={journeyActive ? `${fromRoot}${fromQuality}` : undefined}
              isExpanded={expandedId === approach.id}
              onToggle={() => setExpandedId(expandedId === approach.id ? null : approach.id)}
            />
          ))}
```

- [ ] **Step 3: Verify final build**

```bash
cd /Users/astuser/Documents/Repos/music-tool && npm run build 2>&1 | tail -20
```

Expected: zero TypeScript errors.

- [ ] **Step 4: Full browser test**

Start `npm run dev`. Test all scenarios:

**Scenario A — Journey inactive (regression check):**
1. Target = Gmaj7, From Chord panel closed
2. Cards show normal chain: `G7 → Gmaj7` (no source prepended)
3. No Journey banner visible

**Scenario B — Journey active, Dm7 → Gmaj7 (interval = 5, "V — dominante"):**
1. Open From Chord, select D + m7
2. Journey banner appears: "Dm7 ──→ Gmaj7"
3. Role badge shows "V — dominante"
4. Journey Highlights shows: vsus4-alone, vsus4-then-V7, float-chord, perfect-cadence, altered-ii-V
5. Highlight cards have gold left border + "★ Journey" badge
6. Each card chain starts with: `Dm7 → [approach steps] → Gmaj7`
7. Main card list also shows Dm7 prepended in every chain

**Scenario C — expandedId shared:**
1. Click a card in Journey Highlights to expand it
2. Scroll down — same card is also expanded in the main list

**Scenario D — Target changes:**
1. Change target to Cm7 — banner updates "Dm7 ──→ Cm7", role changes to "ii — sopratonica"
2. Highlights update to: basic-ii-V, altered-ii-V, etc.

**Scenario E — From root changes:**
1. Change from root to Bb — banner updates "Bbm7 ──→ Cm7", role = "bVII — backdoor"

- [ ] **Step 5: Final commit**

```bash
git add src/features/chord-landing/ChordLandingFeature.tsx
git commit -m "feat(chord-landing): Journey Analysis banner with highlights + source chord in chain"
```

---

## Self-review checklist

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| 8 new Berklee approach cards | Task 1 |
| `journeyInterval()` | Task 2, Step 3 |
| `analyzeJourney()` with 12-entry map | Task 2, Step 3 |
| `getJourneyHighlights()` | Task 2, Step 3 |
| `getChain()` accepts `sourceChord?` | Task 2, Step 2 |
| `ChordChainViz` renders source in amber | Task 2, Step 4 |
| `ApproachCard` `sourceChord?` + `isHighlight?` | Task 3, Step 1-2 |
| 3 new state vars | Task 3, Step 3 |
| `journey` + `journeyHighlights` useMemos | Task 3, Step 4 |
| From Chord panel (collapsible, same selectors as target) | Task 3, Step 5 |
| JourneyAnalysisBanner with role + label + highlights | Task 4, Step 1 |
| `expandedId` shared between highlights + main list | Task 4 (same state ref) |
| Main list cards show source in chain when journey active | Task 4, Step 2 |
| Zero regressions when panel closed | verified in Scenario A |

**Type consistency:**

- `JourneyAnalysis` interface defined Task 2 Step 1, used in state type annotation Task 3 Step 4 ✓
- `getChain()` returns `{ chord, role, isTarget, isSource? }[]` — ChordChainViz accepts same type ✓
- `ApproachCard` receives `sourceChord?: string` — passed as `${fromRoot}${fromQuality}` string ✓
- `journeyHighlights` is `Approach[]` — same type as `filtered`, used identically ✓

**Placeholder scan:** No TBDs, TODOs, or vague steps found. All code is complete.
