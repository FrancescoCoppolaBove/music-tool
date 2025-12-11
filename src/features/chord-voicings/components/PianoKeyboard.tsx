import React from 'react';
import { NoteName } from '@shared/types/music.types';
import { NoteWithOctave } from '../types/chord.types';

interface PianoKeyboardProps {
  // DEPRECATED: highlightedNotes: NoteName[];
  // NUOVO: usa specificNotes
  specificNotes: NoteWithOctave[];
  leftHandNotes?: NoteName[];
  rightHandNotes?: NoteName[];
  compact?: boolean;
  showOctaves?: boolean;
  startOctave?: number;
  endOctave?: number;
}

const WHITE_KEYS: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS_PATTERN: (NoteName | null)[] = ['C#', 'D#', null, 'F#', 'G#', 'A#', null];

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  specificNotes,
  leftHandNotes = [],
  rightHandNotes = [],
  compact = false,
  showOctaves = false,
  startOctave = 3,
  endOctave = 5,
}) => {
  const octaves = Array.from(
    { length: endOctave - startOctave + 1 },
    (_, i) => startOctave + i
  );

  // NUOVO: controlla se questa specifica nota+ottava è evidenziata
  const isNoteHighlighted = (note: NoteName, octave: number): boolean => {
    return specificNotes.some(
      (n) => n.note === note && n.octave === octave
    );
  };

  // Controlla quale mano suona questa nota
  const getKeyState = (note: NoteName, octave: number): 'left' | 'right' | 'both' | null => {
    const isInSpecific = specificNotes.some(
      (n) => n.note === note && n.octave === octave
    );
    
    if (!isInSpecific) return null;

    const inLeft = leftHandNotes.includes(note);
    const inRight = rightHandNotes.includes(note);

    if (inLeft && inRight) return 'both';
    if (inLeft) return 'left';
    if (inRight) return 'right';
    return null;
  };

  return (
    <div className={`piano-keyboard-v2 ${compact ? 'compact' : ''}`}>
      <div className="keyboard-wrapper">
        {octaves.map((octave) => (
          <div key={`octave-${octave}`} className="octave-group">
            {showOctaves && !compact && (
              <div className="octave-label">Oct {octave}</div>
            )}
            
            <div className="keys-container">
              {WHITE_KEYS.map((note, whiteIndex) => {
                const isHighlighted = isNoteHighlighted(note, octave);
                const state = getKeyState(note, octave);
                const blackKey = BLACK_KEYS_PATTERN[whiteIndex];

                return (
                  <div key={`${note}-${octave}-${whiteIndex}`} className="key-group">
                    {/* White Key */}
                    <div
                      className={`
                        white-key-v2
                        ${isHighlighted ? 'is-highlighted' : ''}
                        ${state ? `hand-${state}` : ''}
                      `}
                      data-note={note}
                      data-octave={octave}
                    >
                      {!compact && (
                        <div className="key-content">
                          <span className="note-label">{note}</span>
                          {isHighlighted && state && (
                            <span className={`hand-indicator ${state}`}>
                              {state === 'both' ? 'L+R' : state === 'left' ? 'L' : 'R'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Black Key */}
                    {blackKey && (
                      <div
                        className={`
                          black-key-v2
                          ${isNoteHighlighted(blackKey, octave) ? 'is-highlighted' : ''}
                          ${getKeyState(blackKey, octave) ? `hand-${getKeyState(blackKey, octave)}` : ''}
                        `}
                        data-note={blackKey}
                        data-octave={octave}
                      >
                        {!compact && isNoteHighlighted(blackKey, octave) && (
                          <div className="key-content">
                            {getKeyState(blackKey, octave) && (
                              <span className={`hand-indicator ${getKeyState(blackKey, octave)}`}>
                                {getKeyState(blackKey, octave) === 'both' ? 'L+R' : 
                                 getKeyState(blackKey, octave) === 'left' ? 'L' : 'R'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="keyboard-legend-v2">
          <div className="legend-title">Hands:</div>
          <div className="legend-items">
            <span className="legend-item">
              <span className="legend-swatch left-swatch"></span>
              Left Hand
            </span>
            <span className="legend-item">
              <span className="legend-swatch right-swatch"></span>
              Right Hand
            </span>
            <span className="legend-item">
              <span className="legend-swatch both-swatch"></span>
              Both Hands
            </span>
          </div>
        </div>
      )}
    </div>
  );
};