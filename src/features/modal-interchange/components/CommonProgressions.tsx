import { useState } from 'react';
import { Play, Copy, Check } from 'lucide-react';
import { NoteName } from '@shared/types/music.types';
import { COMMON_PROGRESSIONS } from '../services/progressionLibrary'; // ✅ DA QUI
import { transposeChords } from '../services/modalInterchangeData'; // ✅ DA QUI

interface CommonProgressionsProps {
  selectedKey: NoteName;
  tonality: 'major' | 'minor';
}

export function CommonProgressions({ selectedKey, tonality }: CommonProgressionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtra progressioni appropriate per la tonalità
  const filtered = COMMON_PROGRESSIONS.filter(() => {
    return true; // Mostra tutte per ora
  });

  // Helper: Traspone gli accordi alla tonalità selezionata
  const transposeProgression = (prog: (typeof COMMON_PROGRESSIONS)[0]) => {
    if (selectedKey === 'C') {
      return prog.chords; // Già in C
    }

    return transposeChords(prog.chords, 'C', selectedKey);
  };

  const handleCopy = (progression: (typeof COMMON_PROGRESSIONS)[0]) => {
    const transposedChords = transposeProgression(progression);
    const text = `${progression.name}\n${transposedChords.join(' → ')}\nKey: ${selectedKey} ${tonality}`;
    navigator.clipboard.writeText(text);
    setCopiedId(progression.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className='progressions-container'>
      <div className='progressions-header'>
        <h3>Common Modal Interchange Progressions</h3>
        <p>Famous chord progressions that use borrowed chords (quadriads)</p>
        {selectedKey !== 'C' && (
          <div className='key-notice'>
            <strong>Note:</strong> Progressions transposed to {selectedKey} {tonality}
          </div>
        )}
      </div>

      <div className='progressions-grid'>
        {filtered.map((prog) => {
          const transposedChords = transposeProgression(prog);

          return (
            <div key={prog.id} className='progression-card'>
              <div className='progression-card-header'>
                <div className='header-top'>
                  <h4>{prog.name}</h4>
                  <span className={`difficulty-badge difficulty-${prog.difficulty}`}>{prog.difficulty}</span>
                </div>
                <div className='progression-genres'>
                  {prog.genre.map((g) => (
                    <span key={g} className='genre-tag'>
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <p className='progression-description'>{prog.description}</p>

              <div className='progression-chords'>
                <div className='chord-numerals'>
                  {prog.numerals.map((numeral, i) => (
                    <span key={i} className={`chord-numeral ${prog.borrowedDegrees.includes(i + 1) ? 'borrowed' : ''}`}>
                      {numeral}
                    </span>
                  ))}
                </div>

                <div className='chord-names'>
                  {transposedChords.map((chord, i) => (
                    <span key={i} className='chord-name'>
                      {chord}
                    </span>
                  ))}
                </div>
              </div>

              {prog.examples.length > 0 && (
                <div className='progression-examples'>
                  <span className='examples-label'>Examples:</span>
                  <ul>
                    {prog.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className='progression-actions'>
                <button className='action-button' onClick={() => handleCopy(prog)}>
                  {copiedId === prog.id ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === prog.id ? 'Copied!' : 'Copy'}
                </button>

                <button className='action-button primary' disabled title='Coming soon!'>
                  <Play size={16} />
                  Play
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
