import { BorrowedChord, ChordQuality } from '../types/modalInterchange.types';

interface BorrowedChordHighlighterProps {
  borrowedChords: BorrowedChord[];
  tonality: 'major' | 'minor';
}

export function BorrowedChordHighlighter({ borrowedChords, tonality }: BorrowedChordHighlighterProps) {
  // Raggruppa per grado
  const byDegree = borrowedChords.reduce(
    (acc, bc) => {
      const degree = bc.chord.degree;
      if (!acc[degree]) acc[degree] = [];
      acc[degree].push(bc);
      return acc;
    },
    {} as Record<number, BorrowedChord[]>,
  );

  return (
    <div className='borrowed-chords-container'>
      <div className='borrowed-header'>
        <h3>Available Borrowed Chords (Seventh Chords)</h3>
        <p>
          These seventh chords are <strong>not diatonic</strong> to your {tonality} key, but can be borrowed from parallel modes for richer
          harmonic color in jazz, neo-soul, and fusion styles.
        </p>
      </div>

      <div className='borrowed-grid'>
        {Object.entries(byDegree)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([degree, chords]) => (
            <div key={degree} className='degree-group'>
              <h4 className='degree-title'>Degree {degree}</h4>

              {chords.map((bc, index) => (
                <div key={index} className={`borrowed-card quality-${bc.chord.quality}`}>
                  <div className='borrowed-card-header'>
                    <span className='borrowed-chord-name'>
                      {bc.chord.fullSymbol}
                      <span className='chord-quality-badge'>{getQualityLabel(bc.chord.quality)}</span>
                    </span>
                    <span className='borrowed-numeral-badge'>{bc.chord.numeral}</span>
                  </div>

                  <div className='borrowed-card-content'>
                    <div className='borrowed-info-row'>
                      <span className='info-label'>From:</span>
                      <span className='info-value'>{bc.sourceModeLabel}</span>
                    </div>

                    <div className='borrowed-info-row'>
                      <span className='info-label'>Color:</span>
                      <span className='info-value color-text'>{bc.emotionalColor}</span>
                    </div>

                    <div className='borrowed-usage'>
                      <span className='usage-label'>Usage:</span>
                      <p className='usage-text'>{bc.commonUsage}</p>
                    </div>

                    {/* Jazz Context - Solo se presente */}
                    {bc.jazzContext && bc.jazzContext.length > 0 && (
                      <div className='borrowed-jazz-context'>
                        <span className='jazz-label'>🎷 Scale/Mode:</span>
                        <p className='jazz-text'>{bc.jazzContext}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Restituisce un'etichetta leggibile per la qualità dell'accordo
 */
function getQualityLabel(quality: ChordQuality): string {
  const labels: Record<ChordQuality, string> = {
    maj7: 'Major 7th',
    m7: 'Minor 7th',
    '7': 'Dominant 7th',
    m7b5: 'Half-Dim',
    dim7: 'Diminished 7th',
    mMaj7: 'Minor-Major 7th',
    'maj7#5': 'Aug Major 7th',
    '7b9': 'Altered Dom',
    'm7#5': 'Minor 7th #5',
  };

  return labels[quality] || '';
}
