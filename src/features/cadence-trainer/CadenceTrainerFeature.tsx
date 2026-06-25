import { useState, useEffect, useCallback, useMemo } from 'react';
import { Scale, Note } from 'tonal';
import { audioPlayer } from '../ear-training/utils/audio-player';
import { useExerciseScore } from '../../shared/hooks/useExerciseScore';

// ── Types ─────────────────────────────────────────────────────────────────────

type CadenceId = 'authentic' | 'plagal' | 'half' | 'deceptive';

interface CadenceDef {
  id: CadenceId;
  name: string;          // English name
  italian: string;       // Conservatory Italian term
  symbol: string;        // Roman-numeral shorthand
  degrees: number[];     // 0-based scale degrees of the phrase
  sevenths: boolean[];   // whether each chord gets a diatonic 7th
  color: string;
  endsUnresolved: boolean;
  short: string;
  theory: string;
  ear: string;           // what to listen for
}

// Phrases are 4 chords: a lead-in that establishes the key, then the
// defining final motion. Degrees are 0-based (0 = I … 6 = vii°).
const CADENCES: CadenceDef[] = [
  {
    id: 'authentic',
    name: 'Authentic Cadence',
    italian: 'Cadenza Autentica (Perfetta)',
    symbol: 'V → I',
    degrees: [0, 3, 4, 0],          // I – IV – V7 – I
    sevenths: [false, false, true, false],
    color: '#10b981',
    endsUnresolved: false,
    short: 'The strongest resolution — dominant falls home to tonic.',
    theory: 'The dominant (V), usually a dominant 7th, resolves to the tonic (I). When both chords are in root position and the soprano lands on the tonic, it is a Perfect Authentic Cadence — the conclusive full stop of tonal music.',
    ear: 'A clear sense of arrival and finality. The leading tone pulls up to the tonic; the bass leaps down a fifth (or up a fourth).',
  },
  {
    id: 'plagal',
    name: 'Plagal Cadence',
    italian: 'Cadenza Plagale',
    symbol: 'IV → I',
    degrees: [0, 5, 3, 0],          // I – vi – IV – I
    sevenths: [false, false, false, false],
    color: '#06b6d4',
    endsUnresolved: false,
    short: 'The "Amen" cadence — gentle, plagal, no dominant tension.',
    theory: 'The subdominant (IV) moves to the tonic (I) without any dominant. Famous as the "Amen" sung at the end of hymns. Softer and warmer than the authentic cadence because it lacks the leading-tone tension.',
    ear: 'A settled, churchy "Amen" feeling. No sharp leading-tone pull — the resolution is smooth and rounded.',
  },
  {
    id: 'half',
    name: 'Half Cadence',
    italian: 'Cadenza Sospesa (Semicadenza)',
    symbol: '… → V',
    degrees: [0, 3, 1, 4],          // I – IV – ii – V7
    sevenths: [false, false, false, true],
    color: '#f59e0b',
    endsUnresolved: true,
    short: 'Ends on the dominant — a comma, not a full stop.',
    theory: 'Any phrase that ends on the dominant (V) rather than resolving to the tonic. It leaves the ear suspended, expecting more — the musical equivalent of a question or a comma. Common at the midpoint of a period.',
    ear: 'Unfinished, hanging in the air. It stops on a chord that clearly wants to resolve but never does.',
  },
  {
    id: 'deceptive',
    name: 'Deceptive Cadence',
    italian: "Cadenza d'Inganno",
    symbol: 'V → vi',
    degrees: [0, 3, 4, 5],          // I – IV – V7 – vi
    sevenths: [false, false, true, false],
    color: '#ec4899',
    endsUnresolved: false,
    short: 'The dominant resolves to vi — a surprise instead of home.',
    theory: 'The dominant (V) sets up a resolution to the tonic but lands on the submediant (vi) instead — an "inganno" (deception). The expected I is replaced by its relative minor, prolonging the phrase and adding poignancy.',
    ear: 'A "trick" ending: it sounds like it will resolve to a bright major tonic, but slips to a softer minor chord instead.',
  },
];

const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTY: { id: Difficulty; label: string; ids: CadenceId[] }[] = [
  { id: 'easy',   label: 'Easy — 2 cadences',   ids: ['authentic', 'plagal'] },
  { id: 'medium', label: 'Medium — 3 cadences', ids: ['authentic', 'plagal', 'half'] },
  { id: 'hard',   label: 'Hard — all 4',        ids: ['authentic', 'plagal', 'half', 'deceptive'] },
];

// ── Chord voicing ─────────────────────────────────────────────────────────────

