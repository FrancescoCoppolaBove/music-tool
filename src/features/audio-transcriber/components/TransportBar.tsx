import type React from 'react';

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TransportBarProps {
  isPlaying: boolean;
  playheadSec: number;
  duration: number;
  loopA: number | null;
  loopB: number | null;
  disabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onClearLoop: () => void;
}

export default function TransportBar({
  isPlaying, playheadSec, duration, loopA, loopB,
  disabled, onPlay, onPause, onStop, onClearLoop,
}: TransportBarProps) {
  const pct = duration > 0 ? (playheadSec / duration) * 100 : 0;

  return (
    <div style={{
      borderTop: '1px solid #21262d',
      background: '#161b22',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Play / Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={disabled}
        style={tbBtn(!disabled)}
        title={isPlaying ? 'Pausa (Space)' : 'Play (Space)'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Stop */}
      <button onClick={onStop} disabled={disabled} style={tbBtn(!disabled)} title="Stop">
        ⏹
      </button>

      {/* Progress bar */}
      <div style={{ flex: 1, height: 4, background: '#21262d', borderRadius: 2, position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#7c3aed', borderRadius: 2 }} />
      </div>

      {/* Time */}
      <span style={{ fontSize: 12, color: '#8b949e', fontFamily: 'monospace', flexShrink: 0 }}>
        {fmtTime(playheadSec)} / {fmtTime(duration)}
      </span>

      {/* Loop indicator */}
      {(loopA !== null || loopB !== null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#a78bfa' }}>
            Loop {loopA !== null ? fmtTime(loopA) : '?'} → {loopB !== null ? fmtTime(loopB) : '?'}
          </span>
          <button onClick={onClearLoop} style={tbBtn(true)} title="Rimuovi loop">✕</button>
        </div>
      )}

      <span style={{ fontSize: 11, color: '#4b5563' }}>A/B: loop</span>
    </div>
  );
}

function tbBtn(enabled: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? '#e6edf3' : '#4b5563', fontSize: 16,
    padding: '4px 8px', borderRadius: 6,
  };
}
