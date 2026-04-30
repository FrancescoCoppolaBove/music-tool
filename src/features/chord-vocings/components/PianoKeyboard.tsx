import React, { useMemo } from 'react';
import type { VoicingNote } from '../types/chord.types';

interface PianoKeyboardProps {
  highlightedNotes: VoicingNote[];
  octaveStart?: number;
  octaveEnd?: number;
  width?: number;
}

const WHITE_KEYS_PER_OCTAVE = 7;
const NOTE_IN_OCTAVE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function noteColor(note: VoicingNote): string {
  if (note.isRoot) return '#f97316';
  if (note.interval === '3' || note.interval === '♭3') return '#a78bfa';
  if (note.interval === '7' || note.interval === '♭7') return '#34d399';
  if (note.interval === '5') return '#60a5fa';
  return '#fbbf24';
}

function getMidiForKey(noteName: string, octave: number): number {
  const semitones: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
    F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  return (octave + 1) * 12 + (semitones[noteName] ?? 0);
}

export default function PianoKeyboard({
  highlightedNotes, octaveStart = 2, octaveEnd = 5, width = 700,
}: PianoKeyboardProps) {
  const totalOctaves = octaveEnd - octaveStart + 1;
  const totalWhiteKeys = totalOctaves * WHITE_KEYS_PER_OCTAVE;
  const whiteKeyWidth = width / totalWhiteKeys;
  const whiteKeyHeight = 120;
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyHeight = 72;

  const midiToHighlight = useMemo(() => {
    const map = new Map<number, VoicingNote>();
    highlightedNotes.forEach(n => map.set(n.midi, n));
    return map;
  }, [highlightedNotes]);

  const highlightedMidis = useMemo(
    () => new Set(highlightedNotes.map(n => n.midi)),
    [highlightedNotes]
  );

  const whiteKeys: React.ReactNode[] = [];
  const blackKeys: React.ReactNode[] = [];

  for (let oct = octaveStart; oct <= octaveEnd; oct++) {
    NOTE_IN_OCTAVE.forEach((noteName, noteIdx) => {
      const midi = getMidiForKey(noteName, oct);
      const isHighlighted = highlightedMidis.has(midi);
      const highlightInfo = midiToHighlight.get(midi);
      const whiteIdx = (oct - octaveStart) * WHITE_KEYS_PER_OCTAVE + noteIdx;
      const x = whiteIdx * whiteKeyWidth;

      let fillColor = '#f0f0f0';
      if (isHighlighted && highlightInfo) {
        fillColor = noteColor(highlightInfo);
      }

      const isC = noteName === 'C';
      whiteKeys.push(
        <g key={`w-${oct}-${noteName}`}>
          <rect
            x={x + 0.5}
            y={0.5}
            width={whiteKeyWidth - 1}
            height={whiteKeyHeight - 1}
            rx={isHighlighted ? 3 : 2}
            fill={fillColor}
            stroke={isHighlighted ? fillColor : '#9ca3af'}
            strokeWidth={isHighlighted ? 1.5 : 0.5}
          />
          {isC && (
            <text x={x + whiteKeyWidth / 2} y={whiteKeyHeight - 10} textAnchor="middle" fontSize={9} fill="#6b7280">
              C{oct}
            </text>
          )}
          {isHighlighted && highlightInfo && (
            <>
              <circle cx={x + whiteKeyWidth / 2} cy={whiteKeyHeight - 22} r={9} fill={fillColor} stroke="#fff" strokeWidth={1} />
              <text x={x + whiteKeyWidth / 2} y={whiteKeyHeight - 22 + 3.5} textAnchor="middle" fontSize={7} fill="#fff" fontWeight="bold">
                {highlightInfo.interval}
              </text>
              <text x={x + whiteKeyWidth / 2} y={whiteKeyHeight - 34} textAnchor="middle" fontSize={8} fill={fillColor} fontWeight="bold">
                {highlightInfo.note}
              </text>
            </>
          )}
        </g>
      );
    });

    // Black keys
    const blackNoteNames = ['C#', 'D#', 'F#', 'G#', 'A#'];
    const blackOffsets = [0.6, 1.6, 3.65, 4.65, 5.65];
    blackNoteNames.forEach((noteName, i) => {
      const midi = getMidiForKey(noteName, oct);
      const isHighlighted = highlightedMidis.has(midi);
      const highlightInfo = midiToHighlight.get(midi);
      const octaveX = (oct - octaveStart) * WHITE_KEYS_PER_OCTAVE * whiteKeyWidth;
      const x = octaveX + blackOffsets[i] * whiteKeyWidth;

      let fillColor = '#1a1a2e';
      if (isHighlighted && highlightInfo) {
        fillColor = noteColor(highlightInfo);
      }

      blackKeys.push(
        <g key={`b-${oct}-${noteName}`}>
          <rect x={x} y={0} width={blackKeyWidth} height={blackKeyHeight} rx={2} fill={fillColor} stroke="#111" strokeWidth={0.5} />
          {isHighlighted && highlightInfo && (
            <>
              <circle cx={x + blackKeyWidth / 2} cy={blackKeyHeight - 14} r={7} fill={fillColor} stroke="#fff" strokeWidth={1} />
              <text x={x + blackKeyWidth / 2} y={blackKeyHeight - 14 + 3} textAnchor="middle" fontSize={6} fill="#fff" fontWeight="bold">
                {highlightInfo.interval}
              </text>
            </>
          )}
        </g>
      );
    });
  }

  return (
    <div style={{ overflowX: 'auto', padding: '4px 0' }}>
      <svg width={width} height={whiteKeyHeight} style={{ display: 'block', minWidth: width }}>
        {whiteKeys}
        {blackKeys}
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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
