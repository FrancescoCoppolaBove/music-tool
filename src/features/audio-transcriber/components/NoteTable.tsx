import { memo, useEffect, useMemo, useRef } from 'react';
import type { NoteEvent, ChordEvent } from '../types';

const CHORD_PALETTE = [
  '#7c3aed','#9333ea','#a855f7','#c084fc',
  '#8b5cf6','#6d28d9','#7e22ce','#d946ef',
];

function midiToNoteName(midi: number): string {
  const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octave = Math.floor(midi / 12) - 1;
  return NAMES[midi % 12] + octave;
}

function beatsToRhythm(beats: number | undefined): string {
  if (beats === undefined) return '—';
  if (Math.abs(beats - 4)    < 0.06) return '𝅝';
  if (Math.abs(beats - 2)    < 0.06) return '𝅗𝅥';
  if (Math.abs(beats - 1)    < 0.06) return '♩';
  if (Math.abs(beats - 0.5)  < 0.06) return '♪';
  if (Math.abs(beats - 0.25) < 0.06) return '♬';
  if (Math.abs(beats - 2/3)  < 0.06) return '♩₃';
  if (Math.abs(beats - 1/3)  < 0.06) return '♪₃';
  if (Math.abs(beats - 1/6)  < 0.04) return '♬₃';
  return beats.toFixed(2) + 'b';
}

function formatPosition(startBeat: number | undefined): string {
  if (startBeat === undefined) return '—';
  const measure = Math.floor(startBeat / 4) + 1;
  const beat = (startBeat % 4) + 1;
  return `${measure}.${beat.toFixed(1)}`;
}

interface NoteTableProps {
  notes: NoteEvent[];
  chords: ChordEvent[];
  selectedIds: Set<string>;
  onSelectNote: (id: string, addToSelection: boolean) => void;
  playheadSec: number;
  isPlaying: boolean;
}

const COL: React.CSSProperties = {
  padding: '6px 10px', fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  borderBottom: '1px solid #1a1f27',
  whiteSpace: 'nowrap',
};

const HDR: React.CSSProperties = {
  ...COL, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#4b5563', background: '#0d1117',
  position: 'sticky', top: 0,
};

/* Riga memoizzata: durante il playback la tabella si aggiorna ~8 volte al
   secondo — senza memo ogni tick ri-renderizzerebbe migliaia di righe. */
const NoteRow = memo(function NoteRow({
  note, chordSymbol, chordColor, isSelected, isCurrent, onSelectNote,
}: {
  note: NoteEvent;
  chordSymbol: string | null;
  chordColor: string | undefined;
  isSelected: boolean;
  isCurrent: boolean;
  onSelectNote: (id: string, addToSelection: boolean) => void;
}) {
  const a = Math.abs(note.cents);
  const centsColor = a < 15 ? '#34d399' : a < 30 ? '#fbbf24' : '#f87171';

  return (
    <tr
      data-current={isCurrent || undefined}
      onClick={e => onSelectNote(note.id, e.shiftKey || e.metaKey)}
      style={{
        cursor: 'pointer',
        background: isSelected
          ? 'rgba(124,58,237,0.12)'
          : isCurrent ? 'rgba(239,68,68,0.10)' : 'transparent',
        borderLeft: `2px solid ${isSelected ? '#7c3aed' : isCurrent ? '#ef4444' : 'transparent'}`,
      }}
    >
      <td style={{ ...COL, fontWeight: 700, color: '#e6edf3' }}>
        {midiToNoteName(note.midi)}
      </td>
      <td style={{ ...COL, color: centsColor, fontVariantNumeric: 'tabular-nums' as const }}>
        {note.cents > 0 ? '+' : ''}{note.cents.toFixed(0)}
      </td>
      <td style={{ ...COL, maxWidth: 120 }}>
        {chordSymbol ? (
          <span style={{
            display: 'inline-block', background: chordColor + '22',
            border: `1px solid ${chordColor}55`, borderRadius: 4,
            padding: '1px 6px', fontSize: 11, color: chordColor,
            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {chordSymbol}
          </span>
        ) : <span style={{ color: '#4b5563' }}>—</span>}
      </td>
      <td style={{ ...COL, color: '#8b949e', fontVariantNumeric: 'tabular-nums' as const }}>
        {formatPosition(note.startBeat)}
      </td>
      <td style={{ ...COL, color: '#8b949e' }}>
        {beatsToRhythm(note.durationBeats)}
      </td>
      <td style={{ ...COL }}>
        <div style={{
          width: 32, height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{ width: `${Math.round(note.velocity * 100)}%`, height: '100%', background: '#7c3aed' }} />
        </div>
      </td>
    </tr>
  );
});

export default function NoteTable({
  notes, chords, selectedIds, onSelectNote, playheadSec, isPlaying,
}: NoteTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...notes].sort((a, b) => a.startSec - b.startSec),
    [notes],
  );

  const chordById = useMemo(() => {
    const m = new Map<string, { symbol: string; color: string }>();
    chords.forEach((c, i) => m.set(c.id, { symbol: c.symbol, color: CHORD_PALETTE[i % CHORD_PALETTE.length] }));
    return m;
  }, [chords]);

  // Note che stanno suonando sotto il playhead
  const currentIds = useMemo(() => {
    const s = new Set<string>();
    for (const n of sorted) {
      if (n.startSec > playheadSec) break;
      if (playheadSec < n.startSec + n.durationSec) s.add(n.id);
    }
    return s;
  }, [sorted, playheadSec]);

  // In riproduzione la tabella segue la nota corrente
  useEffect(() => {
    if (!isPlaying || currentIds.size === 0) return;
    containerRef.current
      ?.querySelector('[data-current]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [isPlaying, currentIds]);

  return (
    <div ref={containerRef} style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HDR}>Nota</th>
            <th style={HDR}>Cents</th>
            <th style={{ ...HDR, maxWidth: 120 }}>Accordo</th>
            <th style={HDR}>Pos.</th>
            <th style={HDR}>Dur.</th>
            <th style={HDR}>Vel.</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(note => {
            const chord = note.chordId !== undefined ? chordById.get(note.chordId) : undefined;
            return (
              <NoteRow
                key={note.id}
                note={note}
                chordSymbol={chord?.symbol ?? null}
                chordColor={chord?.color}
                isSelected={selectedIds.has(note.id)}
                isCurrent={currentIds.has(note.id)}
                onSelectNote={onSelectNote}
              />
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
          Nessuna nota rilevata
        </div>
      )}
    </div>
  );
}
