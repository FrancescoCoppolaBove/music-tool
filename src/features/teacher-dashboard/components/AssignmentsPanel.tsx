import React from 'react';
import type { AssignmentsPanelProps } from '../TeacherDashboardFeature';

const MODULE_LABELS: Record<string, string> = {
  'melodic-intervals': 'Intervalli melodici',
  'harmonic-intervals': 'Intervalli armonici',
  'triads': 'Triadi',
  'sevenths': 'Accordi di settima',
  'tonal-functions': 'Funzioni tonali',
  'cadences': 'Cadenze',
};

export function AssignmentsPanel({ data, onNewAssignment, onRefresh }: AssignmentsPanelProps) {
  const now = Date.now();
  const active = data.assignments.filter(a => a.dueDate > now);
  const past   = data.assignments.filter(a => a.dueDate <= now).slice(0, 5);

  function daysUntil(ms: number) {
    return Math.ceil((ms - now) / (24 * 60 * 60 * 1000));
  }

  function completionRate(assignmentId: string, classId: string): { done: number; total: number } {
    const cls = data.classes.find(c => c.id === classId);
    if (!cls) return { done: 0, total: 0 };
    const total = cls.studentIds.length;
    const done = data.submissions.filter(s => s.assignmentId === assignmentId).length;
    return { done, total };
  }

  return (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>
          Compiti attivi ({active.length})
        </div>
        <button
          onClick={onNewAssignment}
          style={{
            padding: '6px 14px', background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Nuovo
        </button>
      </div>

      {active.length === 0 ? (
        <div style={{ padding: '20px 18px', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
          Nessun compito attivo.
        </div>
      ) : (
        active.map(a => {
          const { done, total } = completionRate(a.id!, a.classId);
          const days = daysUntil(a.dueDate);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const cls = data.classes.find(c => c.id === a.classId);

          return (
            <div key={a.id} style={{ padding: '14px 18px', borderBottom: '1px solid #21262d' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>
                    {a.title || MODULE_LABELS[a.moduleId] || a.moduleId}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {cls?.name ?? '—'} · L{a.level} · {a.mode === 'exam' ? 'Esame' : 'Allenamento'}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: days <= 2 ? '#ef4444' : '#f59e0b', textAlign: 'right' }}>
                  {days <= 0 ? 'Scaduto' : `${days}g`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#10b981' : '#7c3aed', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>{done}/{total}</div>
              </div>
            </div>
          );
        })
      )}

      {past.length > 0 && (
        <div style={{ padding: '10px 18px', borderTop: '1px solid #21262d' }}>
          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Scaduti recenti
          </div>
          {past.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #1c2128' }}>
              <span>{a.title || MODULE_LABELS[a.moduleId] || a.moduleId}</span>
              <span>{new Date(a.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
