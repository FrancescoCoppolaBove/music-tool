import { useState } from 'react';
import { Chord, Note } from 'tonal';
import { transposeNote } from '@shared/utils/musicTheory';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScaleInfo {
  name: string;
  intervals: number[];
  chordTones: number[];
  goodExtensions: number[];
  avoidNotes: number[];
  description: string;
  extensionLabel: string;
  trickSemitones?: number;
  trickScaleName?: string;
  trickInterval?: string;
}

interface ChordScaleEntry {
  quality: string;
  label: string;
  chordTones: number[];
  primary: ScaleInfo;
  alternatives: ScaleInfo[];
}

// ─── Scale Intervals ────────────────────────────────────────────────────────

const SCALES: Record<string, { name: string; intervals: number[] }> = {
  lydian:          { name: 'Lydian',               intervals: [0, 2, 4, 6, 7, 9, 11] },
  ionian:          { name: 'Ionian (Major)',        intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian:          { name: 'Dorian',               intervals: [0, 2, 3, 5, 7, 9, 10] },
  dorianb2:        { name: 'Dorian ♭2',            intervals: [0, 1, 3, 5, 7, 9, 10] },
  aeolian:         { name: 'Aeolian (Nat. Minor)',  intervals: [0, 2, 3, 5, 7, 8, 10] },
  phrygian:        { name: 'Phrygian',              intervals: [0, 1, 3, 5, 7, 8, 10] },
  mixolydian:      { name: 'Mixolydian',            intervals: [0, 2, 4, 5, 7, 9, 10] },
  mixolydianb6:    { name: 'Mixolydian ♭6',        intervals: [0, 2, 4, 5, 7, 8, 10] },
  lydianDom:       { name: 'Lydian Dominant',       intervals: [0, 2, 4, 6, 7, 9, 10] },
  lydianAug:       { name: 'Lydian Augmented',      intervals: [0, 2, 4, 6, 8, 9, 11] },
  phrygianDom:     { name: 'Phrygian Dominant',     intervals: [0, 1, 4, 5, 7, 8, 10] },
  altered:         { name: 'Altered (Super Locrian)', intervals: [0, 1, 3, 4, 6, 8, 10] },
  wholeTone:       { name: 'Whole Tone',            intervals: [0, 2, 4, 6, 8, 10] },
  hwDim:           { name: 'Half-Whole Diminished', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  whDim:           { name: 'Whole-Half Diminished', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  locrianSharp2:   { name: 'Locrian ♯2',           intervals: [0, 2, 3, 5, 6, 8, 10] },
  locrian:         { name: 'Locrian',               intervals: [0, 1, 3, 5, 6, 8, 10] },
  melodicMinor:    { name: 'Melodic Minor',         intervals: [0, 2, 3, 5, 7, 9, 11] },
  harmonicMinor:   { name: 'Harmonic Minor',        intervals: [0, 2, 3, 5, 7, 8, 11] },
};

// ─── Chord–Scale Data ───────────────────────────────────────────────────────

const CHORD_SCALE_DATA: ChordScaleEntry[] = [
  // ── Maj7 ────────────────────────────────────────────────────────────────
  {
    quality: 'maj7',
    label: 'Major 7th',
    chordTones: [0, 4, 7, 11],
    primary: {
      name: SCALES.lydian.name,
      intervals: SCALES.lydian.intervals,
      chordTones: [0, 4, 7, 11],
      goodExtensions: [2, 6, 9],
      avoidNotes: [],
      description: 'The gold standard for maj7 in jazz. The ♯11 adds brightness without creating tension against the chord. The natural 4th (11) is avoided because it clashes with the major 3rd.',
      extensionLabel: 'Extensions: 9, ♯11, 13',
      trickSemitones: 5,
      trickScaleName: 'Major',
      trickInterval: 'P4 above',
    },
    alternatives: [
      {
        name: SCALES.ionian.name,
        intervals: SCALES.ionian.intervals,
        chordTones: [0, 4, 7, 11],
        goodExtensions: [2, 9],
        avoidNotes: [5],
        description: 'The diatonic choice — natural major scale. Works well in tonal contexts. Watch out for the P4 (11th), which clashes with the major 3rd and should be treated as an avoid note.',
        extensionLabel: 'Extensions: 9, 13 (avoid 11)',
      },
      {
        name: SCALES.lydianAug.name,
        intervals: SCALES.lydianAug.intervals,
        chordTones: [0, 4, 11],
        goodExtensions: [2, 6, 8, 9],
        avoidNotes: [7],
        description: 'Melodic Minor mode 3 — replaces the P5 with a ♯5, creating a dreamy, floating quality. Best on maj7♯5 chords. The ♯11 and ♯5 together give a lush, cinematic sound (think Ennio Morricone, Wayne Shorter).',
        extensionLabel: 'Extensions: 9, ♯11, ♯5, 13',
        trickSemitones: 9,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'maj. 6th above',
      },
    ],
  },

  // ── m7 ──────────────────────────────────────────────────────────────────
  {
    quality: 'm7',
    label: 'Minor 7th',
    chordTones: [0, 3, 7, 10],
    primary: {
      name: SCALES.dorian.name,
      intervals: SCALES.dorian.intervals,
      chordTones: [0, 3, 7, 10],
      goodExtensions: [2, 9],
      avoidNotes: [],
      description: 'The default jazz choice for m7. The natural 6th (13) is the signature Dorian sound — warm and open, characteristic of jazz-funk (think Miles Davis "So What", Snarky Puppy).',
      extensionLabel: 'Extensions: 9, 11, 13',
      trickSemitones: 2,
      trickScaleName: 'Major',
      trickInterval: 'M2 above',
    },
    alternatives: [
      {
        name: SCALES.aeolian.name,
        intervals: SCALES.aeolian.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [2],
        avoidNotes: [8],
        description: 'Natural minor — preferred in rock, pop, and classical contexts. The b6 creates more darkness compared to Dorian. Strong for melodic minor contexts and for tonal cadences.',
        extensionLabel: 'Extensions: 9, 11 (b13 is colouristic)',
      },
      {
        name: SCALES.dorianb2.name,
        intervals: SCALES.dorianb2.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [5, 9],
        avoidNotes: [1],
        description: 'Melodic Minor mode 2 — Dorian with a b2. Keeps the warm natural 6th but adds a half-step tension at the b2. Sophisticated and modern, used in contemporary jazz (Jacob Collier, Brad Mehldau). The b2 is an avoid note on long durations.',
        extensionLabel: 'Extensions: 11, 13 (b2 is colour)',
        trickSemitones: 10,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'min. 7th above',
      },
      {
        name: SCALES.phrygian.name,
        intervals: SCALES.phrygian.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [5],
        avoidNotes: [1],
        description: 'The darkest diatonic minor mode. The b2 and b6 create a Spanish-Flamenco or Moorish tension. Great for film scoring, metal, Middle-Eastern contexts. Avoid sustaining the b2 — use it as a half-step approach.',
        extensionLabel: 'Extensions: 11 (avoid b2 on long notes)',
        trickSemitones: 8,
        trickScaleName: 'Major',
        trickInterval: 'min. 6th above',
      },
    ],
  },

  // ── dom7 ────────────────────────────────────────────────────────────────
  {
    quality: '7',
    label: 'Dominant 7th',
    chordTones: [0, 4, 7, 10],
    primary: {
      name: SCALES.lydianDom.name,
      intervals: SCALES.lydianDom.intervals,
      chordTones: [0, 4, 7, 10],
      goodExtensions: [2, 6, 9],
      avoidNotes: [],
      description: 'Melodic Minor mode 4 — combines the dominant b7 with the Lydian ♯11. Sophisticated tension without the harshness of Altered. The go-to modern jazz dominant sound (think Herbie Hancock, Snarky Puppy).',
      extensionLabel: 'Extensions: 9, ♯11, 13',
      trickSemitones: 7,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'P5 above',
    },
    alternatives: [
      {
        name: SCALES.mixolydian.name,
        intervals: SCALES.mixolydian.intervals,
        chordTones: [0, 4, 7, 10],
        goodExtensions: [2, 9],
        avoidNotes: [5],
        description: 'The most direct dominant scale — natural major with a b7. Functional and clear. Avoid the 11th (P4) which clashes with the major 3rd. Ideal for blues, bebop, and tonal harmony.',
        extensionLabel: 'Extensions: 9, 13 (avoid 11)',
        trickSemitones: 5,
        trickScaleName: 'Major',
        trickInterval: 'P4 above (= key tonic)',
      },
      {
        name: SCALES.mixolydianb6.name,
        intervals: SCALES.mixolydianb6.intervals,
        chordTones: [0, 4, 7, 10],
        goodExtensions: [2, 8],
        avoidNotes: [5],
        description: 'Melodic Minor mode 5 — Mixolydian with a b13. The b6 creates a darker, more brooding dominant sound that resolves naturally to a minor tonic. Perfect for V7–im7 progressions.',
        extensionLabel: 'Extensions: 9, b13 (avoid 11)',
        trickSemitones: 5,
        trickScaleName: 'Melodic Minor',
        trickInterval: 'P4 above',
      },
      {
        name: SCALES.phrygianDom.name,
        intervals: SCALES.phrygianDom.intervals,
        chordTones: [0, 4, 7, 10],
        goodExtensions: [1, 5, 8],
        avoidNotes: [],
        description: 'Harmonic Minor mode 5 — the "Spanish Dominant." The b2/b9 is the defining colour, creating a flamenco or Middle-Eastern tension. Common in Spanish music, metal, and film scoring when resolving to minor.',
        extensionLabel: 'Extensions: b9, 11, b13',
        trickSemitones: 5,
        trickScaleName: 'Harmonic Minor',
        trickInterval: 'P4 above (= key tonic)',
      },
    ],
  },

  // ── 7alt ────────────────────────────────────────────────────────────────
  {
    quality: '7alt',
    label: 'Dominant Alt.',
    chordTones: [0, 4, 10],
    primary: {
      name: SCALES.altered.name,
      intervals: SCALES.altered.intervals,
      chordTones: [0, 4, 10],
      goodExtensions: [1, 3, 6, 8],
      avoidNotes: [],
      description: 'All tensions are altered: b9, ♯9, ♯11, b13. Maximum tension — resolves perfectly a semitone below (G7alt → Fmaj7). Melodic Minor mode 7. The signature sound of post-bop jazz.',
      extensionLabel: 'Extensions: b9/♯9, ♯11, b13',
      trickSemitones: 1,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'min. 2nd above',
    },
    alternatives: [
      {
        name: SCALES.hwDim.name,
        intervals: SCALES.hwDim.intervals,
        chordTones: [0, 4, 10],
        goodExtensions: [1, 3, 6, 9],
        avoidNotes: [],
        description: 'The Half-Whole Diminished gives b9, ♯9, ♯11 AND includes the natural 5th and 13. Less fully altered than the Altered scale — a good middle ground between tension and stability.',
        extensionLabel: 'Extensions: b9, ♯9, ♯11, 13',
      },
      {
        name: SCALES.wholeTone.name,
        intervals: SCALES.wholeTone.intervals,
        chordTones: [0, 4, 10],
        goodExtensions: [2, 6, 8],
        avoidNotes: [],
        description: 'Fully symmetrical — every note is a whole step apart. Creates a dreamy, unresolved dominant sound with natural 9, ♯11, b13 but NO b9 or ♯9. Debussy-esque, ethereal. Debussy used it to avoid the clichés of functional harmony.',
        extensionLabel: 'Extensions: 9, ♯11, b13 (no b9/♯9)',
      },
    ],
  },

  // ── m7b5 ────────────────────────────────────────────────────────────────
  {
    quality: 'm7b5',
    label: 'Min. 7♭5 (ø)',
    chordTones: [0, 3, 6, 10],
    primary: {
      name: SCALES.locrianSharp2.name,
      intervals: SCALES.locrianSharp2.intervals,
      chordTones: [0, 3, 6, 10],
      goodExtensions: [2, 5],
      avoidNotes: [],
      description: 'Melodic Minor mode 6 — adds a natural 9th instead of the b9 found in standard Locrian. Much softer and more jazzistic, ideal for minor ii–V–i progressions. The natural 9th is the key difference.',
      extensionLabel: 'Extensions: 9 (natural), 11',
      trickSemitones: 3,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'min. 3rd above',
    },
    alternatives: [
      {
        name: SCALES.locrian.name,
        intervals: SCALES.locrian.intervals,
        chordTones: [0, 3, 6, 10],
        goodExtensions: [5],
        avoidNotes: [1],
        description: 'Classic Locrian — includes the b9, making it more dissonant. The b9 is very tense and should be treated as a colour note rather than a stable extension. Harsher sound, better in very tense passages.',
        extensionLabel: 'Extensions: 11 (b9 is very tense)',
      },
      {
        name: SCALES.hwDim.name,
        intervals: SCALES.hwDim.intervals,
        chordTones: [0, 3, 6, 10],
        goodExtensions: [1, 3, 5, 9],
        avoidNotes: [],
        description: 'An unexpected but valid choice on ø chords in a tense context. The symmetrical nature provides both b9 and ♯9 as well as all the chord tones. Works when the half-diminished is functioning as a passing or pivot chord.',
        extensionLabel: 'Extensions: b9, ♯9, 11, 13',
      },
    ],
  },

  // ── dim7 ────────────────────────────────────────────────────────────────
  {
    quality: 'dim7',
    label: 'Diminished 7th',
    chordTones: [0, 3, 6, 9],
    primary: {
      name: SCALES.hwDim.name,
      intervals: SCALES.hwDim.intervals,
      chordTones: [0, 3, 6, 9],
      goodExtensions: [1, 4, 7, 10],
      avoidNotes: [],
      description: 'The Half-Whole Diminished contains all four dim7 chord tones plus symmetrical extensions. The scale repeats every minor 3rd — this means one scale covers 4 different root positions of the same dim7 chord.',
      extensionLabel: 'Extensions: b9, ♯9, ♮7, b7 (symmetrical)',
    },
    alternatives: [
      {
        name: SCALES.whDim.name,
        intervals: SCALES.whDim.intervals,
        chordTones: [0, 3, 6, 9],
        goodExtensions: [2, 5, 8, 11],
        avoidNotes: [],
        description: 'The Whole-Half Diminished includes chord tones + 9, 11, b13, maj7. More open-sounding than the HW — often used for passing lines or when approaching the resolution chord.',
        extensionLabel: 'Extensions: 9, 11, b13, maj7',
      },
    ],
  },

  // ── mMaj7 ───────────────────────────────────────────────────────────────
  {
    quality: 'mMaj7',
    label: 'Min. Maj7',
    chordTones: [0, 3, 7, 11],
    primary: {
      name: SCALES.melodicMinor.name,
      intervals: SCALES.melodicMinor.intervals,
      chordTones: [0, 3, 7, 11],
      goodExtensions: [2, 9],
      avoidNotes: [],
      description: 'The natural home of the mMaj7 chord — melodic minor in its jazz ascending form. Cinematic and mysterious, characteristic of Ennio Morricone, Wayne Shorter, and Jacob Collier. Every note is a good note.',
      extensionLabel: 'Extensions: 9, 11, 13',
      trickSemitones: 0,
      trickScaleName: 'Melodic Minor',
      trickInterval: 'same root',
    },
    alternatives: [
      {
        name: SCALES.harmonicMinor.name,
        intervals: SCALES.harmonicMinor.intervals,
        chordTones: [0, 3, 7, 11],
        goodExtensions: [2],
        avoidNotes: [8],
        description: 'Harmonic Minor adds a b6, creating a more dramatic and classical tension. The augmented 2nd (between b6 and maj7) gives a characteristic Eastern European or classical flavour. Associated with Romantic-era composition and flamenco.',
        extensionLabel: 'Extensions: 9, 11 (b13 is colouristic)',
      },
    ],
  },
];

// ─── Note Parsing ───────────────────────────────────────────────────────────

const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function toAppQuality(tonalType: string): string {
  const map: Record<string, string> = {
    'major seventh': 'maj7',
    'major': 'maj7',
    'minor seventh': 'm7',
    'minor': 'm7',
    'dominant seventh': '7',
    'dominant': '7',
    'half-diminished': 'm7b5',
    'diminished seventh': 'dim7',
    'diminished': 'dim7',
    'minor/major seventh': 'mMaj7',
  };
  return map[tonalType] ?? '7';
}

function parseChordSymbol(symbol: string): { root: string; quality: string; displaySymbol: string } | null {
  const trimmed = symbol.trim();
  if (!trimmed) return null;

  const altMatch = trimmed.match(/^([A-G][#b]?)(?:7)?alt$/i);
  if (altMatch) {
    const root = altMatch[1];
    return { root, quality: '7alt', displaySymbol: `${root}7alt` };
  }

  const chord = Chord.get(trimmed);
  if (chord.empty || !chord.tonic) return null;

  const root = Note.simplify(chord.tonic) || chord.tonic;
  const quality = toAppQuality(chord.type);
  const displaySymbol = chord.symbol || trimmed;

  return { root, quality, displaySymbol };
}

function parseProgression(text: string): Array<{ root: string; quality: string; symbol: string }> {
  return text
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const parsed = parseChordSymbol(s);
      return parsed ? { root: parsed.root, quality: parsed.quality, symbol: parsed.displaySymbol } : null;
    })
    .filter((x): x is { root: string; quality: string; symbol: string } => x !== null);
}

// ─── Color helpers ───────────────────────────────────────────────────────────

function getNoteColor(semitone: number, chordTones: number[], goodExtensions: number[], avoidNotes: number[]): string {
  if (semitone === 0) return '#f59e0b';
  if (chordTones.includes(semitone)) return '#a78bfa';
  if (avoidNotes.includes(semitone)) return '#ef4444';
  if (goodExtensions.includes(semitone)) return '#06b6d4';
  return '#6b7280';
}

function getIntervalName(semitone: number): string {
  const names: Record<number, string> = {
    0: 'R', 1: '♭9', 2: '9', 3: '♭3/♯9', 4: '3', 5: '11',
    6: '♯11/♭5', 7: '5', 8: '♭13/♯5', 9: '13/6', 10: '♭7', 11: '△7',
  };
  return names[semitone] ?? `+${semitone}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScaleNoteRow({ root, scale }: { root: string; scale: ScaleInfo }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {scale.intervals.map((semitone, i) => {
        const note = transposeNote(root, semitone);
        const color = getNoteColor(semitone, scale.chordTones, scale.goodExtensions, scale.avoidNotes);
        const intervalName = getIntervalName(semitone);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 38, height: 38,
              borderRadius: '50%',
              background: `${color}20`,
              border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color,
            }}>
              {note}
            </div>
            <div style={{ fontSize: 10, color: `${color}99`, fontFamily: 'monospace' }}>
              {intervalName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScaleCard({
  root,
  scale,
  isPrimary,
}: {
  root: string;
  scale: ScaleInfo;
  isPrimary: boolean;
}) {
  const relatedRoot = scale.trickSemitones !== undefined
    ? transposeNote(root, scale.trickSemitones)
    : null;

  return (
    <div style={{
      background: '#0d1117',
      border: `1px solid ${isPrimary ? '#7c3aed50' : '#30363d'}`,
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: isPrimary ? '#c4b5fd' : '#8b949e' }}>
            {root} {scale.name}
          </span>
          {isPrimary && (
            <span style={{
              marginLeft: 8, fontSize: 10, background: '#7c3aed30', border: '1px solid #7c3aed',
              borderRadius: 20, padding: '2px 8px', color: '#a78bfa', fontWeight: 600,
            }}>
              PRIMARY
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: '#06b6d4', background: '#06b6d410',
          border: '1px solid #06b6d430', borderRadius: 6, padding: '3px 8px',
        }}>
          {scale.extensionLabel}
        </div>
      </div>

      <ScaleNoteRow root={root} scale={scale} />

      {relatedRoot && scale.trickScaleName && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: '#10b98110', border: '1px solid #10b98130',
          borderRadius: 8, fontSize: 12, color: '#6ee7b7',
        }}>
          💡 <strong>{relatedRoot} {scale.trickScaleName}</strong>{' '}
          ({scale.trickInterval}) — parent scale for memorisation
        </div>
      )}

      <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
        {scale.description}
      </p>
    </div>
  );
}

function ChordScalePanel({ root, quality }: { root: string; quality: string }) {
  const entry = CHORD_SCALE_DATA.find(e => e.quality === quality);
  if (!entry) return <div style={{ color: '#6b7280', fontSize: 13 }}>Chord quality not recognised.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
        {[
          { color: '#f59e0b', label: 'Root' },
          { color: '#a78bfa', label: 'Chord tones' },
          { color: '#06b6d4', label: 'Good extensions' },
          { color: '#ef4444', label: 'Avoid notes' },
          { color: '#6b7280', label: 'Passing tones' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Primary scale */}
      <ScaleCard root={root} scale={entry.primary} isPrimary />

      {/* Alternatives */}
      {entry.alternatives.map((alt, i) => (
        <ScaleCard key={i} root={root} scale={alt} isPrimary={false} />
      ))}
    </div>
  );
}

// ─── Progression Card ────────────────────────────────────────────────────────

function ProgressionChordCard({
  symbol,
  root,
  quality,
  index,
}: {
  symbol: string;
  root: string;
  quality: string;
  index: number;
}) {
  const entry = CHORD_SCALE_DATA.find(e => e.quality === quality);
  if (!entry) return null;
  const { primary } = entry;
  const relatedRoot = primary.trickSemitones !== undefined
    ? transposeNote(root, primary.trickSemitones)
    : null;

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 220,
      flex: '1 1 220px',
    }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#4b5563', fontFamily: 'monospace' }}>#{index + 1}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#e6edf3' }}>{symbol}</span>
        </div>
        <div style={{
          fontSize: 11, color: '#c4b5fd', background: '#7c3aed20',
          border: '1px solid #7c3aed40', borderRadius: 6,
          padding: '2px 8px', display: 'inline-block',
        }}>
          {root} {primary.name}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {primary.intervals.map((semitone, i) => {
          const note = transposeNote(root, semitone);
          const color = getNoteColor(semitone, primary.chordTones, primary.goodExtensions, primary.avoidNotes);
          return (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `${color}20`, border: `1.5px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color,
            }}>
              {note}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: '#06b6d4', marginBottom: 8 }}>
        {primary.extensionLabel}
      </div>

      {relatedRoot && primary.trickScaleName && (
        <div style={{
          fontSize: 11, color: '#6ee7b7',
          background: '#10b98110', border: '1px solid #10b98130',
          borderRadius: 6, padding: '5px 8px',
        }}>
          💡 {relatedRoot} {primary.trickScaleName}
        </div>
      )}
    </div>
  );
}

