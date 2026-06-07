/**
 * EAR TRAINING FEATURE
 * Selector tra 7 esercizi + iOS audio unlock
 */

import React, { useState, useEffect } from 'react';
import { EarTrainingSettingsProvider, useEarTrainingSettings, type RepeatDelay } from './context/EarTrainingSettingsContext';
import './styles/_ear-training.css';
import {
  Headphones,
  Music2,
  GitCompare,
  Music,
  Scale3d,
  List,
  Target,
  Music4,
  GitMerge,
  ChevronDown,
  ChevronUp,
  Music3,
  Activity,
} from 'lucide-react';
import { PerfectPitchExercise } from './components/PerfectPitchExercise';
import { IntervalsExercise } from './components/IntervalsExercise';
import { ChordsExercise } from './components/ChordsExercise';
import { ScalesExercise } from './components/ScalesExercise';
import { ChordProgressionsExercise } from './components/ChordProgressionsExercise';
import { ScaleDegreesExercise } from './components/ScaleDegreesExercise';
import { MelodicDictationExercise } from './components/MelodicDictationExercise';
import { IntervalsInContextExercise } from './components/IntervalsInContextExercise';
import { RhythmRecognitionExercise } from './components/RhythmRecognitionExercise';
import { BPMRecognitionExercise } from './components/BpmRecognitionExercise';
import { audioPlayer } from '../../features/ear-training/utils/audio-player';

type ExerciseType =
  | 'perfect-pitch'
  | 'intervals'
  | 'chords'
  | 'scales'
  | 'progressions'
  | 'degrees'
  | 'melodic'
  | 'intervals-context'
  | 'rhythm'
  | 'bpm';

const EXERCISES = [
  { id: 'perfect-pitch' as ExerciseType, name: 'Perfect Pitch', icon: Music2, description: 'Identify single notes' },
  { id: 'intervals' as ExerciseType, name: 'Intervals', icon: GitCompare, description: 'Recognize intervals' },
  { id: 'chords' as ExerciseType, name: 'Chords', icon: Music, description: 'Identify chord types' },
  { id: 'scales' as ExerciseType, name: 'Scales', icon: Scale3d, description: 'Recognize scales' },
  { id: 'progressions' as ExerciseType, name: 'Progressions', icon: List, description: 'Identify chord progressions' },
  { id: 'degrees' as ExerciseType, name: 'Scale Degrees', icon: Target, description: 'Identify scale degrees in context' },
  { id: 'melodic' as ExerciseType, name: 'Melodic Dictation', icon: Music4, description: 'Identify melodies note by note' },
  {
    id: 'intervals-context' as ExerciseType,
    name: 'Intervals in Context',
    icon: GitMerge,
    description: 'Identify intervals and degrees in key',
  },
  { id: 'rhythm' as ExerciseType, name: 'Rhythm Recognition', icon: Music3, description: 'Identify rhythm patterns' },
  { id: 'bpm' as ExerciseType, name: 'BPM Recognition', icon: Activity, description: 'Identify tempo (BPM)' },
];

// ─── Auto-repeat settings bar ────────────────────────────────────────────────

function AutoRepeatBar() {
  const { autoRepeat, setAutoRepeat, repeatDelay, setRepeatDelay } = useEarTrainingSettings();

  const delays: { label: string; value: RepeatDelay }[] = [
    { label: '3s', value: 3000 },
    { label: '5s', value: 5000 },
    { label: '8s', value: 8000 },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 0 2px',
      borderTop: '1px solid #21262d',
      marginTop: 12,
    }}>
      <span style={{ fontSize: 12, color: '#4b5563', fontWeight: 600 }}>Auto-repeat:</span>
      <button
        onClick={() => setAutoRepeat(!autoRepeat)}
        style={{
          padding: '4px 12px', borderRadius: 20,
          border: `1px solid ${autoRepeat ? '#7c3aed' : '#30363d'}`,
          background: autoRepeat ? '#7c3aed22' : 'none',
          color: autoRepeat ? '#c4b5fd' : '#6b7280',
          fontSize: 12, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
        }}
      >
        {autoRepeat ? '● On' : '○ Off'}
      </button>

      {autoRepeat && (
        <div style={{ display: 'flex', gap: 6 }}>
          {delays.map(d => (
            <button
              key={d.value}
              onClick={() => setRepeatDelay(d.value)}
              style={{
                padding: '4px 10px', borderRadius: 20,
                border: `1px solid ${repeatDelay === d.value ? '#7c3aed' : '#30363d'}`,
                background: repeatDelay === d.value ? '#7c3aed22' : 'none',
                color: repeatDelay === d.value ? '#c4b5fd' : '#6b7280',
                fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              {d.label}
            </button>
          ))}
          <span style={{ fontSize: 11, color: '#4b5563', alignSelf: 'center' }}>between plays</span>
        </div>
      )}
    </div>
  );
}

