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
  // Melodic minor (or other) trick — computed at render using root
  trickSemitones?: number;    // semitones above chord root for the related scale
  trickScaleName?: string;    // e.g. "Melodic Minor"
  trickInterval?: string;     // e.g. "5th above"
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
  aeolian:         { name: 'Aeolian (Nat. Minor)',  intervals: [0, 2, 3, 5, 7, 8, 10] },
  mixolydian:      { name: 'Mixolydian',            intervals: [0, 2, 4, 5, 7, 9, 10] },
  lydianDom:       { name: 'Lydian Dominant',       intervals: [0, 2, 4, 6, 7, 9, 10] },
  altered:         { name: 'Altered (Super Locrian)', intervals: [0, 1, 3, 4, 6, 8, 10] },
  hwDim:           { name: 'Half-Whole Diminished', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  whDim:           { name: 'Whole-Half Diminished', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  locrianSharp2:   { name: 'Locrian ♯2',           intervals: [0, 2, 3, 5, 6, 8, 10] },
  locrian:         { name: 'Locrian',               intervals: [0, 1, 3, 5, 6, 8, 10] },
  melodicMinor:    { name: 'Melodic Minor',         intervals: [0, 2, 3, 5, 7, 9, 11] },
  harmonicMinor:   { name: 'Harmonic Minor',        intervals: [0, 2, 3, 5, 7, 8, 11] },
};

// ─── Chord–Scale Data ───────────────────────────────────────────────────────

const CHORD_SCALE_DATA: ChordScaleEntry[] = [
  {
    quality: 'maj7',
    label: 'Major 7th',
    chordTones: [0, 4, 7, 11],
    primary: {
      name: SCALES.lydian.name,
      intervals: SCALES.lydian.intervals,
      chordTones: [0, 4, 7, 11],
      goodExtensions: [2, 6, 9],   // 9, #11, 13
      avoidNotes: [],
      description: 'La scelta migliore per maj7: il ♯11 aggiunge brillantezza senza creare tensioni. Evita il IV grado naturale che crea attrito con la terza.',
      extensionLabel: 'Estensioni fisse: 9, ♯11, 13',
      trickSemitones: 5,           // Lydian = Major from P4 above (or equiv: scale built on 4th)
      trickScaleName: 'Maggiore',
      trickInterval: '4a sopra',
    },
    alternatives: [
      {
        name: SCALES.ionian.name,
        intervals: SCALES.ionian.intervals,
        chordTones: [0, 4, 7, 11],
        goodExtensions: [2, 9],    // 9, 13
        avoidNotes: [5],           // 11 (P4) — avoid note for maj7
        description: 'Funziona bene in contesti diatonici. Attenzione alla quarta giusta (11) che crea attrito con la terza maggiore.',
        extensionLabel: 'Estensioni: 9, 13 (evita 11)',
      },
    ],
  },

  {
    quality: 'm7',
    label: 'Minor 7th',
    chordTones: [0, 3, 7, 10],
    primary: {
      name: SCALES.dorian.name,
      intervals: SCALES.dorian.intervals,
      chordTones: [0, 3, 7, 10],
      goodExtensions: [2, 9],      // 9, 13 (natural 6th)
      avoidNotes: [],
      description: 'Il Dorico è la scelta jazz per eccellenza su m7. La sesta naturale distingue il Dorico dall\'Eolio e dà un suono caldo e aperto.',
      extensionLabel: 'Estensioni fisse: 9, 11, 13',
      trickSemitones: 2,           // Dorian = Major from 2nd above
      trickScaleName: 'Maggiore',
      trickInterval: '2a sopra',
    },
    alternatives: [
      {
        name: SCALES.aeolian.name,
        intervals: SCALES.aeolian.intervals,
        chordTones: [0, 3, 7, 10],
        goodExtensions: [2],       // 9
        avoidNotes: [8],           // b6 — avoid in bright contexts
        description: 'Preferito nel rock e nel pop. La b6 crea più oscurità rispetto al Dorico.',
        extensionLabel: 'Estensioni: 9, 11 (evita b13)',
      },
    ],
  },

  {
    quality: '7',
    label: 'Dominante 7ª',
    chordTones: [0, 4, 7, 10],
    primary: {
      name: SCALES.lydianDom.name,
      intervals: SCALES.lydianDom.intervals,
      chordTones: [0, 4, 7, 10],
      goodExtensions: [2, 6, 9],   // 9, #11, 13
      avoidNotes: [],
      description: 'Il Lidio Dominante combina il sound dominante (b7) con il ♯11 lidiante: tensione sofisticata, tipica del jazz moderno e fusion.',
      extensionLabel: 'Estensioni fisse: 9, ♯11, 13',
      trickSemitones: 7,           // Lydian Dom = Melodic Minor from 5th
      trickScaleName: 'Minore Melodica',
      trickInterval: '5a sopra',
    },
    alternatives: [
      {
        name: SCALES.mixolydian.name,
        intervals: SCALES.mixolydian.intervals,
        chordTones: [0, 4, 7, 10],
        goodExtensions: [2, 9],    // 9, 13
        avoidNotes: [5],           // 11 (P4) — avoid for dominant
        description: 'Il Misolidio è la scelta più diretta sul V7. Suono funzionale e riconoscibile.',
        extensionLabel: 'Estensioni: 9, 13 (evita 11)',
        trickSemitones: 5,
        trickScaleName: 'Maggiore',
        trickInterval: '4a sopra (= tonica)',
      },
    ],
  },

  {
    quality: '7alt',
    label: 'Dominante Alt.',
    chordTones: [0, 4, 10],       // root, 3rd, b7 (5th is altered)
    primary: {
      name: SCALES.altered.name,
      intervals: SCALES.altered.intervals,
      chordTones: [0, 4, 10],
      goodExtensions: [1, 3, 6, 8], // b9, #9, #11, b13
      avoidNotes: [],
      description: 'Tutte le estensioni sono alterate (b9, ♯9, ♯11, b13). Massima tensione — risolve perfettamente su im7 o Imaj7. È il 7° modo della Minore Melodica.',
      extensionLabel: 'Estensioni mobili: b9/♯9, ♯11, b13',
      trickSemitones: 1,           // Altered = Melodic Minor from b2
      trickScaleName: 'Minore Melodica',
      trickInterval: 'b2 sopra',
    },
    alternatives: [
      {
        name: SCALES.hwDim.name,
        intervals: SCALES.hwDim.intervals,
        chordTones: [0, 4, 10],
        goodExtensions: [1, 3, 6, 9],
        avoidNotes: [],
        description: 'La scala Semitono-Tono fornisce b9, ♯9, ♯11 e include sia la quinta giusta che la b13. Alternativa simmetrica all\'Alterata.',
        extensionLabel: 'Estensioni: b9, ♯9, ♯11, 13',
      },
    ],
  },

  {
    quality: 'm7b5',
    label: 'Min. 7♭5 (ø)',
    chordTones: [0, 3, 6, 10],
    primary: {
      name: SCALES.locrianSharp2.name,
      intervals: SCALES.locrianSharp2.intervals,
      chordTones: [0, 3, 6, 10],
      goodExtensions: [2, 5],      // 9 (natural), 11
      avoidNotes: [],
      description: 'Il Locrio ♯2 aggiunge la nona naturale (invece della b9 del Locrio). Suono più morbido e jazzistico — è il 6° modo della Minore Melodica.',
      extensionLabel: 'Estensioni: 9 (naturale), 11',
      trickSemitones: 3,           // Locrian #2 = Melodic Minor from b3
      trickScaleName: 'Minore Melodica',
      trickInterval: 'b3 sopra',
    },
    alternatives: [
      {
        name: SCALES.locrian.name,
        intervals: SCALES.locrian.intervals,
        chordTones: [0, 3, 6, 10],
        goodExtensions: [5],
        avoidNotes: [1],           // b9 — more dissonant
        description: 'Il Locrio classico include la b9. Suono più aspro e dissonante, adatto a contesti molto tesi.',
        extensionLabel: 'Estensioni: 11 (b9 è tesa)',
      },
    ],
  },

  {
    quality: 'dim7',
    label: 'Diminuito 7ª',
    chordTones: [0, 3, 6, 9],
    primary: {
      name: SCALES.hwDim.name,
      intervals: SCALES.hwDim.intervals,
      chordTones: [0, 3, 6, 9],
      goodExtensions: [1, 4, 7, 10], // b9, #9, natural 7, b7
      avoidNotes: [],
      description: 'La scala diminuita Semitono-Tono contiene tutti i suoni del accordo dim7 + estensioni simmetriche. È una scala simmetrica (ripete ogni b3).',
      extensionLabel: 'Estensioni: b9, ♯9, ♮7, b7 (simmetriche)',
    },
    alternatives: [
      {
        name: SCALES.whDim.name,
        intervals: SCALES.whDim.intervals,
        chordTones: [0, 3, 6, 9],
        goodExtensions: [2, 5, 8, 11],
        avoidNotes: [],
        description: 'La scala diminuita Tono-Semitono (Whole-Half) include i chord tones + 9, 11, b13, maj7. Più aperta della HW, usata spesso per passaggi.',
        extensionLabel: 'Estensioni: 9, 11, b13, maj7',
      },
    ],
  },

  {
    quality: 'mMaj7',
    label: 'Min. Maj7',
    chordTones: [0, 3, 7, 11],
    primary: {
      name: SCALES.melodicMinor.name,
      intervals: SCALES.melodicMinor.intervals,
      chordTones: [0, 3, 7, 11],
      goodExtensions: [2, 9],      // 9, 13
      avoidNotes: [],
      description: 'La Minore Melodica (jazz ascending) è la scala naturale del accordo mMaj7. Suono cinematico, tipico di Ennio Morricone, Wayne Shorter, e Jacob Collier.',
      extensionLabel: 'Estensioni fisse: 9, 11, 13',
      trickSemitones: 0,
      trickScaleName: 'Minore Melodica',
      trickInterval: 'stessa radice',
    },
    alternatives: [
      {
        name: SCALES.harmonicMinor.name,
        intervals: SCALES.harmonicMinor.intervals,
        chordTones: [0, 3, 7, 11],
        goodExtensions: [2],
        avoidNotes: [8],           // b6 — creates half-step tension
        description: 'La Minore Armonica include la b6 che crea un sapore più drammatico e classico. Associata al Fiammento e alla musica classica.',
        extensionLabel: 'Estensioni: 9, 11 (b13 è coloristica)',
      },
    ],
  },
];

// ─── Note Parsing ───────────────────────────────────────────────────────────

const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Map Tonal chord type strings to the app's internal quality keys.
 * Falls back to dominant ('7') for unrecognised types.
 */
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

/**
 * Parse a chord symbol using Tonal's Chord.get(), then map to the app's
 * internal { root, quality } representation.
 *
 * Special case: symbols containing "alt" (e.g. "G7alt", "Bbalt") are
 * handled before Tonal lookup because Tonal may not recognise them.
 */
function parseChordSymbol(symbol: string): { root: string; quality: string; displaySymbol: string } | null {
  const trimmed = symbol.trim();
  if (!trimmed) return null;

  // Handle "alt" dominant before Tonal (e.g. G7alt, Bbalt)
  const altMatch = trimmed.match(/^([A-G][#b]?)(?:7)?alt$/i);
  if (altMatch) {
    const root = altMatch[1];
    return { root, quality: '7alt', displaySymbol: `${root}7alt` };
  }

  const chord = Chord.get(trimmed);
  if (chord.empty || !chord.tonic) return null;

  const root = Note.simplify(chord.tonic) || chord.tonic;
  const quality = toAppQuality(chord.type);

  // Use Tonal's canonical symbol when available, otherwise reconstruct
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
  if (semitone === 0) return '#f59e0b';         // root → gold
  if (chordTones.includes(semitone)) return '#a78bfa'; // chord tone → purple
  if (avoidNotes.includes(semitone)) return '#ef4444'; // avoid → red
  if (goodExtensions.includes(semitone)) return '#06b6d4'; // good ext → cyan
  return '#6b7280';                              // passing → grey
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
              PRIMARIA
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
          ({scale.trickInterval}) — trick per memorizzare la scala
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
  if (!entry) return <div style={{ color: '#6b7280', fontSize: 13 }}>Qualità accordo non riconosciuta.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
        {[
          { color: '#f59e0b', label: 'Radice' },
          { color: '#a78bfa', label: 'Note accordo' },
          { color: '#06b6d4', label: 'Estensioni buone' },
          { color: '#ef4444', label: 'Da evitare' },
          { color: '#6b7280', label: 'Passaggio' },
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
      {/* Chord header */}
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

      {/* Scale notes compact */}
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

      {/* Extension label */}
      <div style={{ fontSize: 10, color: '#06b6d4', marginBottom: 8 }}>
        {primary.extensionLabel}
      </div>

      {/* Trick */}
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

  // Single chord
  const [root, setRoot] = useState('C');
  const [quality, setQuality] = useState('maj7');

  // Progression
  const [progressionText, setProgressionText] = useState('Dm7 G7 Cmaj7');
  const [parsedChords, setParsedChords] = useState<Array<{ root: string; quality: string; symbol: string }>>([]);
  const [parseError, setParseError] = useState('');

  function handleAnalyze() {
    const chords = parseProgression(progressionText);
    if (chords.length === 0) {
      setParseError('Nessun accordo riconosciuto. Prova: Dm7 G7 Cmaj7 o Cm7b5 F7alt Bbmaj7');
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
          Scopri quali scale usare su ogni accordo. Basato sulla teoria chord-scale del jazz moderno:
          ogni accordo e la sua scala condividono le stesse note — le estensioni determinano il colore armonico.
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
            {m === 'single' ? '🎵 Singolo Accordo' : '🎼 Progressione'}
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
                Nota Radice
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
                Tipo di Accordo
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
              Inserisci la progressione (es: Dm7 G7 Cmaj7 · Cm7b5 F7alt Bbmaj7)
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
                Analizza
              </button>
            </div>

            {/* Quick examples */}
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#4b5563' }}>Esempi:</span>
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
                  { color: '#f59e0b', label: 'Radice' },
                  { color: '#a78bfa', label: 'Note accordo' },
                  { color: '#06b6d4', label: 'Estensioni buone' },
                  { color: '#ef4444', label: 'Da evitare' },
                  { color: '#6b7280', label: 'Passaggio' },
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

              {/* Detailed breakdown toggle */}
              <details style={{
                background: '#161b22', border: '1px solid #30363d',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
                  🔍 Dettaglio completo per ogni accordo
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
          📖 Teoria Chord-Scale: come funziona
        </summary>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {[
            {
              title: 'Estensioni Fisse vs Mobili',
              text: 'Accordi con estensioni fisse (maj7, m7, 7 non alterato) hanno 9, 11, 13 predefinite dalla scala. Accordi con estensioni mobili (7alt) possono avere b9/♯9 e b13/♯11 intercambiabili.',
            },
            {
              title: 'Trucco Minore Melodica',
              text: 'La Minore Melodica è la "madre" di tante scale: suonala dalla 5a per il Lidio Dom. su V7, dalla b2 per l\'Alterata su 7alt, dalla b3 per il Locrio♯2 su m7b5.',
            },
            {
              title: 'Guide Tones',
              text: 'La terza e la settima di ogni accordo sono le "guide tones". Mantenerle vicine tra accordi adiacenti crea voice leading fluido — la base del jazz.',
            },
            {
              title: 'Dorico vs Eolio',
              text: 'Entrambi funzionano su m7. Il Dorico ha la sesta naturale (più luminoso, jazz/funk). L\'Eolio ha la b6 (più scuro, rock/pop). La scelta cambia il colore emotivo.',
            },
            {
              title: 'Note da Evitare',
              text: 'Le "avoid notes" non sono vietate — sono note da non tenere lunghe su una nota dell\'accordo. Usate di passaggio o in abbellimenti funzionano benissimo.',
            },
            {
              title: 'Scala Alterata',
              text: 'Su 7alt tutte le tensioni sono alterate: b9, ♯9, ♯11, b13. È il modo più tensivo e risolve benissimo un semitono sotto (es. G7alt → Fmaj7).',
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
