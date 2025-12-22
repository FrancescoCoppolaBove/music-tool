/**
 * EAR TRAINING FEATURE
 * Selector tra 7 esercizi
 */

import React, { useState, useEffect } from 'react';
import { Headphones, Music2, GitCompare, Music, Scale3d, List, Target, Music4, GitMerge, ChevronDown, ChevronUp } from 'lucide-react';
import { PerfectPitchExercise } from './components/PerfectPitchExercise';
import { IntervalsExercise } from './components/IntervalsExercise';
import { ChordsExercise } from './components/ChordsExercise';
import { ScalesExercise } from './components/ScalesExercise';
import { ChordProgressionsExercise } from './components/ChordProgressionsExercise';
import { ScaleDegreesExercise } from './components/ScaleDegreesExercise';
import { MelodicDictationExercise } from './components/MelodicDictationExercise';
import { IntervalsInContextExercise } from './components/IntervalsInContextExercise';

type ExerciseType = 'perfect-pitch' | 'intervals' | 'chords' | 'scales' | 'progressions' | 'degrees' | 'melodic' | 'intervals-context';

const EXERCISES = [
  { id: 'perfect-pitch', name: 'Perfect Pitch', icon: Music2, description: 'Identify single notes' },
  { id: 'intervals', name: 'Intervals', icon: GitCompare, description: 'Recognize intervals' },
  { id: 'chords', name: 'Chords', icon: Music, description: 'Identify chord types' },
  { id: 'scales', name: 'Scales', icon: Scale3d, description: 'Recognize scales' },
  { id: 'progressions', name: 'Progressions', icon: List, description: 'Identify chord progressions' },
  { id: 'degrees', name: 'Scale Degrees', icon: Target, description: 'Identify scale degrees in context' },
  { id: 'melodic', name: 'Melodic Dictation', icon: Music4, description: 'Identify melodies note by note' },
  { id: 'intervals-context', name: 'Intervals in Context', icon: GitMerge, description: 'Identify intervals and degrees in key' },
];

export function EarTrainingFeature() {
  const [activeExercise, setActiveExercise] = useState<ExerciseType>('perfect-pitch');
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelect = (id: ExerciseType) => {
    setActiveExercise(id);
    if (isMobile) setMenuOpen(false); // Chiude automaticamente su mobile
  };

  return (
    <div className='ear-training-feature'>
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
    </div>
  );
}
