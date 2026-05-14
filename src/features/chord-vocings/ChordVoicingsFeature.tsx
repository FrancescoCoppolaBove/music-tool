import { useEffect } from 'react';
import ChordInput from './components/ChordInput';
import VoicingResults from './components/VoicingResults';
import VoicingStyleSelector from './components/VoicingStyleSelector';
import { useChordVoicings } from './hooks/useChordVoicings';

export default function ChordVoicingsFeature() {
  const {
    inputValue, setInputValue,
    parsedChord, voicings,
    activeStyles, setActiveStyles,
    error, submit,
  } = useChordVoicings();

  // Auto-submit on mount to show Cmaj7 by default
  useEffect(() => { submit(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Piano Voicings</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Enter any chord symbol to explore closed, drop, shell, quartal, and upper-structure voicings — all displayed on a piano keyboard.
        </p>
      </div>

      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ChordInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={submit}
          error={error}
        />
        <VoicingStyleSelector selected={activeStyles} onChange={setActiveStyles} />
      </div>

      {parsedChord && voicings.length > 0 && (
        <VoicingResults
          voicings={voicings}
          activeStyles={activeStyles}
          chordDisplay={parsedChord.displayName}
          chordNotes={parsedChord.notes}
        />
      )}

      {!parsedChord && !error && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          Enter a chord symbol above to see piano voicings.
        </div>
      )}
    </div>
  );
}
