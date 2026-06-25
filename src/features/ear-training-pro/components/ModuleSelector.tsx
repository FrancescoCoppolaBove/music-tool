// src/features/ear-training-pro/components/ModuleSelector.tsx
import React, { useState } from 'react';
import { EarModuleId, ExerciseMode, ExerciseLevel } from '../types';

const MODULES: Array<{ id: EarModuleId; icon: string; label: string; desc: string }> = [
  { id: 'melodic-intervals',  icon: '🎵', label: 'Intervalli Melodici',  desc: 'Ascolta due note in sequenza' },
  { id: 'harmonic-intervals', icon: '🎶', label: 'Intervalli Armonici',  desc: 'Ascolta due note simultanee' },
  { id: 'triads',             icon: '🎹', label: 'Triadi',               desc: 'Maggiore, minore, dim, aug + rivolti' },
  { id: 'sevenths',           icon: '🎸', label: 'Accordi di Settima',   desc: 'Dom7, maj7, min7, semidim + rivolti' },
  { id: 'tonal-functions',    icon: '🧲', label: 'Funzioni Tonali',      desc: 'Tonica, dominante, sottodominante' },
  { id: 'cadences',           icon: '🎓', label: 'Cadenze',              desc: 'Autentica, plagale, evitata, semicadenza' },
];

interface Selection { moduleId: EarModuleId; level: ExerciseLevel; mode: ExerciseMode }

export function ModuleSelector({ onStart }: { onStart: (s: Selection) => void }) {
  const [selected, setSelected] = useState<EarModuleId>('melodic-intervals');
  const [level, setLevel]       = useState<ExerciseLevel>(1);
  const [mode, setMode]         = useState<ExerciseMode>('training');

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, color: '#e6edf3', marginBottom: 4 }}>
        Ear Training Pro
      </h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Scegli modulo, livello e modalità</p>

      {/* Module grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              padding: '12px 14px', textAlign: 'left',
              background: selected === m.id ? '#7c3aed18' : '#1c2128',
              border: `1px solid ${selected === m.id ? '#7c3aed' : '#30363d'}`,
              borderRadius: 10, cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected === m.id ? '#c4b5fd' : '#e6edf3' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Level */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
          Livello
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([1, 2, 3] as ExerciseLevel[]).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: level === l ? '#7c3aed' : '#21262d',
                border: `1px solid ${level === l ? '#7c3aed' : '#30363d'}`,
                color: level === l ? '#fff' : '#8b949e',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {l === 1 ? '1 — Base' : l === 2 ? '2 — Intermedio' : '3 — Avanzato'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {(['training', 'exam'] as ExerciseMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '14px', textAlign: 'center', borderRadius: 10,
              background: mode === m ? '#7c3aed18' : '#1c2128',
              border: `1px solid ${mode === m ? '#7c3aed' : '#30363d'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{m === 'training' ? '🏋️' : '📝'}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: mode === m ? '#c4b5fd' : '#e6edf3' }}>
              {m === 'training' ? 'Allenamento' : 'Esame'}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {m === 'training' ? 'Feedback immediato · infinito' : '10 domande · timer · report'}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart({ moduleId: selected, level, mode })}
        style={{
          width: '100%', padding: '14px', background: '#7c3aed', color: '#fff',
          border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Inizia →
      </button>
    </div>
  );
}
