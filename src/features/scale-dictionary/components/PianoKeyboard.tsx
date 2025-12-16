/**
 * PIANO KEYBOARD COMPONENT - FIXED
 * Visualizzazione tastiera piano con posizionamento corretto dei tasti neri
 */

import React from 'react';
import { isNoteInScale, calculateInterval, getIntervalName, normalizeNote } from '../utils/piano-utils';

interface PianoKeyboardProps {
  scaleNotes: string[];
  rootNote: string;
  startOctave?: number;
  endOctave?: number;
  showLabels?: boolean;
  showIntervals?: boolean;
}

interface Key {
  note: string;
  octave: number;
  isBlack: boolean;
  position: number; // posizione nell'ottava (0-11)
}

export function PianoKeyboard({
  scaleNotes,
  rootNote,
  startOctave = 3,
  endOctave = 5,
  showLabels = true,
  showIntervals = true,
}: PianoKeyboardProps) {
  // Generate all keys across octaves
  const allKeys = generateAllKeys(startOctave, endOctave);

  // Normalizza tutte le scale notes
  const normalizedScaleNotes = scaleNotes.map((n) => normalizeNote(n));
  const normalizedRoot = normalizeNote(rootNote);

  // Trova la prima occorrenza della root note
  const firstRootIndex = allKeys.findIndex((key) => normalizeNote(key.note) === normalizedRoot);

  // Trova quante note uniche ci sono nella scala (escludendo la root finale se duplicata)
  const uniqueScaleNotes = new Set(normalizedScaleNotes);

  // Variabili per tracciare il progresso
  let currentNoteIndex = 0; // Indice nella scaleNotes array
  let foundFinalRoot = false;

  const isHighlighted = (note: string, keyIndex: number) => {
    // Non evidenziare nulla prima della root
    if (keyIndex < firstRootIndex) return false;

    // Se abbiamo già trovato la root finale, stop
    if (foundFinalRoot && keyIndex > firstRootIndex) return false;

    const normalized = normalizeNote(note);

    // Controlla se questa nota corrisponde alla nota corrente nella sequenza della scala
    if (currentNoteIndex < scaleNotes.length) {
      const expectedNote = normalizedScaleNotes[currentNoteIndex];

      if (normalized === expectedNote) {
        // Questa nota matcha la sequenza
        currentNoteIndex++;

        // Se abbiamo completato tutte le note della scala, abbiamo finito
        if (currentNoteIndex >= scaleNotes.length) {
          foundFinalRoot = true;
        }

        return true;
      }
    }

    return false;
  };

  const isRoot = (note: string, keyIndex: number) => {
    const normalized = normalizeNote(note);
    // Root = prima occorrenza o ultima (se è alla fine della scala)
    if (keyIndex === firstRootIndex) return true;

    // Oppure è la root finale (dopo aver evidenziato tutte le altre note)
    if (normalized === normalizedRoot && currentNoteIndex === scaleNotes.length - 1) {
      return true;
    }

    return false;
  };

  return (
    <div className='piano-keyboard-container'>
      <div className='piano-keyboard'>
        <div className='keys-wrapper'>
          {allKeys.map((key, index) => {
            const highlighted = isHighlighted(key.note, index);
            const root = isRoot(key.note, index);
            const interval = calculateInterval(rootNote, key.note);
            const intervalName = getIntervalName(interval);

            return (
              <div
                key={`${key.note}-${key.octave}-${index}`}
                className={`piano-key ${key.isBlack ? 'black-key' : 'white-key'} ${highlighted ? 'highlighted' : ''} ${
                  root ? 'root-note' : ''
                }`}
                data-note={key.note}
                data-octave={key.octave}
              >
                {highlighted && showLabels && (
                  <div className='key-label'>
                    <span className='note-name'>{key.note}</span>
                    {showIntervals && <span className='interval-name'>{intervalName}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Genera tutte le chiavi del piano nell'ordine corretto
 * Include sia tasti bianchi che neri, posizionati correttamente
 */
function generateAllKeys(startOctave: number, endOctave: number): Key[] {
  const keys: Key[] = [];

  // Pattern di note in un'ottava (con flag per tasti neri)
  const octavePattern = [
    { note: 'C', isBlack: false, position: 0 },
    { note: 'C#', isBlack: true, position: 1 },
    { note: 'D', isBlack: false, position: 2 },
    { note: 'D#', isBlack: true, position: 3 },
    { note: 'E', isBlack: false, position: 4 },
    { note: 'F', isBlack: false, position: 5 },
    { note: 'F#', isBlack: true, position: 6 },
    { note: 'G', isBlack: false, position: 7 },
    { note: 'G#', isBlack: true, position: 8 },
    { note: 'A', isBlack: false, position: 9 },
    { note: 'A#', isBlack: true, position: 10 },
    { note: 'B', isBlack: false, position: 11 },
  ];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    octavePattern.forEach(({ note, isBlack, position }) => {
      keys.push({
        note,
        octave,
        isBlack,
        position,
      });
    });
  }

  return keys;
}
