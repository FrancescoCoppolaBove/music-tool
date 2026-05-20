import { useState, useEffect, useCallback } from 'react';
import { Note, Scale } from 'tonal';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHROMATIC_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const ALL_NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

// ─── Degree definitions ───────────────────────────────────────────────────────

interface Degree {
  label: string;
  interval: string;
  altered: boolean;
}

const NATURAL_DEGREES: Degree[] = [
  { label: '1st (Root)',   interval: '1P', altered: false },
  { label: '2nd',          interval: '2M', altered: false },
  { label: '3rd',          interval: '3M', altered: false },
  { label: '4th',          interval: '4P', altered: false },
  { label: '5th',          interval: '5P', altered: false },
  { label: '6th',          interval: '6M', altered: false },
  { label: '7th',          interval: '7M', altered: false },
];

const ALTERED_DEGREES: Degree[] = [
  { label: 'b2 (bIX)',     interval: '2m', altered: true },
  { label: '#2',           interval: '2A', altered: true },
  { label: 'b3 (bIII)',    interval: '3m', altered: true },
  { label: '#4 / b5',      interval: '4A', altered: true },
  { label: 'b6 (bVI)',     interval: '6m', altered: true },
  { label: '#5 / b6',      interval: '5A', altered: true },
  { label: 'b7 (bVII)',    interval: '7m', altered: true },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizMode = 'natural' | 'altered' | 'mixed';
type GameState = 'setup' | 'playing' | 'feedback' | 'gameover' | 'complete';

interface Question {
  key: string;
  degree: Degree;
  correctAnswer: string;
  choices: string[];
}

interface RoundResult {
  correct: boolean;
  question: Question;
  given: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeNote(note: string): string {
  const pc = Note.pitchClass(note);
  if (!pc) return note;
  const enharmonic: Record<string, string> = {
    'C#': 'C#', 'Db': 'Db', 'D#': 'D#', 'Eb': 'Eb',
    'F#': 'F#', 'Gb': 'Gb', 'G#': 'G#', 'Ab': 'Ab',
    'A#': 'A#', 'Bb': 'Bb',
  };
  return enharmonic[pc] ?? pc;
}

function areEnharmonic(a: string, b: string): boolean {
  const sa = Note.get(a).height;
  const sb = Note.get(b).height;
  return sa !== undefined && sb !== undefined && sa === sb;
}

function generateQuestion(keyPool: string[], degreePool: Degree[]): Question | null {
  const key = keyPool[Math.floor(Math.random() * keyPool.length)];
  const degree = degreePool[Math.floor(Math.random() * degreePool.length)];
  const transposed = Note.transpose(key, degree.interval);
  if (!transposed) return null;
  const correctAnswer = normalizeNote(transposed);

  const wrongPool = ALL_NOTES.filter(n => !areEnharmonic(n, correctAnswer));
  const shuffled = [...wrongPool].sort(() => Math.random() - 0.5);
  const choices = [...shuffled.slice(0, 3), correctAnswer].sort(() => Math.random() - 0.5);

  return { key, degree, correctAnswer, choices };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LIVES = 3;
const QUESTIONS_PER_GAME = 30;
const SCORE_CORRECT = 10;
const SCORE_STREAK_BONUS = 5;
const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

// ─── Shared styles ────────────────────────────────────────────────────────────

function primaryBtnStyle(accent: string): React.CSSProperties {
  return {
    flex: 1, padding: '13px 0', borderRadius: 10,
    background: accent, border: 'none', color: '#fff',
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  };
}

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: '13px 0', borderRadius: 10,
  background: 'transparent', border: '1px solid #30363d', color: '#8b949e',
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
  cursor: 'pointer',
};

// ─── Result stats ─────────────────────────────────────────────────────────────

function ResultStats({ score, results, bestStreak }: { score: number; results: RoundResult[]; bestStreak: number }) {
  const correct = results.filter(r => r.correct).length;
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
  const stats = [
    { label: 'Score',       value: String(score),          color: '#c4b5fd' },
    { label: 'Correct',     value: `${correct}/${results.length}`, color: '#6ee7b7' },
    { label: 'Accuracy',    value: `${accuracy}%`,          color: '#67e8f9' },
    { label: 'Best Streak', value: `×${bestStreak}`,        color: '#fbbf24' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px 14px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: s.color, marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IntervalQuizFeature() {
  const [keyMode, setKeyMode]       = useState<'all' | 'pick'>('all');
  const [pickedKey, setPickedKey]   = useState('C');
  const [quizMode, setQuizMode]     = useState<QuizMode>('natural');

  const [gameState, setGameState]   = useState<GameState>('setup');
  const [question, setQuestion]     = useState<Question | null>(null);
  const [lives, setLives]           = useState(MAX_LIVES);
  const [score, setScore]           = useState(0);
  const [streak, setStreak]         = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [qIndex, setQIndex]         = useState(0);
  const [results, setResults]       = useState<RoundResult[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [isCorrect, setIsCorrect]   = useState<boolean | null>(null);
  const [scoreFlash, setScoreFlash] = useState(0);
  const [shaking, setShaking]       = useState(false);

  const keyPool    = keyMode === 'all' ? CHROMATIC_ROOTS : [pickedKey];
  const degreePool = quizMode === 'natural' ? NATURAL_DEGREES
                   : quizMode === 'altered' ? ALTERED_DEGREES
                   : [...NATURAL_DEGREES, ...ALTERED_DEGREES];

  const nextQuestion = useCallback(() => {
    const q = generateQuestion(keyPool, degreePool);
    if (q) { setQuestion(q); setSelected(null); setIsCorrect(null); }
  }, [keyPool, degreePool]);

  function startGame() {
    setLives(MAX_LIVES); setScore(0); setStreak(0); setBestStreak(0);
    setQIndex(0); setResults([]); setSelected(null); setIsCorrect(null);
    setGameState('playing');
    const q = generateQuestion(keyPool, degreePool);
    if (q) setQuestion(q);
  }

  function handleAnswer(choice: string) {
    if (!question || gameState !== 'playing') return;
    const correct = areEnharmonic(choice, question.correctAnswer);
    setSelected(choice);
    setIsCorrect(correct);
    setGameState('feedback');
    setResults(prev => [...prev, { correct, question, given: choice }]);

    if (correct) {
      const newStreak = streak + 1;
      const bonus = newStreak >= 3 ? SCORE_STREAK_BONUS * Math.floor(newStreak / 3) : 0;
      const gained = SCORE_CORRECT + bonus;
      setScoreFlash(gained);
      setStreak(newStreak);
      setScore(s => s + gained);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) { setTimeout(() => setGameState('gameover'), 900); return; }
    }
    if (qIndex + 1 >= QUESTIONS_PER_GAME) {
      setTimeout(() => setGameState('complete'), 900);
    }
  }

  function advance() {
    if (gameState !== 'feedback') return;
    setQIndex(i => i + 1);
    setGameState('playing');
    nextQuestion();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && gameState === 'feedback') advance(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  const accent = '#7c3aed';

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pop     { 0%,100% { transform:scale(1); } 50% { transform:scale(1.18); } }
        @keyframes shake   { 0%,100% { transform:translateX(0); } 20% { transform:translateX(-8px); } 40% { transform:translateX(8px); } 60% { transform:translateX(-5px); } 80% { transform:translateX(5px); } }
        @keyframes scoreUp { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-28px); } }
        .quiz-choice { transition: background 0.12s, border-color 0.12s, transform 0.1s; }
        .quiz-choice:hover:not(:disabled) { background: #21262d !important; transform: translateY(-1px); }
        .quiz-choice:active:not(:disabled) { transform: scale(0.97); }
      `}</style>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* ── Setup ──────────────────────────────────────────────────────────── */}
        {gameState === 'setup' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: '#e6edf3', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                Scale Degree Quiz
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.65 }}>
                Train your knowledge of major scale degrees.<br />
                {QUESTIONS_PER_GAME} questions · 3 lives · streak bonuses.
              </p>
            </div>

            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '26px 22px', marginBottom: 20 }}>

              {/* Key mode */}
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Key
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {(['all', 'pick'] as const).map(m => (
                    <button key={m} onClick={() => setKeyMode(m)} style={{
                      flex: 1, padding: '10px 0', borderRadius: 8,
                      border: `1px solid ${keyMode === m ? accent : '#30363d'}`,
                      background: keyMode === m ? `${accent}18` : 'transparent',
                      color: keyMode === m ? '#c4b5fd' : '#6b7280',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                      {m === 'all' ? 'All keys' : 'Choose a key'}
                    </button>
                  ))}
                </div>
                {keyMode === 'pick' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, animation: 'fadeIn 0.2s ease' }}>
                    {CHROMATIC_ROOTS.map(r => (
                      <button key={r} onClick={() => setPickedKey(r)} style={{
                        width: 44, height: 36, borderRadius: 7,
                        border: `1px solid ${pickedKey === r ? accent : '#30363d'}`,
                        background: pickedKey === r ? `${accent}22` : '#0d1117',
                        color: pickedKey === r ? '#c4b5fd' : '#6b7280',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Degree mode */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Degree type
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { value: 'natural', icon: '🎼', label: 'Natural degrees only',    desc: 'The 7 diatonic degrees of the major scale (I–VII)' },
                    { value: 'altered', icon: '⚡', label: 'Altered degrees only',    desc: 'b2, #2, b3, #4/b5, b6, b7 — chromatic extensions' },
                    { value: 'mixed',   icon: '🌀', label: 'Mixed (everything)',       desc: 'Natural + altered — advanced mode' },
                  ] as { value: QuizMode; icon: string; label: string; desc: string }[]).map(opt => (
                    <button key={opt.value} onClick={() => setQuizMode(opt.value)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10,
                      border: `1px solid ${quizMode === opt.value ? accent : '#21262d'}`,
                      background: quizMode === opt.value ? `${accent}12` : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: quizMode === opt.value ? '#c4b5fd' : '#e6edf3', marginBottom: 2 }}>
                          {opt.label}
                        </span>
                        <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{opt.desc}</span>
                      </span>
                      {quizMode === opt.value && <span style={{ color: accent, fontSize: 14, flexShrink: 0 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={startGame} style={{
              width: '100%', padding: '16px 0', borderRadius: 12,
              background: `linear-gradient(135deg, ${accent}, #6d28d9)`,
              border: 'none', color: '#fff',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17,
              cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: `0 4px 24px ${accent}44`,
            }}>
              Start Quiz →
            </button>
          </div>
        )}

        {/* ── Playing / Feedback ─────────────────────────────────────────────── */}
        {(gameState === 'playing' || gameState === 'feedback') && question && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>

            {/* HUD */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <span key={i} style={{ fontSize: 20, opacity: i < lives ? 1 : 0.2, filter: i < lives ? 'drop-shadow(0 0 4px #ef444466)' : 'none' }}>
                    ❤️
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                {qIndex + 1} / {QUESTIONS_PER_GAME}
              </div>
              <div style={{ position: 'relative', textAlign: 'right' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: '#e6edf3' }}>
                  {score}
                </div>
                {isCorrect && scoreFlash > 0 && (
                  <div style={{ position: 'absolute', top: -4, right: 0, fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: '#10b981', animation: 'scoreUp 0.7s ease forwards', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                    +{scoreFlash}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: '#21262d', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${accent}, #06b6d4)`, width: `${(qIndex / QUESTIONS_PER_GAME) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>

            {/* Streak badge */}
            {streak >= 2 && (
              <div style={{ textAlign: 'center', marginBottom: 14, animation: 'pop 0.3s ease' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 100,
                  background: streak >= 5 ? '#f59e0b22' : `${accent}18`,
                  border: `1px solid ${streak >= 5 ? '#f59e0b55' : accent + '44'}`,
                  fontSize: 13, fontWeight: 600, color: streak >= 5 ? '#fbbf24' : '#c4b5fd',
                }}>
                  {streak >= 5 ? '🔥' : '⚡'} Streak ×{streak}
                  {streak >= 3 && <span style={{ fontSize: 11, opacity: 0.7 }}> +{SCORE_STREAK_BONUS * Math.floor(streak / 3)} bonus</span>}
                </span>
              </div>
            )}

            {/* Question card */}
            <div style={{
              background: '#161b22',
              border: `1px solid ${gameState === 'feedback' ? (isCorrect ? '#10b98166' : '#ef444466') : '#30363d'}`,
              borderRadius: 16, padding: '28px 22px 24px', textAlign: 'center', marginBottom: 16,
              animation: shaking ? 'shake 0.45s ease' : 'none',
              transition: 'border-color 0.2s',
            }}>
              {/* Key badge — large and unmissable */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Key
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'baseline', gap: 6,
                  background: `${accent}18`, border: `1px solid ${accent}44`,
                  borderRadius: 12, padding: '8px 22px',
                }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 40, color: '#c4b5fd', letterSpacing: '-1px', lineHeight: 1 }}>
                    {question.key}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 15, color: '#7c6cad', letterSpacing: '0.02em' }}>
                    major
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', height: 1, background: '#21262d', marginBottom: 18 }} />

              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: '#e6edf3', letterSpacing: '-0.5px' }}>
                What is the <span style={{ color: accent }}>{question.degree.label}</span>?
              </div>
              {question.degree.altered && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  Chromatic degree — not part of the natural major scale
                </div>
              )}
            </div>

            {/* Choices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {question.choices.map((choice, i) => {
                const isSelected = selected === choice;
                const isRight = areEnharmonic(choice, question.correctAnswer);
                let bg = '#161b22', border = '#30363d', textColor = '#e6edf3';
                if (gameState === 'feedback') {
                  if (isRight) { bg = '#10b98120'; border = '#10b981'; textColor = '#6ee7b7'; }
                  else if (isSelected) { bg = '#ef444420'; border = '#ef4444'; textColor = '#fca5a5'; }
                }
                return (
                  <button key={choice} disabled={gameState === 'feedback'} onClick={() => handleAnswer(choice)}
                    className="quiz-choice"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', borderRadius: 12, border: `1.5px solid ${border}`, background: bg, cursor: gameState === 'feedback' ? 'default' : 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: gameState === 'feedback' ? (isRight ? '#10b98130' : isSelected ? '#ef444430' : '#21262d') : '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: gameState === 'feedback' ? (isRight ? '#6ee7b7' : isSelected ? '#fca5a5' : '#6b7280') : '#6b7280' }}>
                      {CHOICE_LABELS[i]}
                    </span>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: textColor, letterSpacing: '-0.3px' }}>
                      {choice}
                    </span>
                    {gameState === 'feedback' && isRight   && <span style={{ marginLeft: 'auto', fontSize: 15 }}>✓</span>}
                    {gameState === 'feedback' && isSelected && !isRight && <span style={{ marginLeft: 'auto', fontSize: 15 }}>✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {gameState === 'feedback' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div style={{ padding: '13px 16px', borderRadius: 10, marginBottom: 12, background: isCorrect ? '#10b98115' : '#ef444415', border: `1px solid ${isCorrect ? '#10b98133' : '#ef444433'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{isCorrect ? '🎉' : '💡'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isCorrect ? '#6ee7b7' : '#fca5a5', marginBottom: 2 }}>
                      {isCorrect ? 'Correct!' : `Correct answer: ${question.correctAnswer}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      The {question.degree.label} of <strong style={{ color: '#e6edf3' }}>{question.key} major</strong> = <strong style={{ color: '#e6edf3' }}>{question.correctAnswer}</strong>
                      {!isCorrect && <> — you answered <span style={{ color: '#fca5a5' }}>{selected}</span></>}
                    </div>
                  </div>
                </div>
                <button onClick={advance} style={{ width: '100%', padding: '13px 0', borderRadius: 10, background: accent, border: 'none', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Next question →
                  <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 8 }}>(Enter)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Game Over ──────────────────────────────────────────────────────── */}
        {gameState === 'gameover' && (
          <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>💀</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: '#e6edf3', margin: '0 0 6px' }}>
              Game Over
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>
              You ran out of lives after {results.length} question{results.length !== 1 ? 's' : ''}.
            </p>
            <ResultStats score={score} results={results} bestStreak={bestStreak} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={startGame} style={primaryBtnStyle(accent)}>Try again 🔄</button>
              <button onClick={() => setGameState('setup')} style={secondaryBtnStyle}>Settings</button>
            </div>
          </div>
        )}

        {/* ── Complete ───────────────────────────────────────────────────────── */}
        {gameState === 'complete' && (
          <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>
              {score >= 240 ? '🏆' : score >= 160 ? '⭐' : '🎯'}
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: '#e6edf3', margin: '0 0 6px' }}>
              Quiz Complete!
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>
              {score >= 260 ? 'Outstanding — you know your intervals cold!'
               : score >= 180 ? 'Great work! Keep it up.'
               : 'Good start — practice makes perfect.'}
            </p>
            <ResultStats score={score} results={results} bestStreak={bestStreak} />

            {results.filter(r => !r.correct).length > 0 && (
              <div style={{ marginTop: 22, textAlign: 'left', background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Review these
                </div>
                {results.filter(r => !r.correct).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #21262d' }}>
                    <span style={{ fontSize: 13, color: '#8b949e' }}>
                      {r.question.degree.label} of <strong style={{ color: '#e6edf3' }}>{r.question.key} major</strong>
                    </span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#ef4444', textDecoration: 'line-through' }}>{r.given}</span>
                      <span style={{ fontSize: 11, color: '#4b5563' }}>→</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{r.question.correctAnswer}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={startGame} style={primaryBtnStyle(accent)}>Play again 🔄</button>
              <button onClick={() => setGameState('setup')} style={secondaryBtnStyle}>Settings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
