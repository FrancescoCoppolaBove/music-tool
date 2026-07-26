import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { VoicingNote } from '../types/chord.types';

interface PianoKeyboardProps {
  highlightedNotes: VoicingNote[];
  octaveStart?: number;
  octaveEnd?: number;
}

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const WHITE_KEYS_PER_OCTAVE = 7;

const SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

// Fractional white-key offset for each black key within an octave
const BLACK_KEY_OFFSETS: Record<string, number> = {
  'C#': 0.65, 'D#': 1.65, 'F#': 3.67, 'G#': 4.67, 'A#': 5.67,
};
const BLACK_NOTES_IN_OCT = ['C#', 'D#', 'F#', 'G#', 'A#'];

function getMidi(note: string, octave: number): number {
  return (octave + 1) * 12 + (SEMITONE[note] ?? 0);
}

function noteColor(n: VoicingNote): string {
  if (n.isRoot) return '#f97316';
  if (n.interval === '3' || n.interval === '♭3') return '#a78bfa';
  if (n.interval === '7' || n.interval === '♭7') return '#34d399';
  if (n.interval === '5') return '#60a5fa';
  return '#fbbf24';
}

export default function PianoKeyboard({ highlightedNotes, octaveStart = 2, octaveEnd = 5 }: PianoKeyboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 10) setContainerW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalOctaves = octaveEnd - octaveStart + 1;
  const totalWhiteKeys = totalOctaves * WHITE_KEYS_PER_OCTAVE;
  const MIN_KEY_W = 22;
  const MIN_WIDTH = totalWhiteKeys * MIN_KEY_W;
  const svgWidth = Math.max(containerW - 4, MIN_WIDTH);

  const wkw = svgWidth / totalWhiteKeys;
  const wkh = Math.min(140, Math.max(90, wkw * 7));
  const bkw = wkw * 0.62;
  const bkh = wkh * 0.62;

  const midiMap = useMemo(() => {
    const m = new Map<number, VoicingNote>();
    highlightedNotes.forEach(n => m.set(n.midi, n));
    return m;
  }, [highlightedNotes]);

  // Scale font/circle sizes with key width
  const fs = Math.max(6, Math.min(10, wkw * 0.48));
  const cr = Math.max(7, Math.min(11, wkw * 0.55));

  const whites: React.ReactNode[] = [];
  const blacks: React.ReactNode[] = [];

  for (let oct = octaveStart; oct <= octaveEnd; oct++) {
    WHITE_NOTES.forEach((note, ni) => {
      const midi = getMidi(note, oct);
      const hi = midiMap.get(midi);
      const x = ((oct - octaveStart) * WHITE_KEYS_PER_OCTAVE + ni) * wkw;
      const fill = hi ? noteColor(hi) : '#f0f0f0';
      const labelY = wkh - cr - 18;

      whites.push(
        <g key={`w-${oct}-${note}`}>
          <rect
            x={x + 0.5} y={0.5} width={wkw - 1} height={wkh - 1}
            rx={2} fill={fill}
            stroke={hi ? fill : '#9ca3af'} strokeWidth={hi ? 1.5 : 0.5}
          />
          {note === 'C' && (
            <text x={x + wkw / 2} y={wkh - 4} textAnchor="middle" fontSize={fs} fill="#6b7280">
              C{oct}
            </text>
          )}
          {hi && (
            <>
              <circle cx={x + wkw / 2} cy={labelY} r={cr} fill={fill} stroke="#fff" strokeWidth={1} />
              <text x={x + wkw / 2} y={labelY + fs * 0.42} textAnchor="middle" fontSize={fs} fill="#fff" fontWeight="bold">
                {hi.interval}
              </text>
              <text x={x + wkw / 2} y={labelY - cr - 2} textAnchor="middle" fontSize={fs + 1} fill={fill} fontWeight="bold">
                {hi.note}
              </text>
            </>
          )}
        </g>
      );
    });

    BLACK_NOTES_IN_OCT.forEach(note => {
      const midi = getMidi(note, oct);
      const hi = midiMap.get(midi);
      const offX = ((oct - octaveStart) * WHITE_KEYS_PER_OCTAVE + BLACK_KEY_OFFSETS[note]) * wkw;
      const fill = hi ? noteColor(hi) : '#1a1a2e';
      const bCr = Math.min(6, bkw * 0.38);
      const bLabelY = bkh - bCr - 5;

      blacks.push(
        <g key={`b-${oct}-${note}`}>
          <rect x={offX} y={0} width={bkw} height={bkh} rx={2} fill={fill} stroke="#111" strokeWidth={0.5} />
          {hi && (
            <>
              <circle cx={offX + bkw / 2} cy={bLabelY} r={bCr} fill={fill} stroke="#fff" strokeWidth={0.8} />
              <text x={offX + bkw / 2} y={bLabelY + (fs - 1) * 0.38} textAnchor="middle" fontSize={Math.max(5, fs - 1)} fill="#fff" fontWeight="bold">
                {hi.interval}
              </text>
              <text x={offX + bkw / 2} y={bLabelY - bCr - 2} textAnchor="middle" fontSize={Math.max(5, fs - 1)} fill={fill} fontWeight="bold">
                {hi.note}
              </text>
            </>
          )}
        </g>
      );
    });
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <svg width={svgWidth} height={wkh} style={{ display: 'block', minWidth: MIN_WIDTH }}>
          {whites}
          {blacks}
        </svg>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { color: '#f97316', label: 'Root' },
          { color: '#a78bfa', label: '3rd' },
          { color: '#60a5fa', label: '5th' },
          { color: '#34d399', label: '7th' },
          { color: '#fbbf24', label: 'Extensions' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
