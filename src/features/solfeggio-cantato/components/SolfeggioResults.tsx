import React from 'react';
import { NoteEvaluation } from '../types';

const STATUS_COLOR: Record<string, string> = {
  correct: '#22c55e', sharp: '#f59e0b', flat: '#f59e0b', missed: '#ef4444',
};
const STATUS_LABEL: Record<string, string> = {
  correct: '✓', sharp: '↑', flat: '↓', missed: '✗',
};

export function SolfeggioResults({
  evals,
  onRetry,
  onNext,
}: {
  evals: NoteEvaluation[];
  onRetry: () => void;
  onNext: () => void;
}) {
  const correct = evals.filter(e => e.status === 'correct').length;
  const pct     = Math.round((correct / evals.length) * 100);
  const color   = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color, fontFamily: "'Syne', sans-serif" }}>{pct}%</div>
        <div style={{ fontSize: 13, color: '#8b949e' }}>{correct}/{evals.length} note corrette</div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {evals.map((e, i) => (
          <div
            key={i}
            title={e.status === 'correct' ? 'Preciso' : `${e.centsOff > 0 ? '+' : ''}${e.centsOff} cent`}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `${STATUS_COLOR[e.status]}22`,
              border: `2px solid ${STATUS_COLOR[e.status]}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontSize: 11,
            }}
          >
            <div style={{ fontWeight: 700, color: '#e6edf3' }}>{e.note.label}</div>
            <div style={{ color: STATUS_COLOR[e.status] }}>{STATUS_LABEL[e.status]}</div>
          </div>
        ))}
      </div>

      {pct < 80 && (
        <div style={{ padding: '10px 14px', background: '#f59e0b18', border: '1px solid #f59e0b30', borderRadius: 8, fontSize: 12, color: '#fcd34d', marginBottom: 16 }}>
          {evals.filter(e => e.status === 'sharp').length > 0 && 'Alcune note troppo acute. '}
          {evals.filter(e => e.status === 'flat').length > 0 && 'Alcune note troppo gravi. '}
          {evals.filter(e => e.status === 'missed').length > 0 && 'Alcune note non rilevate — canta più forte e tieni la nota.'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onRetry} style={{ flex: 1, padding: '12px', background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
          Riprova
        </button>
        <button onClick={onNext} style={{ flex: 1, padding: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Prossimo →
        </button>
      </div>
    </div>
  );
}
