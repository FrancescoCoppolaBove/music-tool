import { useState } from 'react';

// ─── Data Types ───────────────────────────────────────────────────────────────

type ChordQuality =
  | 'maj' | 'min' | 'dom7' | 'maj7' | 'm7' | 'hdim'
  | 'dim7' | 'dim' | 'aug' | 'mMaj7' | 'sus4' | 'sus2';

type HarmonicFn = 'T' | 'S' | 'D' | 'B' | '?';

interface ParsedChord {
  root: number;
  rootStr: string;
  quality: ChordQuality;
  bassNote?: number;
  original: string;
}

interface AnalyzedChord extends ParsedChord {
  romanNumeral: string;
  fn: HarmonicFn;
  isDiatonic: boolean;
  borrowedFrom?: string;
  tension: number;
}

interface KeyCandidate {
  root: number;
  rootName: string;
  mode: 'major' | 'minor';
  score: number;
  pct: number;
}

interface PatternMatch {
  label: string;
  indices: number[];
  description: string;
}

interface AnalysisResult {
  key: KeyCandidate;
  alternateKeys: KeyCandidate[];
  chords: AnalyzedChord[];
  patterns: PatternMatch[];
}

// ─── Music Theory Constants ───────────────────────────────────────────────────

const NOTE_TO_SEMI: Record<string, number> = {
  'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4, 'F': 5, 'E#': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11,
};

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_KEY_ROOTS = new Set([5, 10, 3, 8, 1, 6]);