// ─── Inner feature (inside provider) ─────────────────────────────────────────

function EarTrainingInner() {
  const [activeExercise, setActiveExercise] = useState<ExerciseType>('perfect-pitch');
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // ✅ 1. Gestisce la responsività
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ 2. Sblocco automatico per Desktop / Android (non necessario su iOS)
  useEffect(() => {
    const tryAutoUnlock = async () => {
      try {
        await audioPlayer.initAudioContext();
        setAudioUnlocked(true);
        console.log('🎧 Auto-unlocked audio (desktop/android)');
      } catch {
        console.log('🔒 Awaiting user gesture to unlock audio...');
      }
    };
    tryAutoUnlock();
  }, []);

  // ✅ 3. Unlock manuale su iOS (click/tap diretto)
  const unlockAudio = () => {
    if (audioUnlocked) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext!;
      const ctx = audioPlayer['audioContext'] || new AudioContextClass();

      ctx.resume();

      // Suono silenzioso per sbloccare iOS
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Assegna al player e segna come sbloccato
      // @ts-ignore
      audioPlayer.audioContext = ctx;
      setAudioUnlocked(true);
      console.log('🔓 Audio context unlocked by user gesture');
    } catch (err) {
      console.warn('⚠️ Failed to unlock audio:', err);
    }
  };

  // ✅ 4. Quando l’utente seleziona un esercizio
  const handleSelect = (id: ExerciseType) => {
    if (!audioUnlocked) unlockAudio();
    setActiveExercise(id);
    if (isMobile) setMenuOpen(false);
  };

  return (
    <div className='ear-training-feature' onClick={!audioUnlocked ? unlockAudio : undefined}>
      {/* Header */}
      <div className='card'>
        <div className='card-header'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Headphones size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className='card-title'>Ear Training</h2>
              <p className='card-description'>Develop your musical ear</p>
            </div>
          </div>
        </div>

        {/* Selector area */}
        <div className='card-content'>
          {isMobile && (
            <button className='selector-toggle' onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? (
                <>
                  <ChevronUp size={20} /> Chiudi selezione
                </>
              ) : (
                <>
                  <ChevronDown size={20} /> Seleziona esercizio
                </>
              )}
            </button>
          )}

          <div className={`exercise-selector-wrapper ${!isMobile || menuOpen ? 'open' : 'closed'}`}>
            <div className='exercise-selector'>
              {EXERCISES.map((exercise) => {
                const Icon = exercise.icon;
                const isActive = activeExercise === exercise.id;
                return (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelect(exercise.id)}
                    className={`exercise-selector-button ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={24} />
                    <div className='exercise-selector-content'>
                      <span className='exercise-selector-name'>{exercise.name}</span>
                      <span className='exercise-selector-description'>{exercise.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <AutoRepeatBar />
        </div>
      </div>

      {/* Active Exercise */}
      {activeExercise === 'perfect-pitch' && <PerfectPitchExercise />}
      {activeExercise === 'intervals' && <IntervalsExercise />}
      {activeExercise === 'chords' && <ChordsExercise />}
      {activeExercise === 'scales' && <ScalesExercise />}
      {activeExercise === 'progressions' && <ChordProgressionsExercise />}
      {activeExercise === 'degrees' && <ScaleDegreesExercise />}
      {activeExercise === 'melodic' && <MelodicDictationExercise />}
      {activeExercise === 'intervals-context' && <IntervalsInContextExercise />}
      {activeExercise === 'rhythm' && <RhythmRecognitionExercise />}
      {activeExercise === 'bpm' && <BPMRecognitionExercise />}
    </div>
  );
}

export default function EarTrainingFeature() {
  return (
    <EarTrainingSettingsProvider>
      <EarTrainingInner />
    </EarTrainingSettingsProvider>
  );
}