/** Stack note names into an ascending voicing starting around `startOctave`. */
function voiceChord(pitchClasses: string[], startOctave = 3): string[] {
  const out: string[] = [];
  let prevMidi = -Infinity;
  let octave = startOctave;
  for (const pc of pitchClasses) {
    let candidate = `${pc}${octave}`;
    let midi = Note.midi(candidate);
    while (midi !== null && midi <= prevMidi) {
      octave++;
      candidate = `${pc}${octave}`;
      midi = Note.midi(candidate);
    }
    out.push(candidate);
    prevMidi = midi ?? prevMidi;
  }
  return out;
}

/** Build the diatonic chord (triad, +7th optional) on a scale degree. */
function buildDegreeChord(scaleNotes: string[], degree: number, seventh: boolean): string[] {
  const pcs = [
    scaleNotes[degree % 7],
    scaleNotes[(degree + 2) % 7],
    scaleNotes[(degree + 4) % 7],
  ];
  if (seventh) pcs.push(scaleNotes[(degree + 6) % 7]);
  // Bass-first voicing: put the root low, stack the rest above.
  const bass = `${pcs[0]}2`;
  const upper = voiceChord(pcs, 3);
  return [bass, ...upper];
}

interface Question {
  cadence: CadenceDef;
  key: string;
  phrase: string[][];   // array of chords, each an array of note names
}

