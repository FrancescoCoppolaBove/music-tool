/**
 * INTERVALS EXERCISE - STRICT SCORING
 * Solo il primo tentativo conta per lo score
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, Trophy } from 'lucide-react';
import { audioPlayer } from '../utils/audio-player';
import { INTERVALS } from '../utils/interval-data';
import { generateRandomIntervalWithHistory } from '../utils/random-with-history';

interface IntervalQuestion {
  rootNote: string;
  secondNote: string;
  interval: (typeof INTERVALS)[number];
}

export function IntervalsExercise() {
  const [currentQuestion, setCurrentQuestion] = useState<IntervalQuestion>(() => generateRandomIntervalWithHistory());
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

  const nextQuestion = useCallback(() => {
    // Se non ha ancora indovinato, conta come errore
    if (!isCorrect) {
      setScore((prev) => ({
        correct: prev.correct,
        total: prev.total + 1,
      }));
      setStreak(0);
    }

    // Reset per prossima domanda - genera intervallo diverso
    setCurrentQuestion(generateRandomIntervalWithHistory());
    setAttempts(new Set());
    setWrongAttempts(new Set());
    setIsCorrect(false);
    setIsFirstTry(true); // Reset first try flag
  }, [isCorrect]);

  // Auto-advance after correct answer
  useEffect(() => {
    if (isCorrect) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 1000); // 1 secondo

      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const playInterval = useCallback(async () => {
    setIsPlaying(true);
    try {
      // Volume ridotto per evitare clipping
      await audioPlayer.playSequence([currentQuestion.rootNote, currentQuestion.secondNote], 600, 0.8);
    } catch (error: any) {
      console.error('Error playing interval:', error);
    }
    setTimeout(() => setIsPlaying(false), 1500);
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (intervalName: string) => {
      // Se già indovinato, non fare nulla
      if (isCorrect) return;

      // Se già provato questo intervallo, non fare nulla
      if (attempts.has(intervalName)) return;

      // Aggiungi alle attempts
      const newAttempts = new Set(attempts);
      newAttempts.add(intervalName);
      setAttempts(newAttempts);

      const correctAnswer = currentQuestion.interval.name;

      if (intervalName === correctAnswer) {
        // CORRETTO! 🎉
        setIsCorrect(true);

        // Update score - SOLO se primo tentativo
        if (isFirstTry) {
          setScore((prev) => ({
            correct: prev.correct + 1,
            total: prev.total + 1,
          }));

          // Update streak - solo se primo tentativo
          const newStreak = streak + 1;
          setStreak(newStreak);
          if (newStreak > bestStreak) {
            setBestStreak(newStreak);
          }
        } else {
          // Non è primo tentativo - conta come sbagliato nello score
          setScore((prev) => ({
            correct: prev.correct,
            total: prev.total + 1,
          }));

          // Reset streak
          setStreak(0);
        }
      } else {
        // SBAGLIATO! ❌
        setIsFirstTry(false); // Non è più il primo tentativo

        const newWrongAttempts = new Set(wrongAttempts);
        newWrongAttempts.add(intervalName);
        setWrongAttempts(newWrongAttempts);
      }
    },
    [currentQuestion, isCorrect, attempts, wrongAttempts, streak, bestStreak, isFirstTry]
  );

  const resetScore = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    nextQuestion();
  }, [nextQuestion]);

  return (
    <div className='exercise-container'>
      {/* Header */}
      <div className='exercise-header'>
        <h3 className='exercise-title'>Interval Recognition</h3>
        <p className='exercise-description'>Identify the interval on the first try to score!</p>
      </div>

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
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playInterval} disabled={isPlaying || isCorrect}>
          <Volume2 size={32} />
          <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Interval'}</span>
        </button>
        <p className='playback-hint'>
          {isCorrect
            ? isFirstTry
              ? `✅ Perfect! ${currentQuestion.rootNote} → ${currentQuestion.secondNote}`
              : `✅ Found it: ${currentQuestion.rootNote} → ${currentQuestion.secondNote}`
            : isFirstTry
            ? 'First attempt - make it count!'
            : 'Keep trying to find the interval'}
        </p>
      </div>

      {/* Answer Grid */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          {isCorrect ? `It was a ${currentQuestion.interval.name}` : 'Select the interval you heard:'}
        </h4>
        <div className='answer-grid intervals-grid'>
          {INTERVALS.map((interval) => {
            const isSelectedCorrect = isCorrect && interval.name === currentQuestion.interval.name;
            const isWrong = wrongAttempts.has(interval.name);
            const isDisabled = isCorrect || attempts.has(interval.name);

            return (
              <button
                key={interval.name}
                onClick={() => handleAnswer(interval.name)}
                disabled={isDisabled}
                className={`answer-button interval-button ${isSelectedCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
              >
                <span className='interval-short'>{interval.shortName}</span>
                <span className='interval-full'>{interval.name}</span>
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
              You've tried {wrongAttempts.size} incorrect interval{wrongAttempts.size > 1 ? 's' : ''}.
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
                  Correct: <strong>{currentQuestion.interval.name}</strong> ({currentQuestion.interval.shortName})
                </p>
                <p className='interval-detail'>
                  {currentQuestion.rootNote} → {currentQuestion.secondNote} = {currentQuestion.interval.semitones} semitone
                  {currentQuestion.interval.semitones !== 1 ? 's' : ''}
                </p>
                <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>
              </>
            ) : (
              <>
                <h4>Found it!</h4>
                <p>
                  The interval was <strong>{currentQuestion.interval.name}</strong> ({currentQuestion.interval.shortName})
                </p>
                <p className='interval-detail'>
                  {currentQuestion.rootNote} → {currentQuestion.secondNote} = {currentQuestion.interval.semitones} semitone
                  {currentQuestion.interval.semitones !== 1 ? 's' : ''}
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
