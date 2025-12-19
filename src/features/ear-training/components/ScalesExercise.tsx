/**
 * SCALES EXERCISE - WITH SCALE_DATA.JSON
 * Usa scale precalcolate invece di generarle dinamicamente
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, Trophy, Settings } from 'lucide-react';
import { audioPlayer } from '../utils/audio-player';
import { generateRandomScaleFromData, getAvailableScales } from '../utils/scale-data-loader';
import { generateRandomScaleWithHistory } from '../utils/random-with-history';

interface ScaleQuestion {
  scaleName: string;
  root: string;
  notes: string[];
}

type DifficultyLevel = 'simple' | 'all';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'simple', label: 'Simple (Major, Natural Minor, Harmonic Minor)' },
  { value: 'all', label: 'All Scales (Including Modes & Others)' },
];

export function ScalesExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple');
  const [showSettings, setShowSettings] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<ScaleQuestion | null>(null);
  const [attempts, setAttempts] = useState<Set<string>>(new Set());
  const [wrongAttempts, setWrongAttempts] = useState<Set<string>>(new Set());
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isFirstTry, setIsFirstTry] = useState<boolean>(true);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Preload audio on mount
  useEffect(() => {
    audioPlayer.preloadAllNotes();
  }, []);

  // Generate question when settings change
  useEffect(() => {
    generateQuestion();
  }, [difficulty]);

  // Auto-advance after correct answer
  useEffect(() => {
    if (isCorrect) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 1000); // 1 secondo

      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const generateQuestion = useCallback(() => {
    const question = generateRandomScaleWithHistory(difficulty);
    setCurrentQuestion(question);
  }, [difficulty]);

  const getAvailableScaleNames = useCallback(() => {
    const scales = getAvailableScales();
    const filtered = difficulty === 'simple' ? scales.filter((s) => s.category === 'simple') : scales;

    return filtered.map((s) => s.name);
  }, [difficulty]);

  const playScale = useCallback(async () => {
    if (!currentQuestion) {
      console.error('❌ No current question!');
      return;
    }

    console.log('🎹 Playing scale:', currentQuestion.scaleName, 'from', currentQuestion.root);
    console.log('🎵 Notes to play:', currentQuestion.notes);

    setIsPlaying(true);
    try {
      // Suona la scala in sequenza con volume ridotto (50%)
      await audioPlayer.playSequence(currentQuestion.notes, 400, 0.5);
      console.log('✅ Scale played successfully');
    } catch (error) {
      console.error('❌ Error playing scale:', error);
    }
    setTimeout(() => setIsPlaying(false), currentQuestion.notes.length * 450);
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (scaleName: string) => {
      if (!currentQuestion) return;
      if (isCorrect) return;
      if (attempts.has(scaleName)) return;

      const newAttempts = new Set(attempts);
      newAttempts.add(scaleName);
      setAttempts(newAttempts);

      const correctAnswer = currentQuestion.scaleName;

      if (scaleName === correctAnswer) {
        setIsCorrect(true);

        if (isFirstTry) {
          setScore((prev) => ({
            correct: prev.correct + 1,
            total: prev.total + 1,
          }));

          const newStreak = streak + 1;
          setStreak(newStreak);
          if (newStreak > bestStreak) {
            setBestStreak(newStreak);
          }
        } else {
          setScore((prev) => ({
            correct: prev.correct,
            total: prev.total + 1,
          }));
          setStreak(0);
        }
      } else {
        setIsFirstTry(false);

        const newWrongAttempts = new Set(wrongAttempts);
        newWrongAttempts.add(scaleName);
        setWrongAttempts(newWrongAttempts);
      }
    },
    [currentQuestion, isCorrect, attempts, wrongAttempts, streak, bestStreak, isFirstTry]
  );

  const nextQuestion = useCallback(() => {
    if (!isCorrect) {
      setScore((prev) => ({
        correct: prev.correct,
        total: prev.total + 1,
      }));
      setStreak(0);
    }

    generateQuestion();
    setAttempts(new Set());
    setWrongAttempts(new Set());
    setIsCorrect(false);
    setIsFirstTry(true);
  }, [isCorrect, generateQuestion]);

  const resetScore = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    nextQuestion();
  }, [nextQuestion]);

  if (!currentQuestion) {
    console.log('⚠️ No current question, returning null');
    return null;
  }

  const availableScaleNames = getAvailableScaleNames();

  return (
    <div className='exercise-container'>
      {/* Header with Settings Button */}
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>Scale Recognition</h3>
            <p className='exercise-description'>Identify the scale on the first try to score!</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className='settings-toggle-button' title='Settings'>
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className='settings-panel'>
          <h4 className='settings-title'>Exercise Settings</h4>

          {/* Difficulty Selection */}
          <div className='settings-section'>
            <label className='settings-label'>Difficulty:</label>
            <div className='settings-options'>
              {DIFFICULTY_OPTIONS.map((option) => (
                <label key={option.value} className='settings-radio'>
                  <input
                    type='radio'
                    name='difficulty'
                    value={option.value}
                    checked={difficulty === option.value}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className='exercise-stats'>
        <div className='stat-item'>
          <span className='stat-label'>Score</span>
          <span className='stat-value'>
            {score.correct} / {score.total}
            {score.total > 0 && <span className='stat-percentage'>({Math.round((score.correct / score.total) * 100)}%)</span>}
          </span>
        </div>

        <div className='stat-item'>
          <span className='stat-label'>Attempts</span>
          <span className='stat-value attempts-count'>{attempts.size}</span>
        </div>

        <div className='stat-item'>
          <span className='stat-label'>Streak</span>
          <span className='stat-value streak'>{streak} 🔥</span>
        </div>

        {bestStreak > 0 && (
          <div className='stat-item'>
            <span className='stat-label'>Best</span>
            <span className='stat-value best-streak'>
              <Trophy size={16} />
              {bestStreak}
            </span>
          </div>
        )}
      </div>

      {/* Play Button */}
      <div className='exercise-playback'>
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playScale} disabled={isPlaying || isCorrect}>
          <Volume2 size={32} />
          <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Scale'}</span>
        </button>
        <p className='playback-hint'>
          {isCorrect
            ? isFirstTry
              ? `✅ Perfect! ${currentQuestion.scaleName} in ${currentQuestion.root}`
              : `✅ Found it: ${currentQuestion.scaleName} in ${currentQuestion.root}`
            : isFirstTry
            ? 'First attempt - make it count!'
            : 'Keep trying to find the scale'}
        </p>
      </div>

      {/* Answer Grid */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          {isCorrect ? `It was ${currentQuestion.scaleName} in ${currentQuestion.root}` : 'Select the scale you heard:'}
        </h4>
        <div className='answer-grid scales-grid'>
          {availableScaleNames.map((scaleName) => {
            const isSelectedCorrect = isCorrect && scaleName === currentQuestion.scaleName;
            const isWrong = wrongAttempts.has(scaleName);
            const isDisabled = isCorrect || attempts.has(scaleName);

            return (
              <button
                key={scaleName}
                onClick={() => handleAnswer(scaleName)}
                disabled={isDisabled}
                className={`answer-button scale-button ${isSelectedCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
              >
                <span className='scale-name'>{scaleName}</span>
                {isSelectedCorrect && (
                  <span className='answer-icon'>
                    <Check size={20} />
                  </span>
                )}
                {isWrong && (
                  <span className='answer-icon'>
                    <X size={20} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className='exercise-actions'>
        {isCorrect ? (
          <div className='auto-advance-message'>Next question in 1s... ⏱️</div>
        ) : (
          <>
            <button className='btn btn-ghost' onClick={resetScore}>
              Reset Score
            </button>
            <button className='btn btn-secondary' onClick={nextQuestion}>
              Skip Question
            </button>
          </>
        )}
      </div>

      {/* Feedback */}
      {wrongAttempts.size > 0 && !isCorrect && (
        <div className='exercise-feedback error'>
          <div className='feedback-icon'>
            <X size={32} />
          </div>
          <div className='feedback-content'>
            <h4>Not quite!</h4>
            <p>
              You've tried {wrongAttempts.size} incorrect scale{wrongAttempts.size > 1 ? 's' : ''}.
            </p>
            <p className='hint'>⚠️ This question will not count towards your score</p>
          </div>
        </div>
      )}

      {isCorrect && (
        <div className={`exercise-feedback ${isFirstTry ? 'success' : 'warning'}`}>
          <div className='feedback-icon'>{isFirstTry ? <Check size={32} /> : <X size={32} />}</div>
          <div className='feedback-content'>
            {isFirstTry ? (
              <>
                <h4>Perfect! 🎉</h4>
                <p>
                  Correct: <strong>{currentQuestion.scaleName}</strong> in <strong>{currentQuestion.root}</strong>
                </p>
                <p className='scale-detail'>
                  {currentQuestion.notes.length} notes: {currentQuestion.notes.join(' - ')}
                </p>
                <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>
              </>
            ) : (
              <>
                <h4>Found it!</h4>
                <p>
                  The scale was <strong>{currentQuestion.scaleName}</strong> in <strong>{currentQuestion.root}</strong>
                </p>
                <p className='scale-detail'>
                  {currentQuestion.notes.length} notes: {currentQuestion.notes.join(' - ')}
                </p>
                <p className='hint'>But it took {attempts.size} attempts, so no points this time</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
