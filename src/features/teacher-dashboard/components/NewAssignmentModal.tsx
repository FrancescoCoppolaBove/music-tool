import React, { useState } from 'react';
import { createAssignment } from '../../../shared/utils/firestoreConservatory';
import { useAuth } from '../../../shared/context/AuthContext';
import type { ClassDoc } from '../../../shared/types/conservatory.types';

const MODULE_OPTIONS = [
  { id: 'melodic-intervals',  label: 'Intervalli melodici' },
  { id: 'harmonic-intervals', label: 'Intervalli armonici' },
  { id: 'triads',             label: 'Triadi' },
  { id: 'sevenths',           label: 'Accordi di settima' },
  { id: 'tonal-functions',    label: 'Funzioni tonali' },
  { id: 'cadences',           label: 'Cadenze' },
];

interface Props {
  classes: ClassDoc[];
  onClose: () => void;
  onCreated: () => void;
}

export function NewAssignmentModal({ classes, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [classId,  setClassId]  = useState(classes[0]?.id ?? '');
  const [moduleId, setModuleId] = useState('melodic-intervals');
  const [level,    setLevel]    = useState<1 | 2 | 3>(1);
  const [mode,     setMode]     = useState<'training' | 'exam'>('exam');
  const [dueDate,  setDueDate]  = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !classId) return;
    setSaving(true);
    setErr(null);
    try {
      const moduleLabel = MODULE_OPTIONS.find(m => m.id === moduleId)?.label ?? moduleId;
      await createAssignment({
        classId,
        teacherId: user.uid,
        moduleId,
        level,
        mode,
        dueDate: new Date(dueDate).getTime(),
        createdAt: Date.now(),
        title: `${moduleLabel} — L${level}`,
      });
      onCreated();
    } catch {
      setErr('Errore nella creazione del compito. Riprova.');
      setSaving(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: '#1c2128', border: '1px solid #30363d',
    borderRadius: 8, color: '#e6edf3', fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#8b949e',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 501,
        width: Math.min(420, window.innerWidth - 32),
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 16,
        padding: '28px 24px',
      }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#e6edf3', margin: '0 0 20px' }}>
          Nuovo compito
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {classes.length > 1 && (
            <label>
              <span style={labelStyle}>Classe</span>
              <select value={classId} onChange={e => setClassId(e.target.value)} style={selectStyle}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}

          <label>
            <span style={labelStyle}>Modulo</span>
            <select value={moduleId} onChange={e => setModuleId(e.target.value)} style={selectStyle}>
              {MODULE_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>

          <label>
            <span style={labelStyle}>Livello</span>
            <select value={level} onChange={e => setLevel(Number(e.target.value) as 1|2|3)} style={selectStyle}>
              <option value={1}>Livello 1 — Propedeutico</option>
              <option value={2}>Livello 2 — Intermedio</option>
              <option value={3}>Livello 3 — Avanzato</option>
            </select>
          </label>

          <label>
            <span style={labelStyle}>Modalità</span>
            <select value={mode} onChange={e => setMode(e.target.value as 'training' | 'exam')} style={selectStyle}>
              <option value="exam">Esame (nessun feedback)</option>
              <option value="training">Allenamento (feedback immediato)</option>
            </select>
          </label>

          <label>
            <span style={labelStyle}>Scadenza</span>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ ...selectStyle, fontFamily: 'inherit' }}
            />
          </label>

          {err && <div style={{ fontSize: 13, color: '#ef4444' }}>{err}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid #30363d', borderRadius: 8, color: '#8b949e', fontSize: 14, cursor: 'pointer' }}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, padding: '11px', background: saving ? '#4b5563' : '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Creazione…' : 'Crea compito'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
