import React from 'react';
import type { UserProfile, SubmissionDoc } from '../../../shared/types/conservatory.types';

interface Props {
  student: UserProfile;
  submissions: SubmissionDoc[];
  onClose: () => void;
}

const MODULE_LABELS: Record<string, string> = {
  'melodic-intervals': 'Intervalli melodici',
  'harmonic-intervals': 'Intervalli armonici',
  'triads': 'Triadi',
  'sevenths': 'Settime',
  'tonal-functions': 'Funzioni tonali',
  'cadences': 'Cadenze',
};

function scoreColor(s: number): string {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}

export function StudentDrawer({ student, submissions, onClose }: Props) {
  const recent = [...submissions]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 15);

  const avgScore = submissions.length
    ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length)
    : 0;

  const sparkData = [...submissions]
    .sort((a, b) => a.completedAt - b.completedAt)
    .slice(-10)
    .map(s => s.score);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)' }}
      />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: Math.min(380, window.innerWidth),
        zIndex: 401,
        background: '#161b22',
        borderLeft: '1px solid #30363d',
        overflowY: 'auto',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3' }}>{student.displayName}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{student.email}</div>
            {student.conservatory && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>{student.conservatory}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: '#1c2128', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(avgScore) }}>{submissions.length > 0 ? `${avgScore}%` : '—'}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Media</div>
          </div>
          <div style={{ flex: 1, background: '#1c2128', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3' }}>{submissions.length}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Sessioni</div>
          </div>
        </div>

        {sparkData.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Andamento (ultime {sparkData.length})
            </div>
            <svg width="100%" height="50" viewBox={`0 0 ${(sparkData.length - 1) * 30} 50`} preserveAspectRatio="none">
              <polyline
                points={sparkData.map((v, i) => `${i * 30},${50 - (v / 100) * 44}`).join(' ')}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sparkData.map((v, i) => (
                <circle key={i} cx={i * 30} cy={50 - (v / 100) * 44} r="3" fill={scoreColor(v)} />
              ))}
            </svg>
          </div>
        )}

        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Sessioni recenti
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>
            Nessuna sessione ancora
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map(sub => {
              const label = MODULE_LABELS[sub.moduleId] ?? sub.moduleId.replace('exam-template:', 'Prova: ');
              const date = new Date(sub.completedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
              return (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#1c2128',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ color: '#e6edf3', fontWeight: 500 }}>{label}</div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 1 }}>{date}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: scoreColor(sub.score) }}>{sub.score}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
