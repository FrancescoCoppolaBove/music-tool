/**
 * SCALE HARMONIZATION FEATURE - COMPLETE
 * Con Major, Harmonic Minor e Melodic Minor modes
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

// Mode options grouped by family
const MODE_OPTIONS: {
  family: string;
  modes: { value: ScaleMode; label: string; emoji: string }[];
}[] = [
  {
    family: 'Major Scale Modes',
    modes: [
      { value: 'ionian', label: 'Ionian (Major)', emoji: '🌞' },
      { value: 'dorian', label: 'Dorian', emoji: '🎷' },
      { value: 'phrygian', label: 'Phrygian', emoji: '🌚' },
      { value: 'lydian', label: 'Lydian', emoji: '✨' },
      { value: 'mixolydian', label: 'Mixolydian', emoji: '🎸' },
      { value: 'aeolian', label: 'Aeolian (Minor)', emoji: '🌙' },
      { value: 'locrian', label: 'Locrian', emoji: '🌀' },
    ],
  },
  {
    family: 'Harmonic Minor Modes',
    modes: [
      { value: 'harmonic-minor', label: 'Harmonic Minor (I)', emoji: '🎻' },
      { value: 'locrian-sharp6', label: 'Locrian ♯6 (II)', emoji: '⚠️' },
      { value: 'ionian-sharp5', label: 'Ionian ♯5 (III)', emoji: '☁️' },
      { value: 'dorian-sharp4', label: 'Dorian ♯4 (IV)', emoji: '🎪' },
      { value: 'phrygian-dominant', label: 'Phrygian Dominant (V)', emoji: '🔥' },
      { value: 'lydian-sharp2', label: 'Lydian ♯2 (VI)', emoji: '🌟' },
      { value: 'super-locrian-bb7', label: 'Super Locrian ♭♭7 (VII)', emoji: '⚡' },
    ],
  },
  {
    family: 'Melodic Minor Modes',
    modes: [
      { value: 'melodic-minor', label: 'Melodic Minor (I)', emoji: '🎺' },
      { value: 'dorian-b2', label: 'Dorian ♭2 (II)', emoji: '🌐' },
      { value: 'lydian-augmented', label: 'Lydian Augmented (III)', emoji: '🌈' },
      { value: 'lydian-dominant-melodic', label: 'Lydian Dominant (IV)', emoji: '🎯' },
      { value: 'mixolydian-b6', label: 'Mixolydian ♭6 (V)', emoji: '🌃' },
      { value: 'locrian-natural2', label: 'Locrian ♮2 (VI)', emoji: '🎭' },
      { value: 'altered', label: 'Altered / Super Locrian (VII)', emoji: '💥' },
    ],
  },
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
    const match = symbol.match(/^([A-G][#b]*)/);
    if (!match) return ['C2'];

    let root = match[1];
    const quality = symbol.replace(root, '');

    root = root.replace('##', '#').replace('bb', 'b');

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

    // Determine intervals based on chord quality
    let intervals: number[] = [];

    if (quality.includes('maj7♯5') || quality.includes('maj7#5')) {
      intervals = [0, 4, 8, 11]; // Augmented major 7
    } else if (quality.includes('m△7') || quality.includes('mMaj7')) {
      intervals = [0, 3, 7, 11]; // Minor major 7
    } else if (quality.includes('°7') || quality.includes('dim7')) {
      intervals = [0, 3, 6, 9]; // Diminished 7
    } else if (quality.includes('7alt')) {
      intervals = [0, 4, 6, 10]; // Altered dominant (example voicing)
    } else if (quality.includes('maj7')) {
      intervals = [0, 4, 7, 11]; // Major 7
    } else if (quality.includes('m7♭5') || quality.includes('m7b5')) {
      intervals = [0, 3, 6, 10]; // Half-diminished
    } else if (quality.includes('m7')) {
      intervals = [0, 3, 7, 10]; // Minor 7
    } else if (quality.includes('7')) {
      intervals = [0, 4, 7, 10]; // Dominant 7
    } else {
      intervals = [0, 4, 7]; // Major triad fallback
    }

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
              <p className='card-description'>Explore Major, Harmonic Minor & Melodic Minor modes</p>
            </div>
          </div>
        </div>

        {/* Selectors */}
        <div className='card-content'>
          <div className='harmonization-selectors'>
            {/* Key Selector */}
            <div className='selector-group'>
              <label className='selector-label'>Key</label>
              <div className='key-selector'>
                {CHROMATIC_NOTES.map((note) => (
                  <button key={note} onClick={() => setSelectedKey(note)} className={`key-button ${selectedKey === note ? 'active' : ''}`}>
                    {note}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector - Grouped by Family */}
            {MODE_OPTIONS.map((group) => (
              <div key={group.family} className='selector-group'>
                <label className='selector-label'>{group.family}</label>
                <div className='mode-selector'>
                  {group.modes.map((option) => (
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
            ))}
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
                <span>Characteristics:</span>
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
          <h3 className='card-title'>Scale Chords</h3>
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
            <h3 className='card-title'>Common Progressions</h3>
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
            <h3 className='card-title'>How to Use</h3>
          </div>
          <button className='accordion-toggle'>{showTheory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>
        {showTheory && (
          <div className='card-content'>
            <div className='theory-content'>
              <div className='theory-section'>
                <h4>Three Modal Families</h4>
                <p>
                  <strong>Major Scale Modes:</strong> Functional harmony - focus on tension and resolution (I-IV-V-I)
                </p>
                <p>
                  <strong>Harmonic Minor Modes:</strong> Exotic dominant sound with augmented 2nd interval - classical, metal, neoclassical
                </p>
                <p>
                  <strong>Melodic Minor Modes:</strong> Jazz sophistication - altered dominants and complex harmonies (bebop, modern jazz)
                </p>
              </div>

              <div className='theory-section'>
                <h4>Harmonic Minor Applications</h4>
                <ul>
                  <li>
                    <strong>Phrygian Dominant (V):</strong> THE go-to mode for Spanish/flamenco sound and exotic metal riffs
                  </li>
                  <li>
                    <strong>Harmonic Minor (I):</strong> Classical minor with strong V7→i resolution (Bach, Vivaldi)
                  </li>
                  <li>
                    <strong>Lydian ♯2 (VI):</strong> Bright and exotic - use for otherworldly film score textures
                  </li>
                </ul>
              </div>

              <div className='theory-section'>
                <h4>Melodic Minor Applications</h4>
                <ul>
                  <li>
                    <strong>Altered Scale (VII):</strong> Maximum tension for jazz - play over altered dominants (G7♯9♭13 → Cmaj7)
                  </li>
                  <li>
                    <strong>Lydian Dominant (IV):</strong> THE jazz dominant sound - bright ♯11 over dominant 7 chords
                  </li>
                  <li>
                    <strong>Melodic Minor (I):</strong> Sophisticated minor - dark yet bright (Bill Evans, Herbie Hancock)
                  </li>
                </ul>
              </div>

              <div className='theory-section'>
                <h4>Writing Tips</h4>
                <p>
                  <strong>❌ Don't try to use all 7 chords!</strong>
                  <br />
                  <strong>✅ Use: 1 center + 2-3 characteristic chords</strong>
                </p>
                <p>
                  Harmonic Minor example: Am△7 (i) → E7 (V) → Fmaj7 (♭VI)
                  <br />
                  Melodic Minor example: Cm△7 (i) → F7 (IV lydian dom) → G7alt (V)
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
  const match = symbol.match(/^([A-G][#b]*)/);
  if (!match) return ['C2'];

  let root = match[1];
  const quality = symbol.replace(root, '');

  root = root.replace('##', '#').replace('bb', 'b');

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

  if (quality.includes('maj7♯5') || quality.includes('maj7#5')) {
    intervals = [0, 4, 8, 11];
  } else if (quality.includes('m△7') || quality.includes('mMaj7')) {
    intervals = [0, 3, 7, 11];
  } else if (quality.includes('°7') || quality.includes('dim7')) {
    intervals = [0, 3, 6, 9];
  } else if (quality.includes('7alt')) {
    intervals = [0, 4, 6, 10];
  } else if (quality.includes('maj7')) {
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

  const useFlats = root.includes('b');
  const chromaticScale = useFlats
    ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return intervals.map((interval) => {
    const noteSemitone = (rootSemitone + interval) % 12;
    return `${chromaticScale[noteSemitone]}2`;
  });
}
