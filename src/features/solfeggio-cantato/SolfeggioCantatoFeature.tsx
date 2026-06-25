import React, { useState } from 'react';
import { SOLFEGGIO_EXERCISES } from './data/exercises';
import { NoteEvaluation, SolfeggioExercise } from './types';
import { ExercisePlayer } from './components/ExercisePlayer';
import { SolfeggioResults } from './components/SolfeggioResults';

type Level = 'propedeutico' | 'facile' | 'medio';
type Screen = 'selector' | 'exercise' | 'results';

export default function SolfeggioCantatoFeature() {
  const [screen, setScreen] = useState<Screen>('selector');
  const [level, setLevel]   = useState<Level>('propedeutico');
  const [idx, setIdx]       = useState(0);
  const [evals, setEvals]   = useState<NoteEvaluation[]>([]);

  const filtered = SOLFEGGIO_EXERCISES.filter(e => e.level === level);
  const exercise: SolfeggioExercise | undefined = filtered[idx % filtered.length];

  function handleResult(ev: NoteEvaluation[]) {
    setEvals(ev);
    setScreen('results');
  }

  if (screen === 'selector') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, color: '#e6edf3', marginBottom: 4 }}>Solfeggio Cantato</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Ascolta la frase, poi cantala. Pitchy valuterà la tua intonazione nota per nota.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {(['propedeutico', 'facile', 'medio'] as Level[]).map(l => {
            const count = SOLFEGGIO_EXERCISES.filter(e => e.level === l).length;
            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                style={{
                  padding: '14px 16px', textAlign: 'left',
                  background: level === l ? '#7c3aed18' : '#1c2128',
                  border: `1px solid ${level === l ? '#7c3aed' : '#30363d'}`,
                  borderRadius: 10, cursor: 'pointer', color: '#e6edf3',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: level === l ? '#c4b5fd' : '#e6edf3', textTransform: 'capitalize' }}>{l}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{count} esercizi</div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { setIdx(0); setScreen('exercise'); }}
          style={{ width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Inizia →
        </button>
      </div>
    );
  }

  if (screen === 'exercise' && exercise) {
    return (
      <ExercisePlayer
        key={exercise.id}
        exercise={exercise}
        onResult={handleResult}
      />
    );
  }

  if (screen === 'results') {
    return (
      <SolfeggioResults
        evals={evals}
        onRetry={() => setScreen('exercise')}
        onNext={() => { setIdx(i => i + 1); setScreen('exercise'); }}
      />
    );
  }

  return null;
}
