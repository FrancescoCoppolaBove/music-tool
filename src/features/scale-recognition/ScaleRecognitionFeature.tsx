import NoteInput from './components/NoteInput';
import ScaleResults from './components/ScaleResults';
import { useScaleRecognition } from './hooks/useScaleRecognition';

export default function ScaleRecognitionFeature() {
  const {
    noteInput, setNoteInput,
    rootNote, setRootNote,
    results, parsedNotes,
    error, analyze, clear,
  } = useScaleRecognition();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Scale Recognition</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Enter a sequence of notes and optionally a root note. The analyzer searches through {Object.keys({}).length + 100}+ scales
          and ranks them by how well they match. Without a root note, all 12 possible roots are explored.
        </p>
      </div>

      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16 }}>
        <NoteInput
          noteInput={noteInput}
          setNoteInput={setNoteInput}
          rootNote={rootNote}
          setRootNote={setRootNote}
          onAnalyze={analyze}
          onClear={clear}
          error={error}
          parsedNotes={parsedNotes}
        />
      </div>

      {results.length > 0 && (
        <ScaleResults results={results} parsedNotes={parsedNotes} rootNote={rootNote} />
      )}

      {results.length === 0 && parsedNotes.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎼</div>
          <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 8 }}>Enter some notes and click Analyze</div>
          <div style={{ fontSize: 13, color: '#4b5563' }}>
            Example: <code style={{ background: '#1c2128', padding: '2px 6px', borderRadius: 4, color: '#8b949e' }}>D E F G A B C</code>
          </div>
        </div>
      )}
    </div>
  );
}
