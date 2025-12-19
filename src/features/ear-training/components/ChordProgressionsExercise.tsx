/**
 * CHORD PROGRESSIONS EXERCISE
 * Riconoscimento progressioni armoniche
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, Trophy, Settings } from 'lucide-react';
import { audioPlayer } from '../utils/audio-player';
import { CHORD_PROGRESSIONS, generateRandomProgression, ProgressionDifficulty, ChordProgression } from '../utils/interval-data';
import { generateRandomProgressionWithHistory } from '../utils/random-with-history';

interface ProgressionQuestion {
  progression: ChordProgression;
  chords: string[][];
  degrees: string[];
}

type DifficultyLevel = 'simple-triads' | 'all-triads' | 'triads-and-sevenths';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'simple-triads', label: 'Simple Triads (I, IV, V)' },
  { value: 'all-triads', label: 'All Triads (I, II, III, IV, V, VI, VII)' },
  { value: 'triads-and-sevenths', label: 'Triads and Sevenths' },
];

export function ChordProgressionsExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple-triads');
  const [showSettings, setShowSettings] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<ProgressionQuestion | null>(null);
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
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const generateQuestion = useCallback(() => {
    const result = generateRandomProgressionWithHistory(difficulty as ProgressionDifficulty);
    setCurrentQuestion(result);
  }, [difficulty]);

  const getAvailableProgressions = useCallback(() => {
    return CHORD_PROGRESSIONS.filter((p) => p.category === difficulty);
  }, [difficulty]);

  const playProgression = useCallback(async () => {
    if (!currentQuestion) {
      console.error('❌ No current question!');
      return;
    }

    console.log('🎹 Playing progression:', currentQuestion.progression.name);

    setIsPlaying(true);
    try {
      // Suona ogni accordo della progressione
      for (const chord of currentQuestion.chords) {
        console.log('🎵 Playing chord:', chord);
        await audioPlayer.playChord(chord);
        await audioPlayer.delay(800); // 800ms tra gli accordi
      }
      console.log('✅ Progression played successfully');
    } catch (error) {
      console.error('❌ Error playing progression:', error);
    }
    setIsPlaying(false);
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (progressionName: string) => {
      if (!currentQuestion) return;
      if (isCorrect) return;
      if (attempts.has(progressionName)) return;

      const newAttempts = new Set(attempts);
      newAttempts.add(progressionName);
      setAttempts(newAttempts);

      const correctAnswer = currentQuestion.progression.name;

      if (progressionName === correctAnswer) {
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
        newWrongAttempts.add(progressionName);
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

  const availableProgressions = getAvailableProgressions();

  return (
    <div className='exercise-container'>
      {/* Header with Settings Button */}
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>Chord Progressions</h3>
            <p className='exercise-description'>Identify the progression on the first try to score!</p>
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
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playProgression} disabled={isPlaying || isCorrect}>
          <Volume2 size={32} />
          <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Progression'}</span>
        </button>
        <p className='playback-hint'>
          {isCorrect
            ? isFirstTry
              ? `✅ Perfect! ${currentQuestion.progression.name}`
              : `✅ Found it: ${currentQuestion.progression.name}`
            : isFirstTry
            ? 'First attempt - make it count!'
            : 'Keep trying to find the progression'}
        </p>
      </div>

      {/* Answer Grid */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          {isCorrect ? `It was ${currentQuestion.progression.name}` : 'Select the progression you heard:'}
        </h4>
        <div className='answer-grid progressions-grid'>
          {availableProgressions.map((progression) => {
            const isSelectedCorrect = isCorrect && progression.name === currentQuestion.progression.name;
            const isWrong = wrongAttempts.has(progression.name);
            const isDisabled = isCorrect || attempts.has(progression.name);

            return (
              <button
                key={progression.name}
                onClick={() => handleAnswer(progression.name)}
                disabled={isDisabled}
                className={`answer-button progression-button ${isSelectedCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
              >
                <span className='progression-name'>{progression.name}</span>
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
              You've tried {wrongAttempts.size} incorrect progression{wrongAttempts.size > 1 ? 's' : ''}.
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
                  Correct: <strong>{currentQuestion.progression.name}</strong>
                </p>
                <p className='progression-detail'>Degrees: {currentQuestion.degrees.join(' - ')}</p>
                <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>
              </>
            ) : (
              <>
                <h4>Found it!</h4>
                <p>
                  The progression was <strong>{currentQuestion.progression.name}</strong>
                </p>
                <p className='progression-detail'>Degrees: {currentQuestion.degrees.join(' - ')}</p>
                <p className='hint'>But it took {attempts.size} attempts, so no points this time</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