function buildQuestion(key: string, cadence: CadenceDef): Question {
  const scaleNotes = Scale.get(`${key} major`).notes;
  const phrase = cadence.degrees.map((deg, i) =>
    buildDegreeChord(scaleNotes, deg, cadence.sevenths[i]),
  );
  return { cadence, key, phrase };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CadenceTrainerFeature() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [fixedKey, setFixedKey] = useState<string | null>(null); // null = random
  const [question, setQuestion] = useState<Question | null>(null);
  const [wrongPicks, setWrongPicks] = useState<Set<CadenceId>>(new Set());
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTheory, setShowTheory] = useState(false);

  const { score, setScore, streak, setStreak, bestStreak, setBestStreak } = useExerciseScore('cadence-trainer');

  const activeCadences = useMemo(
    () => CADENCES.filter(c => DIFFICULTY.find(d => d.id === difficulty)!.ids.includes(c.id)),
    [difficulty],
  );

  const newQuestion = useCallback(() => {
    const pool = DIFFICULTY.find(d => d.id === difficulty)!.ids;
    const cadId = pool[Math.floor(Math.random() * pool.length)];
    const cadence = CADENCES.find(c => c.id === cadId)!;
    const key = fixedKey ?? KEYS[Math.floor(Math.random() * KEYS.length)];
    setQuestion(buildQuestion(key, cadence));
    setWrongPicks(new Set());
    setSolved(false);
    setFirstTry(true);
  }, [difficulty, fixedKey]);

  // Preload audio + first question
  useEffect(() => { audioPlayer.preloadAllNotes(); }, []);
  useEffect(() => { newQuestion(); }, [difficulty, fixedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const playPhrase = useCallback(async () => {
    if (!question || isPlaying) return;
    setIsPlaying(true);
    try {
      for (let i = 0; i < question.phrase.length; i++) {
        await audioPlayer.playChord(question.phrase[i]);
        await audioPlayer.delay(820);
      }
    } catch { /* ignore */ }
    setIsPlaying(false);
  }, [question, isPlaying]);

  // Auto-advance after solving
  useEffect(() => {
    if (!solved) return;
    const t = setTimeout(newQuestion, 1600);
    return () => clearTimeout(t);
  }, [solved, newQuestion]);

  function handleAnswer(id: CadenceId) {
    if (!question || solved || wrongPicks.has(id)) return;
    if (id === question.cadence.id) {
      setSolved(true);
      if (firstTry) {
        setScore(p => ({ correct: p.correct + 1, total: p.total + 1 }));
        const s = streak + 1;
        setStreak(s);
        if (s > bestStreak) setBestStreak(s);
      } else {
        setScore(p => ({ correct: p.correct, total: p.total + 1 }));
        setStreak(0);
      }
    } else {
      setFirstTry(false);
      setWrongPicks(prev => new Set(prev).add(id));
    }
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>Cadence Trainer</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          Train your ear to recognise harmonic cadences — the punctuation of tonal music. Built for conservatory solfège and harmony exams.
        </p>
      </div>

      {/* Controls */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Difficulty */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Difficulty</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DIFFICULTY.map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                padding: '7px 14px',
                background: difficulty === d.id ? '#7c3aed20' : 'none',
                border: `1px solid ${difficulty === d.id ? '#7c3aed' : '#30363d'}`,
                borderRadius: 8, color: difficulty === d.id ? '#c4b5fd' : '#6b7280',
                fontSize: 13, cursor: 'pointer', fontWeight: difficulty === d.id ? 600 : 400,
              }}>{d.label}</button>
            ))}
          </div>
        </div>

        {/* Key */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Key</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={() => setFixedKey(null)} style={{
              padding: '5px 12px',
              background: fixedKey === null ? '#7c3aed20' : '#0d1117',
              border: `1px solid ${fixedKey === null ? '#7c3aed' : '#30363d'}`,
              borderRadius: 6, color: fixedKey === null ? '#c4b5fd' : '#6b7280',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>🎲 Random</button>
            {KEYS.map(k => (
              <button key={k} onClick={() => setFixedKey(k)} style={{
                padding: '5px 10px',
                background: fixedKey === k ? '#7c3aed20' : '#0d1117',
                border: `1px solid ${fixedKey === k ? '#7c3aed' : '#30363d'}`,
                borderRadius: 6, color: fixedKey === k ? '#c4b5fd' : '#6b7280',
                fontSize: 12, cursor: 'pointer', fontFamily: 'monospace', fontWeight: fixedKey === k ? 700 : 400,
              }}>{k}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Score', value: `${score.correct}/${score.total}${score.total > 0 ? ` · ${pct}%` : ''}`, color: '#e6edf3' },
          { label: 'Streak', value: `${streak} 🔥`, color: '#f59e0b' },
          { label: 'Best', value: `${bestStreak} 🏆`, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 100px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginTop: 2, fontFamily: 'monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Play + answer */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
        <button onClick={playPhrase} disabled={isPlaying} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 28px',
          background: isPlaying ? '#1c2128' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          border: 'none', borderRadius: 100,
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: isPlaying ? 'default' : 'pointer',
          boxShadow: isPlaying ? 'none' : '0 0 24px rgba(124,58,237,0.35)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          🔊 {isPlaying ? 'Playing…' : 'Play Cadence'}
        </button>

        <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          {solved
            ? `✅ ${question?.cadence.name} — ${question?.cadence.italian} in ${question?.key} major`
            : firstTry ? 'Listen, then pick the cadence you hear — first try counts!' : 'Keep trying — find the right cadence.'}
        </div>

        {/* Answer buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, width: '100%' }}>
          {activeCadences.map(c => {
            const isAnswer = solved && question?.cadence.id === c.id;
            const isWrong = wrongPicks.has(c.id);
            const disabled = solved || isWrong;
            return (
              <button key={c.id} onClick={() => handleAnswer(c.id)} disabled={disabled} style={{
                padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: disabled ? 'default' : 'pointer',
                background: isAnswer ? `${c.color}20` : isWrong ? '#2d1418' : '#0d1117',
                border: `1px solid ${isAnswer ? c.color : isWrong ? '#7f1d1d' : '#30363d'}`,
                opacity: isWrong ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isAnswer ? c.color : '#e6edf3' }}>{c.name}</span>
                  {isAnswer && <span style={{ fontSize: 14 }}>✓</span>}
                  {isWrong && <span style={{ fontSize: 14 }}>✕</span>}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{c.italian}</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: c.color, marginTop: 4 }}>{c.symbol}</div>
              </button>
            );
          })}
        </div>

        {/* Reveal phrase after solving */}
        {solved && question && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 4 }}>
            {question.cadence.degrees.map((deg, i) => {
              const numeral = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'][deg];
              const sev = question.cadence.sevenths[i] ? '7' : '';
              return (
                <span key={i} style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#c4b5fd', background: '#1c2128', border: '1px solid #30363d', borderRadius: 6, padding: '4px 10px' }}>
                  {numeral}{sev}
                </span>
              );
            })}
          </div>
        )}

        {!solved && (
          <button onClick={newQuestion} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #30363d', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
            Skip →
          </button>
        )}
      </div>

      {/* Theory reference */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '14px 18px' }}>
        <button onClick={() => setShowTheory(s => !s)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', fontSize: 13, fontWeight: 600 }}>
          <span>📖 The Four Cadences — Reference</span>
          <span style={{ transform: showTheory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </button>
        {showTheory && (
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {CADENCES.map(c => (
              <div key={c.id} style={{ background: '#0d1117', border: `1px solid ${c.color}40`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#8b949e' }}>{c.symbol}</span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginBottom: 8 }}>{c.italian}</div>
                <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#c9d1d9', lineHeight: 1.6 }}>{c.theory}</p>
                <div style={{ fontSize: 11.5, color: c.color, lineHeight: 1.55 }}>
                  <strong>👂 Listen for:</strong> {c.ear}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
