/**
 * SCALE DICTIONARY FEATURE
 * Visualizza scale su tastiera piano interattiva
 */

import React, { useState, useMemo } from 'react';
import { Book, Info } from 'lucide-react';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ScaleSelector } from './components/ScaleSelector';
import { correctEnharmonicSpelling, extendScaleWithOctave } from '../../shared/utils/enharmonicUtils';
import scaleData from '../scale-recognition/data/scale_data.json';

interface ScaleData {
  scale_name: string;
  root: string;
  notes: string;
  interval_pattern: string;
}

export function ScaleDictionaryFeature() {
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedScale, setSelectedScale] = useState('Ionian (Major)');
  const [showIntervals, setShowIntervals] = useState(true);

  // Ottieni lista unica di tipi di scale
  const scaleTypes = useMemo(() => {
    const types = new Set<string>();
    (scaleData as ScaleData[]).forEach((scale) => {
      types.add(scale.scale_name);
    });
    return Array.from(types).sort();
  }, []);

  // Trova la scala selezionata
  const currentScale = useMemo(() => {
    return (scaleData as ScaleData[]).find((scale) => scale.scale_name === selectedScale && scale.root === selectedRoot);
  }, [selectedScale, selectedRoot]);

  // Estrai note della scala
  const scaleNotes = useMemo(() => {
    if (!currentScale) return [];

    const rawNotes = currentScale.notes.split(' ');

    // 1. Correggi nomenclatura enarmonica
    const correctedNotes = correctEnharmonicSpelling(rawNotes, selectedRoot);

    // 2. Aggiungi root un'ottava sopra per completare la scala
    const notesWithOctave = extendScaleWithOctave(correctedNotes, selectedRoot);

    return notesWithOctave;
  }, [currentScale, selectedRoot]);

  return (
    <div className='scale-dictionary'>
      {/* Header */}
      <div className='card'>
        <div className='card-header'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Book size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className='card-title'>Scale Dictionary</h2>
              <p className='card-description'>Explore scales across the keyboard</p>
            </div>
          </div>
        </div>

        <div className='card-content'>
          {/* Scale Selector */}
          <ScaleSelector
            selectedScale={selectedScale}
            selectedRoot={selectedRoot}
            scaleTypes={scaleTypes}
            onScaleChange={setSelectedScale}
            onRootChange={setSelectedRoot}
          />

          {/* Options */}
          <div className='dictionary-options'>
            <label className='option-checkbox'>
              <input type='checkbox' checked={showIntervals} onChange={(e) => setShowIntervals(e.target.checked)} />
              <span>Show Intervals</span>
            </label>
          </div>
        </div>
      </div>

      {/* Piano Keyboard */}
      {currentScale && (
        <div className='keyboard-section'>
          <PianoKeyboard
            scaleNotes={scaleNotes}
            rootNote={selectedRoot}
            startOctave={3}
            endOctave={5}
            showLabels={true}
            showIntervals={showIntervals}
          />
        </div>
      )}

      {/* Scale Info */}
      {currentScale && (
        <div className='card'>
          <div className='card-header'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={24} style={{ color: 'var(--info)' }} />
              <h3 className='card-title'>Scale Information</h3>
            </div>
          </div>

          <div className='card-content'>
            <div className='scale-info-grid'>
              <div className='info-item'>
                <span className='info-label'>Full Name:</span>
                <span className='info-value'>
                  {selectedRoot} {selectedScale}
                </span>
              </div>

              <div className='info-item'>
                <span className='info-label'>Notes:</span>
                <span className='info-value scale-notes'>
                  {scaleNotes.map((note, index) => (
                    <span key={index} className={`note-badge ${note === selectedRoot ? 'root' : ''}`}>
                      {note}
                    </span>
                  ))}
                </span>
              </div>

              <div className='info-item'>
                <span className='info-label'>Interval Pattern:</span>
                <span className='info-value'>{currentScale.interval_pattern}</span>
              </div>

              <div className='info-item'>
                <span className='info-label'>Number of Notes:</span>
                <span className='info-value'>{scaleNotes.length} notes (including octave)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