function noteLabel(semi: number, keyRoot: number): string {
  return FLAT_KEY_ROOTS.has(keyRoot) ? FLAT_NAMES[semi] : SHARP_NAMES[semi];
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_DEGREE_QUAL = ['M', 'm', 'm', 'M', 'd', 'm', 'h'] as const;
const MAJOR_NUMERALS    = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MAJOR_FUNCTIONS: HarmonicFn[] = ['T', 'S', 'T', 'S', 'D', 'T', 'D'];

const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
const MINOR_DEGREE_QUAL = ['m', 'h', 'M', 'm', 'm', 'M', 'M'] as const;
const MINOR_NUMERALS    = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
const MINOR_FUNCTIONS: HarmonicFn[] = ['T', 'D', 'T', 'S', 'D', 'S', 'D'];

// ─── Chord Parser ─────────────────────────────────────────────────────────────

function parseQuality(q: string): ChordQuality {
  q = q.trim();
  if (/^(mMaj7|mM7|m\(maj7\)|minMaj7|-M7)/i.test(q)) return 'mMaj7';
  if (/^(m7b5|m7♭5|ø7?|-7b5)/i.test(q))              return 'hdim';
  if (/^(dim7|°7|o7)/i.test(q))                        return 'dim7';
  if (/^(dim|°|o)(?!9)/i.test(q))                      return 'dim';
  if (/^(aug|\+)(?!\d)/i.test(q))                      return 'aug';
  if (/^(maj7|Maj7|M7|Δ7?|△7?|maj9|Maj9)/i.test(q))  return 'maj7';
  if (/^(m7|min7|-7|m9|m11|m13)/i.test(q))            return 'm7';
  if (/^(sus2)/i.test(q))                              return 'sus2';
  if (/^(sus4|sus)/i.test(q))                          return 'sus4';
  if (/^(m|min|-)(?!a)/i.test(q))                      return 'min';
  if (/^(7|9|11|13|alt|dom)/i.test(q))                 return 'dom7';
  if (/^(maj|Maj|M)(?!7)/i.test(q) || q === '')        return 'maj';
  if (/^(add|6|2)/i.test(q))                           return 'maj';
  return 'maj';
}

function parseChord(sym: string): ParsedChord | null {
  sym = sym.trim().replace(/[()]/g, '');
  if (!sym) return null;
  const rootMatch = sym.match(/^([A-G][#b]?)/);
  if (!rootMatch) return null;
  const rootStr = rootMatch[1];
  const root = NOTE_TO_SEMI[rootStr];
  if (root === undefined) return null;
  let rest = sym.slice(rootStr.length);
  let bassNote: number | undefined;
  const slashIdx = rest.lastIndexOf('/');
  if (slashIdx !== -1) {
    const bassStr = rest.slice(slashIdx + 1);
    bassNote = NOTE_TO_SEMI[bassStr];
    rest = rest.slice(0, slashIdx);
  }
  return { root, rootStr, quality: parseQuality(rest), bassNote, original: sym };
}

function parseProgression(input: string): ParsedChord[] {
  return input
    .split(/[\s,|]+/)
    .filter(Boolean)
    .map(parseChord)
    .filter((c): c is ParsedChord => c !== null);
}

// ─── Key Detection ────────────────────────────────────────────────────────────

function qualFamily(q: ChordQuality): string {
  if (q === 'maj' || q === 'maj7') return 'M';
  if (q === 'min' || q === 'm7' || q === 'mMaj7') return 'm';
  if (q === 'dom7') return 'd';
  if (q === 'hdim') return 'h';
  if (q === 'dim' || q === 'dim7') return 'dim';
  return 'x';
}

function scoreChordInKey(chord: ParsedChord, keyRoot: number, mode: 'major' | 'minor'): number {
  const intervals = mode === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
  const degreeQuals = mode === 'major' ? MAJOR_DEGREE_QUAL : MINOR_DEGREE_QUAL;
  const interval = (chord.root - keyRoot + 12) % 12;
  const degreeIdx = intervals.indexOf(interval);
  if (degreeIdx === -1) return 0;
  const expectedFam = degreeQuals[degreeIdx];
  const actualFam = qualFamily(chord.quality);
  if (actualFam === expectedFam) return 3;
  if (expectedFam === 'd' && (actualFam === 'M' || actualFam === 'm')) return 1;
  if (mode === 'minor' && degreeIdx === 4 && actualFam === 'd') return 3;
  if (expectedFam === 'h' && actualFam === 'm') return 1;
  return 0;
}

function detectKeys(chords: ParsedChord[]): KeyCandidate[] {
  const results: KeyCandidate[] = [];
  const maxPossible = chords.length * 3;
  for (let root = 0; root < 12; root++) {
    for (const mode of ['major', 'minor'] as const) {
      const score = chords.reduce((s, c) => s + scoreChordInKey(c, root, mode), 0);
      results.push({
        root,
        rootName: FLAT_KEY_ROOTS.has(root) ? FLAT_NAMES[root] : SHARP_NAMES[root],
        mode,
        score,
        pct: maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0,
      });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

// ─── Chord Analysis ───────────────────────────────────────────────────────────

function analyzeChord(chord: ParsedChord, key: KeyCandidate): AnalyzedChord {
  const intervals   = key.mode === 'major' ? MAJOR_INTERVALS   : MINOR_INTERVALS;
  const degreeQuals = key.mode === 'major' ? MAJOR_DEGREE_QUAL : MINOR_DEGREE_QUAL;
  const numerals    = key.mode === 'major' ? MAJOR_NUMERALS    : MINOR_NUMERALS;
  const functions   = key.mode === 'major' ? MAJOR_FUNCTIONS   : MINOR_FUNCTIONS;

  const interval = (chord.root - key.root + 12) % 12;
  const degIdx   = intervals.indexOf(interval);

  if (degIdx !== -1) {
    const expFam = degreeQuals[degIdx];
    const actFam = qualFamily(chord.quality);
    const isDiatonic =
      actFam === expFam ||
      (expFam === 'd' && (actFam === 'M' || actFam === 'm')) ||
      (key.mode === 'minor' && degIdx === 4 && actFam === 'd') ||
      (expFam === 'h' && actFam === 'm');

    let numeral = numerals[degIdx];
    const fn = functions[degIdx];
    let tension: number;
    if (fn === 'T') tension = 1;
    else if (fn === 'S') tension = 2;
    else if (fn === 'D') tension = 4;
    else tension = 3;

    if (chord.quality === 'maj7' && !numeral.includes('vii')) numeral += 'maj7';
    else if (chord.quality === 'm7' && !numeral.includes('°')) numeral += '7';
    else if (chord.quality === 'dom7') numeral = numeral.replace('v', 'V') + '7';
    else if (chord.quality === 'dim7') numeral += '7';
    else if (chord.quality === 'mMaj7') numeral += '(maj7)';

    return { ...chord, romanNumeral: numeral, fn, isDiatonic, tension };
  }

  // Borrowed chord detection
  const borrowedNumerals: Record<number, { numeral: string; fn: HarmonicFn; from: string; tension: number }> = {};
  if (key.mode === 'major') {
    for (let di = 0; di < 7; di++) {
      const semiFromKey = (MINOR_INTERVALS[di] + key.root) % 12;
      if (semiFromKey === chord.root) {
        borrowedNumerals[di] = {
          numeral: MINOR_NUMERALS[di],
          fn: 'B',
          from: `${key.rootName} minor`,
          tension: 3,
        };
      }
    }
  }

  if (Object.keys(borrowedNumerals).length > 0) {
    const borrowed = Object.values(borrowedNumerals)[0];
    return {
      ...chord,
      romanNumeral: borrowed.numeral,
      fn: 'B',
      isDiatonic: false,
      borrowedFrom: borrowed.from,
      tension: 3,
    };
  }

  const intervalNames = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII'];
  return {
    ...chord,
    romanNumeral: intervalNames[interval],
    fn: '?',
    isDiatonic: false,
    tension: 3,
  };
}

// ─── Pattern Detection ────────────────────────────────────────────────────────

function detectPatterns(chords: AnalyzedChord[], _key: KeyCandidate): PatternMatch[] {
  const patterns: PatternMatch[] = [];

  for (let i = 0; i < chords.length - 2; i++) {
    if (chords[i].fn === 'S' && chords[i + 1].fn === 'D' && chords[i + 2].fn === 'T') {
      patterns.push({
        label: 'ii–V–I',
        indices: [i, i + 1, i + 2],
        description: 'Classic jazz cadence: pre-dominant → dominant → tonic resolution',
      });
    }
  }

  for (let i = 0; i < chords.length - 1; i++) {
    // ii-V (unresolved)
    if (
      chords[i].fn === 'S' &&
      chords[i + 1].fn === 'D' &&
      (i + 2 >= chords.length || chords[i + 2].fn !== 'T')
    ) {
      const alreadyCovered = patterns.some(
        p => p.label === 'ii–V–I' && p.indices.includes(i),
      );
      if (!alreadyCovered) {
        patterns.push({
          label: 'ii–V',
          indices: [i, i + 1],
          description: 'Unresolved ii–V — tension left hanging',
        });
      }
    }
    // V–I
    if (chords[i].fn === 'D' && chords[i + 1].fn === 'T') {
      const alreadyCovered = patterns.some(
        p => p.label === 'ii–V–I' && p.indices.includes(i),
      );
      if (!alreadyCovered) {
        patterns.push({
          label: 'V–I',
          indices: [i, i + 1],
          description: 'Authentic cadence — strong tonic arrival',
        });
      }
    }
    // IV–I (plagal)
    if (
      chords[i].fn === 'S' &&
      chords[i + 1].fn === 'T' &&
      chords[i].romanNumeral.startsWith('IV')
    ) {
      patterns.push({
        label: 'IV–I',
        indices: [i, i + 1],
        description: 'Plagal cadence — the "Amen" cadence, softer resolution',
      });
    }
    // Deceptive
    if (
      chords[i].fn === 'D' &&
      chords[i + 1].fn !== 'T' &&
      chords[i].romanNumeral.includes('V')
    ) {
      patterns.push({
        label: 'Deceptive',
        indices: [i, i + 1],
        description: 'Dominant resolves unexpectedly — avoids tonic',
      });
    }
    // Borrowed
    if (chords[i].fn === 'B') {
      patterns.push({
        label: 'Borrowed',
        indices: [i],
        description: `${chords[i].original} borrowed from ${chords[i].borrowedFrom ?? 'parallel mode'} — adds modal colour`,
      });
    }
  }
  return patterns;
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

function analyzeProgression(input: string): AnalysisResult | null {
  const chords = parseProgression(input);
  if (chords.length === 0) return null;
  const keyRanking = detectKeys(chords);
  const key = keyRanking[0];
  const analyzedChords = chords.map(c => analyzeChord(c, key));
  const patterns = detectPatterns(analyzedChords, key);
  return {
    key,
    alternateKeys: keyRanking.slice(1, 3),
    chords: analyzedChords,
    patterns,
  };
}

// ─── UI Constants ─────────────────────────────────────────────────────────────

const FN_COLORS: Record<HarmonicFn, { bg: string; text: string; label: string }> = {
  T:   { bg: '#10b98120', text: '#34d399', label: 'Tonic' },
  S:   { bg: '#3b82f620', text: '#60a5fa', label: 'Subdominant' },
  D:   { bg: '#ef444420', text: '#f87171', label: 'Dominant' },
  B:   { bg: '#7c3aed20', text: '#c4b5fd', label: 'Borrowed' },
  '?': { bg: '#6b728020', text: '#9ca3af', label: 'Unknown' },
};

const PATTERN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'ii–V–I':    { bg: '#10b98115', border: '#34d399', text: '#34d399' },
  'ii–V':      { bg: '#10b98115', border: '#34d39970', text: '#34d399' },
  'V–I':       { bg: '#f9731615', border: '#fb923c', text: '#fb923c' },
  'IV–I':      { bg: '#3b82f615', border: '#60a5fa', text: '#60a5fa' },
  'Deceptive': { bg: '#eab30815', border: '#fbbf24', text: '#fbbf24' },
  'Borrowed':  { bg: '#7c3aed15', border: '#c4b5fd', text: '#c4b5fd' },
};

const EXAMPLES = [
  { label: 'Jazz ii–V–I',  value: 'Dm7 G7 Cmaj7' },
  { label: 'Pop Canon',    value: 'C G Am F' },
  { label: 'Modal Jazz',   value: 'Dm7 Em7b5 A7 Dm' },
  { label: 'Borrowed VI',  value: 'C Am F Fm C' },
  { label: 'Coltrane',     value: 'Cmaj7 Ebmaj7 Abmaj7 Bmaj7 Cmaj7' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TensionArc({ chords }: { chords: AnalyzedChord[] }) {
  const W = 800;
  const H = 100;
  const PAD_X = 40;
  const PAD_Y = 14;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y * 2;

  const n = chords.length;
  if (n === 0) return null;

  const xOf = (i: number) =>
    n === 1 ? PAD_X + chartW / 2 : PAD_X + (i / (n - 1)) * chartW;

  const yOf = (tension: number) =>
    PAD_Y + chartH - ((tension - 1) / 4) * chartH;

  const pts = chords.map((c, i) => ({ x: xOf(i), y: yOf(c.tension), chord: c }));

  // Build smooth polyline points string
  const linePoints = pts.map(p => `${p.x},${p.y}`).join(' ');

  // Gradient fill area
  const fillPath = [
    `M ${pts[0].x},${H - PAD_Y}`,
    ...pts.map(p => `L ${p.x},${p.y}`),
    `L ${pts[pts.length - 1].x},${H - PAD_Y}`,
    'Z',
  ].join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', minWidth: 320, height: H, display: 'block' }}
        aria-label="Tension arc"
      >
        <defs>
          <linearGradient id="tensionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Subtle grid lines */}
        {[1, 2, 3, 4, 5].map(t => (
          <line
            key={t}
            x1={PAD_X}
            y1={yOf(t)}
            x2={W - PAD_X}
            y2={yOf(t)}
            stroke="#30363d"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Fill area */}
        <path d={fillPath} fill="url(#tensionGrad)" />

        {/* Line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill={FN_COLORS[p.chord.fn].text}
            stroke="#0d1117"
            strokeWidth="2"
          />
        ))}

        {/* Chord labels below */}
        {pts.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - 2}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7280"
            fontFamily="monospace"
          >
            {chords[i].original.length > 6 ? chords[i].original.slice(0, 6) + '…' : chords[i].original}
          </text>
        ))}

        {/* Y-axis labels */}
        {(['Low', '', 'Med', '', 'High'] as const).map((lbl, i) => (
          lbl ? (
            <text
              key={i}
              x={PAD_X - 4}
              y={yOf(i + 1) + 4}
              textAnchor="end"
              fontSize="8"
              fill="#6b7280"
            >
              {lbl}
            </text>
          ) : null
        ))}
      </svg>
    </div>
  );
}

function TensionDots({ tension }: { tension: number }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 6, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: i <= tension ? '#7c3aed' : '#30363d',
          }}
        />
      ))}
    </div>
  );
}

function ChordCard({
  chord,
  isHighlighted,
}: {
  chord: AnalyzedChord;
  isHighlighted: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const fnColor = FN_COLORS[chord.fn];
  const borderColor = hovered || isHighlighted ? fnColor.text : '#30363d';
  const bgColor = chord.fn === 'B'
    ? '#1a1040'
    : isHighlighted
    ? '#1c2130'
    : '#161b22';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bgColor,
        border: `1px ${chord.fn === 'B' ? 'dashed' : 'solid'} ${borderColor}`,
        borderRadius: 12,
        padding: '14px 16px',
        minWidth: 110,
        maxWidth: 130,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: 'default',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: hovered ? `0 0 14px ${fnColor.text}30` : 'none',
      }}
    >
      {/* Chord name */}
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color: '#e6edf3',
        fontFamily: 'monospace',
        letterSpacing: '-0.5px',
        textAlign: 'center',
        lineHeight: 1.1,
      }}>
        {chord.original}
      </div>

      {/* Roman numeral */}
      <div style={{
        fontSize: 17,
        fontWeight: 600,
        color: fnColor.text,
        fontFamily: 'Georgia, serif',
        marginTop: 4,
      }}>
        {chord.romanNumeral}
      </div>

      {/* Function badge */}
      <div style={{
        background: fnColor.bg,
        color: fnColor.text,
        fontSize: 10,
        fontWeight: 600,
        borderRadius: 6,
        padding: '2px 7px',
        marginTop: 2,
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
      }}>
        {chord.fn === 'B' ? 'Borrowed' : chord.fn === '?' ? 'Unknown' :
          chord.fn === 'T' ? 'Tonic' :
          chord.fn === 'S' ? 'Pre-dom' : 'Dominant'}
      </div>

      {/* Non-diatonic note */}
      {!chord.isDiatonic && chord.fn !== 'B' && (
        <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2, textAlign: 'center' }}>
          Non-diatonic
        </div>
      )}

      {/* Tension dots */}
      <TensionDots tension={chord.tension} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HarmonicAnalysisFeature() {
  const [input, setInput] = useState('Dm7 G7 Cmaj7 Am7');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);

  function handleAnalyse() {
    setError('');
    setHighlightIndices([]);
    if (!input.trim()) {
      setError('Enter at least 2 chords to analyse');
      setResult(null);
      return;
    }
    const r = analyzeProgression(input.trim());
    if (!r) {
      setError('No recognisable chords found. Try something like: Cmaj7 Am7 Dm7 G7');
      setResult(null);
      return;
    }
    if (r.chords.length < 2) {
      setResult(r);
      setError('Add more chords for pattern detection');
      return;
    }
    setResult(r);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.key === 'Enter') && (e.metaKey || e.ctrlKey)) {
      handleAnalyse();
    }
  }

  const modeName = (mode: 'major' | 'minor') =>
    mode === 'major' ? 'Major' : 'Minor';

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '32px 20px 64px',
        color: '#e6edf3',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}>
            ♬
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Harmonic Analysis
          </h1>
        </div>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>
          Detect key, Roman numerals, harmonic function, and common patterns in any chord progression.
        </p>
      </div>

      {/* ── Input Section ── */}
      <div
        style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 14,
          padding: 24,
          marginBottom: 28,
        }}
      >
        <label
          style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          Enter a chord progression
        </label>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={'Dm7 G7 Cmaj7\nC Am F G\nEbmaj7 Abmaj7 Db G7'}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 10,
            color: '#e6edf3',
            fontSize: 18,
            fontFamily: '"SF Mono", "Fira Code", monospace',
            padding: '12px 14px',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.6,
          }}
        />

        {/* Example chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              onClick={() => { setInput(ex.value); setResult(null); setError(''); }}
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 20,
                color: '#9ca3af',
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 12px',
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed';
                (e.currentTarget as HTMLButtonElement).style.color = '#c4b5fd';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d';
                (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Analyse button */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleAnalyse}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              padding: '10px 24px',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Analyse →
          </button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            or press {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
          </span>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: '#1c1a00',
          border: '1px solid #fbbf2440',
          borderRadius: 10,
          padding: '12px 16px',
          color: '#fbbf24',
          fontSize: 14,
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Key Detection */}
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 14,
            padding: 24,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Detected Key
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#e6edf3' }}>
                {result.key.rootName} {modeName(result.key.mode)}
              </div>
              <div style={{
                background: '#7c3aed25',
                border: '1px solid #7c3aed60',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 14,
                fontWeight: 600,
                color: '#c4b5fd',
              }}>
                {result.key.pct}% match
              </div>
            </div>

            {/* Alternate keys */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>Alternates:</span>
              {result.alternateKeys.map((k, i) => (
                <div
                  key={i}
                  style={{
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: 20,
                    padding: '3px 12px',
                    fontSize: 13,
                    color: '#9ca3af',
                  }}
                >
                  {k.rootName} {modeName(k.mode)}
                  <span style={{ color: '#6b7280', marginLeft: 5, fontSize: 11 }}>{k.pct}%</span>
                </div>
              ))}
            </div>

            {/* Function legend */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {(Object.entries(FN_COLORS) as [HarmonicFn, typeof FN_COLORS[HarmonicFn]][]).map(([fn, col]) => (
                <div key={fn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.text }} />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chord Cards */}
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 14,
            padding: 24,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Chord Analysis
            </div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                paddingBottom: 8,
              }}
            >
              {result.chords.map((chord, i) => (
                <ChordCard
                  key={i}
                  chord={chord}
                  isHighlighted={highlightIndices.includes(i)}
                />
              ))}
            </div>
          </div>

          {/* Tension Arc */}
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 14,
            padding: 24,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Tension Arc
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
              How harmonic tension rises and falls across the progression
            </div>
            <TensionArc chords={result.chords} />
          </div>

          {/* Patterns */}
          {result.patterns.length > 0 && (
            <div style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 14,
              padding: 24,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Patterns Detected
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.patterns.map((pat, i) => {
                  const col = PATTERN_COLORS[pat.label] ?? {
                    bg: '#6b728015',
                    border: '#9ca3af',
                    text: '#9ca3af',
                  };
                  return (
                    <div
                      key={i}
                      style={{
                        background: col.bg,
                        border: `1px solid ${col.border}40`,
                        borderLeft: `3px solid ${col.border}`,
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={() => setHighlightIndices(pat.indices)}
                      onMouseLeave={() => setHighlightIndices([])}
                    >
                      <div style={{
                        background: col.border + '25',
                        color: col.text,
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 6,
                        padding: '3px 10px',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.05em',
                        flexShrink: 0,
                        border: `1px solid ${col.border}50`,
                      }}>
                        {pat.label}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#e6edf3', marginBottom: 3 }}>
                          {pat.description}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          Chords {pat.indices.map(idx => result.chords[idx].original).join(' → ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: '#6b7280' }}>
                Hover a pattern to highlight the chords above
              </div>
            </div>
          )}

          {result.patterns.length === 0 && result.chords.length >= 2 && (
            <div style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 14,
              padding: 24,
              color: '#6b7280',
              fontSize: 14,
              textAlign: 'center',
            }}>
              No common harmonic patterns detected in this progression.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
