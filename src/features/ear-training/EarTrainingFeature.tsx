/**
 * EAR TRAINING FEATURE
 * Selector tra 7 esercizi
 */

import React, { useState } from 'react';
import { Headphones, Music2, GitCompare, Music, Scale3d, List, Target, Music4 } from 'lucide-react';
import { PerfectPitchExercise } from './components/PerfectPitchExercise';
import { IntervalsExercise } from './components/IntervalsExercise';
import { ChordsExercise } from './components/ChordsExercise';
import { ScalesExercise } from './components/ScalesExercise';
import { ChordProgressionsExercise } from './components/ChordProgressionsExercise';
import { ScaleDegreesExercise } from './components/ScaleDegreesExercise';
import { MelodicDictationExercise } from './components/MelodicDictationExercise';

type ExerciseType = 'perfect-pitch' | 'intervals' | 'chords' | 'scales' | 'progressions' | 'degrees' | 'melodic';

const EXERCISES = [
  {
    id: 'perfect-pitch' as ExerciseType,
    name: 'Perfect Pitch',
    icon: Music2,
    description: 'Identify single notes',
  },
  {
    id: 'intervals' as ExerciseType,
    name: 'Intervals',
    icon: GitCompare,
    description: 'Recognize intervals',
  },
  {
    id: 'chords' as ExerciseType,
    name: 'Chords',
    icon: Music,
    description: 'Identify chord types',
  },
  {
    id: 'scales' as ExerciseType,
    name: 'Scales',
    icon: Scale3d,
    description: 'Recognize scales',
  },
  {
    id: 'progressions' as ExerciseType,
    name: 'Progressions',
    icon: List,
    description: 'Identify chord progressions',
  },
  {
    id: 'degrees' as ExerciseType,
    name: 'Scale Degrees',
    icon: Target,
    description: 'Identify scale degrees in context',
  },
  {
    id: 'melodic' as ExerciseType,
    name: 'Melodic Dictation',
    icon: Music4,
    description: 'Identify melodies note by note',
  },
];

export function EarTrainingFeature() {
  const [activeExercise, setActiveExercise] = useState<ExerciseType>('perfect-pitch');

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

        {/* Exercise Selector */}
        <div className='card-content'>
          <div className='exercise-selector'>
            {EXERCISES.map((exercise) => {
              const Icon = exercise.icon;
              const isActive = activeExercise === exercise.id;

              return (
                <button
                  key={exercise.id}
                  onClick={() => setActiveExercise(exercise.id)}
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

      {/* Active Exercise */}
      {activeExercise === 'perfect-pitch' && <PerfectPitchExercise />}
      {activeExercise === 'intervals' && <IntervalsExercise />}
      {activeExercise === 'chords' && <ChordsExercise />}
      {activeExercise === 'scales' && <ScalesExercise />}
      {activeExercise === 'progressions' && <ChordProgressionsExercise />}
      {activeExercise === 'degrees' && <ScaleDegreesExercise />}
      {activeExercise === 'melodic' && <MelodicDictationExercise />}
    </div>
  );
}
