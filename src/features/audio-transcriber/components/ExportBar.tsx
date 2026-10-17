interface ExportBarProps {
  appState: 'idle' | 'loaded' | 'analyzing' | 'ready' | 'error';
  progress: number;
  fileName: string;
  hasNotes: boolean;
}

export default function ExportBar({ appState, progress, fileName, hasNotes }: ExportBarProps) {
  const showButtons = appState === 'ready';
  const showProgress = appState === 'analyzing';

  return (
    <div style={{
      borderTop: '1px solid #21262d',
      background: '#161b22',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>

      {showProgress && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: '#21262d', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: '#7c3aed', borderRadius: 2, transition: 'width 0.1s' }} />
          </div>
          <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}

      {showButtons && (
        <>
          <span style={{ fontSize: 12, color: '#4b5563', flex: 1 }}>
            {fileName && `${fileName}_transcription`}
          </span>
          <div title={!hasNotes ? 'Nessuna nota da esportare' : 'Export MIDI — disponibile in Piano 3'}>
            <button
              disabled={!hasNotes}
              style={{
                background: '#21262d', color: hasNotes ? '#8b949e' : '#4b5563',
                border: '1px solid #30363d', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'not-allowed',
                opacity: hasNotes ? 0.7 : 0.4,
              }}
            >
              ⬇ MIDI
            </button>
          </div>
          <div title={!hasNotes ? 'Nessuna nota da esportare' : 'Export PDF — disponibile in Piano 3'}>
            <button
              disabled={!hasNotes}
              style={{
                background: '#21262d', color: hasNotes ? '#8b949e' : '#4b5563',
                border: '1px solid #30363d', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'not-allowed',
                opacity: hasNotes ? 0.7 : 0.4,
              }}
            >
              ⬇ PDF
            </button>
          </div>
        </>
      )}

      {!showProgress && !showButtons && (
        <span style={{ fontSize: 12, color: '#4b5563' }}>
          Carica un file e avvia l'analisi per esportare
        </span>
      )}
    </div>
  );
}
