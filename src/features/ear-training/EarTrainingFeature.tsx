import { useState, useCallback, useRef } from 'react';

// ─── Audio Engine ─────────────────────────────────────────────────────────────

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

function playTone(midi: number, startTime: number, duration: number, volume = 0.22) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'triangle';
  osc.frequency.value = midiToFreq(midi);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.setValueAtTime(volume, startTime + duration * 0.72);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function playSequence(midis: number[], gap = 0.45, noteDuration = 1.2): number {
  const ctx = getCtx();
  let t = ctx.currentTime + 0.08;
  midis.forEach(midi => {
    playTone(midi, t, noteDuration);
    t += gap;
  });
  return t;
}

function playHarmonic(midis: number[], duration = 2.5) {
  const ctx = getCtx();
  const t = ctx.currentTime + 0.08;
  midis.forEach(midi => playTone(midi, t, duration));
}

// ─── Music Data ───────────────────────────────────────────────────────────────

const INTERVALS = [
  { semitones: 0,  name: 'Unison',               abbr: 'P1',  example: 'Same note' },
  { semitones: 1,  name: 'Minor 2nd',             abbr: 'm2',  example: 'Jaws theme' },
  { semitones: 2,  name: 'Major 2nd',             abbr: 'M2',  example: 'Happy Birthday' },
  { semitones: 3,  name: 'Minor 3rd',             abbr: 'm3',  example: 'Smoke on the Water' },
  { semitones: 4,  name: 'Major 3rd',             abbr: 'M3',  example: 'When the Saints...' },
  { semitones: 5,  name: 'Perfect 4th',           abbr: 'P4',  example: 'Here Comes the Bride' },
  { semitones: 6,  name: 'Tritone',               abbr: 'TT',  example: 'The Simpsons' },
  { semitones: 7,  name: 'Perfect 5th',           abbr: 'P5',  example: 'Star Wars' },
  { semitones: 8,  name: 'Minor 6th',             abbr: 'm6',  example: 'The Entertainer' },
  { semitones: 9,  name: 'Major 6th',             abbr: 'M6',  example: 'My Bonnie Lies...' },
  { semitones: 10, name: 'Minor 7th',             abbr: 'm7',  example: 'Somewhere' },
  { semitones: 11, name: 'Major 7th',             abbr: 'M7',  example: 'Take On Me' },
  { semitones: 12, name: 'Octave',                abbr: 'Oct', example: 'Somewhere Over...' },
];

const CHORD_TYPES = [
  { label: 'Major',            intervals: [0, 4, 7],     id: 'maj' },
  { label: 'Minor',            intervals: [0, 3, 7],     id: 'min' },
  { label: 'Dominant 7',       intervals: [0, 4, 7, 10], id: 'dom7' },
  { label: 'Major 7',          intervals: [0, 4, 7, 11], id: 'maj7' },
  { label: 'Minor 7',          intervals: [0, 3, 7, 10], id: 'min7' },
  { label: 'Diminished',       intervals: [0, 3, 6],     id: 'dim' },
  { label: 'Augmented',        intervals: [0, 4, 8],     id: 'aug' },
  { label: 'Half-Dim (m7♭5)', intervals: [0, 3, 6, 10], id: 'hdim' },
];

const SCALE_TYPES = [
  { label: 'Major (Ionian)',      intervals: [0,2,4,5,7,9,11], id: 'major' },
  { label: 'Natural Minor',       intervals: [0,2,3,5,7,8,10], id: 'minor' },
  { label: 'Dorian',              intervals: [0,2,3,5,7,9,10], id: 'dorian' },
  { label: 'Phrygian',            intervals: [0,1,3,5,7,8,10], id: 'phryg' },
  { label: 'Lydian',              intervals: [0,2,4,6,7,9,11], id: 'lydian' },
  { label: 'Mixolydian',          intervals: [0,2,4,5,7,9,10], id: 'mixo' },
  { label: 'Major Pentatonic',    intervals: [0,2,4,7,9],      id: 'majorPenta' },
  { label: 'Minor Pentatonic',    intervals: [0,3,5,7,10],     id: 'minorPenta' },
  { label: 'Blues',               intervals: [0,3,5,6,7,10],   id: 'blues' },
  { label: 'Harmonic Minor',      intervals: [0,2,3,5,7,8,11], id: 'harmMin' },
  { label: 'Whole Tone',          intervals: [0,2,4,6,8,10],   id: 'wholeTone' },
  { label: 'Diminished (WH)',     intervals: [0,2,3,5,6,8,9,11],id: 'dimWH' },
];

type Mode = 'intervals' | 'chords' | 'scales';

interface Question {
  midis: number[];
  correctIndex: number;
  rootMidi: number;
}

interface Score {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}