// ─── Main Feature ────────────────────────────────────────────────────────────

type Mode = 'single' | 'progression';

export default function ScaleAdvisorFeature() {
  const [mode, setMode] = useState<Mode>('single');

  const [root, setRoot] = useState('C');
  const [quality, setQuality] = useState('maj7');

  const [progressionText, setProgressionText] = useState('Dm7 G7 Cmaj7');
  const [parsedChords, setParsedChords] = useState<Array<{ root: string; quality: string; symbol: string }>>([]);
  const [parseError, setParseError] = useState('');

  function handleAnalyze() {
    const chords = parseProgression(progressionText);
    if (chords.length === 0) {
      setParseError('No chords recognised. Try: Dm7 G7 Cmaj7 or Cm7b5 F7alt Bbmaj7');
      setParsedChords([]);
    } else {
      setParseError('');
      setParsedChords(chords);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Scale Advisor</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Find the right scale for any chord — based on the chord-scale theory of modern jazz.
          Every chord and its scale share the same notes; the extensions determine the harmonic colour.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['single', 'progression'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '8px 20px',
              background: mode === m ? '#7c3aed20' : '#161b22',
              border: `1px solid ${mode === m ? '#7c3aed' : '#30363d'}`,
              borderRadius: 8, cursor: 'pointer',
              color: mode === m ? '#c4b5fd' : '#6b7280',
              fontSize: 13, fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m === 'single' ? '🎵 Single Chord' : '🎼 Progression'}
          </button>
        ))}
      </div>

      {mode === 'single' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls */}
          <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: '16px',
            display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start',
          }}>
            {/* Root selector */}
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
                Root Note
              </label>
              <select
                value={root}
                onChange={e => setRoot(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, color: '#e6edf3', fontSize: 15, outline: 'none',
                }}
              >
                {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Quality selector */}
            <div style={{ flex: '1 1 100%' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
                Chord Type
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CHORD_SCALE_DATA.map(e => (
                  <button
                    key={e.quality}
                    onClick={() => setQuality(e.quality)}
                    style={{
                      padding: '7px 16px',
                      background: quality === e.quality ? '#1d4ed820' : '#0d1117',
                      border: `1px solid ${quality === e.quality ? '#3b82f6' : '#30363d'}`,
                      borderRadius: 8, cursor: 'pointer',
                      color: quality === e.quality ? '#93c5fd' : '#8b949e',
                      fontSize: 13, fontWeight: quality === e.quality ? 700 : 400,
                    }}
                  >
                    <span style={{ fontFamily: 'monospace' }}>{e.quality}</span>
                    <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 6 }}>{e.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: '16px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3' }}>
                {Chord.get(`${root}${quality}`).symbol || `${root}${quality}`}
              </span>
              <span style={{ marginLeft: 10, fontSize: 14, color: '#6b7280' }}>
                {CHORD_SCALE_DATA.find(e => e.quality === quality)?.label}
              </span>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#4b5563' }}>
                — {CHORD_SCALE_DATA.find(e => e.quality === quality)!.alternatives.length + 1} scales available
              </span>
            </div>
            <ChordScalePanel root={root} quality={quality} />
          </div>
        </div>
      ) : (
        /* Progression mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: '16px',
          }}>
            <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
              Enter the progression (e.g. Dm7 G7 Cmaj7 · Cm7b5 F7alt Bbmaj7)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={progressionText}
                onChange={e => setProgressionText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="Dm7 G7 Cmaj7"
                style={{
                  flex: 1, padding: '10px 14px',
                  background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, color: '#e6edf3', fontSize: 15, outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={handleAnalyze}
                style={{
                  padding: '10px 24px', background: '#7c3aed', border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Analyze
              </button>
            </div>

            {/* Quick examples */}
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#4b5563' }}>Examples:</span>
              {[
                'Dm7 G7 Cmaj7',
                'Cm7b5 F7alt Bbmaj7',
                'Dm7 G7alt Cmaj7 A7alt',
                'Fmaj7 Em7b5 A7alt Dm7',
                'Cmaj7 Am7 Dm7 G7',
              ].map(ex => (
                <button
                  key={ex}
                  onClick={() => { setProgressionText(ex); setParsedChords([]); setParseError(''); }}
                  style={{
                    fontSize: 11, padding: '2px 8px',
                    background: 'none', border: '1px solid #30363d',
                    borderRadius: 4, color: '#8b949e', cursor: 'pointer',
                    fontFamily: 'monospace',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            {parseError && (
              <div style={{ marginTop: 10, color: '#ef4444', fontSize: 12 }}>{parseError}</div>
            )}
          </div>

          {parsedChords.length > 0 && (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
                {[
                  { color: '#f59e0b', label: 'Root' },
                  { color: '#a78bfa', label: 'Chord tones' },
                  { color: '#06b6d4', label: 'Good extensions' },
                  { color: '#ef4444', label: 'Avoid notes' },
                  { color: '#6b7280', label: 'Passing tones' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {parsedChords.map((chord, i) => (
                  <ProgressionChordCard key={i} index={i} {...chord} />
                ))}
              </div>

              {/* Detailed breakdown */}
              <details style={{
                background: '#161b22', border: '1px solid #30363d',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
                  🔍 Full scale breakdown for each chord
                </summary>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {parsedChords.map((chord, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 10 }}>
                        #{i + 1} — {chord.symbol}
                      </div>
                      <ChordScalePanel root={chord.root} quality={chord.quality} />
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>
      )}

      {/* Theory box */}
      <details style={{
        background: '#161b22', border: '1px solid #30363d',
        borderRadius: 10, padding: '14px 16px',
      }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          📖 Chord-Scale Theory: how it works
        </summary>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {[
            {
              title: 'Fixed vs Floating Extensions',
              text: 'Chords with fixed extensions (maj7, m7, unaltered 7) have predictable 9, 11, 13 from the scale. Altered dominants (7alt) have floating extensions — b9/♯9 and b13/♯11 are interchangeable depending on context.',
            },
            {
              title: 'The Melodic Minor Family',
              text: 'Melodic Minor is the "mother" of several important scales: play it from the P5 above for Lydian Dominant (on V7), from the b2 above for Altered (on 7alt), from the min. 3rd above for Locrian ♯2 (on ø), from the maj. 6th above for Lydian Augmented (on maj7♯5).',
            },
            {
              title: 'Guide Tones',
              text: 'The 3rd and 7th of every chord are the "guide tones." Moving them by step between adjacent chords creates smooth voice leading — the foundation of jazz harmony.',
            },
            {
              title: 'Dorian vs Aeolian vs Phrygian',
              text: 'All three work on m7. Dorian (nat. 6th) = warm, jazz-funk. Aeolian (b6) = darker, rock/pop. Phrygian (b2 + b6) = darkest, Spanish/film. The choice changes the emotional weight of the chord.',
            },
            {
              title: 'Avoid Notes',
              text: '"Avoid notes" are not forbidden — they are notes to avoid sustaining directly against a chord tone. Used as passing notes, grace notes, or brief touches they add colour without creating clashes.',
            },
            {
              title: 'Whole Tone vs Altered',
              text: 'Both work on 7alt chords, but differently. Altered gives b9, ♯9, ♯11, b13 — maximum tension. Whole Tone gives natural 9, ♯11, b13 — softer, more impressionistic. Debussy vs Coltrane.',
            },
          ].map(({ title, text }) => (
            <div key={title} style={{
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{text}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
