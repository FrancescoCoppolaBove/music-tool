import React, { useState } from 'react';
import { SETTICLAVIO_EXERCISES } from './data/exercises';
import { CClefType } from './types';
import { NoteQuiz } from './components/NoteQuiz';

type Screen = 'selector' | 'exercise';

export default function SetticlavioFeature() {
  const [screen, setScreen]   = useState<Screen>('selector');
  const [clef, setClef]       = useState<CClefType>('contralto');
  const [level, setLevel]     = useState<1 | 2 | 3>(1);
  const [idx, setIdx]         = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal]     = useState(0);

  const pool = SETTICLAVIO_EXERCISES.filter(e => e.clef === clef && e.level === level);
  const exercise = pool[idx % pool.length];

  function handleAnswer(isCorrect: boolean) {
    setTotal(t => t + 1);
    if (isCorrect) setCorrect(c => c + 1);
    setIdx(i => i + 1);
  }

  if (screen === 'selector') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, color: '#e6edf3', marginBottom: 4 }}>Setticlavio</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Leggi le note nelle chiavi antiche — fondamentale per viola, violoncello, trombone e fagotto.</p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Chiave</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['contralto', 'tenore'] as CClefType[]).map(c => (
              <button key={c} onClick={() => setClef(c)} style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                background: clef === c ? '#7c3aed18' : '#1c2128',
                border: `1px solid ${clef === c ? '#7c3aed' : '#30363d'}`,
                color: clef === c ? '#c4b5fd' : '#e6edf3', fontWeight: 600, fontSize: 13,
                textTransform: 'capitalize',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Livello</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2, 3] as const).map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{
                flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                background: level === l ? '#7c3aed' : '#21262d',
                border: `1px solid ${level === l ? '#7c3aed' : '#30363d'}`,
                color: level === l ? '#fff' : '#8b949e', fontSize: 13, fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setIdx(0); setCorrect(0); setTotal(0); setScreen('exercise'); }}
          style={{ width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Inizia →
        </button>
      </div>
    );
  }

  if (!exercise) return <div style={{ padding: 24, color: '#8b949e' }}>Nessun esercizio per questa selezione.</div>;

  return (
    <div>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setScreen('selector')} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 13 }}>
          ← Cambia chiave
        </button>
        <div style={{ fontSize: 13, color: '#8b949e' }}>
          {total > 0 && `${correct}/${total} · ${Math.round(correct / total * 100)}%`}
        </div>
      </div>
      <NoteQuiz
        key={`${exercise.id}-${idx}`}
        exercise={exercise}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
