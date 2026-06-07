import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Volume2, Share2, CheckCircle, RotateCcw } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../shared/context/AuthContext';
import {
  generateDailyQuestions,
  getTodayKey,
  getDayNumber,
  buildShareText,
  type DailyQuestion,
  type DailyResult,
} from './dailyGenerator';
import { audioPlayer } from '../ear-training/utils/audio-player';

const CSS = `
  .dc-container { max-width: 520px; margin: 0 auto; }

  .dc-header { text-align: center; margin-bottom: 28px; }
  .dc-day-badge {
    display: inline-block; padding: 4px 12px; border-radius: 20px;
    background: #7c3aed18; border: 1px solid #7c3aed40;
    color: #c4b5fd; font-size: 12px; font-weight: 700;
    letter-spacing: 0.05em; margin-bottom: 12px;
  }
  .dc-title { font-size: 28px; font-weight: 800; color: #e6edf3; margin: 0; letter-spacing: -0.5px; }
  .dc-subtitle { font-size: 14px; color: #6b7280; margin-top: 6px; }

  .dc-progress {
    display: flex; gap: 6px; justify-content: center; margin-bottom: 28px;
  }
  .dc-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: #21262d; border: 1px solid #30363d;
    transition: all 0.2s;
  }
  .dc-dot.done { background: #7c3aed; border-color: #7c3aed; }
  .dc-dot.current { background: #7c3aed60; border-color: #7c3aed; box-shadow: 0 0 6px #7c3aed80; }

  .dc-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px;
    padding: 28px; margin-bottom: 16px;
    animation: dc-fadein 0.3s ease both;
  }
  @keyframes dc-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .dc-type-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #4b5563; margin-bottom: 20px;
  }

  .dc-play-btn {
    width: 100%; padding: 18px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #1c2128; border: 1px solid #30363d; border-radius: 12px;
    color: #e6edf3; font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.15s; margin-bottom: 20px;
  }
  .dc-play-btn:hover:not(:disabled) { background: #21262d; border-color: #7c3aed60; }
  .dc-play-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .dc-play-btn.playing { border-color: #7c3aed; color: #c4b5fd; }

  .dc-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .dc-option {
    padding: 14px 12px; border-radius: 10px;
    border: 1px solid #30363d; background: #1c2128;
    color: #e6edf3; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.15s; text-align: center;
  }
  .dc-option:hover:not(:disabled):not(.correct):not(.wrong) {
    border-color: #7c3aed60; background: #7c3aed10;
  }
  .dc-option.correct { border-color: #22c55e; background: #22c55e18; color: #4ade80; }
  .dc-option.wrong   { border-color: #ef4444; background: #ef444418; color: #f87171; }
  .dc-option:disabled { cursor: not-allowed; }

  .dc-feedback {
    margin-top: 16px; padding: 12px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 600; text-align: center;
  }
  .dc-feedback.correct { background: #22c55e18; color: #4ade80; border: 1px solid #22c55e30; }
  .dc-feedback.wrong   { background: #ef444418; color: #f87171; border: 1px solid #ef444430; }

  .dc-next-btn {
    width: 100%; margin-top: 16px; padding: 14px;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    color: #fff; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; border: none; border-radius: 10px;
    cursor: pointer; transition: box-shadow 0.15s, transform 0.15s;
  }
  .dc-next-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,0.4); }

  /* Results */
  .dc-result-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 20px;
    padding: 36px 28px; text-align: center;
    animation: dc-fadein 0.4s ease both;
  }
  .dc-emoji-row { font-size: 32px; letter-spacing: 4px; margin-bottom: 16px; }
  .dc-result-score { font-size: 48px; font-weight: 800; color: #c4b5fd; line-height: 1; }
  .dc-result-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
  .dc-result-msg { font-size: 18px; font-weight: 700; color: #e6edf3; margin-top: 20px; }

  .dc-share-btn {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 24px; padding: 14px 28px;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    color: #fff; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; border: none; border-radius: 10px;
    cursor: pointer; transition: box-shadow 0.15s, transform 0.15s;
  }
  .dc-share-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,0.4); }

  .dc-comeback {
    margin-top: 24px; padding: 16px; border-radius: 10px;
    background: #1c2128; border: 1px solid #30363d;
    font-size: 13px; color: #6b7280;
  }
`;

