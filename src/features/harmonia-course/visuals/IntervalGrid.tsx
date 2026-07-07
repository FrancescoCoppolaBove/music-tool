import { Chord, Scale, Interval } from 'tonal';
import type { IntervalRow } from '../data/types';

// Maps tonal interval codes to display degree names
const INTERVAL_LABEL: Record<string, string> = {
  '1P': '1',  '2m': 'b2', '2M': '2',  '3m': 'b3', '3M': '3',
  '4P': '4',  '4A': '#4', '5d': 'b5', '5P': '5',  '5A': '#5',
  '6m': 'b6', '6M': '6',  '7m': 'b7', '7M': '7',
};

function rowBg(degree: string): string {
  if (degree === '1') return 'transparent';
  if (['b3', '3'].includes(degree)) return 'rgba(167,139,250,0.12)';
  if (['5', 'b5', '#5'].includes(degree)) return 'transparent';
  if (['b7', '7'].includes(degree)) return 'rgba(251,191,36,0.12)';
  return 'rgba(45,212,191,0.10)'; // tensions: 2, 4, 6, etc.
}

function deriveRows(chord?: string, scale?: string, root?: string): IntervalRow[] {
  if (chord) {
    const c = Chord.get(chord);
    if (c.empty) return [];
    return c.intervals.map((ivl, i) => ({
      degree: INTERVAL_LABEL[ivl] ?? ivl,
      note: c.notes[i] ?? '',
      semitones: Interval.semitones(ivl) ?? 0,
    }));
  }
  if (scale && root) {
    const s = Scale.get(`${root} ${scale}`);
    if (s.empty) return [];
    return s.intervals.map((ivl, i) => ({
      degree: INTERVAL_LABEL[ivl] ?? ivl,
      note: s.notes[i] ?? '',
      semitones: Interval.semitones(ivl) ?? 0,
    }));
  }
  return [];
}

export default function IntervalGrid({
  title,
  chord,
  scale,
  root,
  rows,
}: {
  title?: string;
  chord?: string;
  scale?: string;
  root?: string;
  rows?: IntervalRow[];
}) {
  const displayRows = rows ?? deriveRows(chord, scale, root);

  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      {displayRows.length === 0 ? (
        <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Nessun dato da visualizzare.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Grado', 'Nota', 'Semitoni'].map(h => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left', padding: '6px 12px',
                    color: '#6b7280', fontWeight: 600,
                    borderBottom: '1px solid #30363d',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={i}
                style={{
                  background: rowBg(row.degree),
                  borderBottom: '1px solid rgba(48,54,61,0.4)',
                }}
              >
                <td style={{
                  padding: '7px 12px', color: '#e6edf3',
                  fontWeight: 600, fontFamily: 'monospace',
                }}>
                  {row.degree}
                </td>
                <td style={{
                  padding: '7px 12px', color: '#c4b5fd', fontFamily: 'monospace',
                }}>
                  {row.note}
                </td>
                <td style={{ padding: '7px 12px', color: '#8b949e' }}>
                  {row.semitones}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
