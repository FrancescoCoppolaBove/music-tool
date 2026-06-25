// src/features/ear-training-pro/components/ExamResults.tsx
import React from 'react';
import { ExamSessionResult } from '../types';

const MODULE_LABELS: Record<string, string> = {
  'melodic-intervals':  'Intervalli Melodici',
  'harmonic-intervals': 'Intervalli Armonici',
  'triads':             'Triadi',
  'sevenths':           'Accordi di Settima',
  'tonal-functions':    'Funzioni Tonali',
  'cadences':           'Cadenze',
};

export function ExamResults({
  result,
  onRetry,
  onBack,
}: {
  result: ExamSessionResult;
  onRetry: () => void;
  onBack: () => void;
}) {
  const scoreColor = result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor, fontFamily: "'Syne', sans-serif" }}>
          {result.score}%
        </div>
        <div style={{ fontSize: 14, color: '#8b949e', marginTop: 4 }}>
          {MODULE_LABELS[result.moduleId]} · Livello {result.level}
        </div>
        <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
          {result.answers.filter(a => a.isCorrect).length}/{result.answers.length} corrette
          · {Math.round(result.durationMs / 1000)}s
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {result.answers.map((a, i) => (
          <div
            key={a.questionId}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              background: a.isCorrect ? '#22c55e18' : '#ef444418',
              border: `1px solid ${a.isCorrect ? '#22c55e30' : '#ef444430'}`,
              borderRadius: 8, fontSize: 13,
            }}
          >
            <span style={{ color: a.isCorrect ? '#22c55e' : '#ef4444', fontWeight: 700, width: 20 }}>
              {a.isCorrect ? '✓' : '✗'}
            </span>
            <span style={{ color: '#8b949e', width: 20 }}>{i + 1}.</span>
            <span style={{ flex: 1, color: '#e6edf3' }}>{a.correct}</span>
            {!a.isCorrect && (
              <span style={{ color: '#ef4444', fontSize: 12 }}>hai detto: {a.given}</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 1, padding: '12px', background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Riprova
        </button>
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: '12px', background: '#21262d', color: '#e6edf3',
            border: '1px solid #30363d', borderRadius: 10, fontSize: 14, cursor: 'pointer',
          }}
        >
          Cambia modulo
        </button>
      </div>
    </div>
  );
}
