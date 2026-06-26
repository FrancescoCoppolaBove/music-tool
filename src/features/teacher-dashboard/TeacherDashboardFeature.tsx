// src/features/teacher-dashboard/TeacherDashboardFeature.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useUserProfile } from '../../shared/context/UserProfileContext';
import {
  getClassesByTeacher,
  getAssignmentsByTeacher,
  getUserProfiles,
  getSubmissionsByStudents,
} from '../../shared/utils/firestoreConservatory';
import type { ClassDoc, AssignmentDoc, UserProfile, SubmissionDoc } from '../../shared/types/conservatory.types';
import { RosterPanel } from './components/RosterPanel';
import { StudentDrawer } from './components/StudentDrawer';

// ── Prop types shared with sub-components ────────────────────────────────────
export interface DashboardData {
  classes: ClassDoc[];
  assignments: AssignmentDoc[];
  students: UserProfile[];
  submissions: SubmissionDoc[];
}

export interface AlertsPanelProps {
  data: DashboardData;
}

export interface AssignmentsPanelProps {
  data: DashboardData;
  onNewAssignment: () => void;
  onRefresh: () => void;
}

export interface RosterPanelProps {
  data: DashboardData;
}

// Placeholder — replaced in Tasks 9, 10
const AlertsPanel = (_p: AlertsPanelProps) => <div />;
const AssignmentsPanel = (_p: AssignmentsPanelProps) => <div />;

// ─────────────────────────────────────────────────────────────────────────────

export default function TeacherDashboardFeature() {
  const { user } = useAuth();
  const { role, profileLoading } = useUserProfile();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const classes = await getClassesByTeacher(user.uid);
      const assignments = await getAssignmentsByTeacher(user.uid);

      const allStudentIds = [...new Set(classes.flatMap(c => c.studentIds))];
      const [students, submissions] = await Promise.all([
        getUserProfiles(allStudentIds),
        getSubmissionsByStudents(allStudentIds),
      ]);

      setData({ classes, assignments, students, submissions });
    } catch (e) {
      setError('Errore nel caricamento dei dati. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === 'teacher') loadData();
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.uid]);

  if (profileLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ fontSize: 14, color: '#4b5563' }}>Caricamento…</div>
      </div>
    );
  }

  if (role !== 'teacher') {
    return (
      <div style={{
        maxWidth: 520, margin: '40px auto', padding: '28px 30px',
        background: '#161b22', border: '1px solid #30363d', borderRadius: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>
          Accesso riservato ai docenti
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#8b949e', lineHeight: 1.6 }}>
          Questa sezione è disponibile solo per i docenti. Se sei un docente, contatta l'amministratore
          per richiedere l'accesso.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>
        {error}
        <br />
        <button onClick={loadData} style={{ marginTop: 12, padding: '8px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Riprova
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#e6edf3', margin: '0 0 4px' }}>
            Dashboard Docente
          </h1>
          <div style={{ fontSize: 13, color: '#8b949e' }}>
            {data.classes.length} {data.classes.length === 1 ? 'classe' : 'classi'} ·{' '}
            {data.students.length} studenti ·{' '}
            {data.assignments.filter(a => a.dueDate > Date.now()).length} compiti attivi
          </div>
        </div>
        {/* showNewAssignment is wired to a modal in Task 9 */}
        <div style={{ display: showNewAssignment ? 'block' : 'none' }} />
      </div>

      {/* Alerts */}
      <AlertsPanel data={data} />

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginTop: 16 }}>
        <AssignmentsPanel
          data={data}
          onNewAssignment={() => setShowNewAssignment(true)}
          onRefresh={loadData}
        />
        <RosterPanel data={data} onSelectStudent={setSelectedStudent} />
      </div>
      {selectedStudent && (
        <StudentDrawer
          student={selectedStudent}
          submissions={data.submissions.filter(s => s.userId === selectedStudent.uid)}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
