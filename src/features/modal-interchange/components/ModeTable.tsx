import { ModalInterchangeTable, ChordQuality } from '../types/modalInterchange.types';

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
            {table.modes.map((modeRow) => {
              const isDiatonic = modeRow.mode === diatonicMode;

              return (
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
            })}
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
