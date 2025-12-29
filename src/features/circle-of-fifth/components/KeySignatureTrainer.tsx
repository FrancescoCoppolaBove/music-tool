/**
 * KEY SIGNATURES TRAINER - FIXED
 * Educational quiz for learning key signatures
 */

import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Timer, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { CIRCLE_ORDER, MINOR_CIRCLE_ORDER, MAJOR_KEYS, MINOR_KEYS } from '../utils/circle-of-fifths-data';

type QuestionType = 'accidentals-to-key' | 'key-to-accidentals' | 'relative-key' | 'mixed';
type Mode = 'major' | 'minor' | 'both';

interface Question {
  type: QuestionType;
  mode: 'major' | 'minor';
  key: string;
  correctAnswer: string | number;
  options: (string | number)[];
}

interface QuizStats {
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
  totalTime: number;
}

export function KeySignaturesTrainer() {
  const [quizMode, setQuizMode] = useState<Mode>('both');
  const [questionType, setQuestionType] = useState<QuestionType>('mixed');
  const [isActive, setIsActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Set<string | number>>(new Set()); // Track wrong answers
  const [showResult, setShowResult] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false); // Lock during transition
  const [stats, setStats] = useState<QuizStats>({
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
    totalTime: 0,
  });
  const [startTime, setStartTime] = useState<number>(0);
  const [isSpeedRun, setIsSpeedRun] = useState(false);
  const [speedRunTimer, setSpeedRunTimer] = useState(0);

  // Speed run timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && isSpeedRun) {
      interval = setInterval(() => {
        setSpeedRunTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isSpeedRun]);

  // Generate random question
  const generateQuestion = (): Question => {
    const modes: ('major' | 'minor')[] = quizMode === 'both' ? ['major', 'minor'] : [quizMode];
    const mode = modes[Math.floor(Math.random() * modes.length)];

    const keys = mode === 'major' ? CIRCLE_ORDER : MINOR_CIRCLE_ORDER;
    const keyData = mode === 'major' ? MAJOR_KEYS : MINOR_KEYS;

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const keyInfo = keyData[randomKey];

    // Determine question type
    let type = questionType;
    if (type === 'mixed') {
      const types: QuestionType[] = ['accidentals-to-key', 'key-to-accidentals', 'relative-key'];
      type = types[Math.floor(Math.random() * types.length)];
    }

    switch (type) {
      case 'accidentals-to-key': {
        const accidentalText =
          Math.abs(keyInfo.accidentals) === 0
            ? 'no sharps or flats'
            : `${Math.abs(keyInfo.accidentals)} ${keyInfo.accidentalType}${Math.abs(keyInfo.accidentals) > 1 ? 's' : ''}`;

        // Get 3 unique wrong keys
        const availableWrongKeys = keys.filter((k) => k !== randomKey);
        const wrongKeys = shuffle(availableWrongKeys).slice(0, 3);
        const options = shuffle([randomKey, ...wrongKeys]);

        return {
          type,
          mode,
          key: accidentalText,
          correctAnswer: randomKey,
          options,
        };
      }

      case 'key-to-accidentals': {
        // Generate 3 unique wrong accidentals
        const wrongAccidentals: number[] = [];
        const attempts = 0;
        const maxAttempts = 50;

        while (wrongAccidentals.length < 3 && attempts < maxAttempts) {
          const wrongAcc = Math.floor(Math.random() * 7) * (Math.random() > 0.5 ? 1 : -1);
          if (wrongAcc !== keyInfo.accidentals && !wrongAccidentals.includes(wrongAcc)) {
            wrongAccidentals.push(wrongAcc);
          }
        }

        const options = shuffle([keyInfo.accidentals, ...wrongAccidentals]);

        return {
          type,
          mode,
          key: randomKey,
          correctAnswer: keyInfo.accidentals,
          options,
        };
      }

      case 'relative-key': {
        const relativeKey = mode === 'major' ? keyInfo.relativeMinor : keyInfo.relativeMajor;

        // Get 3 unique wrong keys
        const availableWrongKeys = keys.filter((k) => k !== randomKey);
        const wrongKeys = shuffle(availableWrongKeys).slice(0, 3);

        // Get relative keys (will be unique since source keys are unique)
        const wrongRelatives = wrongKeys.map((k) => (mode === 'major' ? keyData[k].relativeMinor : keyData[k].relativeMajor));

        const options = shuffle([relativeKey, ...wrongRelatives]);

        return {
          type,
          mode,
          key: randomKey,
          correctAnswer: relativeKey!,
          options,
        };
      }

      default:
        return generateQuestion();
    }
  };

  // Start quiz
  const startQuiz = () => {
    setIsActive(true);
    setStartTime(Date.now());
    setSpeedRunTimer(0);
    setStats({
      correct: 0,
      incorrect: 0,
      streak: 0,
      bestStreak: 0,
      totalTime: 0,
    });
    nextQuestion();
  };

  // Next question
  const nextQuestion = () => {
    setCurrentQuestion(generateQuestion());
    setSelectedAnswer(null);
    setWrongAnswers(new Set()); // Reset wrong answers for new question
    setShowResult(false);
    setIsAdvancing(false); // Reset lock
  };

  // Check answer - FIXED: only count first attempt
  const checkAnswer = (answer: string | number) => {
    const isCorrect = answer === currentQuestion?.correctAnswer;

    // Only count stats on FIRST attempt (when no answer was selected yet)
    if (selectedAnswer === null) {
      setStats((prev) => {
        const newStreak = isCorrect ? prev.streak + 1 : 0;
        return {
          correct: prev.correct + (isCorrect ? 1 : 0),
          incorrect: prev.incorrect + (isCorrect ? 0 : 1),
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          totalTime: prev.totalTime + (Date.now() - startTime),
        };
      });

      setStartTime(Date.now());
    }

    // Add to wrong answers if incorrect
    if (!isCorrect) {
      setWrongAnswers((prev) => new Set(prev).add(answer));
    }

    setSelectedAnswer(answer);
    setShowResult(true);

    // Auto-advance only on correct answer after 1.5s
    if (isCorrect) {
      setIsAdvancing(true); // Lock all buttons during transition
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
  };

  // Get question text
  const getQuestionText = (): string => {
    if (!currentQuestion) return '';

    switch (currentQuestion.type) {
      case 'accidentals-to-key':
        return `Which ${currentQuestion.mode} key has ${currentQuestion.key}?`;
      case 'key-to-accidentals':
        return `How many sharps/flats does ${currentQuestion.key} ${currentQuestion.mode} have?`;
      case 'relative-key':
        return `What is the relative ${currentQuestion.mode === 'major' ? 'minor' : 'major'} of ${currentQuestion.key}?`;
      default:
        return '';
    }
  };

  // Format accidentals answer
  const formatAccidentalsAnswer = (num: number): string => {
    if (num === 0) return 'None (♮)';
    const type = num > 0 ? '♯' : '♭';
    return `${Math.abs(num)} ${type}`;
  };

  return (
    <div className='key-signatures-trainer'>
      {/* Header */}
      <div className='card'>
        <div className='card-header'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className='card-title'>Key Signatures Trainer</h2>
              <p className='card-description'>Master key signatures with interactive quizzes</p>
            </div>
          </div>
        </div>

        {!isActive && (
          <div className='card-content'>
            <div className='trainer-settings'>
              {/* Mode selection */}
              <div className='setting-group'>
                <label className='setting-label'>Keys to practice</label>
                <div className='mode-buttons'>
                  <button onClick={() => setQuizMode('major')} className={`mode-btn ${quizMode === 'major' ? 'active' : ''}`}>
                    Major only
                  </button>
                  <button onClick={() => setQuizMode('minor')} className={`mode-btn ${quizMode === 'minor' ? 'active' : ''}`}>
                    Minor only
                  </button>
                  <button onClick={() => setQuizMode('both')} className={`mode-btn ${quizMode === 'both' ? 'active' : ''}`}>
                    Both
                  </button>
                </div>
              </div>

              {/* Question type */}
              <div className='setting-group'>
                <label className='setting-label'>Question type</label>
                <div className='type-buttons'>
                  <button
                    onClick={() => setQuestionType('accidentals-to-key')}
                    className={`type-btn ${questionType === 'accidentals-to-key' ? 'active' : ''}`}
                  >
                    Accidentals → Key
                  </button>
                  <button
                    onClick={() => setQuestionType('key-to-accidentals')}
                    className={`type-btn ${questionType === 'key-to-accidentals' ? 'active' : ''}`}
                  >
                    Key → Accidentals
                  </button>
                  <button
                    onClick={() => setQuestionType('relative-key')}
                    className={`type-btn ${questionType === 'relative-key' ? 'active' : ''}`}
                  >
                    Relative Keys
                  </button>
                  <button onClick={() => setQuestionType('mixed')} className={`type-btn ${questionType === 'mixed' ? 'active' : ''}`}>
                    Mixed
                  </button>
                </div>
              </div>

              {/* Speed run toggle */}
              <div className='setting-group'>
                <label className='setting-label'>
                  <input type='checkbox' checked={isSpeedRun} onChange={(e) => setIsSpeedRun(e.target.checked)} />
                  Speed run mode (timed)
                </label>
              </div>

              {/* Start button */}
              <button className='start-quiz-btn' onClick={startQuiz}>
                <Zap size={20} />
                Start Quiz
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Active */}
      {isActive && currentQuestion && (
        <div className='quiz-container'>
          {/* Stats Bar */}
          <div className='card stats-bar'>
            <div className='stat-item'>
              <CheckCircle size={18} style={{ color: '#10b981' }} />
              <span>{stats.correct} correct</span>
            </div>
            <div className='stat-item'>
              <XCircle size={18} style={{ color: '#ef4444' }} />
              <span>{stats.incorrect} incorrect</span>
            </div>
            <div className='stat-item'>
              <Trophy size={18} style={{ color: '#f59e0b' }} />
              <span>
                Streak: {stats.streak} (Best: {stats.bestStreak})
              </span>
            </div>
            {isSpeedRun && (
              <div className='stat-item'>
                <Timer size={18} />
                <span>
                  {Math.floor(speedRunTimer / 60)}:{(speedRunTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            <button className='reset-btn' onClick={startQuiz}>
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Question Card */}
          <div className='card question-card'>
            <div className='card-header'>
              <h3 className='question-text'>{getQuestionText()}</h3>
            </div>

            <div className='card-content'>
              <div className='answer-options'>
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  const isWrong = wrongAnswers.has(option);
                  const showCorrectFeedback = showResult && isSelected && isCorrect;
                  const showWrongFeedback = isWrong;
                  // Disable if: (1) already found correct OR (2) already tried and was wrong OR (3) advancing to next
                  const isDisabled = (showResult && isCorrect && isSelected) || isWrong || isAdvancing;

                  return (
                    <button
                      key={idx}
                      onClick={() => !isDisabled && checkAnswer(option)}
                      disabled={isDisabled}
                      className={`answer-option ${isSelected ? 'selected' : ''} ${
                        showCorrectFeedback ? 'correct' : showWrongFeedback ? 'incorrect' : ''
                      }`}
                    >
                      {typeof option === 'number' ? formatAccidentalsAnswer(option) : option}
                      {showCorrectFeedback && <CheckCircle size={20} />}
                      {showWrongFeedback && <XCircle size={20} />}
                    </button>
                  );
                })}
              </div>

              {showResult && selectedAnswer !== currentQuestion.correctAnswer && (
                <div className='feedback-message incorrect'>
                  <span>Try again! Select another answer.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility: Shuffle array
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
