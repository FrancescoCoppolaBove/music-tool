/**
 * MELODIC DICTATION EXERCISE
 * Riconoscimento melodia: identificare sequenza di gradi
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, Trophy, Settings, RotateCcw } from 'lucide-react';
import { audioPlayer } from '../utils/audio-player';
import { generateChordProgressionAudio } from '../utils/interval-data';
import {
  getMelodicDegreesByDifficulty,
  getMelodicContextProgression,
  generateRandomMelody,
  getNoteStaffPosition,
  MELODY_LENGTH,
  type MelodicDictationDifficulty,
  type MelodicNote,
} from '../utils/melodic-dictation-data';
import { MusicStaff } from './MusicStaff';

interface MelodicQuestion {
  melody: {
    degrees: MelodicNote[];
    notes: string[];
  };
  key: string;
  contextProgression: ReturnType<typeof generateChordProgressionAudio>;
}

type DifficultyLevel = 'simple' | 'advanced' | 'all';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'simple', label: 'Simple (1, 4, 5) - 3 notes' },
  { value: 'advanced', label: 'Advanced (1, 3, 4, 5, 6) - 4 notes' },
  { value: 'all', label: 'All (1-7) - 5 notes' },
];

export function MelodicDictationExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple');
  const [showSettings, setShowSettings] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<MelodicQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingMelodyOnly, setIsPlayingMelodyOnly] = useState(false);
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
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const generateQuestion = useCallback(() => {
    const keys = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2'];
    const key = keys[Math.floor(Math.random() * keys.length)];

    const contextProg = getMelodicContextProgression(difficulty as MelodicDictationDifficulty);
    const contextProgression = generateChordProgressionAudio(contextProg, key);

    const melody = generateRandomMelody(difficulty as MelodicDictationDifficulty, key);

    console.log('🎼 Generated melodic dictation:');
    console.log('   Key:', key);
    console.log('   Melody degrees:', melody.degrees.map((d) => d.name).join('-'));
    console.log('   Melody notes:', melody.notes.join('-'));

    setCurrentQuestion({ melody, key, contextProgression });
  }, [difficulty]);

  const getAvailableDegrees = useCallback(() => {
    return getMelodicDegreesByDifficulty(difficulty as MelodicDictationDifficulty);
  }, [difficulty]);

  const playContextAndMelody = useCallback(async () => {
    if (!currentQuestion) return;

    setIsPlaying(true);
    try {
      for (const chord of currentQuestion.contextProgression.chords) {
        await audioPlayer.playChord(chord);
        await audioPlayer.delay(600);
      }

      await audioPlayer.delay(500);

      for (const note of currentQuestion.melody.notes) {
        await audioPlayer.playNote(note, 0.8);
        await audioPlayer.delay(500);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setIsPlaying(false);
  }, [currentQuestion]);

  const playMelodyOnly = useCallback(async () => {
    if (!currentQuestion) return;

    setIsPlayingMelodyOnly(true);
    try {
      for (const note of currentQuestion.melody.notes) {
        await audioPlayer.playNote(note, 0.8);
        await audioPlayer.delay(500);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setIsPlayingMelodyOnly(false);
  }, [currentQuestion]);

  const handleDegreeClick = useCallback(
    (degreeName: string) => {
      if (isCorrect || hasSubmitted) return;

      const melodyLength = MELODY_LENGTH[difficulty as MelodicDictationDifficulty];

      if (userAnswer.length < melodyLength) {
        setUserAnswer([...userAnswer, degreeName]);
      }
    },
    [userAnswer, isCorrect, hasSubmitted, difficulty]
  );

  const handleRemoveLastNote = useCallback(() => {
    if (userAnswer.length > 0 && !isCorrect && !hasSubmitted) {
      setUserAnswer(userAnswer.slice(0, -1));
    }
  }, [userAnswer, isCorrect, hasSubmitted]);

  const handleClear = useCallback(() => {
    if (!isCorrect && !hasSubmitted) {
      setUserAnswer([]);
    }
  }, [isCorrect, hasSubmitted]);

  const handleSubmit = useCallback(() => {
    if (!currentQuestion) return;
    if (userAnswer.length !== currentQuestion.melody.degrees.length) return;
    if (hasSubmitted) return;

    setHasSubmitted(true);

    const correctAnswer = currentQuestion.melody.degrees.map((d) => d.name);
    const isAnswerCorrect = userAnswer.every((ans, idx) => ans === correctAnswer[idx]);

    if (isAnswerCorrect) {
      setIsCorrect(true);
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
    } else {
      setScore((prev) => ({ correct: prev.correct, total: prev.total + 1 }));
      setStreak(0);
    }
  }, [currentQuestion, userAnswer, hasSubmitted, streak, bestStreak]);

  const nextQuestion = useCallback(() => {
    generateQuestion();
    setUserAnswer([]);
    setIsCorrect(false);
    setHasSubmitted(false);
  }, [generateQuestion]);

  const resetScore = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    nextQuestion();
  }, [nextQuestion]);

  if (!currentQuestion) return null;

  const availableDegrees = getAvailableDegrees();
  const melodyLength = MELODY_LENGTH[difficulty as MelodicDictationDifficulty];
  const canSubmit = userAnswer.length === melodyLength && !hasSubmitted;

  // Staff notes SEMPRE visibili - mostra "?" per note non inserite
  const staffNotes = currentQuestion.melody.notes.map((note, idx) => {
    const staffPos = getNoteStaffPosition(note);
    const noteName = note.replace('2', '').replace('3', '');
    const degreeLabel = currentQuestion.melody.degrees[idx].name;

    // Logica visualizzazione:
    // 1. Se non ha inserito questa nota → "?"
    // 2. Se ha inserito ma non ha fatto submit → mostra scelta utente
    // 3. Se ha fatto submit → mostra risposta corretta
    const userDegree = userAnswer[idx];
    const displayText = !userDegree
      ? '?'
      : hasSubmitted
      ? `${noteName} (${degreeLabel})` // Dopo submit: risposta corretta
      : `${noteName} (${userDegree})`; // Durante: scelta utente

    return {
      noteName: displayText,
      isUnknown: !userDegree,
      isCorrect: hasSubmitted && userAnswer[idx] === degreeLabel,
      isWrong: hasSubmitted && userAnswer[idx] !== degreeLabel,
      ...staffPos,
    };
  });

  return (
    <div className='exercise-container'>
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>Melodic Dictation</h3>
            <p className='exercise-description'>Identify the scale degrees of each note in the melody!</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className='settings-toggle-button'>
            <Settings size={24} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className='settings-panel'>
          <h4 className='settings-title'>Exercise Settings</h4>
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

      <div className='exercise-stats'>
        <div className='stat-item'>
          <span className='stat-label'>Score</span>
          <span className='stat-value'>
            {score.correct} / {score.total}
            {score.total > 0 && <span className='stat-percentage'>({Math.round((score.correct / score.total) * 100)}%)</span>}
          </span>
        </div>
        <div className='stat-item'>
          <span className='stat-label'>Progress</span>
          <span className='stat-value'>
            {userAnswer.length} / {melodyLength}
          </span>
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

      <div className='exercise-playback'>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={playContextAndMelody}
            disabled={isPlaying || isPlayingMelodyOnly || isCorrect}
          >
            <Volume2 size={28} />
            <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Context + Melody'}</span>
          </button>
          <button
            className={`play-button secondary ${isPlayingMelodyOnly ? 'playing' : ''}`}
            onClick={playMelodyOnly}
            disabled={isPlaying || isPlayingMelodyOnly || isCorrect}
            style={{ backgroundColor: 'var(--secondary, #6366f1)' }}
          >
            <RotateCcw size={28} />
            <span className='play-button-text'>{isPlayingMelodyOnly ? 'Playing...' : 'Replay Melody Only'}</span>
          </button>
        </div>
        <p className='playback-hint'>
          {isCorrect
            ? '✅ Perfect melody!'
            : hasSubmitted
            ? '❌ Not quite right. Try again!'
            : `Enter ${melodyLength} scale degrees in order`}
        </p>
      </div>

      {/* Staff Notation - SEMPRE VISIBILE */}
      <div style={{ margin: '2rem auto', maxWidth: '700px' }}>
        <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {!hasSubmitted ? '🎼 Build Your Answer:' : isCorrect ? '✅ Correct Melody:' : '📝 The Melody Was:'}
        </h4>
        <MusicStaff notes={staffNotes} />
        {!hasSubmitted && (
          <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Select scale degrees below to fill in the "?" notes
          </p>
        )}
      </div>

      <div className='answer-section'>
        <h4 className='answer-section-title'>Your Answer:</h4>
        <div className='melody-answer-display'>
          {userAnswer.map((degree, idx) => (
            <div key={idx} className='melody-note-box'>
              {degree}
            </div>
          ))}
          {Array.from({ length: melodyLength - userAnswer.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className='melody-note-box empty'>
              _
            </div>
          ))}
        </div>
        <button
          onClick={handleRemoveLastNote}
          disabled={userAnswer.length === 0 || isCorrect || hasSubmitted}
          className='btn btn-ghost btn-sm'
          style={{ marginTop: '0.5rem' }}
        >
          ← Remove Last
        </button>
      </div>

      <div className='answer-section'>
        <h4 className='answer-section-title'>Select degrees (in order):</h4>
        <div className='answer-grid degrees-grid'>
          {availableDegrees.map((degree) => (
            <button
              key={degree.name}
              onClick={() => handleDegreeClick(degree.name)}
              disabled={isCorrect || hasSubmitted || userAnswer.length >= melodyLength}
              className='answer-button degree-button'
            >
              <span className='degree-name'>{degree.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className='exercise-actions'>
        {isCorrect ? (
          <div className='auto-advance-message'>Next melody in 2s... ⏱️</div>
        ) : (
          <>
            <button className='btn btn-ghost' onClick={handleClear} disabled={userAnswer.length === 0 || hasSubmitted}>
              Clear
            </button>
            <button className='btn btn-ghost' onClick={resetScore}>
              Reset Score
            </button>
            <button className='btn btn-primary' onClick={handleSubmit} disabled={!canSubmit} style={{ fontWeight: 600 }}>
              Submit Answer
            </button>
          </>
        )}
      </div>

      {hasSubmitted && (
        <div className={`exercise-feedback ${isCorrect ? 'success' : 'error'}`}>
          <div className='feedback-icon'>{isCorrect ? <Check size={32} /> : <X size={32} />}</div>
          <div className='feedback-content'>
            {isCorrect ? (
              <>
                <h4>Perfect! 🎉</h4>
                <p>You correctly identified the melody!</p>
                <p className='melody-detail'>Degrees: {currentQuestion.melody.degrees.map((d) => d.name).join(' - ')}</p>
                <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>
              </>
            ) : (
              <>
                <h4>Not Quite!</h4>
                <p>Your answer: {userAnswer.join(' - ')}</p>
                <p>Correct answer: {currentQuestion.melody.degrees.map((d) => d.name).join(' - ')}</p>
                <p className='hint'>Listen again and try the next one!</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
