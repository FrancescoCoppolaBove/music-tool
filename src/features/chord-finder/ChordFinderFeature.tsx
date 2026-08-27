import { useState, useMemo } from 'react';
import { Note } from 'tonal';

// ─── Chord type definitions ───────────────────────────────────────────────────

interface ChordType {
  suffix: string;
  label: string;
  intervals: number[];  // chord tones, mod 12 from root
  tensions: number[];   // available tensions, mod 12 from root
}

const CHORD_TYPES: ChordType[] = [
  { suffix: 'maj7',    label: 'maj7',    intervals: [0,4,7,11],       tensions: [2,6,9] },
  { suffix: '6',       label: '6',       intervals: [0,4,7,9],        tensions: [2,6,11] },
  { suffix: '6/9',     label: '6/9',     intervals: [0,2,4,7,9],      tensions: [6,11] },
  { suffix: 'maj7#11', label: 'maj7#11', intervals: [0,4,6,7,11],     tensions: [2,9] },
  { suffix: 'maj9',    label: 'maj9',    intervals: [0,2,4,7,11],     tensions: [6,9] },
  { suffix: 'm7',      label: 'm7',      intervals: [0,3,7,10],       tensions: [2,5,9] },
  { suffix: 'm9',      label: 'm9',      intervals: [0,2,3,7,10],     tensions: [5,9] },
  { suffix: 'm11',     label: 'm11',     intervals: [0,2,3,5,7,10],   tensions: [9] },
  { suffix: 'm6',      label: 'm6',      intervals: [0,3,7,9],        tensions: [2,5,10,11] },
  { suffix: 'mMaj7',   label: 'mMaj7',  intervals: [0,3,7,11],       tensions: [2,5,9] },
  { suffix: '7',       label: '7',       intervals: [0,4,7,10],       tensions: [2,5,9,1,3,6,8] },
  { suffix: '9',       label: '9',       intervals: [0,2,4,7,10],     tensions: [6,9] },
  { suffix: '13',      label: '13',      intervals: [0,2,4,7,9,10],   tensions: [6] },
  { suffix: '7sus4',   label: '7sus4',   intervals: [0,5,7,10],       tensions: [2,9] },
  { suffix: '7alt',    label: '7alt',    intervals: [0,4,10],         tensions: [1,3,6,8] },
  { suffix: 'm7b5',    label: 'm7b5',    intervals: [0,3,6,10],       tensions: [2,8] },
  { suffix: 'dim7',    label: '°7',      intervals: [0,3,6,9],        tensions: [] },
  { suffix: 'aug',     label: 'aug',     intervals: [0,4,8],          tensions: [2,10] },
  { suffix: 'sus2',    label: 'sus2',    intervals: [0,2,7],          tensions: [9,10] },
  { suffix: 'sus4',    label: 'sus4',    intervals: [0,5,7],          tensions: [2,9,10] },
];

// ─── Interval label mapping ───────────────────────────────────────────────────

const INTERVAL_LABEL: Record<number, string> = {
  0: 'R', 1: 'b9', 2: '9', 3: 'b3', 4: '3',
  5: '11', 6: '#11', 7: '5', 8: 'b13', 9: '13', 10: 'b7', 11: '7',
};

// Label to display when note is a chord tone (for grouping single-note results)
const CHORD_TONE_GROUP: Record<number, string> = {
  0: 'Root',
  3: 'Minor 3rd (b3)',
  4: 'Major 3rd (3)',
  5: '11th / sus4',
  6: 'Tritone (#11 / b5)',
  7: '5th',
  8: 'Aug 5th / b13',
  9: '6th / 13th',
  10: 'Minor 7th (b7)',
  11: 'Major 7th (7)',
};

const TENSION_GROUP: Record<number, string> = {
  1: 'b9 (tension)',
  2: '9 (tension)',
  3: '#9 (tension)',
  5: '11 (tension)',
  6: '#11 (tension)',
  8: 'b13 (tension)',
  9: '13 (tension)',
};

// ─── Note names ───────────────────────────────────────────────────────────────

const CHROMA_TO_NOTE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ALL_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ─── Core algorithm ───────────────────────────────────────────────────────────

interface NoteRole {
  note: string;
  role: string;
  isChordTone: boolean;
}

interface FitResult {
  root: string;
  suffix: string;
  symbol: string;
  roles: NoteRole[];
  score: number;
  // for single-note grouping
  offsetFromRoot: number;
}

