/**
 * SCALE DEGREES EXERCISE
 * Riconoscimento gradi della scala in contesto tonale
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, Trophy, Settings } from 'lucide-react';
import { audioPlayer } from '../utils/audio-player';
import { generateRandomScaleDegreeWithHistory } from '../utils/random-with-history';
import {
  getScaleDegreesByDifficulty,
  generateTargetNoteFromDegree,
  type ScaleDegreeDifficulty,
  type ScaleDegree,
} from '../utils/scale-degrees-data';

interface ScaleDegreeQuestion {
  scaleDegree: ScaleDegree;
  key: string;
  targetNote: string;
  contextProgression: {
    progression: any;
    chords: string[][];
    degrees: string[];
  };
}

type DifficultyLevel = 'simple' | 'diatonic' | 'chromatic';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'simple', label: 'Simple (1st, 3rd, 5th)' },
  { value: 'diatonic', label: 'Diatonic (All 7 degrees)' },
  { value: 'chromatic', label: 'Chromatic (All 12 degrees)' },
];

export function ScaleDegreesExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple');
  const [showSettings, setShowSettings] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<ScaleDegreeQuestion | null>(null);
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
    const question = generateRandomScaleDegreeWithHistory(difficulty as ScaleDegreeDifficulty);

    console.log('🎼 Generated scale degree question:');
    console.log('   Degree:', question.scaleDegree.name);
    console.log('   Key:', question.key);
    console.log('   Target note:', question.targetNote);

    setCurrentQuestion(question);
  }, [difficulty]);

  const getAvailableDegrees = useCallback(() => {
    return getScaleDegreesByDifficulty(difficulty as ScaleDegreeDifficulty);
  }, [difficulty]);

  const playContextAndNote = useCallback(async () => {
    if (!currentQuestion) {
      console.error('❌ No current question!');
      return;
    }

    console.log('🎹 Playing context progression + target note');

    setIsPlaying(true);
    try {
      // 1. Suona progressione di contesto
      for (const chord of currentQuestion.contextProgression.chords) {
        console.log('🎵 Playing chord:', chord);
        await audioPlayer.playChord(chord);
        await audioPlayer.delay(600); // 600ms tra accordi
      }

      // 2. Pausa prima della nota target
      await audioPlayer.delay(500);

      // 3. Suona nota target
      console.log('🎵 Playing target note:', currentQuestion.targetNote);
      await audioPlayer.playNote(currentQuestion.targetNote, 0.8);

      console.log('✅ Context + note played successfully');
    } catch (error) {
      console.error('❌ Error playing context + note:', error);
    }
    setIsPlaying(false);
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (degreeName: string) => {
      if (!currentQuestion) return;
      if (isCorrect) return;
      if (attempts.has(degreeName)) return;

      const newAttempts = new Set(attempts);
      newAttempts.add(degreeName);
      setAttempts(newAttempts);

      const correctAnswer = currentQuestion.scaleDegree.name;

      if (degreeName === correctAnswer) {
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
        newWrongAttempts.add(degreeName);
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

  const availableDegrees = getAvailableDegrees();

  return (
    <div className='exercise-container'>
      {/* Header with Settings Button */}
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>Scale Degrees</h3>
            <p className='exercise-description'>Identify the scale degree on the first try to score!</p>
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
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playContextAndNote} disabled={isPlaying || isCorrect}>
          <Volume2 size={32} />
          <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Context + Note'}</span>
        </button>
        <p className='playback-hint'>
          {isCorrect
            ? isFirstTry
              ? `✅ Perfect! Degree ${currentQuestion.scaleDegree.name}`
              : `✅ Found it: Degree ${currentQuestion.scaleDegree.name}`
            : isFirstTry
            ? 'First attempt - make it count!'
            : 'Keep trying to find the degree'}
        </p>
      </div>

      {/* Answer Grid */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          {isCorrect
            ? `It was degree ${currentQuestion.scaleDegree.name} (${currentQuestion.targetNote.replace('2', '').replace('3', '')})`
            : 'Select the scale degree you heard:'}
        </h4>
        <div className='answer-grid degrees-grid'>
          {availableDegrees.map((degree) => {
            const isSelectedCorrect = isCorrect && degree.name === currentQuestion.scaleDegree.name;
            const isWrong = wrongAttempts.has(degree.name);
            const isDisabled = isCorrect || attempts.has(degree.name);

            // Calcola il nome della nota per questo grado nella tonalità corrente
            const targetNoteForDegree = generateTargetNoteFromDegree(currentQuestion.key, degree);
            const noteName = targetNoteForDegree.replace('2', '').replace('3', '');

            return (
              <button
                key={degree.name}
                onClick={() => handleAnswer(degree.name)}
                disabled={isDisabled}
                className={`answer-button degree-button ${isSelectedCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
              >
                <span className='degree-name'>{degree.name}</span>
                <span className='degree-note-name'>{noteName}</span>
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
              You've tried {wrongAttempts.size} incorrect degree{wrongAttempts.size > 1 ? 's' : ''}.
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
                  Correct: <strong>Degree {currentQuestion.scaleDegree.name}</strong> ={' '}
                  <strong>{currentQuestion.targetNote.replace('2', '').replace('3', '')}</strong>
                </p>
                <p className='degree-detail'>
                  Context: {currentQuestion.contextProgression.progression.name} in {currentQuestion.key.replace('2', '')} major
                </p>
                <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>
              </>
            ) : (
              <>
                <h4>Found it!</h4>
                <p>
                  The degree was <strong>{currentQuestion.scaleDegree.name}</strong> ={' '}
                  <strong>{currentQuestion.targetNote.replace('2', '').replace('3', '')}</strong>
                </p>
                <p className='degree-detail'>
                  Context: {currentQuestion.contextProgression.progression.name} in {currentQuestion.key.replace('2', '')} major
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
