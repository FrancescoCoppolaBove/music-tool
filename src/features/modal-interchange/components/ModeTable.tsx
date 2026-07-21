import React from 'react';
import { ModalInterchangeTable, ChordQuality, Mode } from '../types/modalInterchange.types';

const HM_MODES = new Set<Mode>(['harmonic-minor', 'locrian-natural6', 'ionian-sharp5', 'dorian-sharp4', 'phrygian-dominant', 'lydian-sharp2', 'altered-diminished']);
const MM_MODES = new Set<Mode>(['melodic-minor', 'dorian-b2', 'lydian-augmented', 'lydian-dominant', 'mixolydian-b6', 'locrian-natural2', 'altered']);

function getModeGroup(mode: Mode): 'diatonic' | 'harmonic-minor' | 'melodic-minor' {
  if (HM_MODES.has(mode)) return 'harmonic-minor';
  if (MM_MODES.has(mode)) return 'melodic-minor';
  return 'diatonic';
}

const GROUP_LABELS: Record<'diatonic' | 'harmonic-minor' | 'melodic-minor', string> = {
  'diatonic': 'Diatonic Modes',
  'harmonic-minor': 'Harmonic Minor Modes',
  'melodic-minor': 'Melodic Minor Modes',
};

interface ModeTableProps {
  table: ModalInterchangeTable;
}

export function ModeTable({ table }: ModeTableProps) {
  const diatonicMode = table.tonality === 'major' ? 'ionian' : 'aeolian';

  return (
    <div className='mode-table-container'>
      <div className='mode-table-info'>
        <h3>
          Parallel Modes of {table.key} {table.tonality === 'major' ? 'Major' : 'Minor'}
        </h3>
        <p>
          The <strong>{diatonicMode === 'ionian' ? 'Ionian' : 'Aeolian'}</strong> row shows your diatonic chords. Other rows show available
          borrowed chords (all chords are seventh chords).
        </p>
      </div>

      <div className='mode-table-scroll'>
        <table className='mode-table'>
          <thead>
            <tr>
              <th className='mode-name-header'>Mode</th>
              <th>I</th>
              <th>II</th>
              <th>III</th>
              <th>IV</th>
              <th>V</th>
              <th>VI</th>
              <th>VII</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let currentGroup: string | null = null;
              return table.modes.flatMap((modeRow) => {
                const group = getModeGroup(modeRow.mode);
                const rows: React.ReactNode[] = [];
                if (group !== currentGroup) {
                  currentGroup = group;
                  rows.push(
                    <tr key={`divider-${group}`} className="mode-group-divider">
                      <th colSpan={8} scope="colgroup">{GROUP_LABELS[group]}</th>
                    </tr>
                  );
                }
                const isDiatonic = modeRow.mode === diatonicMode;
                rows.push(
                  <tr key={modeRow.mode} className={isDiatonic ? 'diatonic-row' : ''}>
                    <td className='mode-name'>
                      {modeRow.label}
                      {isDiatonic && <span className='diatonic-badge'>Diatonic</span>}
                    </td>
                    {modeRow.chords.map((chord, index) => (
                      <td key={index} className={`chord-cell quality-${chord.quality}`}>
                        <div className='chord-content'>
                          <span className='chord-root'>{chord.root}</span>
                          <span className='chord-quality-symbol'>{getQualitySymbol(chord.quality)}</span>
                          <span className='chord-numeral'>{chord.numeral}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
                return rows;
              });
            })()}
          </tbody>
        </table>
      </div>

      <div className='mode-table-legend'>
        <h4>Chord Qualities (Seventh Chords)</h4>
        <div className='legend-grid'>
          {/* Common Chords */}
          <div className='legend-category'>
            <h5>Common</h5>
            <div className='legend-items'>
              <div className='legend-item'>
                <span className='legend-symbol quality-maj7'>maj7</span>
                <span>Major 7th</span>
              </div>
              <div className='legend-item'>
                <span className='legend-symbol quality-m7'>m7</span>
                <span>Minor 7th</span>
              </div>
              <div className='legend-item'>
                <span className='legend-symbol quality-7'>7</span>
                <span>Dominant 7th</span>
              </div>
              <div className='legend-item'>
                <span className='legend-symbol quality-m7b5'>m7♭5</span>
                <span>Half-Diminished</span>
              </div>
            </div>
          </div>

          {/* Advanced Chords */}
          <div className='legend-category'>
            <h5>Advanced</h5>
            <div className='legend-items'>
              <div className='legend-item'>
                <span className='legend-symbol quality-dim7'>°7</span>
                <span>Diminished 7th</span>
              </div>
              <div className='legend-item'>
                <span className='legend-symbol quality-mMaj7'>m(maj7)</span>
                <span>Minor-Major 7th</span>
              </div>
              <div className='legend-item'>
                <span className='legend-symbol quality-maj7#5'>maj7#5</span>
                <span>Augmented Maj7</span>
              </div>
              <div className='legend-item'>
                <span className='legend-symbol quality-7b9'>7♭9</span>
                <span>Altered Dominant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Restituisce il simbolo per la qualità dell'accordo (QUADRIADI)
 */
function getQualitySymbol(quality: ChordQuality): string {
  const symbols: Record<ChordQuality, string> = {
    maj7: 'maj7',
    m7: 'm7',
    '7': '7',
    m7b5: 'm7♭5',
    dim7: '°7',
    mMaj7: 'm(maj7)',
    'maj7#5': 'maj7#5',
    '7b9': '7♭9',
    'm7#5': 'm7#5',
  };

  return symbols[quality] || '';
}
