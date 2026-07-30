import { useMemo } from 'react';
import { Scale, Chord, Note } from 'tonal';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
const SEMITONE_TO_KEY = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

interface SourceChord {
  symbol: string;
  root: string;
  isBorrowed: boolean;
}

interface SourceColumn {
  label: string;
  sublabel: string;
  color: string;
  chords: SourceChord[];
  isHome?: boolean;
}

function getSourceKey(home: string, semitoneOffset: number): string {
  const chroma = Note.get(home).chroma ?? 0;
  return SEMITONE_TO_KEY[(chroma + semitoneOffset + 12) % 12];
}

function buildScaleChords(sourceKey: string, homeKey: string): SourceChord[] {
  const scaleData = Scale.get(`${sourceKey} major`);
  if (scaleData.empty || scaleData.notes.length < 7) return [];

  const homeScale = Scale.get(`${homeKey} major`);
  const homeNotes = new Set(homeScale.notes.map(n => Note.pitchClass(n)));

  const notes = scaleData.notes;
  return notes.map((root, i) => {
    const chordNotes = [
      notes[i],
      notes[(i + 2) % 7],
      notes[(i + 4) % 7],
      notes[(i + 6) % 7],
    ];
    const detected = Chord.detect(chordNotes);
    const symbol = detected[0] ?? root;
    const isBorrowed = !homeNotes.has(Note.pitchClass(root));
    return { symbol, root, isBorrowed };
  });
}

export default function PhrygianCushionExplorer() {
  const { globalKey } = useGlobalKey();

  const columns = useMemo<SourceColumn[]>(() => {
    const dorianKey   = getSourceKey(globalKey, 10);
    const aeolianKey  = getSourceKey(globalKey,  3);
    const phrygianKey = getSourceKey(globalKey,  8);
    return [
      {
        label: 'Originale', sublabel: `${globalKey} maggiore`, color: '#10b981', isHome: true,
        chords: buildScaleChords(globalKey, globalKey),
      },
      {
        label: 'Dorian', sublabel: `da ${dorianKey} maj`, color: '#06b6d4',
        chords: buildScaleChords(dorianKey, globalKey),
      },
      {
        label: 'Aeolian', sublabel: `da ${aeolianKey} maj`, color: '#ef4444',
        chords: buildScaleChords(aeolianKey, globalKey),
      },
      {
        label: 'Phrygian', sublabel: `da ${phrygianKey} maj`, color: '#f59e0b',
        chords: buildScaleChords(phrygianKey, globalKey),
      },
    ];
  }, [globalKey]);

  const validColumns = columns.filter(col => col.chords.length === 7);

  return (
    <div style={{
      background: '#161b22', border: '1px solid #30363d',
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header */}
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#e6edf3' }}>
          🎹 Cushion Chord Palette
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          Tutti gli accordi disponibili dalle tre tonalità sorgente. Gli accordi con bordo colorato
          non appartengono a <strong style={{ color: '#e6edf3' }}>{globalKey} maggiore</strong> —
          sono i cush chords da prendere in prestito liberamente nelle tue progressioni.
        </p>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `28px repeat(${validColumns.length}, minmax(110px, 1fr))`,
          gap: 5,
          minWidth: 400,
        }}>
          {/* Header row */}
          <div />
          {validColumns.map((col, ci) => (
            <div key={`h-${ci}`} style={{
              textAlign: 'center', padding: '6px 4px',
              borderBottom: `2px solid ${col.color}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{col.sublabel}</div>
            </div>
          ))}

          {/* Data rows — flatMap keeps CSS grid left-to-right order */}
          {Array.from({ length: 7 }, (_, rowIdx) => [
            <div key={`deg-${rowIdx}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#4b5563', fontWeight: 700, fontFamily: 'monospace',
            }}>
              {ROMAN[rowIdx]}
            </div>,
            ...validColumns.map((col, colIdx) => {
              const chord = col.chords[rowIdx];
              const highlight = !col.isHome && chord.isBorrowed;
              return (
                <div
                  key={`c-${rowIdx}-${colIdx}`}
                  style={{
                    padding: '7px 6px', borderRadius: 7, textAlign: 'center',
                    background: highlight ? `${col.color}12` : '#0d1117',
                    border: `1px solid ${highlight ? col.color : '#21262d'}`,
                    boxShadow: highlight ? `0 0 7px ${col.color}20` : 'none',
                  }}
                >
                  <div style={{
                    fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                    color: highlight ? '#e6edf3' : '#4b5563',
                  }}>
                    {chord.symbol}
                  </div>
                  {highlight && (
                    <div style={{ fontSize: 9, color: col.color, marginTop: 2 }}>
                      prestito
                    </div>
                  )}
                </div>
              );
            }),
          ]).flat()}
        </div>
      </div>

      {/* Usage note */}
      <div style={{
        fontSize: 12, color: '#6b7280', padding: '10px 12px',
        background: '#0d1117', borderRadius: 8, lineHeight: 1.6,
      }}>
        <strong style={{ color: '#8b949e' }}>Come usarlo:</strong>{' '}
        Il <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>I ({globalKey}maj)</strong> resta
        sempre il tuo tonico. Per tutti gli altri accordi puoi pescare liberamente da qualsiasi colonna —
        anche mischiando fonti diverse nella stessa progressione. Più scuro il colore della fonte,
        più scuro l'effetto armonico. La progressione risolve sempre sul I.
      </div>
    </div>
  );
}
