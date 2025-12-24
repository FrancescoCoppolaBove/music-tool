/**
 * BPM RECOGNITION EXERCISE
 * Riconoscimento tempo metronome
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, Settings, Trophy, Clock } from 'lucide-react';
import { bpmRecognitionHistory } from '../utils/history-manager';
import { generateBPMQuestion, getTempoMarking, type BPMDifficulty, type BPMQuestion } from '../utils/bpm-recognition-data';

type DifficultyLevel = 'slow' | 'medium' | 'fast';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; range: string }[] = [
  { value: 'slow', label: 'Slow', range: '60-90 BPM (Adagio/Andante)' },
  { value: 'medium', label: 'Medium', range: '90-140 BPM (Moderato/Allegro)' },
  { value: 'fast', label: 'Fast', range: '140-200 BPM (Presto)' },
];

const METRONOME_BARS = 4; // Number of bars to play

export function BPMRecognitionExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [showSettings, setShowSettings] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<BPMQuestion | null>(null);
  const [selectedBPM, setSelectedBPM] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongBPMs, setWrongBPMs] = useState<Set<number>>(new Set());
  const [hasAnyWrongAnswer, setHasAnyWrongAnswer] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    generateQuestion();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [difficulty]);

  useEffect(() => {
    if (isCorrect) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const generateQuestion = useCallback(() => {
    const question = generateBPMQuestion(difficulty as BPMDifficulty);

    // Check history
    if (bpmRecognitionHistory.includes(question.targetBPM)) {
      // Retry once
      const retry = generateBPMQuestion(difficulty as BPMDifficulty);
      bpmRecognitionHistory.add(retry.targetBPM);
      setCurrentQuestion(retry);
    } else {
      bpmRecognitionHistory.add(question.targetBPM);
      setCurrentQuestion(question);
    }
  }, [difficulty]);

  const playMetronome = useCallback(async () => {
    if (!currentQuestion || isPlaying) return;

    setIsPlaying(true);
    setCurrentBeat(0);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const bpm = currentQuestion.targetBPM;
      const beatDuration = 60000 / bpm; // ms per beat

      let beatCount = 0;
      const totalBeats = METRONOME_BARS * 4; // 4 beats per bar

      // Play first beat immediately
      playClick(audioContext, true);
      setCurrentBeat(1);
      beatCount++;

      // Schedule remaining beats
      intervalRef.current = window.setInterval(() => {
        if (beatCount >= totalBeats) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsPlaying(false);
          setCurrentBeat(0);
          return;
        }

        const isDownbeat = beatCount % 4 === 0;
        playClick(audioContext, isDownbeat);
        setCurrentBeat((beatCount % 4) + 1);
        beatCount++;
      }, beatDuration);
    } catch (error) {
      console.error('Error playing metronome:', error);
      setIsPlaying(false);
      setCurrentBeat(0);
    }
  }, [currentQuestion, isPlaying]);

  const playClick = (audioContext: AudioContext, isDownbeat: boolean) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = isDownbeat ? 1200 : 800;
    gainNode.gain.value = isDownbeat ? 0.4 : 0.2;

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  };

  const handleBPMSelect = useCallback(
    (bpm: number) => {
      console.log('🎯 BPM selected:', bpm, 'Target:', currentQuestion?.targetBPM);

      if (isCorrect || wrongBPMs.has(bpm)) {
        console.log('⏸️ Blocked (already correct or wrong)');
        return;
      }

      setSelectedBPM(bpm);
      const correct = bpm === currentQuestion?.targetBPM;

      console.log('🎯 Result:', correct ? '✅ CORRECT' : '❌ WRONG');

      if (correct) {
        setIsCorrect(true);

        // STRICT SCORING
        if (!hasAnyWrongAnswer) {
          console.log('✨ PERFECT! First attempt! +1 point');
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
      } else {
        setWrongBPMs((prev) => new Set(prev).add(bpm));
        setHasAnyWrongAnswer(true);
        console.log('📉 Wrong answer! No point will be awarded for this question.');
      }
    },
    [currentQuestion, isCorrect, wrongBPMs, hasAnyWrongAnswer, streak, bestStreak]
  );

  const nextQuestion = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    generateQuestion();
    setSelectedBPM(null);
    setIsCorrect(null);
    setWrongBPMs(new Set());
    setHasAnyWrongAnswer(false);
    setIsPlaying(false);
    setCurrentBeat(0);
  }, [generateQuestion]);

  const resetScore = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    nextQuestion();
  }, [nextQuestion]);

  if (!currentQuestion) return null;

  const tempoMarking = getTempoMarking(currentQuestion.targetBPM);

  return (
    <div className='exercise-container'>
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>BPM Recognition</h3>
            <p className='exercise-description'>Identify the tempo you hear!</p>
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
                  <span>
                    <strong>{option.label}</strong>
                    <br />
                    <small>{option.range}</small>
                  </span>
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
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playMetronome} disabled={isPlaying}>
          <Volume2 size={28} />
          <span className='play-button-text'>{isPlaying ? `Playing... (Beat ${currentBeat}/4)` : 'Play Metronome'}</span>
        </button>
        {isPlaying && (
          <div className='metronome-visual'>
            <div className='beat-indicators'>
              {[1, 2, 3, 4].map((beat) => (
                <div key={beat} className={`beat-indicator ${currentBeat === beat ? 'active' : ''} ${beat === 1 ? 'downbeat' : ''}`}>
                  {beat}
                </div>
              ))}
            </div>
          </div>
        )}
        <p className='playback-hint'>
          {isCorrect
            ? `✅ Perfect! ${currentQuestion.targetBPM} BPM (${tempoMarking})`
            : 'Listen to the metronome and select the correct BPM'}
        </p>
      </div>

      {/* BPM Selection */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          Select the BPM:
          <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isCorrect === true && '✅ Correct!'}
            {isCorrect === null && '⏳ Select...'}
          </span>
        </h4>
        <div className='bpm-options-grid'>
          {currentQuestion.options.map((bpm) => {
            const isSelected = selectedBPM === bpm;
            const isCorrectAnswer = bpm === currentQuestion.targetBPM;
            const isWrong = wrongBPMs.has(bpm);
            const showCorrect = isCorrect === true && isCorrectAnswer;

            return (
              <button
                key={bpm}
                onClick={() => handleBPMSelect(bpm)}
                disabled={isCorrect === true || isWrong}
                className={`bpm-option-button ${showCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
                style={{
                  backgroundColor: isWrong ? '#ef4444' : undefined,
                  borderColor: isWrong ? '#dc2626' : undefined,
                  cursor: isWrong || isCorrect ? 'not-allowed' : 'pointer',
                }}
              >
                <div className='bpm-value'>{bpm}</div>
                <div className='bpm-label'>BPM</div>
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

      {isCorrect && (
        <div className='exercise-feedback success'>
          <div className='feedback-icon'>
            <Clock size={32} />
          </div>
          <div className='feedback-content'>
            <h4>Perfect! 🎉</h4>
            <p>
              <strong>{currentQuestion.targetBPM} BPM</strong> ({tempoMarking})
            </p>
            {!hasAnyWrongAnswer && <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>}
            {hasAnyWrongAnswer && <p className='streak-message'>Completed with errors • No point awarded</p>}
          </div>
        </div>
      )}
    </div>
  );
}
