/**
 * SCALE HARMONIZATION FEATURE
 * Visualizza armonizzazione completa di scale e modi
 */

import React, { useState, useMemo } from 'react';
import { Music, Play, Info, Lightbulb, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import {
  generateScaleHarmonization,
  CHROMATIC_NOTES,
  type ScaleMode,
  type ScaleHarmonization,
  type ChordDegree,
} from '../scales-harmonizations/utils/scale-harmonization-data.ts';
import { audioPlayer } from '../ear-training/utils/audio-player';

const MODE_OPTIONS: { value: ScaleMode; label: string; emoji: string }[] = [
  { value: 'ionian', label: 'Ionian (Maggiore)', emoji: '🌞' },
  { value: 'dorian', label: 'Dorian', emoji: '🎷' },
  { value: 'phrygian', label: 'Phrygian', emoji: '🌚' },
  { value: 'lydian', label: 'Lydian', emoji: '✨' },
  { value: 'mixolydian', label: 'Mixolydian', emoji: '🎸' },
  { value: 'aeolian', label: 'Aeolian (Minore)', emoji: '🌙' },
  { value: 'locrian', label: 'Locrian', emoji: '🌀' },
];

export function ScaleHarmonizationFeature() {
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [selectedMode, setSelectedMode] = useState<ScaleMode>('ionian');
  const [playingChord, setPlayingChord] = useState<string | null>(null);

  // Accordion states (mobile)
  const [showChords, setShowChords] = useState(true);
  const [showProgressions, setShowProgressions] = useState(false);
  const [showTheory, setShowTheory] = useState(false);

  // Generate harmonization
  const harmonization = useMemo(() => {
    return generateScaleHarmonization(selectedKey, selectedMode);
  }, [selectedKey, selectedMode]);

  // Play chord
  const playChord = async (chordSymbol: string) => {
    setPlayingChord(chordSymbol);

    try {
      const notes = getChordNotes(chordSymbol);
      await audioPlayer.playChord(notes);

      setTimeout(() => setPlayingChord(null), 1000);
    } catch (err) {
      console.error('Error playing chord:', err);
      setPlayingChord(null);
    }
  };

  // Get chord notes from symbol
  const getChordNotes = (symbol: string): string[] => {
    // Parse chord symbol (es: "Cmaj7", "Dm7", "Bbm7♭5", "F##maj7")
    const match = symbol.match(/^([A-G][#b]*)/);
    if (!match) return ['C2'];

    let root = match[1];
    const quality = symbol.replace(root, '');

    // Normalizza doppi sharp/flat ma MANTIENI flat (Db, Eb, Bb)
    // Audio player supporta entrambi!
    root = root.replace('##', '#').replace('bb', 'b');

    // Mappa cromatica completa (sharps E flats)
    const allNotes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

    // Trova semitono (posizione)
    let rootSemitone = -1;
    const enharmonicValues: Record<string, number> = {
      C: 0,
      'B#': 0,
      'C#': 1,
      Db: 1,
      D: 2,
      'D#': 3,
      Eb: 3,
      E: 4,
      Fb: 4,
      F: 5,
      'E#': 5,
      'F#': 6,
      Gb: 6,
      G: 7,
      'G#': 8,
      Ab: 8,
      A: 9,
      'A#': 10,
      Bb: 10,
      B: 11,
      Cb: 11,
    };

    rootSemitone = enharmonicValues[root];
    if (rootSemitone === undefined) {
      console.error('❌ Root not recognized:', root, 'from symbol:', symbol);
      return [`${root}2`];
    }

    // Determina intervalli
    let intervals: number[] = [];

    if (quality.includes('maj7')) {
      intervals = [0, 4, 7, 11]; // Root, 3rd, 5th, maj7
    } else if (quality.includes('m7♭5') || quality.includes('m7b5')) {
      intervals = [0, 3, 6, 10]; // Root, ♭3, ♭5, ♭7
    } else if (quality.includes('m7')) {
      intervals = [0, 3, 7, 10]; // Root, ♭3, 5th, ♭7
    } else if (quality.includes('7')) {
      intervals = [0, 4, 7, 10]; // Root, 3rd, 5th, ♭7
    } else {
      intervals = [0, 4, 7]; // Major triad fallback
    }

    // Costruisci note accordo USANDO LA STESSA NOMENCLATURA
    // Se root è flat, usa flat per le altre note
    const useFlats = root.includes('b');
    const chromaticScale = useFlats
      ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
      : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const notes = intervals.map((interval) => {
      const noteSemitone = (rootSemitone + interval) % 12;
      return `${chromaticScale[noteSemitone]}2`;
    });

    console.log('🎹 Chord:', symbol, '→ Root:', root, '(semitone:', rootSemitone, ') → Notes:', notes);
    return notes;
  };

  return (
    <div className='scale-harmonization-feature'>
      {/* Header */}
      <div className='card'>
        <div className='card-header'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Music size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className='card-title'>Scale Harmonization</h2>
              <p className='card-description'>Armonizzazione di scale e modi</p>
            </div>
          </div>
        </div>

        {/* Selectors */}
        <div className='card-content'>
          <div className='harmonization-selectors'>
            <div className='selector-group'>
              <label className='selector-label'>Tonalità (Key)</label>
              <div className='key-selector'>
                {CHROMATIC_NOTES.map((note) => (
                  <button key={note} onClick={() => setSelectedKey(note)} className={`key-button ${selectedKey === note ? 'active' : ''}`}>
                    {note}
                  </button>
                ))}
              </div>
            </div>

            <div className='selector-group'>
              <label className='selector-label'>Modo (Mode)</label>
              <div className='mode-selector'>
                {MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMode(option.value)}
                    className={`mode-button ${selectedMode === option.value ? 'active' : ''}`}
                  >
                    <span className='mode-emoji'>{option.emoji}</span>
                    <span className='mode-label'>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Info */}
      <div className='card'>
        <div className='card-content'>
          <div className='mode-info'>
            <h3 className='mode-info-title'>
              {harmonization.modeName} in {harmonization.key}
            </h3>
            <p className='mode-info-description'>{harmonization.description}</p>

            <div className='mode-characteristics'>
              <div className='characteristic-header'>
                <Info size={18} />
                <span>Caratteristiche:</span>
              </div>
              <ul className='characteristic-list'>
                {harmonization.characteristics.map((char, idx) => (
                  <li key={idx}>{char}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chord Degrees Table */}
      <div className='card'>
        <div className='card-header accordion-header' onClick={() => setShowChords(!showChords)} style={{ cursor: 'pointer' }}>
          <h3 className='card-title'>Accordi della Scala</h3>
          <button className='accordion-toggle'>{showChords ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>
        {showChords && (
          <div className='card-content'>
            <div className='degrees-table'>
              {harmonization.degrees.map((degree, idx) => (
                <div key={idx} className='degree-card'>
                  <div className='degree-header'>
                    <span className='degree-icon'>{degree.icon}</span>
                    <span className='degree-number'>{degree.degree}</span>
                  </div>

                  <div className='degree-body'>
                    <div className='degree-name'>{degree.name}</div>
                    <button
                      className={`degree-chord ${playingChord === degree.symbol ? 'playing' : ''}`}
                      onClick={() => playChord(degree.symbol)}
                    >
                      <Play size={16} />
                      <span>{degree.symbol}</span>
                    </button>
                    <div className='degree-function'>{degree.function}</div>
                    <div className='degree-role'>{degree.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Common Progressions */}
      <div className='card'>
        <div className='card-header accordion-header' onClick={() => setShowProgressions(!showProgressions)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GitBranch size={24} style={{ color: 'var(--primary)' }} />
            <h3 className='card-title'>Progressioni Comuni</h3>
          </div>
          <button className='accordion-toggle'>{showProgressions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>
        {showProgressions && (
          <div className='card-content'>
            <div className='progressions-grid'>
              {harmonization.commonProgressions.map((progression, idx) => (
                <div key={idx} className='progression-card'>
                  <div className='progression-degrees'>{progression.join(' → ')}</div>
                  <div className='progression-chords'>
                    {progression.map((deg, i) => {
                      const chordDegree = harmonization.degrees.find((d) => d.degree === deg);
                      return (
                        <React.Fragment key={i}>
                          {i > 0 && <span className='arrow'>→</span>}
                          <span className='chord-symbol'>{chordDegree?.symbol || deg}</span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <button className='progression-play-button' onClick={() => playProgression(progression, harmonization)}>
                    <Play size={14} />
                    <span>Play</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theory Info */}
      <div className='card'>
        <div className='card-header accordion-header' onClick={() => setShowTheory(!showTheory)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lightbulb size={24} style={{ color: 'var(--primary)' }} />
            <h3 className='card-title'>Come Usarlo</h3>
          </div>
          <button className='accordion-toggle'>{showTheory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>
        {showTheory && (
          <div className='card-content'>
            <div className='theory-content'>
              <div className='theory-section'>
                <h4>Pensiero Funzionale vs Modale</h4>
                <p>
                  <strong>Ionian/Aeolian:</strong> Usa il pensiero funzionale (Tonica → Pre-dominante → Dominante → Tonica). Cerca tensione
                  e risoluzione.
                </p>
                <p>
                  <strong>Altri Modi:</strong> Pensa in termini modali (Centro → Colore → Contrasto → Centro). Cerca l'identità del modo,
                  non la risoluzione.
                </p>
              </div>

              <div className='theory-section'>
                <h4>Accordi "Firma"</h4>
                <p>Ogni modo ha 1-2 accordi caratteristici che definiscono il suo suono:</p>
                <ul>
                  <li>
                    <strong>Dorian:</strong> IV7 (accordo chiave)
                  </li>
                  <li>
                    <strong>Phrygian:</strong> ♭II maj7 (signature)
                  </li>
                  <li>
                    <strong>Lydian:</strong> #IV° (apertura)
                  </li>
                  <li>
                    <strong>Mixolydian:</strong> ♭VII maj7 (chiave)
                  </li>
                </ul>
              </div>

              <div className='theory-section'>
                <h4>Modal Interchange Chords</h4>
                <p>Accordi "prestati" da altri modi per aggiungere colore emotivo:</p>
                <ul>
                  <li>
                    <strong>iv (minor four):</strong> Suono malinconico - Radiohead "No Surprises", Beatles "In My Life"
                  </li>
                  <li>
                    <strong>♭VI ♭VII I:</strong> Cadenza "vittoria" - Super Mario, Beatles "With a Little Help"
                  </li>
                  <li>
                    <strong>♭II maj7:</strong> Ritardo drammatico - Radiohead "Everything in Its Right Place"
                  </li>
                  <li>
                    <strong>I III IV iv:</strong> Progressione "Creep" (usare con cautela!)
                  </li>
                </ul>
              </div>

              <div className='theory-section'>
                <h4>Come Scrivere</h4>
                <p>
                  <strong>❌ Non serve usare tutti gli accordi!</strong>
                  <br />
                  <strong>✅ Usa: 1 centro + 2-3 accordi caratteristici</strong>
                </p>
                <p>
                  Esempio Dorico: Em7 (centro) → A7 (IV7) → Dmaj7 (♭VII)
                  <br />
                  Esempio Mixolydian: G7 (centro) → Fmaj7 (♭VII) → Cmaj7 (IV)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Play progression helper
async function playProgression(progression: string[], harmonization: ScaleHarmonization) {
  for (const deg of progression) {
    const chordDegree = harmonization.degrees.find((d) => d.degree === deg);
    if (!chordDegree) continue;

    const notes = getChordNotesHelper(chordDegree.symbol);
    await audioPlayer.playChord(notes);
    await audioPlayer.delay(800);
  }
}

// Helper to get chord notes
function getChordNotesHelper(symbol: string): string[] {
  // Parse chord symbol
  const match = symbol.match(/^([A-G][#b]*)/);
  if (!match) return ['C2'];

  let root = match[1];
  const quality = symbol.replace(root, '');

  // Normalizza doppi sharp/flat ma MANTIENI flat
  root = root.replace('##', '#').replace('bb', 'b');

  // Mappa semitoni
  const enharmonicValues: Record<string, number> = {
    C: 0,
    'B#': 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    Fb: 4,
    F: 5,
    'E#': 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
    Cb: 11,
  };

  const rootSemitone = enharmonicValues[root];
  if (rootSemitone === undefined) {
    console.error('❌ Root not recognized:', root, 'from symbol:', symbol);
    return [`${root}2`];
  }

  let intervals: number[] = [];

  if (quality.includes('maj7')) {
    intervals = [0, 4, 7, 11];
  } else if (quality.includes('m7♭5') || quality.includes('m7b5')) {
    intervals = [0, 3, 6, 10];
  } else if (quality.includes('m7')) {
    intervals = [0, 3, 7, 10];
  } else if (quality.includes('7')) {
    intervals = [0, 4, 7, 10];
  } else {
    intervals = [0, 4, 7];
  }

  // Usa flats se root ha flat
  const useFlats = root.includes('b');
  const chromaticScale = useFlats
    ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return intervals.map((interval) => {
    const noteSemitone = (rootSemitone + interval) % 12;
    return `${chromaticScale[noteSemitone]}2`;
  });
}