function findFittingChords(inputNotes: string[]): FitResult[] {
  const inputChromas = inputNotes
    .map(n => Note.chroma(n))
    .filter((c): c is number => c !== undefined);

  if (inputChromas.length === 0) return [];

  const results: FitResult[] = [];

  for (let rootChroma = 0; rootChroma < 12; rootChroma++) {
    const root = CHROMA_TO_NOTE[rootChroma];

    for (const ct of CHORD_TYPES) {
      const roles: NoteRole[] = [];
      let allFit = true;
      let score = 0;
      let firstOffset = 0;

      for (let i = 0; i < inputChromas.length; i++) {
        const offset = (inputChromas[i] - rootChroma + 12) % 12;
        if (i === 0) firstOffset = offset;

        if (ct.intervals.includes(offset)) {
          roles.push({ note: inputNotes[i], role: INTERVAL_LABEL[offset] ?? `${offset}`, isChordTone: true });
          score += 3;
        } else if (ct.tensions.includes(offset)) {
          roles.push({ note: inputNotes[i], role: INTERVAL_LABEL[offset] ?? `T${offset}`, isChordTone: false });
          score += 1;
        } else {
          allFit = false;
          break;
        }
      }

      if (allFit) {
        results.push({ root, suffix: ct.suffix, symbol: `${root}${ct.suffix}`, roles, score, offsetFromRoot: firstOffset });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ─── Component ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  'R': '#f97316', '3': '#6366f1', 'b3': '#8b5cf6', '5': '#10b981',
  '7': '#ef4444', 'b7': '#f59e0b', '9': '#3b82f6', 'b9': '#e11d48',
  '#9': '#a855f7', '11': '#06b6d4', '#11': '#06b6d4', 'b13': '#84cc16',
  '13': '#eab308',
};

export default function ChordFinderFeature() {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grouped' | 'ranked'>('grouped');

  const toggleNote = (note: string) => {
    setSelectedNotes(prev =>
      prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
    );
  };

  const results = useMemo(() => findFittingChords(selectedNotes), [selectedNotes]);

  // Group by note function (only for single note; switch to ranked for multi)
  const isSingleNote = selectedNotes.length === 1;
  const effectiveMode = isSingleNote ? viewMode : 'ranked';

  // For grouped view: group by chord tone function of the first/only note
  const groupedResults = useMemo(() => {
    if (!isSingleNote || effectiveMode !== 'grouped') return null;
    const groups: Record<number, FitResult[]> = {};
    for (const r of results) {
      const offset = r.offsetFromRoot;
      // only group by chord tone function (offset is in CHORD_TONE_GROUP)
      if (CHORD_TONE_GROUP[offset] !== undefined) {
        if (!groups[offset]) groups[offset] = [];
        groups[offset].push(r);
      }
    }
    return groups;
  }, [results, isSingleNote, effectiveMode]);

  const tensionResults = useMemo(() => {
    if (!isSingleNote || effectiveMode !== 'grouped') return [];
    return results.filter(r => TENSION_GROUP[r.offsetFromRoot] !== undefined);
  }, [results, isSingleNote, effectiveMode]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e6edf3', fontWeight: 700 }}>
          🎯 Chord Finder
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
          Select one or more notes to find all chords that contain them — as chord tones (R, 3, 5, 7)
          or available tensions (9, 11, 13). Essential for harmonising a melody or finding rich chord options under a line.
        </p>
      </div>

      {/* Note selector */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Select notes
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_NOTES.map(n => {
            const active = selectedNotes.includes(n);
            const idx = selectedNotes.indexOf(n);
            return (
              <button key={n} onClick={() => toggleNote(n)} style={{
                padding: '8px 14px', borderRadius: 7, cursor: 'pointer', position: 'relative',
                border: `2px solid ${active ? '#7c3aed' : '#30363d'}`,
                background: active ? '#7c3aed30' : '#0d1117',
                color: active ? '#c4b5fd' : '#6b7280',
                fontSize: 14, fontWeight: active ? 700 : 400,
                fontFamily: 'monospace', transition: 'all 0.1s',
              }}>
                {n}
                {active && (
                  <span style={{
                    position: 'absolute', top: -7, right: -7,
                    background: '#7c3aed', color: '#fff',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700,
                  }}>{idx + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected notes + controls */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {selectedNotes.length > 0 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selectedNotes.map((n, i) => (
                <span key={i} style={{
                  padding: '3px 10px', borderRadius: 20,
                  background: '#7c3aed20', border: '1px solid #7c3aed',
                  fontSize: 13, color: '#c4b5fd', fontFamily: 'monospace', fontWeight: 700,
                }}>
                  {n}
                  <button onClick={() => toggleNote(n)} style={{
                    marginLeft: 6, background: 'none', border: 'none', color: '#7c3aed',
                    cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1,
                  }}>✕</button>
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#374151' }}>No notes selected</span>
          )}

          {selectedNotes.length > 0 && (
            <button onClick={() => setSelectedNotes([])} style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid #30363d',
              background: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer',
            }}>Clear all</button>
          )}

          {isSingleNote && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={() => setViewMode('grouped')} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: `1px solid ${viewMode === 'grouped' ? '#3b82f6' : '#30363d'}`,
                background: viewMode === 'grouped' ? '#3b82f620' : 'none',
                color: viewMode === 'grouped' ? '#93c5fd' : '#6b7280',
              }}>Group by function</button>
              <button onClick={() => setViewMode('ranked')} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: `1px solid ${viewMode === 'ranked' ? '#3b82f6' : '#30363d'}`,
                background: viewMode === 'ranked' ? '#3b82f620' : 'none',
                color: viewMode === 'ranked' ? '#93c5fd' : '#6b7280',
              }}>Ranked list</button>
            </div>
          )}
        </div>

        {selectedNotes.length > 1 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563' }}>
            Multi-note mode: showing chords where <strong style={{ color: '#6b7280' }}>all {selectedNotes.length} notes</strong> fit as chord tones or tensions.
          </div>
        )}
      </div>

      {/* Results */}
      {selectedNotes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#374151', fontSize: 14 }}>
          Select a note above to see fitting chords.
        </div>
      )}

      {selectedNotes.length > 0 && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#374151', fontSize: 14 }}>
          No common chords contain all these notes simultaneously. Try removing one note.
        </div>
      )}

      {/* Grouped view (single note) */}
      {selectedNotes.length > 0 && effectiveMode === 'grouped' && groupedResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.entries(CHORD_TONE_GROUP).map(([offsetStr, groupLabel]) => {
            const offset = Number(offsetStr);
            const group = groupedResults[offset];
            if (!group || group.length === 0) return null;
            return (
              <div key={offset} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  <span style={{ color: ROLE_COLORS[INTERVAL_LABEL[offset]] ?? '#6b7280' }}>
                    {selectedNotes[0]}
                  </span>
                  {' '}as <span style={{ color: '#8b949e' }}>{groupLabel}</span>
                  <span style={{ fontWeight: 400, color: '#374151', marginLeft: 8 }}>({group.length} chords)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.map((r, i) => (
                    <ChordPill key={i} result={r} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Tension section */}
          {tensionResults.length > 0 && (
            <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                <span style={{ color: '#6b7280' }}>{selectedNotes[0]}</span> as a tension (9, 11, 13…)
                <span style={{ fontWeight: 400, marginLeft: 8 }}>({tensionResults.length} chords)</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tensionResults.map((r, i) => (
                  <ChordPill key={i} result={r} muted />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranked view */}
      {selectedNotes.length > 0 && effectiveMode === 'ranked' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {results.length} fitting chords — sorted by chord tone quality
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map((r, i) => (
              <RankedRow key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Theory tip */}
      {selectedNotes.length > 0 && (
        <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>
          <strong style={{ color: '#6b7280' }}>Berklee rule:</strong> Chord tones (R, 3, 5, 7) give strong harmonic clarity — the melody note locks into the chord.
          Tensions (9, 11, 13) add colour without clashing. Avoid notes create a minor 9th against a chord tone — use briefly, resolve.{' '}
          <strong style={{ color: '#6b7280' }}>For melody harmonisation:</strong> prefer chords where the melody note is a 3rd or 7th (guide tones) — this gives the richest, most unambiguous sound.
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChordPill({ result, muted = false }: { result: FitResult; muted?: boolean }) {
  const role = result.roles[0];
  const roleColor = role ? (ROLE_COLORS[role.role] ?? '#6b7280') : '#6b7280';

  return (
    <div title={result.roles.map(r => `${r.note} = ${r.role}`).join(', ')} style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 10px', borderRadius: 8, cursor: 'default',
      background: muted ? '#0d1117' : '#1c2128',
      border: `1px solid ${muted ? '#21262d' : roleColor + '50'}`,
      minWidth: 60,
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: muted ? '#4b5563' : '#e6edf3' }}>
        {result.symbol}
      </span>
      <span style={{
        fontSize: 10, marginTop: 2, fontFamily: 'monospace',
        color: role?.isChordTone ? roleColor : '#4b5563',
        fontWeight: 600,
      }}>
        {role?.role}
      </span>
    </div>
  );
}

function RankedRow({ result }: { result: FitResult }) {
  const allChordTones = result.roles.every(r => r.isChordTone);
  const anyTension = result.roles.some(r => !r.isChordTone);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '7px 10px',
      borderRadius: 7, background: '#0d1117', border: '1px solid #21262d',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#e6edf3', minWidth: 80 }}>
        {result.symbol}
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
        {result.roles.map((r, i) => (
          <span key={i} style={{
            padding: '2px 7px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace',
            background: r.isChordTone ? `${ROLE_COLORS[r.role] ?? '#6b7280'}20` : '#1c2128',
            border: `1px solid ${r.isChordTone ? (ROLE_COLORS[r.role] ?? '#6b7280') + '60' : '#30363d'}`,
            color: r.isChordTone ? (ROLE_COLORS[r.role] ?? '#8b949e') : '#4b5563',
          }}>
            {r.note} = {r.role}
          </span>
        ))}
      </div>
      <span style={{
        fontSize: 10, color: allChordTones ? '#10b981' : anyTension ? '#f59e0b' : '#6b7280',
        flexShrink: 0,
      }}>
        {allChordTones ? '✓ all chord tones' : '~ tensions'}
      </span>
    </div>
  );
}
