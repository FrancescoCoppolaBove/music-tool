// src/features/melody-harmonizer/StepSequencer.tsx

import type { MelodyNote, NoteRole } from './types';
import { detectRoles } from './harmonize';

let idCounter = 0;
export function newNoteId(): string { return `note-${++idCounter}`; }

interface Props {
  notes: MelodyNote[];
  onChange: (notes: MelodyNote[]) => void;
}

export default function StepSequencer({ notes, onChange }: Props) {
  const roles = detectRoles(notes);

  function add() {
    onChange([...notes, { id: newNoteId(), note: '', chord: '' }]);
  }

  function update(id: string, field: 'note' | 'chord', value: string) {
    onChange(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
  }

  function toggleRole(id: string, current: NoteRole) {
    const next: NoteRole = current === 'target' ? 'approach' : 'target';
    onChange(notes.map(n => n.id === id ? { ...n, manualRole: next } : n));
  }

  function remove(id: string) {
    onChange(notes.filter(n => n.id !== id));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const arr = [...notes];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  }

  function moveDown(idx: number) {
    if (idx === notes.length - 1) return;
    const arr = [...notes];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {notes.map((n, i) => {
        const role      = n.manualRole ?? roles[i];
        const isApproach = role === 'approach';
        return (
          <div
            key={n.id}
            style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: '#1e293b', borderRadius: 8, padding: '8px 12px',
              border: `1px solid ${isApproach ? '#334155' : '#1e3a5f'}`,
            }}
          >
            <span style={{ color: '#475569', fontSize: 11, width: 18, textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </span>
            <input
              value={n.note}
              onChange={e => update(n.id, 'note', e.target.value)}
              placeholder="G, Bb, F#…"
              style={inputStyle(72)}
            />
            <input
              value={n.chord}
              onChange={e => update(n.id, 'chord', e.target.value)}
              placeholder="Ebmaj7, Bbm7, G7b9…"
              style={inputStyle(undefined, true)}
            />
            <button
              onClick={() => toggleRole(n.id, role)}
              title="Clicca per invertire (auto-rilevato di default)"
              style={{
                background: isApproach ? '#1e293b' : '#1e3a5f',
                border: `1px solid ${isApproach ? '#334155' : '#3b5998'}`,
                borderRadius: 4,
                color: isApproach ? '#475569' : '#60a5fa',
                padding: '2px 7px', fontSize: 9, cursor: 'pointer',
                fontFamily: 'monospace', letterSpacing: '0.05em', flexShrink: 0,
              }}
            >
              {isApproach ? 'APPROACH' : 'TARGET'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button onClick={() => moveUp(i)}   style={arrowBtn}>▲</button>
              <button onClick={() => moveDown(i)} style={arrowBtn}>▼</button>
            </div>
            <button onClick={() => remove(n.id)} style={removeBtn}>✕</button>
          </div>
        );
      })}
      <button onClick={add} style={addBtn}>+ Aggiungi nota</button>
    </div>
  );
}

function inputStyle(width?: number, flex?: boolean): React.CSSProperties {
  return {
    background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
    color: '#e2e8f0', padding: '4px 8px', fontSize: 14, fontFamily: 'monospace',
    ...(width  ? { width } : {}),
    ...(flex   ? { flex: 1 } : {}),
  };
}

const arrowBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#475569',
  cursor: 'pointer', fontSize: 9, padding: '1px 4px', lineHeight: 1,
};

const removeBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#ef4444',
  cursor: 'pointer', fontSize: 14, padding: '0 4px',
};

const addBtn: React.CSSProperties = {
  background: '#1e293b', border: '1px dashed #334155', borderRadius: 8,
  color: '#60a5fa', padding: '8px 16px', cursor: 'pointer',
  fontSize: 14, width: '100%', textAlign: 'center',
};