function randomRoot(min = 57, max = 72): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EarTrainingFeature() {
  const [mode, setMode] = useState<Mode>('intervals');
  const [question, setQuestion] = useState<Question | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [answered, setAnswered] = useState<number | null>(null); // index chosen
  const [score, setScore] = useState<Score>({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const [harmonicMode, setHarmonicMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Generate Question ──

  const generateQuestion = useCallback(() => {
    setAnswered(null);
    if (mode === 'intervals') {
      const root = randomRoot(57, 69);
      const items = shuffle(INTERVALS).slice(0, 6);
      const correct = items[Math.floor(Math.random() * items.length)];
      const correctIdx = items.indexOf(correct);
      setQuestion({ midis: [root, root + correct.semitones], correctIndex: correctIdx, rootMidi: root });
      setChoices(items.map(i => i.name));
    } else if (mode === 'chords') {
      const root = randomRoot(48, 64);
      const items = shuffle(CHORD_TYPES).slice(0, 6);
      const correct = items[Math.floor(Math.random() * items.length)];
      const correctIdx = items.indexOf(correct);
      setQuestion({ midis: correct.intervals.map(i => root + i), correctIndex: correctIdx, rootMidi: root });
      setChoices(items.map(c => c.label));
    } else {
      const root = randomRoot(48, 64);
      const items = shuffle(SCALE_TYPES).slice(0, 6);
      const correct = items[Math.floor(Math.random() * items.length)];
      const correctIdx = items.indexOf(correct);
      setQuestion({ midis: correct.intervals.map(i => root + i), correctIndex: correctIdx, rootMidi: root });
      setChoices(items.map(s => s.label));
    }
  }, [mode]);

  // ── Play Audio ──

  const playQuestion = useCallback(() => {
    if (!question) return;
    setIsPlaying(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (mode === 'intervals') {
      if (harmonicMode) {
        playHarmonic(question.midis, 2);
        timeoutRef.current = setTimeout(() => setIsPlaying(false), 2500);
      } else {
        const endTime = playSequence(question.midis, 0.7, 1.4);
        const delay = (endTime - getCtx().currentTime) * 1000;
        timeoutRef.current = setTimeout(() => setIsPlaying(false), delay + 200);
      }
    } else if (mode === 'chords') {
      if (harmonicMode) {
        playHarmonic(question.midis, 2.5);
        timeoutRef.current = setTimeout(() => setIsPlaying(false), 3000);
      } else {
        const endTime = playSequence(question.midis, 0.4, 1.2);
        const delay = (endTime - getCtx().currentTime) * 1000;
        timeoutRef.current = setTimeout(() => {
          playHarmonic(question.midis, 2);
          timeoutRef.current = setTimeout(() => setIsPlaying(false), 2500);
        }, delay + 100);
      }
    } else {
      const endTime = playSequence(question.midis, 0.32, 1.0);
      const delay = (endTime - getCtx().currentTime) * 1000;
      timeoutRef.current = setTimeout(() => setIsPlaying(false), delay + 200);
    }
  }, [question, mode, harmonicMode]);

  // Auto-play when question changes
  const prevMidisRef = useRef<number[]>([]);
  if (question && JSON.stringify(question.midis) !== JSON.stringify(prevMidisRef.current)) {
    prevMidisRef.current = question.midis;
    setTimeout(() => playQuestion(), 100);
  }

  // ── Handle Answer ──

  function handleAnswer(idx: number) {
    if (answered !== null || !question) return;
    setAnswered(idx);
    const isCorrect = idx === question.correctIndex;
    setScore(prev => {
      const streak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      };
    });
  }

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Ear Training</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Train your ear to recognize intervals, chord qualities, and scales. Audio is generated in real time.
        </p>
      </div>

      {/* Mode selector + score */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['intervals', 'Intervals'], ['chords', 'Chords'], ['scales', 'Scales']] as [Mode, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setMode(id); setQuestion(null); setAnswered(null); }}
              style={{
                padding: '8px 16px', borderRadius: 7,
                background: mode === id ? '#7c3aed' : '#0d1117',
                border: `1px solid ${mode === id ? '#7c3aed' : '#30363d'}`,
                color: mode === id ? '#fff' : '#6b7280',
                fontSize: 13, fontWeight: mode === id ? 700 : 400, cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Harmonic/melodic toggle */}
        {mode !== 'scales' && (
          <button
            onClick={() => setHarmonicMode(!harmonicMode)}
            style={{
              padding: '6px 12px', borderRadius: 6,
              background: harmonicMode ? '#1c2128' : 'none',
              border: `1px solid ${harmonicMode ? '#58a6ff' : '#30363d'}`,
              color: harmonicMode ? '#58a6ff' : '#6b7280',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            {harmonicMode ? '🎵 Harmonic' : '🎵 Melodic'}
          </button>
        )}

        {/* Score */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Accuracy</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
              {score.total > 0 ? `${accuracy}%` : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Score</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3' }}>
              {score.correct}/{score.total}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Streak</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: score.streak >= 3 ? '#f59e0b' : '#e6edf3' }}>
              {score.streak} 🔥
            </div>
          </div>
          {score.total > 0 && (
            <button
              onClick={() => setScore({ correct: 0, total: 0, streak: 0, bestStreak: 0 })}
              style={{ padding: '4px 8px', background: 'none', border: '1px solid #30363d', borderRadius: 5, color: '#6b7280', fontSize: 11, cursor: 'pointer', alignSelf: 'center' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Exercise area */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', minHeight: 360 }}>
        {!question ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 48 }}>
              {mode === 'intervals' ? '🎵' : mode === 'chords' ? '🎹' : '🎼'}
            </div>
            <div style={{ fontSize: 16, color: '#8b949e', textAlign: 'center' }}>
              {mode === 'intervals'
                ? 'Listen to two notes and identify the interval between them.'
                : mode === 'chords'
                ? 'Listen to a chord and identify its quality.'
                : 'Listen to a scale ascending and identify it.'}
            </div>
            <button
              onClick={generateQuestion}
              style={{
                padding: '14px 36px', background: '#7c3aed', border: 'none',
                borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Start Exercise
            </button>
          </div>
        ) : (
          <>
            {/* Play button */}
            <button
              onClick={playQuestion}
              disabled={isPlaying}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: isPlaying ? '#1c2128' : '#7c3aed',
                border: `3px solid ${isPlaying ? '#30363d' : '#9d4edd'}`,
                cursor: isPlaying ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, transition: 'all 0.2s',
                boxShadow: isPlaying ? 'none' : '0 0 20px #7c3aed40',
              }}
              title={isPlaying ? 'Playing...' : 'Play again'}
            >
              {isPlaying ? '♪' : '▶'}
            </button>

            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {mode === 'intervals'
                ? `Listen to the ${harmonicMode ? 'harmonic' : 'melodic'} interval and identify it:`
                : mode === 'chords'
                ? `Listen to the ${harmonicMode ? 'harmonic' : 'arpeggiated'} chord and identify its quality:`
                : 'Listen to the ascending scale and identify it:'}
            </div>

            {/* Answer choices */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10, width: '100%', maxWidth: 600,
            }}>
              {choices.map((choice, idx) => {
                const isCorrect = idx === question.correctIndex;
                const isChosen = idx === answered;
                let bg = '#0d1117';
                let border = '#30363d';
                let color = '#e6edf3';

                if (answered !== null) {
                  if (isCorrect) { bg = '#10b98120'; border = '#10b981'; color = '#10b981'; }
                  else if (isChosen) { bg = '#ef444420'; border = '#ef4444'; color = '#ef4444'; }
                  else { bg = '#0d1117'; border = '#21262d'; color = '#4b5563'; }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered !== null}
                    style={{
                      padding: '12px 16px', borderRadius: 8, textAlign: 'center',
                      background: bg, border: `1px solid ${border}`, color,
                      fontSize: 14, fontWeight: isCorrect && answered !== null ? 700 : 500,
                      cursor: answered !== null ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {choice}
                    {answered !== null && isCorrect && (
                      <span style={{ marginLeft: 6 }}>✓</span>
                    )}
                    {answered !== null && isChosen && !isCorrect && (
                      <span style={{ marginLeft: 6 }}>✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            {answered !== null && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontSize: 15, fontWeight: 600,
                  color: answered === question.correctIndex ? '#10b981' : '#ef4444',
                }}>
                  {answered === question.correctIndex
                    ? `✓ Correct! ${score.streak > 1 ? `(${score.streak} streak! 🔥)` : ''}`
                    : `✗ Incorrect — answer: ${choices[question.correctIndex]}`}
                </div>

                {/* Extra info for intervals */}
                {mode === 'intervals' && (
                  <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                    Mnemonic: {INTERVALS.find(i => i.name === choices[question.correctIndex])?.example}
                  </div>
                )}

                <button
                  onClick={generateQuestion}
                  style={{
                    padding: '10px 28px', background: '#1d4ed8', border: 'none',
                    borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Next Question →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Interval reference table */}
      {mode === 'intervals' && (
        <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
            📖 Interval Reference Chart
          </summary>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {INTERVALS.map(iv => (
              <div key={iv.semitones} style={{
                background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: '8px 10px',
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#1c2128',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace', flexShrink: 0,
                }}>
                  {iv.abbr}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{iv.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{iv.example}</div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
