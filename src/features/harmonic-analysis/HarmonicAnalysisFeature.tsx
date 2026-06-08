import { useState, useRef } from 'react';
import { Chord, Key, Progression } from 'tonal';
import { audioPlayer } from '../ear-training/utils/audio-player';

// ─── Data Types ───────────────────────────────────────────────────────────────

type HarmonicFn = 'T' | 'SD' | 'D' | 'B' | '?';

interface AnalyzedChord {
  original: string;
  symbol: string;
  notes: string[];
  romanNumeral: string;
  fn: HarmonicFn;
  isDiatonic: boolean;
  chordScale: string;
  tension: number;
  empty: boolean;
}

interface KeyCandidate {
  root: string;
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
  secondaryDominantHint: string;
}

// ─── Key Detection ────────────────────────────────────────────────────────────

const ALL_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function detectKeys(chordSymbols: string[]): KeyCandidate[] {
  const results: KeyCandidate[] = [];
  const maxScore = chordSymbols.length * 3;

  for (const root of ALL_ROOTS) {
    // ── Major ──
    const maj = Key.majorKey(root);
    const majChordSet = new Set([
      ...maj.chords,
      ...maj.triads,
      ...maj.secondaryDominants.filter(Boolean),
      ...maj.substituteDominants.filter(Boolean),
    ]);

    let majScore = 0;
    for (const sym of chordSymbols) {
      const c = Chord.get(sym);
      if (c.empty) continue;
      if (majChordSet.has(c.symbol) || majChordSet.has(sym)) majScore += 3;
      else if (c.tonic && maj.scale.includes(c.tonic)) majScore += 1;
    }
    results.push({
      root,
      rootName: root,
      mode: 'major',
      score: majScore,
      pct: maxScore ? Math.round((majScore / maxScore) * 100) : 0,
    });

    // ── Minor ──
    const min = Key.minorKey(root);
    const minChordSet = new Set([
      ...min.natural.chords,
      ...(min.natural.triads ?? []),
      ...min.harmonic.chords,
    ]);

    let minScore = 0;
    for (const sym of chordSymbols) {
      const c = Chord.get(sym);
      if (c.empty) continue;
      if (minChordSet.has(c.symbol) || minChordSet.has(sym)) minScore += 3;
      else if (c.tonic && min.natural.scale.includes(c.tonic)) minScore += 1;
    }
    results.push({
      root,
      rootName: root + 'm',
      mode: 'minor',
      score: minScore,
      pct: maxScore ? Math.round((minScore / maxScore) * 100) : 0,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ─── Chord Analysis ───────────────────────────────────────────────────────────

function analyzeChord(sym: string, key: KeyCandidate): AnalyzedChord {
  const chord = Chord.get(sym);

  // Get Roman numeral from Tonal
  const rnArr = Progression.toRomanNumerals(key.root, [sym]);
  const rn = rnArr[0] ?? sym;

  let fn: HarmonicFn = '?';
  let isDiatonic = false;
  let chordScale = '';

  if (key.mode === 'major') {
    const k = Key.majorKey(key.root);
    // Try matching on chord symbol or original input
    let idx = k.chords.indexOf(chord.empty ? sym : chord.symbol);
    if (idx < 0) idx = k.chords.indexOf(sym);
    if (idx < 0) {
      // Try triads
      const triadIdx = k.triads.indexOf(chord.empty ? sym : (chord.tonic ?? '') + (chord.aliases[0] ?? ''));
      if (triadIdx >= 0) {
        idx = triadIdx;
      }
    }
    if (idx >= 0) {
      const rawFn = k.chordsHarmonicFunction[idx];
      fn = (rawFn === 'T' || rawFn === 'SD' || rawFn === 'D') ? rawFn as HarmonicFn : '?';
      isDiatonic = true;
      chordScale = k.chordScales[idx] ?? '';
    } else {
      fn = 'B';
    }
  } else {
    const k = Key.minorKey(key.root);
    let idx = k.natural.chords.indexOf(chord.empty ? sym : chord.symbol);
    if (idx < 0) idx = k.natural.chords.indexOf(sym);
    if (idx >= 0) {
      const rawFn = k.natural.chordsHarmonicFunction[idx];
      fn = (rawFn === 'T' || rawFn === 'SD' || rawFn === 'D') ? rawFn as HarmonicFn : '?';
      isDiatonic = true;
    } else {
      // Try harmonic minor
      const hidx = k.harmonic.chords.indexOf(chord.empty ? sym : chord.symbol);
      if (hidx >= 0) {
        isDiatonic = true;
        fn = 'D'; // harmonic minor chords are typically dominant-function
      } else {
        fn = 'B';
      }
    }
  }

  const tension = fn === 'T' ? 1 : fn === 'SD' ? 2 : fn === 'D' ? 4 : 3;

  return {
    original: sym,
    symbol: chord.empty ? sym : chord.symbol,
    notes: chord.notes ?? [],
    romanNumeral: rn,
    fn,
    isDiatonic,
    chordScale,
    tension,
    empty: chord.empty,
  };
}

// ─── Pattern Detection ────────────────────────────────────────────────────────

function detectPatterns(
  chords: AnalyzedChord[],
  key: KeyCandidate,
): PatternMatch[] {
  const patterns: PatternMatch[] = [];

  // Precompute secondary dominants and tritone subs for the major key
  let secondaryDominantSet = new Set<string>();
  let tritoneSubSet = new Set<string>();
  if (key.mode === 'major') {
    const k = Key.majorKey(key.root);
    secondaryDominantSet = new Set(k.secondaryDominants.filter(Boolean));
    tritoneSubSet = new Set(k.substituteDominants.filter(Boolean));
  }

  for (let i = 0; i < chords.length - 2; i++) {
    if (
      chords[i].fn === 'SD' &&
      chords[i + 1].fn === 'D' &&
      chords[i + 2].fn === 'T'
    ) {
      patterns.push({
        label: 'ii–V–I',
        indices: [i, i + 1, i + 2],
        description: 'Classic jazz cadence: pre-dominant → dominant → tonic resolution',
      });
    }
  }

  for (let i = 0; i < chords.length - 1; i++) {
    // ii–V (unresolved)
    if (
      chords[i].fn === 'SD' &&
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
      chords[i].fn === 'SD' &&
      chords[i + 1].fn === 'T' &&
      (chords[i].romanNumeral.startsWith('IV') ||
        chords[i].romanNumeral.startsWith('iv'))
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
      chords[i].romanNumeral.toUpperCase().includes('V')
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
        description: `${chords[i].original} borrowed from parallel mode — adds modal colour`,
      });
    }

    // Secondary Dominant
    if (
      secondaryDominantSet.size > 0 &&
      (secondaryDominantSet.has(chords[i].symbol) ||
        secondaryDominantSet.has(chords[i].original))
    ) {
      patterns.push({
        label: 'Secondary Dominant',
        indices: [i],
        description: `${chords[i].original} acts as a secondary dominant — temporarily tonicises a non-tonic chord`,
      });
    }

    // Tritone Substitution
    if (
      tritoneSubSet.size > 0 &&
      (tritoneSubSet.has(chords[i].symbol) ||
        tritoneSubSet.has(chords[i].original))
    ) {
      patterns.push({
        label: 'Tritone Sub',
        indices: [i],
        description: `${chords[i].original} is a tritone substitution — replaces the dominant a tritone away`,
      });
    }
  }

  return patterns;
}

// ─── Secondary Dominant Hint ──────────────────────────────────────────────────

function getSecondaryDominantHint(key: KeyCandidate): string {
  if (key.mode !== 'major') return '';
  const k = Key.majorKey(key.root);
  const DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  for (let i = 0; i < k.secondaryDominants.length; i++) {
    const sd = k.secondaryDominants[i];
    if (sd) {
      return `Secondary dominant: ${sd} → ${DEGREES[i]}`;
    }
  }
  return '';
}

// ─── Main Analysis ────────────────────────────────────────────────────────────

function analyzeProgression(input: string): AnalysisResult | null {
  const symbols = input
    .split(/[\s,|]+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) return null;

  // Filter to only recognisable chords
  const validSymbols = symbols.filter(s => !Chord.get(s).empty);
  if (validSymbols.length === 0) return null;

  const keyRanking = detectKeys(validSymbols);
  const key = keyRanking[0];
  const analyzedChords = symbols.map(s => analyzeChord(s, key));
  const patterns = detectPatterns(analyzedChords, key);
  const secondaryDominantHint = getSecondaryDominantHint(key);

  return {
    key,
    alternateKeys: keyRanking.slice(1, 3),
    chords: analyzedChords,
    patterns,
    secondaryDominantHint,
  };
}

// ─── UI Constants ─────────────────────────────────────────────────────────────

const FN_COLORS: Record<HarmonicFn, { bg: string; text: string; label: string }> = {
  T:   { bg: '#10b98120', text: '#34d399', label: 'Tonic' },
  SD:  { bg: '#3b82f620', text: '#60a5fa', label: 'Pre-dom' },
  D:   { bg: '#ef444420', text: '#f87171', label: 'Dominant' },
  B:   { bg: '#7c3aed20', text: '#c4b5fd', label: 'Borrowed' },
  '?': { bg: '#6b728020', text: '#9ca3af', label: 'Unknown' },
};

const PATTERN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'ii–V–I':             { bg: '#10b98115', border: '#34d399', text: '#34d399' },
  'ii–V':               { bg: '#10b98115', border: '#34d39970', text: '#34d399' },
  'V–I':                { bg: '#f9731615', border: '#fb923c', text: '#fb923c' },
  'IV–I':               { bg: '#3b82f615', border: '#60a5fa', text: '#60a5fa' },
  'Deceptive':          { bg: '#eab30815', border: '#fbbf24', text: '#fbbf24' },
  'Borrowed':           { bg: '#7c3aed15', border: '#c4b5fd', text: '#c4b5fd' },
  'Secondary Dominant': { bg: '#f59e0b15', border: '#fbbf24', text: '#fbbf24' },
  'Tritone Sub':        { bg: '#ec489915', border: '#f472b6', text: '#f472b6' },
};

const EXAMPLES = [
  { label: 'Jazz ii–V–I', value: 'Dm7 G7 Cmaj7' },
  { label: 'Pop Canon',   value: 'C G Am F' },
  { label: 'Modal Jazz',  value: 'Dm7 Em7b5 A7 Dm' },
  { label: 'Borrowed VI', value: 'C Am F Fm C' },
  { label: 'Coltrane',   value: 'Cmaj7 Ebmaj7 Abmaj7 Bmaj7 Cmaj7' },
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

  const linePoints = pts.map(p => `${p.x},${p.y}`).join(' ');

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

        <path d={fillPath} fill="url(#tensionGrad)" />

        <polyline
          points={linePoints}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

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
            {chords[i].original.length > 6
              ? chords[i].original.slice(0, 6) + '…'
              : chords[i].original}
          </text>
        ))}

        {(['Low', '', 'Med', '', 'High'] as const).map((lbl, i) =>
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
          ) : null,
        )}
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
  const bgColor =
    chord.fn === 'B' ? '#1a1040' : isHighlighted ? '#1c2130' : '#161b22';

  const fnLabel =
    chord.fn === 'B'
      ? 'Borrowed'
      : chord.fn === '?'
      ? 'Unknown'
      : chord.fn === 'T'
      ? 'Tonic'
      : chord.fn === 'SD'
      ? 'Pre-dom'
      : 'Dominant';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={async () => {
        if (chord.notes.length > 0) {
          await audioPlayer.preloadAllNotes();
          audioPlayer.playChord(chord.notes.map(n => `${n}3`));
        }
      }}
      title="Click to play chord"
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
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: hovered ? `0 0 14px ${fnColor.text}30` : 'none',
      }}
    >
      {/* Chord name */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#e6edf3',
          fontFamily: 'monospace',
          letterSpacing: '-0.5px',
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {chord.original}
      </div>

      {/* Roman numeral */}
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: fnColor.text,
          fontFamily: 'Georgia, serif',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {chord.romanNumeral}
      </div>

      {/* Chord scale subtitle (NEW) */}
      {chord.chordScale && (
        <div
          style={{
            fontSize: 11,
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {chord.chordScale}
        </div>
      )}

      {/* Function badge */}
      <div
        style={{
          background: fnColor.bg,
          color: fnColor.text,
          fontSize: 10,
          fontWeight: 600,
          borderRadius: 6,
          padding: '2px 7px',
          marginTop: 2,
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap',
        }}
      >
        {fnLabel}
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
  const [playingAll, setPlayingAll] = useState(false);
  const stopAllRef = useRef(false);

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
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ♬
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
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
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
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
              onClick={() => {
                setInput(ex.value);
                setResult(null);
                setError('');
              }}
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
        <div
          style={{
            background: '#1c1a00',
            border: '1px solid #fbbf2440',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#fbbf24',
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Key Detection */}
          <div
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              Detected Key
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: '#e6edf3' }}>
                {result.key.rootName} {modeName(result.key.mode)}
              </div>
              <div
                style={{
                  background: '#7c3aed25',
                  border: '1px solid #7c3aed60',
                  borderRadius: 20,
                  padding: '4px 14px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#c4b5fd',
                }}
              >
                {result.key.pct}% match
              </div>
            </div>

            {/* Secondary dominant hint (NEW) */}
            {result.secondaryDominantHint && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                {result.secondaryDominantHint}
              </div>
            )}

            {/* Alternate keys */}
            <div
              style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}
            >
              <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                Alternates:
              </span>
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
                  <span style={{ color: '#6b7280', marginLeft: 5, fontSize: 11 }}>
                    {k.pct}%
                  </span>
                </div>
              ))}
            </div>

            {/* Function legend */}
            <div
              style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}
            >
              {(
                Object.entries(FN_COLORS) as [
                  HarmonicFn,
                  (typeof FN_COLORS)[HarmonicFn],
                ][]
              ).map(([fn, col]) => (
                <div key={fn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: col.text,
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chord Cards */}
          <div
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  flex: 1,
                }}
              >
                Chord Analysis
              </div>
              <button
                onClick={async () => {
                  if (playingAll) { stopAllRef.current = true; return; }
                  stopAllRef.current = false;
                  setPlayingAll(true);
                  await audioPlayer.preloadAllNotes();
                  for (const chord of result.chords) {
                    if (stopAllRef.current) break;
                    if (chord.notes.length > 0) {
                      await audioPlayer.playChord(chord.notes.map(n => `${n}3`));
                    }
                    await audioPlayer.delay(1100);
                  }
                  setPlayingAll(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px',
                  background: playingAll ? '#1a2e1a' : '#0d1117',
                  border: `1px solid ${playingAll ? '#22c55e60' : '#30363d'}`,
                  borderRadius: 7, cursor: 'pointer',
                  fontSize: 11, fontWeight: 600,
                  color: playingAll ? '#86efac' : '#6b7280',
                  transition: 'all 0.2s',
                }}
              >
                {playingAll ? '⏹ Stop' : '▶ Play all'}
              </button>
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
          <div
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              Tension Arc
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
              How harmonic tension rises and falls across the progression
            </div>
            <TensionArc chords={result.chords} />
          </div>

          {/* Patterns */}
          {result.patterns.length > 0 && (
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 16,
                }}
              >
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
                      <div
                        style={{
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
                        }}
                      >
                        {pat.label}
                      </div>
                      <div>
                        <div
                          style={{ fontSize: 13, color: '#e6edf3', marginBottom: 3 }}
                        >
                          {pat.description}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          Chords{' '}
                          {pat.indices
                            .map(idx => result.chords[idx].original)
                            .join(' → ')}
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
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 14,
                padding: 24,
                color: '#6b7280',
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              No common harmonic patterns detected in this progression.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
