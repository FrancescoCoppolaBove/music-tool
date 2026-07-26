import React, { useState, useMemo } from 'react';
import type { RosterPanelProps } from '../TeacherDashboardFeature';
import type { UserProfile } from '../../../shared/types/conservatory.types';

type SortKey = 'name' | 'accuracy' | 'sessions';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export function RosterPanel({ data, onSelectStudent }: RosterPanelProps & { onSelectStudent: (s: UserProfile) => void }) {
  const [sort, setSort] = useState<SortKey>('name');
  const now = Date.now();

  const studentStats = useMemo(() => {
    return data.students.map(s => {
      const subs = data.submissions.filter(sub => sub.userId === s.uid);
      const recent = subs.filter(sub => now - sub.completedAt < ONE_WEEK);
      const accuracy = subs.length
        ? Math.round(subs.reduce((acc, sub) => acc + sub.score, 0) / subs.length)
        : 0;
      return { student: s, sessions: subs.length, recentSessions: recent.length, accuracy };
    });
  }, [data.students, data.submissions]);

  const sorted = [...studentStats].sort((a, b) => {
    if (sort === 'name')     return a.student.displayName.localeCompare(b.student.displayName);
    if (sort === 'accuracy') return b.accuracy - a.accuracy;
    return b.recentSessions - a.recentSessions;
  });

  return (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>
          Studenti ({data.students.length})
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['name', 'accuracy', 'sessions'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSort(k)}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                background: sort === k ? '#7c3aed' : '#21262d',
                color: sort === k ? '#fff' : '#8b949e',
                border: 'none', borderRadius: 6, cursor: 'pointer',
              }}
            >
              {k === 'name' ? 'Nome' : k === 'accuracy' ? '% Media' : 'Sessioni'}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: '24px 18px', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
          Nessuno studente nelle tue classi.<br />
          Aggiungi gli studenti via Firebase console (MVP).
        </div>
      ) : (
        <div>
          {sorted.map(({ student, sessions, recentSessions, accuracy }) => {
            const inactive = recentSessions === 0;
            const initials = student.displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

            return (
              <button
                key={student.uid}
                onClick={() => onSelectStudent(student)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 18px',
                  background: 'none', border: 'none',
                  borderBottom: '1px solid #21262d',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: inactive ? '#374151' : '#7c3aed33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: inactive ? '#6b7280' : '#c4b5fd',
                }}>
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: inactive ? '#8b949e' : '#e6edf3', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {student.displayName}
                    {inactive && <span style={{ fontSize: 10, padding: '1px 6px', background: '#374151', color: '#6b7280', borderRadius: 4 }}>Inattivo</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    {sessions} sessioni totali · {recentSessions} questa settimana
                  </div>
                </div>

                <div style={{ fontSize: 16, fontWeight: 800, color: accuracy >= 80 ? '#10b981' : accuracy >= 60 ? '#f59e0b' : '#ef4444' }}>
                  {sessions > 0 ? `${accuracy}%` : '—'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
