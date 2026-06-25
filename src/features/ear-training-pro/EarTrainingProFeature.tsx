import React, { useState } from 'react';
import { EarModuleId, ExerciseLevel, ExerciseMode } from './types';
import { ModuleSelector } from './components/ModuleSelector';
import { ExamSession } from './components/ExamSession';
import { generateQuestions } from './data/index';

// For training mode, reuse existing exercise components
import { IntervalsExercise }       from '../ear-training/components/IntervalsExercise';
import { ChordsExercise }          from '../ear-training/components/ChordsExercise';

type Screen = 'selector' | 'training' | 'exam';

interface ActiveConfig { moduleId: EarModuleId; level: ExerciseLevel; mode: ExerciseMode }

export default function EarTrainingProFeature() {
  const [screen, setScreen] = useState<Screen>('selector');
  const [config, setConfig] = useState<ActiveConfig | null>(null);

  function handleStart(sel: ActiveConfig) {
    setConfig(sel);
    setScreen(sel.mode === 'exam' ? 'exam' : 'training');
  }

  function handleBack() {
    setScreen('selector');
    setConfig(null);
  }

  if (screen === 'selector' || !config) {
    return <ModuleSelector onStart={handleStart} />;
  }

  if (screen === 'exam') {
    const questions = generateQuestions(config.moduleId, config.level, 10);
    return (
      <ExamSession
        moduleId={config.moduleId}
        level={config.level}
        questions={questions}
        onBack={handleBack}
      />
    );
  }

  // Training mode — reuse existing exercises (they have full settings UI)
  return (
    <div>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handleBack}
          style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 13 }}
        >
          ← Cambia modulo
        </button>
      </div>
      <TrainingExercise moduleId={config.moduleId} />
    </div>
  );
}

function TrainingExercise({ moduleId }: { moduleId: EarModuleId }) {
  switch (moduleId) {
    case 'melodic-intervals':
    case 'harmonic-intervals':
      return <IntervalsExercise />;
    case 'triads':
    case 'sevenths':
      return <ChordsExercise />;
    case 'tonal-functions':
      // Built in Task 6
      return <div style={{ padding: 24, color: '#8b949e' }}>Tonal Functions — coming in next task</div>;
    case 'cadences':
      return <div style={{ padding: 24, color: '#8b949e' }}>Cadences Training — coming in next task</div>;
    default:
      return null;
  }
}
