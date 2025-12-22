/**
 * CHORDS EXERCISE - WITH SETTINGS
 * Configurabile: difficoltà accordi e inversioni
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, RotateCcw, Trophy, Settings } from 'lucide-react';
import { audioPlayer } from '../utils/audio-player';
import { CHORD_TYPES, generateRandomChord, ChordDifficulty, ChordInversion } from '../utils/interval-data';
import { generateRandomChordWithHistory } from '../utils/random-with-history';

interface ChordQuestion {
  rootNote: string;
  chordType: (typeof CHORD_TYPES)[number];
  notes: string[];
  inversion: ChordInversion;
}

type DifficultyLevel = 'triads' | 'basic-sevenths' | 'triads-and-basic-sevenths' | 'triads-and-all-sevenths';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'triads', label: 'Triads Only (Major, Minor, Dim, Aug)' },
  { value: 'basic-sevenths', label: 'Basic Sevenths (Dom7, Maj7, Min7)' },
  { value: 'triads-and-basic-sevenths', label: 'Triads + Basic Sevenths' },
  { value: 'triads-and-all-sevenths', label: 'Triads + All Sevenths' },
];

const INVERSION_OPTIONS: { value: ChordInversion; label: string }[] = [
  { value: 'root', label: 'Root Position' },
  { value: 'first', label: '1st Inversion' },
  { value: 'second', label: '2nd Inversion' },
  { value: 'third', label: '3rd Inversion (7th chords only)' },
];

export function ChordsExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('triads');
  const [enabledInversions, setEnabledInversions] = useState<Set<ChordInversion>>(new Set(['root']));
  const [showSettings, setShowSettings] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<ChordQuestion | null>(null);
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
    if (enabledInversions.size > 0) {
      generateQuestion();
    }
  }, [difficulty, enabledInversions]);

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
    const inversionsArray = Array.from(enabledInversions);
    const question = generateRandomChordWithHistory(difficulty as ChordDifficulty, inversionsArray);
    setCurrentQuestion(question);
  }, [difficulty, enabledInversions]);

  const toggleInversion = useCallback((inversion: ChordInversion) => {
    setEnabledInversions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(inversion)) {
        newSet.delete(inversion);
      } else {
        newSet.add(inversion);
      }
      // Ensure at least one is selected
      return newSet.size > 0 ? newSet : prev;
    });
  }, []);

  const getAvailableChords = useCallback(() => {
    switch (difficulty) {
      case 'triads':
        return CHORD_TYPES.filter((c) => c.notes.length === 3);
      case 'basic-sevenths':
        return CHORD_TYPES.filter((c) => c.notes.length === 4 && ['Dominant 7th', 'Major 7th', 'Minor 7th'].includes(c.name));
      case 'triads-and-basic-sevenths':
        return CHORD_TYPES.filter((c) => c.notes.length === 3 || ['Dominant 7th', 'Major 7th', 'Minor 7th'].includes(c.name));
      case 'triads-and-all-sevenths':
        return CHORD_TYPES;
      default:
        return CHORD_TYPES.filter((c) => c.notes.length === 3);
    }
  }, [difficulty]);

  const playChord = useCallback(async () => {
    if (!currentQuestion) return;

    setIsPlaying(true);
    try {
      await audioPlayer.playChord(currentQuestion.notes);
    } catch (error: any) {
      console.error('Error playing chord:', error);
    }
    setTimeout(() => setIsPlaying(false), 2000);
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (chordName: string) => {
      if (!currentQuestion) return;
      if (isCorrect) return;
      if (attempts.has(chordName)) return;

      const newAttempts = new Set(attempts);
      newAttempts.add(chordName);
      setAttempts(newAttempts);

      const correctAnswer = currentQuestion.chordType.name;

      if (chordName === correctAnswer) {
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
        newWrongAttempts.add(chordName);
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

  const getInversionLabel = (inv: ChordInversion) => {
    switch (inv) {
      case 'root':
        return 'Root';
      case 'first':
        return '1st';
      case 'second':
        return '2nd';
      case 'third':
        return '3rd';
    }
  };

  if (!currentQuestion) return null;

  const availableChords = getAvailableChords();

  return (
    <div className='exercise-container'>
      {/* Header with Settings Button */}
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>Chord Recognition</h3>
            <p className='exercise-description'>Identify the chord on the first try to score!</p>
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
            <label className='settings-label'>Chord Types:</label>
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

          {/* Inversions Selection */}
          <div className='settings-section'>
            <label className='settings-label'>Inversions (select multiple):</label>
            <div className='settings-options'>
              {INVERSION_OPTIONS.map((option) => (
                <label key={option.value} className='settings-checkbox'>
                  <input
                    type='checkbox'
                    checked={enabledInversions.has(option.value)}
                    onChange={() => toggleInversion(option.value)}
                    disabled={option.value === 'third' && (difficulty === 'triads' || difficulty === 'basic-sevenths')}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <p className='settings-hint'>Note: 3rd inversion only available for 7th chords</p>
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
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playChord} disabled={isPlaying || isCorrect}>
          <Volume2 size={32} />
          <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Chord'}</span>
        </button>
        <p className='playback-hint'>
          {isCorrect
            ? isFirstTry
              ? `✅ Perfect! ${currentQuestion.rootNote}${currentQuestion.chordType.symbol} (${getInversionLabel(
                  currentQuestion.inversion
                )})`
              : `✅ Found it: ${currentQuestion.rootNote}${currentQuestion.chordType.symbol} (${getInversionLabel(
                  currentQuestion.inversion
                )})`
            : isFirstTry
            ? 'First attempt - make it count!'
            : 'Keep trying to find the chord'}
        </p>
      </div>

      {/* Answer Grid */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          {isCorrect
            ? `It was a ${currentQuestion.chordType.name} (${getInversionLabel(currentQuestion.inversion)} inversion)`
            : 'Select the chord type you heard:'}
        </h4>
        <div className='answer-grid chords-grid'>
          {availableChords.map((chordType) => {
            const isSelectedCorrect = isCorrect && chordType.name === currentQuestion.chordType.name;
            const isWrong = wrongAttempts.has(chordType.name);
            const isDisabled = isCorrect || attempts.has(chordType.name);

            return (
              <button
                key={chordType.name}
                onClick={() => handleAnswer(chordType.name)}
                disabled={isDisabled}
                className={`answer-button chord-button ${isSelectedCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
              >
                <span className='chord-symbol'>{chordType.symbol || 'Major'}</span>
                <span className='chord-name'>{chordType.name}</span>
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
              You've tried {wrongAttempts.size} incorrect chord{wrongAttempts.size > 1 ? 's' : ''}.
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
                  Correct: <strong>{currentQuestion.chordType.name}</strong> ({getInversionLabel(currentQuestion.inversion)} inversion)
                </p>
                <p className='chord-detail'>Notes: {currentQuestion.notes.join(' - ')}</p>
                <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>
              </>
            ) : (
              <>
                <h4>Found it!</h4>
                <p>
                  The chord was <strong>{currentQuestion.chordType.name}</strong> ({getInversionLabel(currentQuestion.inversion)} inversion)
                </p>
                <p className='chord-detail'>Notes: {currentQuestion.notes.join(' - ')}</p>
                <p className='hint'>But it took {attempts.size} attempts, so no points this time</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