function QuestionCard({
  question,
  questionIndex,
  total,
  onAnswer,
}: {
  question: DailyQuestion;
  questionIndex: number;
  total: number;
  onAnswer: (firstTry: boolean, emoji: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [answered, setAnswered] = useState<string | null>(null);
  const [firstTry, setFirstTry] = useState(true);
  const [wrongAttempts, setWrongAttempts] = useState<Set<string>>(new Set());
  const [showNext, setShowNext] = useState(false);

  const playAudio = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    await audioPlayer.initAudioContext();
    try {
      if (question.type === 'interval') {
        await audioPlayer.playSequence(question.notes, 700);
      } else {
        audioPlayer.playChord(question.notes);
        await new Promise(r => setTimeout(r, 1200));
      }
    } finally {
      setPlaying(false);
    }
  }, [playing, question]);

  // Auto-play on mount
  useEffect(() => {
    const t = setTimeout(() => { playAudio(); }, 400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleOption(option: string) {
    if (answered) return;
    if (option === question.correctAnswer) {
      setAnswered(option);
      const emoji = firstTry ? '⭐' : '🔶';
      setShowNext(true);
      setTimeout(() => onAnswer(firstTry, emoji), 1200);
    } else {
      setFirstTry(false);
      setWrongAttempts(prev => new Set([...prev, option]));
    }
  }

  const isCorrect = answered === question.correctAnswer;

  return (
    <div className="dc-card">
      <div className="dc-type-label">
        Question {questionIndex + 1} of {total} —{' '}
        {question.type === 'interval' ? 'Identify the interval' : 'Identify the chord'}
      </div>

      <button className={`dc-play-btn${playing ? ' playing' : ''}`} onClick={playAudio} disabled={playing}>
        <Volume2 size={20} />
        {playing ? 'Playing…' : 'Play again'}
      </button>

      <div className="dc-options">
        {question.options.map(opt => {
          const isWrong = wrongAttempts.has(opt);
          const isThis = answered === opt;
          return (
            <button
              key={opt}
              className={`dc-option${isThis && isCorrect ? ' correct' : ''}${isWrong ? ' wrong' : ''}`}
              onClick={() => handleOption(opt)}
              disabled={!!answered || isWrong}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`dc-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {firstTry ? '⭐ Perfect!' : '🔶 Correct!'}
        </div>
      )}

      {showNext && questionIndex < total - 1 && (
        <button className="dc-next-btn" onClick={() => onAnswer(firstTry, firstTry ? '⭐' : '🔶')}>
          Next question →
        </button>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: DailyResult }) {
  const [copied, setCopied] = useState(false);

  const percentage = Math.round((result.firstTryCount / result.total) * 100);
  const msg =
    percentage === 100 ? '🏆 Flawless!' :
    percentage >= 80 ? '🔥 Excellent!' :
    percentage >= 60 ? '👍 Nice work!' :
    percentage >= 40 ? '💪 Keep going!' : '🎵 Practice makes perfect!';

  async function handleShare() {
    const text = buildShareText(result);
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  }

  const nextMidnight = new Date();
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  const hoursLeft = Math.ceil((nextMidnight.getTime() - Date.now()) / 3600000);

  return (
    <div className="dc-result-card">
      <div className="dc-emoji-row">{result.emojis.join('')}</div>
      <div className="dc-result-score">{result.firstTryCount}/{result.total}</div>
      <div className="dc-result-label">first-try correct</div>
      <div className="dc-result-msg">{msg}</div>

      <div>
        <button className="dc-share-btn" onClick={handleShare}>
          {copied ? <CheckCircle size={16} /> : <Share2 size={16} />}
          {copied ? 'Copied!' : 'Share result'}
        </button>
      </div>

      <div className="dc-comeback">
        <strong style={{ color: '#8b949e' }}>🕐 Next challenge in {hoursLeft}h</strong>
        <br />
        Come back tomorrow for a new set of questions
      </div>
    </div>
  );
}

export default function DailyChallengeFeature() {
  const { user } = useAuth();
  const [questions] = useState(() => generateDailyQuestions());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared] = useState(false);

  const dayNumber = getDayNumber();
  const today = getTodayKey();

  // Check if already completed today
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const ref = doc(db, 'users', user.uid, 'data', 'daily');
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        const todayData = data[today] as DailyResult | undefined;
        if (todayData?.completed) setResult(todayData);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, today]);

  async function saveResult(finalResult: DailyResult) {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'data', 'daily');
    await setDoc(ref, { [today]: finalResult }, { merge: true }).catch(() => {});
  }

  function handleAnswer(firstTry: boolean, emoji: string) {
    const newEmojis = [...emojis, emoji];
    const newFirstTryCount = firstTryCount + (firstTry ? 1 : 0);
    setEmojis(newEmojis);
    setFirstTryCount(newFirstTryCount);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      const finalResult: DailyResult = {
        date: today,
        completed: true,
        firstTryCount: newFirstTryCount,
        total: questions.length,
        emojis: newEmojis,
        completedAt: Date.now(),
      };
      setResult(finalResult);
      saveResult(finalResult);
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>Loading…</div>
    );
  }

  return (
    <div className="dc-container">
      <style>{CSS}</style>

      <div className="dc-header">
        <div className="dc-day-badge">DAILY #{dayNumber}</div>
        <h2 className="dc-title">Daily Challenge</h2>
        <p className="dc-subtitle">
          {result ? 'Today\'s challenge — completed!' : 'Same challenge for everyone · Resets at midnight'}
        </p>
      </div>

      {/* Progress dots */}
      <div className="dc-progress">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`dc-dot${
              result || i < (result ? questions.length : currentIndex) ? ' done' :
              i === currentIndex && !result ? ' current' : ''
            }`}
          />
        ))}
      </div>

      {result ? (
        <ResultCard result={result} />
      ) : (
        <QuestionCard
          key={currentIndex}
          question={questions[currentIndex]}
          questionIndex={currentIndex}
          total={questions.length}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  );
}
