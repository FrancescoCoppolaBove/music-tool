# Harmonia Course — Visual Diagrams Design

**Goal:** Add typed visual diagrams to each lesson subsection, rendered in a dedicated "Visualizza" tab in LessonView.

**Architecture:** A `Visual` discriminated union type is added to `Subsection` as an optional field. A new `visuals/` directory under the harmonia-course feature contains one renderer component per diagram type, plus a `VisualRenderer` dispatcher. LessonView grows a fifth tab that only appears when the subsection has visuals.

**Tech Stack:** React + TypeScript, SVG (keyboard and circle of fifths), plain JSX/CSS (progression chart and interval grid), `tonal` for music theory derivation.

---

## Data Model

Add to `src/features/harmonia-course/data/types.ts`:

```typescript
export type Visual =
  | {
      type: 'keyboard';
      title?: string;
      chords: { label: string; notes: string[]; color?: string }[];
    }
  | {
      type: 'progression';
      title?: string;
      key?: string;
      steps: { chord: string; function?: string; annotation?: string }[];
    }
  | {
      type: 'interval-grid';
      title?: string;
      chord?: string;
      scale?: string;
      root?: string;
      rows?: { degree: string; note: string; semitones: number }[];
    }
  | {
      type: 'circle-segment';
      title?: string;
      highlight: string[];
      tonic?: string;
    };
```

`Subsection` gets one new optional field:

```typescript
visuals?: Visual[];
```

Fully backwards-compatible — all existing subsections without `visuals` are unaffected.

---

## File Structure

New directory: `src/features/harmonia-course/visuals/`

| File | Responsibility |
|---|---|
| `KeyboardDiagram.tsx` | SVG piano keyboard, 2 octaves (C3–B4), N chords in parallel |
| `ProgressionChart.tsx` | Horizontal chord sequence with function labels and arrows |
| `IntervalGrid.tsx` | Degree / note / semitones table with color-coded rows |
| `CircleSegment.tsx` | SVG circle of fifths wheel, 12 spokes, highlighted keys |
| `VisualRenderer.tsx` | Switch dispatcher — receives a `Visual`, renders the right component |

Modified files:

| File | Change |
|---|---|
| `src/features/harmonia-course/data/types.ts` | Add `Visual` union type, add `visuals?` to `Subsection` |
| `src/features/harmonia-course/LessonView.tsx` | Add `'visualizza'` tab, render `VisualRenderer` per visual |

---

## Component Specs

### KeyboardDiagram

- Props: `{ title?: string; chords: { label: string; notes: string[]; color?: string }[] }`
- Renders N keyboards in a `flex-wrap` row.
- Each keyboard: SVG, 2 octaves (C3–B4), white keys + black keys.
- Highlighted notes: from `notes[]`. If `notes` is empty, derive via `tonal.Chord.get(label).notes`.
- Color default: `#7c3aed`. Override per-chord via `color`.
- Label shown below each keyboard in `<code>` style.

### ProgressionChart

- Props: `{ title?: string; key?: string; steps: { chord: string; function?: string; annotation?: string }[] }`
- Pure JSX/CSS — no SVG needed.
- Each step is a card: function label (top, small grey), chord symbol (center, large white), annotation (bottom, small purple).
- Steps connected by `→` arrows.
- Key shown top-left of the container.

### IntervalGrid

- Props: `{ title?: string; chord?: string; scale?: string; root?: string; rows?: { degree: string; note: string; semitones: number }[] }`
- If `rows` provided: use them directly.
- If `chord` provided: derive rows via `tonal.Chord.get(chord)`.
- If `scale` + `root` provided: derive rows via `tonal.Scale.get(\`${root} ${scale}\`)`.
- Table columns: Grado | Nota | Semitoni.
- Row colors: root = white, thirds = light purple, sevenths = amber, tensions = teal.

### CircleSegment

- Props: `{ title?: string; highlight: string[]; tonic?: string }`
- SVG 240×240px, centered in card.
- 12 equal spokes for the 12 chromatic tones (C, G, D, A, E, B, F#/Gb, Db, Ab, Eb, Bb, F — circle of fifths order).
- Notes in `highlight[]`: filled `#7c3aed`.
- `tonic` note: filled `#a78bfa` + white border.
- Unhighlighted notes: `#21262d` (dark grey).
- Note name centered in each spoke.

### VisualRenderer

```tsx
export default function VisualRenderer({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case 'keyboard':      return <KeyboardDiagram {...visual} />;
    case 'progression':   return <ProgressionChart {...visual} />;
    case 'interval-grid': return <IntervalGrid {...visual} />;
    case 'circle-segment': return <CircleSegment {...visual} />;
  }
}
```

---

## LessonView Integration

- `LessonTab` union: add `'visualizza'`.
- Tab entry added to `tabs[]` only when `subsection.visuals && subsection.visuals.length > 0`.
- Badge = `subsection.visuals.length`.
- Tab content:
  ```tsx
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    {subsection.visuals.map((v, i) => (
      <div key={i} style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 12, padding: 20 }}>
        {v.title && <h3 style={{ color: '#e6edf3', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{v.title}</h3>}
        <VisualRenderer visual={v} />
      </div>
    ))}
  </div>
  ```
- No changes to the other four tabs.

---

## Phasing

All four diagram types are built in one plan. Suggested implementation order within the plan:

1. `types.ts` — add `Visual` union + `visuals?` on `Subsection`
2. `KeyboardDiagram` — highest visual impact
3. `ProgressionChart` — most used in harmony lessons
4. `IntervalGrid` — useful for theory levels
5. `CircleSegment` — useful for tonal/modal levels
6. `VisualRenderer` + LessonView tab integration
7. Populate `visuals[]` for 3–4 representative subsections as working examples
