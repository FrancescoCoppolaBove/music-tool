const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ROOTS = ['', 'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const EXAMPLES = [
  { label: 'C Major', notes: 'C D E F G A B' },
  { label: 'D Dorian', notes: 'D E F G A B C' },
  { label: 'A Minor Penta', notes: 'A C D E G' },
  { label: 'G Blues', notes: 'G Bb C Db D F' },
  { label: 'F# Altered', notes: 'F# G A Bb C D E' },
  { label: 'C Whole Tone', notes: 'C D E F# Ab Bb' },
];

interface NoteInputProps {
  noteInput: string;
  setNoteInput: (v: string) => void;
  rootNote: string;
  setRootNote: (v: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  error: string;
  parsedNotes: string[];
}

export default function NoteInput({ noteInput, setNoteInput, rootNote, setRootNote, onAnalyze, onClear, error, parsedNotes }: NoteInputProps) {
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onAnalyze();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Main note input */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>
            Notes (space-separated, e.g. C D E F G A B)
          </label>
          <input
            type="text"
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="e.g. D E F G A B C"
            style={{
              width: '100%', padding: '10px 14px',
              background: '#0d1117', border: `1px solid ${error ? '#ef4444' : '#30363d'}`,
              borderRadius: 8, color: '#e6edf3', fontSize: 15, fontFamily: 'monospace',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        {/* Root note selector */}
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>
            Root note <span style={{ color: '#4b5563' }}>(optional)</span>
          </label>
          <select
            value={rootNote}
            onChange={e => setRootNote(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', height: 43,
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 8, color: '#e6edf3', fontSize: 14,
              outline: 'none', cursor: 'pointer',
            }}
          >
            {ROOTS.map(r => (
              <option key={r} value={r}>{r === '' ? '— Auto detect —' : r}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            onClick={onAnalyze}
            style={{
              padding: '10px 20px', background: '#1d4ed8', border: 'none',
              borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', height: 43,
            }}
          >
            Analyze
          </button>
          <button
            onClick={onClear}
            style={{
              padding: '10px 14px', background: 'none', border: '1px solid #30363d',
              borderRadius: 8, color: '#6b7280', fontSize: 14, cursor: 'pointer', height: 43,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Note chips (quick input) */}
      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Click to add notes:</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {NOTE_NAMES.map(n => {
            const inInput = parsedNotes.some(p => p.replace('b', 'b') === n || p === n);
            return (
              <button
                key={n}
                onClick={() => {
                  const current = noteInput.trim();
                  setNoteInput(current ? `${current} ${n}` : n);
                }}
                style={{
                  padding: '4px 10px',
                  background: inInput ? '#1d4ed820' : '#1c2128',
                  border: `1px solid ${inInput ? '#3b82f6' : '#30363d'}`,
                  borderRadius: 6, color: inInput ? '#93c5fd' : '#c9d1d9',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'monospace',
                  fontWeight: inInput ? 600 : 400,
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Example presets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#4b5563' }}>Examples:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex.label}
            onClick={() => { setNoteInput(ex.notes); setRootNote(''); }}
            style={{
              padding: '3px 10px', background: 'none', border: '1px solid #30363d',
              borderRadius: 5, color: '#6b7280', fontSize: 12, cursor: 'pointer',
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Parsed note tags */}
      {parsedNotes.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Recognized:</span>
          {parsedNotes.map((n, i) => (
            <span key={i} style={{
              padding: '2px 10px', background: '#1c2128', border: '1px solid #30363d',
              borderRadius: 20, fontSize: 13, color: '#e6edf3', fontFamily: 'monospace',
            }}>
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
