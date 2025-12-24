/**
 * RHYTHM RECOGNITION EXERCISE
 * Riconoscimento pattern ritmici
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, Check, X, Trophy, Settings } from 'lucide-react';
import { rhythmRecognitionHistory } from '../utils/history-manager';
import {
  getRhythmPatternsByDifficulty,
  generateRandomRhythmPattern,
  getNoteSymbol,
  type RhythmDifficulty,
  type RhythmPattern,
} from '../utils/rhythm-recognition-data';

type DifficultyLevel = 'simple' | 'intermediate' | 'advanced';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'simple', label: 'Simple (4 beats, basic)' },
  { value: 'intermediate', label: 'Intermediate (6-8 beats, dotted notes)' },
  { value: 'advanced', label: 'Advanced (Triplets, sixteenths)' },
];

const TEMPO_BPM = 100; // Beats per minute
const BEAT_DURATION = 60000 / TEMPO_BPM; // ms per beat

export function RhythmRecognitionExercise() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple');
  const [showSettings, setShowSettings] = useState(false);

  const [currentPattern, setCurrentPattern] = useState<RhythmPattern | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongPatternIds, setWrongPatternIds] = useState<Set<string>>(new Set());
  const [hasAnyWrongAnswer, setHasAnyWrongAnswer] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    generateQuestion();
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
    const difficulty_level = difficulty as RhythmDifficulty;
    const availablePatterns = getRhythmPatternsByDifficulty(difficulty_level);

    // Filter out recently played patterns
    const filteredPatterns = availablePatterns.filter((p) => !rhythmRecognitionHistory.includes(p.id));

    // If all patterns were recent, use all patterns
    const patternsToUse = filteredPatterns.length > 0 ? filteredPatterns : availablePatterns;

    // Select random pattern
    const pattern = patternsToUse[Math.floor(Math.random() * patternsToUse.length)];

    // Add to history
    rhythmRecognitionHistory.add(pattern.id);

    console.log('🥁 Generated rhythm pattern:');
    console.log('   Pattern:', pattern.name);
    console.log('   ID:', pattern.id);
    console.log('   Total Beats:', pattern.totalBeats);
    console.log('   Recent history:', rhythmRecognitionHistory.getHistory());

    setCurrentPattern(pattern);
  }, [difficulty]);

  const playRhythmPattern = useCallback(async () => {
    if (!currentPattern || isPlaying) return;

    setIsPlaying(true);

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Play metronome clicks for one measure first
      console.log('🎵 Playing metronome...');
      for (let i = 0; i < 4; i++) {
        playClick(audioContext, i === 0);
        await delay(BEAT_DURATION);
      }

      await delay(BEAT_DURATION); // Pausa

      // Play rhythm pattern
      console.log('🥁 Playing pattern...');
      let currentTime = 0;

      for (const note of currentPattern.notes) {
        if (!note.isRest) {
          playClap(audioContext);
        }
        currentTime += note.duration * BEAT_DURATION;
        await delay(note.duration * BEAT_DURATION);
      }
    } catch (error) {
      console.error('Error playing rhythm:', error);
    }

    setIsPlaying(false);
  }, [currentPattern, isPlaying]);

  const playClick = (audioContext: AudioContext, isDownbeat: boolean) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = isDownbeat ? 1000 : 800;
    gainNode.gain.value = isDownbeat ? 0.3 : 0.15;

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  };

  const playClap = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = ('white-noise' as any) || 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.value = 1000;

    gainNode.gain.value = 0.5;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handlePatternSelect = useCallback(
    (patternId: string) => {
      console.log('🎯 Pattern selected:', patternId);

      if (isCorrect || wrongPatternIds.has(patternId)) {
        console.log('⏸️ Blocked (already correct or wrong)');
        return;
      }

      setSelectedPatternId(patternId);
      const correct = patternId === currentPattern?.id;

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
        setWrongPatternIds((prev) => new Set(prev).add(patternId));
        setHasAnyWrongAnswer(true);
        console.log('📉 Wrong answer! No point will be awarded for this question.');
      }
    },
    [currentPattern, isCorrect, wrongPatternIds, hasAnyWrongAnswer, streak, bestStreak]
  );

  const nextQuestion = useCallback(() => {
    generateQuestion();
    setSelectedPatternId(null);
    setIsCorrect(null);
    setWrongPatternIds(new Set());
    setHasAnyWrongAnswer(false);
  }, [generateQuestion]);

  const resetScore = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    nextQuestion();
  }, [nextQuestion]);

  if (!currentPattern) return null;

  const availablePatterns = getRhythmPatternsByDifficulty(difficulty as RhythmDifficulty);

  return (
    <div className='exercise-container'>
      <div className='exercise-header'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h3 className='exercise-title'>Rhythm Recognition</h3>
            <p className='exercise-description'>Identify the rhythm pattern you hear!</p>
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
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={playRhythmPattern} disabled={isPlaying}>
          <Volume2 size={28} />
          <span className='play-button-text'>{isPlaying ? 'Playing...' : 'Play Rhythm Pattern'}</span>
        </button>
        <p className='playback-hint'>{isCorrect ? '✅ Perfect!' : 'Listen to the rhythm and select the matching pattern'}</p>
      </div>

      {/* Pattern Selection */}
      <div className='answer-section'>
        <h4 className='answer-section-title'>
          Select the Pattern:
          <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isCorrect === true && '✅ Correct!'}
            {isCorrect === null && '⏳ Select...'}
          </span>
        </h4>
        <div className='rhythm-patterns-grid'>
          {availablePatterns.map((pattern) => {
            const isSelected = selectedPatternId === pattern.id;
            const isCorrectAnswer = pattern.id === currentPattern.id;
            const isWrong = wrongPatternIds.has(pattern.id);
            const showCorrect = isCorrect === true && isCorrectAnswer;

            return (
              <button
                key={pattern.id}
                onClick={() => handlePatternSelect(pattern.id)}
                disabled={isCorrect === true || isWrong}
                className={`rhythm-pattern-button ${showCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
                style={{
                  backgroundColor: isWrong ? '#ef4444' : undefined,
                  borderColor: isWrong ? '#dc2626' : undefined,
                  cursor: isWrong || isCorrect ? 'not-allowed' : 'pointer',
                }}
              >
                <div className='rhythm-pattern-visual'>
                  {pattern.notes.map((note, idx) => {
                    const symbol = getNoteSymbol(note.type);

                    // Quarter rest SVG
                    if (symbol === 'SVG_REST_QUARTER') {
                      return (
                        <svg
                          key={idx}
                          className='rhythm-note rhythm-rest-svg'
                          width='12'
                          height='32'
                          viewBox='0 0 26.22 74.74'
                          style={{ display: 'inline-block' }}
                        >
                          <path
                            d='m 26.26,-515.09 c -6.84377,8.15627 -10.26565,14.25001 -10.26562,18.28125 -3e-5,3.89063 3.25778,9.72656 9.77343,17.50781 l -2.03906,2.88282 c -3.28128,-1.92189 -6.09377,-2.88283 -8.4375,-2.88282 -3.04689,-10e-6 -4.57033,1.82811 -4.57031,5.48438 -2e-5,3.74998 1.66404,7.47654 4.99219,11.17969 l -1.82813,2.74218 c -9.23438,-6.84377 -13.85157,-12.93751 -13.85156,-18.28125 -1e-5,-2.71876 0.93749,-4.875 2.8125,-6.46875 1.73436,-1.5 3.98436,-2.25 6.75,-2.25 1.78123,0 3.74998,0.46875 5.90625,1.40625 l -14.13281,-18.77343 c 6.70311,-5.90624 10.05467,-11.24998 10.05468,-16.03125 -10e-6,-3.79685 -2.27345,-8.57809 -6.82031,-14.34375 l 5.625,0 16.03125,19.54687'
                            fill='currentColor'
                          />
                        </svg>
                      );
                    }

                    // Eighth rest SVG
                    if (symbol === 'SVG_REST_EIGHTH') {
                      return (
                        <svg
                          key={idx}
                          className='rhythm-note rhythm-rest-svg'
                          width='10'
                          height='32'
                          viewBox='0 0 7200 7200'
                          style={{ display: 'inline-block' }}
                        >
                          <path
                            d='M5225.287,601.886c-614.986-128.004-472.293,1271.209-1757.328,1218.164c89.865-168.64,140.941-361.042,140.941-565.446  c0-665.175-539.234-1204.387-1204.387-1204.387c-665.15,0-1204.387,539.211-1204.387,1204.387  c0,542.403,358.619,1000.943,851.65,1151.774c615.369,262.896,1501.846,179.729,2097.055,58.182  c-233.398,1562.26-1550.283,4559.834-891.492,4633.305c274.154,30.578,327.703,23.258,464.203-444.475  c493.008-1689.305,1142.293-3791.977,1488.334-5100.414C5353.244,1010.885,5508.875,660.907,5225.287,601.886z'
                            fill='currentColor'
                          />
                        </svg>
                      );
                    }

                    // Sixteenth rest SVG
                    if (symbol === 'SVG_REST_SIXTEENTH') {
                      return (
                        <svg
                          key={idx}
                          className='rhythm-note rhythm-rest-svg'
                          width='8'
                          height='32'
                          viewBox='0 0 1893 3040'
                          style={{ display: 'inline-block' }}
                        >
                          <path
                            d='m 1879,148 -131,5 c 0,0 -76,239 -153,335 -44,55 -169,127 -169,127 l -153,72 -163,52 c 0,0 -104,25 -156,20 -24,-3 -70,-25 -70,-25 27,-27 55,-53 81,-81 29,-30 52,-58 70,-96 15,-33 27,-68 30,-104 3,-39 6,-78 0,-116 -5,-32 -14,-63 -27,-92 -14,-33 -33,-64 -54,-93 -18,-25 -47,-45 -72,-63 -41,-28 -80,-48 -128,-60 -40,-10 -82,-18 -123,-15 -57,4 -115,18 -165,46 -55,30 -104,75 -139,127 -34,51 -55,112 -61,173 -8,89 5,184 42,266 31,65 93,134 142,165 113,72 186,83 258,96 72,16 146,18 219,16 79,-2 158,-13 235,-31 65,-15 128,-38 189,-65 60,-27 138,-77 192,-115 28,-19 -161,628 -161,628 l -98,102 -169,127 -153,72 -163,52 c 0,0 -104,25 -156,20 -24,-3 -70,-25 -70,-25 27,-27 55,-53 81,-81 29,-30 52,-58 70,-96 15,-33 27,-68 30,-104 3,-39 6,-78 0,-116 -5,-32 -14,-63 -27,-92 -14,-33 -33,-64 -54,-93 -18,-25 -47,-45 -72,-63 -41,-28 -80,-48 -128,-60 -40,-10 -82,-18 -123,-15 -57,4 -115,18 -165,46 -55,30 -104,75 -139,127 -34,51 -55,112 -61,173 -8,89 4,185 42,266 30,66 93,134 142,165 113,72 186,83 258,96 72,16 146,18 219,16 79,-2 158,-13 235,-31 65,-15 128,-38 189,-65 60,-27 144,-57 198,-95 15,-25 -240,845 -374,1367 91,14 86,17 155,7 141,-429 653,-2286 800,-2872 z'
                            fill='currentColor'
                          />
                        </svg>
                      );
                    }

                    return (
                      <span key={idx} className='rhythm-note'>
                        {symbol}
                      </span>
                    );
                  })}
                </div>
                <div className='rhythm-pattern-name'>{pattern.name}</div>
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
            <Check size={32} />
          </div>
          <div className='feedback-content'>
            <h4>Perfect! 🎉</h4>
            <p>
              Correct pattern: <strong>{currentPattern.name}</strong>
            </p>
            {!hasAnyWrongAnswer && <p className='streak-message'>+1 point • Streak: {streak} 🔥</p>}
            {hasAnyWrongAnswer && <p className='streak-message'>Completed with errors • No point awarded</p>}
          </div>
        </div>
      )}
    </div>
  );
}
