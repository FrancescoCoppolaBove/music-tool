/**
 * INTERVALS IN CONTEXT EXERCISE
 * Riconoscimento intervalli in contesto tonale
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, Trophy, Settings } from 'lucide-react';
import { audioPlayer } from '../utils/audio-player';
import { generateChordProgressionAudio, INTERVALS } from '../utils/interval-data';
import {
  getContextDegreesByDifficulty,
  getIntervalsContextProgression,
  generateRandomNotePair,
  generateNoteFromDegree,
  type IntervalsInContextDifficulty,
  type ContextNote,
} from '../utils/intervals-in-context-data';

interface ContextQuestion {
  firstDegree: ContextNote;
  secondDegree: ContextNote;
  firstNote: string;
  secondNote: string;
  interval: {
    semitones: number;
    intervalName: string;
    intervalShort: string;
  };
  key: string;
  contextProgression: ReturnType<typeof generateChordProgressionAudio>;
}

type DifficultyLevel = 'simple' | 'diatonic' | 'chromatic';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'simple', label: 'Simple (1st, 3rd, 5th)' },
  { value: 'diatonic', label: 'Diatonic (All 7 degrees)' },
  { value: 'chromatic', label: 'Chromatic (All 12 degrees)' },
];

export function IntervalsInContextExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple');
  const [showSettings, setShowSettings] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<ContextQuestion | null>(null);
  const [selectedFirstDegree, setSelectedFirstDegree] = useState<string | null>(null);
  const [selectedSecondDegree, setSelectedSecondDegree] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null);
  const [isFirstCorrect, setIsFirstCorrect] = useState<boolean | null>(null);
  const [isSecondCorrect, setIsSecondCorrect] = useState<boolean | null>(null);
  const [isIntervalCorrect, setIsIntervalCorrect] = useState<boolean | null>(null);

  // Track wrong answers (remain red permanently)
  const [wrongFirstDegrees, setWrongFirstDegrees] = useState<Set<string>>(new Set());
  const [wrongSecondDegrees, setWrongSecondDegrees] = useState<Set<string>>(new Set());
  const [wrongIntervals, setWrongIntervals] = useState<Set<string>>(new Set());

  // Track if ANY answer was wrong (for strict scoring)
  const [hasAnyWrongAnswer, setHasAnyWrongAnswer] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    audioPlayer.preloadAllNotes();
  }, []);

  useEffect(() => {
    generateQuestion();
  }, [difficulty]);

  // Auto-advance quando tutte e 3 le risposte sono corrette
  useEffect(() => {
    if (isFirstCorrect && isSecondCorrect && isIntervalCorrect) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 1500); // 1.5 secondi per vedere il risultato
      return () => clearTimeout(timer);
    }
  }, [isFirstCorrect, isSecondCorrect, isIntervalCorrect]);

  const generateQuestion = useCallback(() => {
    const keys = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2'];
    const key = keys[Math.floor(Math.random() * keys.length)];

    const contextProg = getIntervalsContextProgression(difficulty as IntervalsInContextDifficulty);
    const contextProgression = generateChordProgressionAudio(contextProg, key);

    const notePair = generateRandomNotePair(difficulty as IntervalsInContextDifficulty, key);

    console.log('🎼 Generated intervals in context:');
    console.log('   Key:', key);
    console.log('   First Note:', notePair.firstNote, '(degree', notePair.firstDegree.name + ')');
    console.log('   Second Note:', notePair.secondNote, '(degree', notePair.secondDegree.name + ')');
    console.log(
      '   Interval:',
      notePair.interval.intervalShort,
      '-',
      notePair.interval.intervalName,
      '(',
      notePair.interval.semitones,
      'semitones)'
    );

    setCurrentQuestion({
      ...notePair,
      key,
      contextProgression,
    });
  }, [difficulty]);

  const playContextAndNotes = useCallback(async () => {
    if (!currentQuestion) return;

    setIsPlaying(true);
    try {
      // Suona progressione
      for (const chord of currentQuestion.contextProgression.chords) {
        await audioPlayer.playChord(chord);
        await audioPlayer.delay(600);
      }

      await audioPlayer.delay(500);

      // Suona le due note
      await audioPlayer.playNote(currentQuestion.firstNote, 0.8);
      await audioPlayer.delay(500);
      await audioPlayer.playNote(currentQuestion.secondNote, 0.8);
    } catch (error) {
      console.error('Error:', error);
    }
    setIsPlaying(false);
  }, [currentQuestion]);

  const handleFirstDegreeSelect = useCallback(
    (degreeName: string) => {
      console.log('🔵 handleFirstDegreeSelect called:', { degreeName, currentCorrect: currentQuestion?.firstDegree.name });

      if (isFirstCorrect || wrongFirstDegrees.has(degreeName)) {
        console.log('⏸️ Blocked (already correct or wrong)');
        return;
      }

      setSelectedFirstDegree(degreeName);
      const correct = degreeName === currentQuestion?.firstDegree.name;

      console.log('🎯 Result:', correct ? '✅ CORRECT' : '❌ WRONG');

      if (correct) {
        setIsFirstCorrect(true);
      } else {
        // Mark as wrong - NO POINT for this question!
        setWrongFirstDegrees((prev) => new Set(prev).add(degreeName));
        setHasAnyWrongAnswer(true);
        console.log('📉 Wrong answer! No point will be awarded for this question.');
      }
    },
    [currentQuestion, isFirstCorrect, wrongFirstDegrees]
  );

  const handleSecondDegreeSelect = useCallback(
    (degreeName: string) => {
      console.log('🟢 handleSecondDegreeSelect called:', { degreeName, currentCorrect: currentQuestion?.secondDegree.name });

      if (isSecondCorrect || wrongSecondDegrees.has(degreeName)) {
        console.log('⏸️ Blocked (already correct or wrong)');
        return;
      }

      setSelectedSecondDegree(degreeName);
      const correct = degreeName === currentQuestion?.secondDegree.name;

      console.log('🎯 Result:', correct ? '✅ CORRECT' : '❌ WRONG');

      if (correct) {
        setIsSecondCorrect(true);
      } else {
        // Mark as wrong - NO POINT for this question!
        setWrongSecondDegrees((prev) => new Set(prev).add(degreeName));
        setHasAnyWrongAnswer(true);
        console.log('📉 Wrong answer! No point will be awarded for this question.');
      }
    },
    [currentQuestion, isSecondCorrect, wrongSecondDegrees]
  );

  const handleIntervalSelect = useCallback(
    (intervalShort: string) => {
      console.log('🟡 handleIntervalSelect called:', {
        intervalShort,
        currentCorrect: currentQuestion?.interval.intervalShort,
        fullInterval: currentQuestion?.interval,
      });

      if (isIntervalCorrect || wrongIntervals.has(intervalShort)) {
        console.log('⏸️ Blocked (already correct or wrong)');
        return;
      }

      setSelectedInterval(intervalShort);
      const correct = intervalShort === currentQuestion?.interval.intervalShort;

      console.log('🎯 Interval check result:', correct ? '✅ CORRECT' : '❌ WRONG');

      if (correct) {
        setIsIntervalCorrect(true);

        // Check if all 3 are correct
        if (isFirstCorrect && isSecondCorrect) {
          console.log('🎉 All 3 correct!');

          // ALWAYS increment total
          // Only increment correct if NO wrong answers
          if (!hasAnyWrongAnswer) {
            console.log('✨ PERFECT! All first attempts! +1 point');
            setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) {
              setBestStreak(newStreak);
            }
          } else {
            console.log('📊 Completed with errors. Total +1, but no point awarded.');
            setScore((prev) => ({ correct: prev.correct, total: prev.total + 1 }));
            setStreak(0);
          }

          // AUTO-ADVANCE after all 3 correct (regardless of errors)
          // Will be handled by useEffect watching all 3 correct states
        }
      } else {
        // Mark as wrong - NO POINT for this question!
        setWrongIntervals((prev) => new Set(prev).add(intervalShort));
        setHasAnyWrongAnswer(true);
        console.log('📉 Wrong answer! No point will be awarded for this question.');
      }
    },
    [currentQuestion, isFirstCorrect, isSecondCorrect, isIntervalCorrect, wrongIntervals, hasAnyWrongAnswer, streak, bestStreak]
  );

  const nextQuestion = useCallback(() => {
    generateQuestion();
    setSelectedFirstDegree(null);
    setSelectedSecondDegree(null);
    setSelectedInterval(null);
    setIsFirstCorrect(null);
    setIsSecondCorrect(null);
    setIsIntervalCorrect(null);
    setWrongFirstDegrees(new Set());
    setWrongSecondDegrees(new Set());
    setWrongIntervals(new Set());
    setHasAnyWrongAnswer(false);
  }, [generateQuestion]);

  const resetScore = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    nextQuestion();
  }, [nextQuestion]);

  if (!currentQuestion) return null;

  const availableDegrees = getContextDegreesByDifficulty(difficulty as IntervalsInContextDifficulty);

  return (
    <div className='exercise-container'>
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>Intervals in Context</h3>
            <p className='exercise-description'>Identify scale degrees and interval between two notes!</p>
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
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playContextAndNotes} disabled={isPlaying}>
          <Volume2 size={28} />
          <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Context + Notes'}</span>
        </button>
        <p className='playback-hint'>
          {isFirstCorrect && isSecondCorrect && isIntervalCorrect
            ? '✅ Perfect! Next question in 1.5s...'
            : 'Select the first note, second note, and interval'}
        </p>
      </div>

      {/* First Note Selection */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          First Note:
          <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isFirstCorrect === true && '✅ Correct!'}
            {isFirstCorrect === false && '❌ Wrong, try again'}
            {isFirstCorrect === null && '⏳ Select...'}
          </span>
        </h4>
        <div className='answer-grid degrees-grid'>
          {availableDegrees.map((degree) => {
            const noteName = generateNoteFromDegree(currentQuestion.key, degree).replace('2', '').replace('3', '');
            const isSelected = selectedFirstDegree === degree.name;
            const isCorrectAnswer = degree.name === currentQuestion.firstDegree.name;
            const isWrong = wrongFirstDegrees.has(degree.name);
            const showCorrect = isFirstCorrect === true && isCorrectAnswer;

            return (
              <button
                key={`first-${degree.name}`}
                onClick={() => handleFirstDegreeSelect(degree.name)}
                disabled={isFirstCorrect === true || isWrong}
                className={`answer-button degree-button ${showCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
                style={{
                  backgroundColor: isWrong ? '#ef4444' : undefined,
                  borderColor: isWrong ? '#dc2626' : undefined,
                  color: isWrong ? 'white' : undefined,
                  cursor: isWrong || isFirstCorrect ? 'not-allowed' : 'pointer',
                }}
              >
                <span className='degree-name'>{degree.name}</span>
                <span className='degree-note-name'>{noteName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Second Note Selection */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          Second Note:
          <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isSecondCorrect === true && '✅ Correct!'}
            {isSecondCorrect === false && '❌ Wrong, try again'}
            {isSecondCorrect === null && '⏳ Select...'}
          </span>
        </h4>
        <div className='answer-grid degrees-grid'>
          {availableDegrees.map((degree) => {
            const noteName = generateNoteFromDegree(currentQuestion.key, degree).replace('2', '').replace('3', '');
            const isSelected = selectedSecondDegree === degree.name;
            const isCorrectAnswer = degree.name === currentQuestion.secondDegree.name;
            const isWrong = wrongSecondDegrees.has(degree.name);
            const showCorrect = isSecondCorrect === true && isCorrectAnswer;

            return (
              <button
                key={`second-${degree.name}`}
                onClick={() => handleSecondDegreeSelect(degree.name)}
                disabled={isSecondCorrect === true || isWrong}
                className={`answer-button degree-button ${showCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
                style={{
                  backgroundColor: isWrong ? '#ef4444' : undefined,
                  borderColor: isWrong ? '#dc2626' : undefined,
                  color: isWrong ? 'white' : undefined,
                  cursor: isWrong || isSecondCorrect ? 'not-allowed' : 'pointer',
                }}
              >
                <span className='degree-name'>{degree.name}</span>
                <span className='degree-note-name'>{noteName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interval Selection */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          Interval Between Notes:
          <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isIntervalCorrect === true && '✅ Correct!'}
            {isIntervalCorrect === false && '❌ Wrong, try again'}
            {isIntervalCorrect === null && '⏳ Select...'}
          </span>
        </h4>
        <div className='answer-grid intervals-grid'>
          {INTERVALS.map((interval) => {
            const isSelected = selectedInterval === interval.shortName;
            const isCorrectAnswer = interval.shortName === currentQuestion.interval.intervalShort;
            const isWrong = wrongIntervals.has(interval.shortName);
            const showCorrect = isIntervalCorrect === true && isCorrectAnswer;

            return (
              <button
                key={interval.shortName}
                onClick={() => handleIntervalSelect(interval.shortName)}
                disabled={isIntervalCorrect === true || isWrong}
                className={`answer-button interval-button ${showCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
                style={{
                  backgroundColor: isWrong ? '#ef4444' : undefined,
                  borderColor: isWrong ? '#dc2626' : undefined,
                  color: isWrong ? 'white' : undefined,
                  cursor: isWrong || isIntervalCorrect ? 'not-allowed' : 'pointer',
                }}
              >
                <span className='interval-short'>{interval.shortName}</span>
                <span className='interval-full'>{interval.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className='exercise-actions'>
        <button className='btn btn-ghost' onClick={resetScore}>
          Reset Score
        </button>
      </div>

      {/* Feedback solo se tutte e 3 corrette o almeno una sbagliata */}
      {isFirstCorrect && isSecondCorrect && isIntervalCorrect && (
        <div className='exercise-feedback success'>
          <div className='feedback-icon'>
            <Check size={32} />
          </div>
          <div className='feedback-content'>
            <h4>Perfect! 🎉</h4>
            <p>
              Correct: <strong>{currentQuestion.firstDegree.name}</strong> → <strong>{currentQuestion.secondDegree.name}</strong> ={' '}
              <strong>{currentQuestion.interval.intervalName}</strong>
            </p>
            <p className='degree-detail'>
              Context: {currentQuestion.contextProgression.progression.name} in {currentQuestion.key.replace('2', '')} major
            </p>
            <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>
          </div>
        </div>
      )}
    </div>
  );
}
