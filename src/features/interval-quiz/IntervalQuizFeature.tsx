import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, Scale } from 'tonal';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHROMATIC_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// All possible chromatic notes for answer choices (display-friendly)
const ALL_NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

// ─── Degree definitions ───────────────────────────────────────────────────────

interface Degree {
  label: string;     // display label, e.g. "2nd", "b7"
  interval: string;  // Tonal interval string, e.g. "2M", "7m"
  altered: boolean;  // true = not diatonic to major
}

const NATURAL_DEGREES: Degree[] = [
  { label: '1° (Tonica)',     interval: '1P', altered: false },
  { label: '2°',              interval: '2M', altered: false },
  { label: '3°',              interval: '3M', altered: false },
  { label: '4°',              interval: '4P', altered: false },
  { label: '5°',              interval: '5P', altered: false },
  { label: '6°',              interval: '6M', altered: false },
  { label: '7°',              interval: '7M', altered: false },
];

const ALTERED_DEGREES: Degree[] = [
  { label: 'b2° (bIX)',       interval: '2m', altered: true },
  { label: '#2° (#II)',       interval: '2A', altered: true },
  { label: 'b3° (bIII)',      interval: '3m', altered: true },
  { label: '#4° / b5°',      interval: '4A', altered: true },
  { label: 'b6° (bVI)',       interval: '6m', altered: true },
  { label: '#5° / b6°',      interval: '5A', altered: true },
  { label: 'b7° (bVII)',      interval: '7m', altered: true },
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

// ─── Helper: normalize enharmonic note to display form ───────────────────────

function normalizeNote(note: string): string {
  const pc = Note.pitchClass(note);
  if (!pc) return note;
  // Prefer flats for certain notes for consistency
  const enharmonic: Record<string, string> = {
    'C#': 'C#', 'Db': 'Db',
    'D#': 'D#', 'Eb': 'Eb',
    'F#': 'F#', 'Gb': 'Gb',
    'G#': 'G#', 'Ab': 'Ab',
    'A#': 'A#', 'Bb': 'Bb',
  };
  return enharmonic[pc] ?? pc;
}

function areEnharmonic(a: string, b: string): boolean {
  const sa = Note.get(a).height;
  const sb = Note.get(b).height;
  return sa !== undefined && sb !== undefined && sa === sb;
}

// ─── Question generator ───────────────────────────────────────────────────────

function generateQuestion(keyPool: string[], degreePool: Degree[]): Question | null {
  const key = keyPool[Math.floor(Math.random() * keyPool.length)];
  const degree = degreePool[Math.floor(Math.random() * degreePool.length)];
  const transposed = Note.transpose(key, degree.interval);
  if (!transposed) return null;
  const correctAnswer = normalizeNote(transposed);

  // Build wrong choices: pick 3 others that are not enharmonically equivalent
  const wrongPool = ALL_NOTES.filter(n => !areEnharmonic(n, correctAnswer));
  const shuffled = [...wrongPool].sort(() => Math.random() - 0.5);
  const wrongs = shuffled.slice(0, 3);
  const choices = [...wrongs, correctAnswer].sort(() => Math.random() - 0.5);

  return { key, degree, correctAnswer, choices };
}

// ─── Main component ───────────────────────────────────────────────────────────

const MAX_LIVES = 3;
const QUESTIONS_PER_GAME = 15;
const SCORE_CORRECT = 10;
const SCORE_STREAK_BONUS = 5;

export default function IntervalQuizFeature() {
  // Setup state
  const [keyMode, setKeyMode] = useState<'all' | 'pick'>('all');
  const [pickedKey, setPickedKey] = useState('C');
  const [quizMode, setQuizMode] = useState<QuizMode>('natural');

  // Game state
  const [gameState, setGameState] = useState<GameState>('setup');
  const [question, setQuestion] = useState<Question | null>(null);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [scoreFlash, setScoreFlash] = useState(0);

  // Shake animation on wrong answer
  const [shaking, setShaking] = useState(false);

  // Key pool & degree pool derived from settings
  const keyPool = keyMode === 'all' ? CHROMATIC_ROOTS : [pickedKey];
  const degreePool: Degree[] =
    quizMode === 'natural' ? NATURAL_DEGREES :
    quizMode === 'altered' ? ALTERED_DEGREES :
    [...NATURAL_DEGREES, ...ALTERED_DEGREES];

  // Next question
  const nextQuestion = useCallback(() => {
    const q = generateQuestion(keyPool, degreePool);
    if (q) {
      setQuestion(q);
      setSelected(null);
      setIsCorrect(null);
    }
  }, [keyPool, degreePool]);

  function startGame() {
    setLives(MAX_LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setQIndex(0);
    setResults([]);
    setSelected(null);
    setIsCorrect(null);
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

    const newResult: RoundResult = { correct, question, given: choice };
    setResults(prev => [...prev, newResult]);

    let newStreak = streak;
    let newScore = score;

    if (correct) {
      newStreak = streak + 1;
      const bonus = newStreak >= 3 ? SCORE_STREAK_BONUS * Math.floor(newStreak / 3) : 0;
      const gained = SCORE_CORRECT + bonus;
      newScore = score + gained;
      setScoreFlash(gained);
      setStreak(newStreak);
      setScore(newScore);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      newStreak = 0;
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setGameState('gameover'), 900);
        return;
      }
    }

    const nextIndex = qIndex + 1;
    if (nextIndex >= QUESTIONS_PER_GAME) {
      setTimeout(() => setGameState('complete'), 900);
    }
  }

  function advance() {
    if (gameState !== 'feedback') return;
    setQIndex(i => i + 1);
    setGameState('playing');
    nextQuestion();
  }

  // Auto-advance after feedback with keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && gameState === 'feedback') advance();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const accentColor = '#7c3aed';

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.18); } 100% { transform: scale(1); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
        @keyframes scoreUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-28px); } }
        @keyframes heartPop { 0%,100% { transform: scale(1); } 50% { transform: scale(1.35); } }

        .quiz-choice {
          transition: background 0.12s, border-color 0.12s, transform 0.1s;
        }
        .quiz-choice:hover:not(:disabled) {
          background: #21262d !important;
          transform: translateY(-1px);
        }
        .quiz-choice:active:not(:disabled) {
          transform: scale(0.97);
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* ── Setup ──────────────────────────────────────────────────────────── */}
        {gameState === 'setup' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28,
                color: '#e6edf3', margin: '0 0 8px', letterSpacing: '-0.5px',
              }}>
                Quiz sui Gradi
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                Allenati a riconoscere i gradi delle scale maggiori.<br />
                {QUESTIONS_PER_GAME} domande · 3 vite · bonus streak.
              </p>
            </div>

            {/* Settings card */}
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '26px 24px', marginBottom: 24 }}>

              {/* Key mode */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Tonalità
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {(['all', 'pick'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setKeyMode(m)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8,
                        border: `1px solid ${keyMode === m ? accentColor : '#30363d'}`,
                        background: keyMode === m ? `${accentColor}18` : 'transparent',
                        color: keyMode === m ? '#c4b5fd' : '#6b7280',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {m === 'all' ? 'Tutte le tonalità' : 'Scegli tonalità'}
                    </button>
                  ))}
                </div>
                {keyMode === 'pick' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, animation: 'fadeIn 0.2s ease' }}>
                    {CHROMATIC_ROOTS.map(r => (
                      <button
                        key={r}
                        onClick={() => setPickedKey(r)}
                        style={{
                          width: 44, height: 38, borderRadius: 7,
                          border: `1px solid ${pickedKey === r ? accentColor : '#30363d'}`,
                          background: pickedKey === r ? `${accentColor}22` : '#0d1117',
                          color: pickedKey === r ? '#c4b5fd' : '#6b7280',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quiz mode */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Tipo di gradi
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { value: 'natural', icon: '🎼', label: 'Solo gradi naturali', desc: 'I 7 gradi della scala maggiore (I–VII)' },
                    { value: 'altered', icon: '⚡', label: 'Solo gradi alterati', desc: 'b2, #2, b3, #4/b5, b6, b7 — cromatico' },
                    { value: 'mixed',   icon: '🌀', label: 'Misto (tutto)',        desc: 'Naturali + alterati — modalità avanzata' },
                  ] as { value: QuizMode; icon: string; label: string; desc: string }[]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setQuizMode(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                        borderRadius: 10,
                        border: `1px solid ${quizMode === opt.value ? accentColor : '#21262d'}`,
                        background: quizMode === opt.value ? `${accentColor}12` : 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{
                          display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                          fontWeight: 600, color: quizMode === opt.value ? '#c4b5fd' : '#e6edf3',
                          marginBottom: 2,
                        }}>
                          {opt.label}
                        </span>
                        <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                          {opt.desc}
                        </span>
                      </span>
                      {quizMode === opt.value && (
                        <span style={{ color: accentColor, fontSize: 14, flexShrink: 0 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={startGame}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 12,
                background: `linear-gradient(135deg, ${accentColor}, #6d28d9)`,
                border: 'none', color: '#fff',
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17,
                cursor: 'pointer', letterSpacing: '0.02em',
                boxShadow: `0 4px 24px ${accentColor}44`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              Inizia il Quiz →
            </button>
          </div>
        )}

        {/* ── Playing / Feedback ─────────────────────────────────────────────── */}
        {(gameState === 'playing' || gameState === 'feedback') && question && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>

            {/* HUD */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              {/* Lives */}
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 20,
                      opacity: i < lives ? 1 : 0.2,
                      filter: i < lives ? 'drop-shadow(0 0 4px #ef444488)' : 'none',
                      animation: gameState === 'feedback' && !isCorrect && i === lives - 1 && lives > 0 ? 'heartPop 0.35s ease' : 'none',
                    }}
                  >
                    ❤️
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                {qIndex + 1} / {QUESTIONS_PER_GAME}
              </div>

              {/* Score */}
              <div style={{ position: 'relative', textAlign: 'right' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: '#e6edf3' }}>
                  {score}
                </div>
                {isCorrect && scoreFlash > 0 && (
                  <div style={{
                    position: 'absolute', top: -4, right: 0,
                    fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700,
                    color: '#10b981',
                    animation: 'scoreUp 0.7s ease forwards',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                  }}>
                    +{scoreFlash}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: '#21262d', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: `linear-gradient(90deg, ${accentColor}, #06b6d4)`,
                width: `${((qIndex) / QUESTIONS_PER_GAME) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* Streak badge */}
            {streak >= 2 && (
              <div style={{
                textAlign: 'center', marginBottom: 14,
                animation: 'pop 0.3s ease',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 100,
                  background: streak >= 5 ? '#f59e0b22' : `${accentColor}18`,
                  border: `1px solid ${streak >= 5 ? '#f59e0b55' : accentColor + '44'}`,
                  fontSize: 13, fontWeight: 600,
                  color: streak >= 5 ? '#fbbf24' : '#c4b5fd',
                }}>
                  {streak >= 5 ? '🔥' : '⚡'} Streak ×{streak}
                  {streak >= 3 && <span style={{ fontSize: 11, opacity: 0.7 }}> +{SCORE_STREAK_BONUS * Math.floor(streak / 3)} bonus</span>}
                </span>
              </div>
            )}

            {/* Question card */}
            <div
              style={{
                background: '#161b22',
                border: `1px solid ${gameState === 'feedback' ? (isCorrect ? '#10b98166' : '#ef444466') : '#30363d'}`,
                borderRadius: 16, padding: '32px 24px',
                textAlign: 'center', marginBottom: 20,
                animation: shaking ? 'shake 0.45s ease' : 'none',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginBottom: 8, letterSpacing: '0.04em' }}>
                In {question.key} maggiore
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 32, color: '#e6edf3', marginBottom: 6,
                letterSpacing: '-0.5px',
              }}>
                Qual è il <span style={{ color: accentColor }}>{question.degree.label}</span>?
              </div>
              {question.degree.altered && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Grado cromatico — non appartiene alla scala maggiore naturale
                </div>
              )}
            </div>

            {/* Choices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {question.choices.map((choice, i) => {
                const isSelected = selected === choice;
                const isRight = areEnharmonic(choice, question.correctAnswer);
                let bg = '#161b22';
                let border = '#30363d';
                let textColor = '#e6edf3';

                if (gameState === 'feedback') {
                  if (isRight) { bg = '#10b98120'; border = '#10b981'; textColor = '#6ee7b7'; }
                  else if (isSelected && !isRight) { bg = '#ef444420'; border = '#ef4444'; textColor = '#fca5a5'; }
                }

                const keyLabels = ['A', 'B', 'C', 'D'];

                return (
                  <button
                    key={choice}
                    disabled={gameState === 'feedback'}
                    onClick={() => handleAnswer(choice)}
                    className="quiz-choice"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '16px 18px', borderRadius: 12,
                      border: `1.5px solid ${border}`,
                      background: bg, cursor: gameState === 'feedback' ? 'default' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                      background: gameState === 'feedback'
                        ? (isRight ? '#10b98130' : isSelected ? '#ef444430' : '#21262d')
                        : '#21262d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: gameState === 'feedback' ? (isRight ? '#6ee7b7' : isSelected ? '#fca5a5' : '#6b7280') : '#6b7280',
                    }}>
                      {keyLabels[i]}
                    </span>
                    <span style={{
                      fontFamily: "'Syne', sans-serif", fontWeight: 700,
                      fontSize: 22, color: textColor, letterSpacing: '-0.3px',
                    }}>
                      {choice}
                    </span>
                    {gameState === 'feedback' && isRight && (
                      <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>
                    )}
                    {gameState === 'feedback' && isSelected && !isRight && (
                      <span style={{ marginLeft: 'auto', fontSize: 16 }}>✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback bar */}
            {gameState === 'feedback' && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div style={{
                  padding: '14px 18px', borderRadius: 10, marginBottom: 14,
                  background: isCorrect ? '#10b98115' : '#ef444415',
                  border: `1px solid ${isCorrect ? '#10b98133' : '#ef444433'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{isCorrect ? '🎉' : '💡'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isCorrect ? '#6ee7b7' : '#fca5a5', marginBottom: 2 }}>
                      {isCorrect ? 'Corretto!' : `Risposta corretta: ${question.correctAnswer}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {question.degree.label} di {question.key} maggiore = <strong style={{ color: '#e6edf3' }}>{question.correctAnswer}</strong>
                      {!isCorrect && ` — hai risposto ${selected}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={advance}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 10,
                    background: accentColor, border: 'none', color: '#fff',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Prossima domanda →
                  <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>(Invio)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Game Over ──────────────────────────────────────────────────────── */}
        {gameState === 'gameover' && (
          <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💀</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: '#e6edf3', margin: '0 0 8px' }}>
              Game Over
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
              Hai esaurito le vite dopo {results.length} domande.
            </p>

            <ResultStats score={score} results={results} bestStreak={bestStreak} />

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={startGame} style={primaryBtnStyle(accentColor)}>
                Riprova 🔄
              </button>
              <button onClick={() => setGameState('setup')} style={secondaryBtnStyle}>
                Impostazioni
              </button>
            </div>
          </div>
        )}

        {/* ── Complete ───────────────────────────────────────────────────────── */}
        {gameState === 'complete' && (
          <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {score >= 120 ? '🏆' : score >= 80 ? '⭐' : '🎯'}
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: '#e6edf3', margin: '0 0 8px' }}>
              Quiz Completato!
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
              {score >= 130
                ? 'Prestazione eccellente — teoria musicale padroneggiata!'
                : score >= 90
                ? 'Ottimo lavoro! Continua così.'
                : 'Buon inizio — con la pratica migliorerai velocemente.'}
            </p>

            <ResultStats score={score} results={results} bestStreak={bestStreak} />

            {/* Missed questions recap */}
            {results.filter(r => !r.correct).length > 0 && (
              <div style={{ marginTop: 24, textAlign: 'left', background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Da ripassare
                </div>
                {results.filter(r => !r.correct).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #21262d' }}>
                    <span style={{ fontSize: 13, color: '#8b949e' }}>
                      {r.question.degree.label} di <strong style={{ color: '#e6edf3' }}>{r.question.key}</strong>
                    </span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#ef4444', textDecoration: 'line-through' }}>{r.given}</span>
                      <span style={{ fontSize: 12, color: '#4b5563' }}>→</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{r.question.correctAnswer}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={startGame} style={primaryBtnStyle(accentColor)}>
                Gioca ancora 🔄
              </button>
              <button onClick={() => setGameState('setup')} style={secondaryBtnStyle}>
                Impostazioni
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Result stats sub-component ───────────────────────────────────────────────

function ResultStats({ score, results, bestStreak }: { score: number; results: RoundResult[]; bestStreak: number }) {
  const correct = results.filter(r => r.correct).length;
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;

  const stats = [
    { label: 'Punteggio', value: String(score), color: '#c4b5fd' },
    { label: 'Corrette', value: `${correct}/${results.length}`, color: '#6ee7b7' },
    { label: 'Precisione', value: `${accuracy}%`, color: '#67e8f9' },
    { label: 'Best Streak', value: `×${bestStreak}`, color: '#fbbf24' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '16px 14px',
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: s.color, marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────

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
