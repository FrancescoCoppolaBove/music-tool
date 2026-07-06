import { Chord } from 'tonal';
import type { ChordKeyboardSpec } from '../data/types';

const WW = 28;   // white key width
const WH = 80;   // white key height
const BW = 18;   // black key width
const BH = 50;   // black key height
const SVG_W = 14 * WW + 1;
const SVG_H = WH + 1;

const WHITE_KEYS: { note: string; idx: number }[] = [
  { note: 'C3', idx: 0 },  { note: 'D3', idx: 1 },  { note: 'E3', idx: 2 },
  { note: 'F3', idx: 3 },  { note: 'G3', idx: 4 },  { note: 'A3', idx: 5 },
  { note: 'B3', idx: 6 },  { note: 'C4', idx: 7 },  { note: 'D4', idx: 8 },
  { note: 'E4', idx: 9 },  { note: 'F4', idx: 10 }, { note: 'G4', idx: 11 },
  { note: 'A4', idx: 12 }, { note: 'B4', idx: 13 },
];

// x = (leftWhiteKeyIndex + 1) * WW - BW/2
const BLACK_KEYS: { names: string[]; x: number }[] = [
  { names: ['C#3', 'Db3'], x: 19  },
  { names: ['D#3', 'Eb3'], x: 47  },
  { names: ['F#3', 'Gb3'], x: 103 },
  { names: ['G#3', 'Ab3'], x: 131 },
  { names: ['A#3', 'Bb3'], x: 159 },
  { names: ['C#4', 'Db4'], x: 215 },
  { names: ['D#4', 'Eb4'], x: 243 },
  { names: ['F#4', 'Gb4'], x: 299 },
  { names: ['G#4', 'Ab4'], x: 327 },
  { names: ['A#4', 'Bb4'], x: 355 },
];

// Strip octave number to get pitch class: "C#4" → "C#"
function pc(n: string): string {
  return n.replace(/\d+$/, '');
}

function isLit(keyNote: string, highlights: string[]): boolean {
  const kpc = pc(keyNote);
  return highlights.some(h => pc(h) === kpc);
}

function SingleKeyboard({ chord }: { chord: ChordKeyboardSpec }) {
  // If notes[] is empty, derive pitch classes from chord name via tonal
  const highlights =
    chord.notes.length > 0 ? chord.notes : Chord.get(chord.label).notes;
  const color = chord.color ?? '#7c3aed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
        {/* White keys first (render below black keys) */}
        {WHITE_KEYS.map(({ note, idx }) => (
          <rect
            key={note}
            x={idx * WW} y={0}
            width={WW - 1} height={WH}
            fill={isLit(note, highlights) ? color : '#f0f0f0'}
            stroke="#555" strokeWidth={0.5}
            rx={1}
          />
        ))}
        {/* Black keys on top */}
        {BLACK_KEYS.map(({ names, x }) => {
          const lit = names.some(n => highlights.some(h => pc(h) === pc(n)));
          return (
            <rect
              key={names[0]}
              x={x} y={0}
              width={BW} height={BH}
              fill={lit ? color : '#1a1a2e'}
              stroke="#333" strokeWidth={0.5}
              rx={1}
            />
          );
        })}
      </svg>
      <code style={{
        fontSize: 11, color: '#c4b5fd',
        background: 'rgba(124,58,237,0.12)',
        padding: '2px 8px', borderRadius: 4,
      }}>
        {chord.label}
      </code>
    </div>
  );
}

export default function KeyboardDiagram({
  title,
  chords,
}: {
  title?: string;
  chords: ChordKeyboardSpec[];
}) {
  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {chords.map((c, i) => (
          <SingleKeyboard key={i} chord={c} />
        ))}
      </div>
    </div>
  );
}
