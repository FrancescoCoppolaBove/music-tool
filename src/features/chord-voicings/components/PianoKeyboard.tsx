import React from 'react';
import { NoteName } from '@shared/types/music.types';

interface PianoKeyboardProps {
  highlightedNotes: NoteName[];
  leftHandNotes?: NoteName[];
  rightHandNotes?: NoteName[];
  compact?: boolean;
}

const WHITE_KEYS: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS: (NoteName | null)[] = ['C#', 'D#', null, 'F#', 'G#', 'A#', null];

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  highlightedNotes,
  leftHandNotes = [],
  rightHandNotes = [],
  compact = false,
}) => {
  const isHighlighted = (note: NoteName): boolean => {
    return highlightedNotes.includes(note);
  };

  const getKeyColor = (note: NoteName): 'left' | 'right' | 'both' | null => {
    const inLeft = leftHandNotes.includes(note);
    const inRight = rightHandNotes.includes(note);
    
    if (inLeft && inRight) return 'both';
    if (inLeft) return 'left';
    if (inRight) return 'right';
    return null;
  };

  return (
    <div className={`piano-keyboard ${compact ? 'compact' : ''}`}>
      <div className="piano-keys">
        {WHITE_KEYS.map((note, index) => {
          const highlighted = isHighlighted(note);
          const handColor = getKeyColor(note);
          
          return (
            <div key={`white-${note}-${index}`} className="key-container">
              <div
                className={`white-key ${highlighted ? 'highlighted' : ''} ${handColor || ''}`}
                data-note={note}
              >
                {!compact && <span className="key-label">{note}</span>}
              </div>
              
              {BLACK_KEYS[index] && (
                <div
                  className={`black-key ${
                    isHighlighted(BLACK_KEYS[index]!) ? 'highlighted' : ''
                  } ${getKeyColor(BLACK_KEYS[index]!) || ''}`}
                  data-note={BLACK_KEYS[index]}
                >
                  {!compact && <span className="key-label">{BLACK_KEYS[index]}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {!compact && (
        <div className="keyboard-legend">
          <span className="legend-item left">
            <span className="legend-color left"></span> Left Hand
          </span>
          <span className="legend-item right">
            <span className="legend-color right"></span> Right Hand
          </span>
          <span className="legend-item both">
            <span className="legend-color both"></span> Both
          </span>
        </div>
      )}
    </div>
  );
};