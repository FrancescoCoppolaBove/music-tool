interface ExportBarProps {
  appState: 'idle' | 'loading' | 'loaded' | 'analyzing' | 'ready' | 'error';
  progress: number;
  fileName: string;
  hasNotes: boolean;
  onOpenScore: () => void;
}

export default function ExportBar({ appState, progress, fileName, hasNotes, onOpenScore }: ExportBarProps) {
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
          <div title={!hasNotes ? 'No notes to export' : 'Open the score workspace and export'}>
            <button
              disabled={!hasNotes}
              onClick={onOpenScore}
              style={{
                background: '#21262d', color: hasNotes ? '#8b949e' : '#4b5563',
                border: '1px solid #30363d', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: hasNotes ? 'pointer' : 'not-allowed',
                opacity: hasNotes ? 0.7 : 0.4,
              }}
            >
              Score & exports
            </button>
          </div>
        </>
      )}

      {!showProgress && !showButtons && (
        <span style={{ fontSize: 12, color: '#4b5563' }}>
          {appState === 'loading' ? 'Loading audio...' : 'Upload a file and analyze it to see export options'}
        </span>
      )}
    </div>
  );
}
