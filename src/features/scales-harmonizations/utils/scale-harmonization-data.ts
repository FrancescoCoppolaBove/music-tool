/**
 * SCALE HARMONIZATION DATA - COMPLETE
 * Armonizzazione completa: Modi maggiori + Minore Armonica + Minore Melodica
 */

import { SCALE_PATTERNS, normalizeKey } from '../../../shared/utils/scale-patterns';

export type ScaleMode =
  // Major scale modes (Diatonic)
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  // Harmonic Minor modes
  | 'harmonic-minor'
  | 'locrian-sharp6'
  | 'ionian-sharp5'
  | 'dorian-sharp4'
  | 'phrygian-dominant'
  | 'lydian-sharp2'
  | 'super-locrian-bb7'
  // Melodic Minor modes
  | 'melodic-minor'
  | 'dorian-b2'
  | 'lydian-augmented'
  | 'lydian-dominant-melodic'
  | 'mixolydian-b6'
  | 'locrian-natural2'
  | 'altered';

export interface ChordDegree {
  degree: string; // "I", "ii", "iii", etc.
  name: string; // "Tonica", "Sopratonica", etc.
  symbol: string; // "Cmaj7", "Dm7", etc.
  function: string; // "Tonica", "Pre-dominante", "Dominante"
  role: string; // Descrizione del ruolo
  icon: string; // Emoji per visualizzazione
}

export interface ScaleHarmonization {
  key: string;
  mode: ScaleMode;
  modeName: string;
  description: string;
  degrees: ChordDegree[];
  commonProgressions: string[][];
  characteristics: string[];
  family?: 'major' | 'harmonic-minor' | 'melodic-minor';
}

// ===================================
// CHROMATIC NOTES - ✅ NOTAZIONE BEMOLLE
// ===================================

export const CHROMATIC_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ===================================
// MODE TEMPLATES - MAJOR MODES
// ===================================

const IONIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'ionian',
  modeName: 'Ionian (Major Scale)',
  description: 'Classic major scale - bright, cheerful, functional',
  family: 'major',
  commonProgressions: [
    ['I', 'IV', 'V'],
    ['I', 'V', 'vi', 'IV'],
    ['vi', 'IV', 'I', 'V'],
    ['I', 'vi', 'IV', 'V'],
    ['ii', 'V', 'I'],
  ],
  characteristics: ['Reference point for harmony', 'Clear tension/resolution (V → I)', 'Well-defined tonal functions'],
};

const DORIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'dorian',
  modeName: 'Dorian (Modern Minor)',
  description: 'Minor with major 6th - jazz, funk, sophisticated',
  family: 'major',
  commonProgressions: [
    ['i', 'IV'],
    ['i', 'IV', 'i'],
    ['i', '♭VII', 'IV', 'i'],
  ],
  characteristics: ['IV7 is the characteristic chord', 'Brighter than natural minor', 'Used in jazz, funk, Miles Davis'],
};

const PHRYGIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'phrygian',
  modeName: 'Phrygian (Dark and Tense)',
  description: 'Minor with flat 2 - flamenco, metal, middle eastern',
  family: 'major',
  commonProgressions: [
    ['i', '♭II'],
    ['i', '♭VII', '♭VI', '♭II'],
    ['♭II', 'i'],
  ],
  characteristics: ['♭II maj7 is the signature chord', 'Dark and tense sound', 'Used in flamenco, metal, Arabic music'],
};

const LYDIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'lydian',
  modeName: 'Lydian (Open and Cinematic)',
  description: 'Major with #4 - dreamy, open, spacious',
  family: 'major',
  commonProgressions: [
    ['I', 'II', 'I'],
    ['I', 'II', 'iii'],
    ['I', '#IV°', 'I'],
  ],
  characteristics: ['#4 creates openness and sweet tension', 'Dreamy and cinematic sound', 'Used by Joe Satriani, film scores'],
};

const MIXOLYDIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'mixolydian',
  modeName: 'Mixolydian (Funk and Groove)',
  description: 'Major with flat 7 - rock, funk, blues',
  family: 'major',
  commonProgressions: [
    ['I', '♭VII', 'IV'],
    ['I', '♭VII', 'I'],
    ['I', 'ii', '♭VII'],
  ],
  characteristics: ['I7 (dominant that does NOT resolve)', '♭VII is the characteristic chord', 'Used in rock, funk, Beatles'],
};

const AEOLIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'aeolian',
  modeName: 'Aeolian (Natural Minor)',
  description: 'Natural minor - sad, nostalgic, emotional',
  family: 'major',
  commonProgressions: [
    ['i', 'iv', 'v'],
    ['i', 'iv', 'V'],
    ['i', '♭VII', '♭VI', 'V'],
    ['i', '♭VI', '♭III', '♭VII'],
  ],
  characteristics: ['Pure natural minor', 'v minor (no strong tension)', 'Nostalgic and melancholic sound'],
};

const LOCRIAN_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'locrian',
  modeName: 'Locrian (Unstable)',
  description: 'Diminished - unstable, tense, rare',
  family: 'major',
  commonProgressions: [
    ['i°', '♭II'],
    ['i°', '♭VII', 'i°'],
  ],
  characteristics: ['Unstable center (m7♭5)', 'Rarely used as a "key"', 'More as passing or color'],
};

// ===================================
// MODE TEMPLATES - HARMONIC MINOR
// ===================================

const HARMONIC_MINOR_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'harmonic-minor',
  modeName: 'Harmonic Minor (I)',
  description: 'Classical minor with major 7 - dramatic, tense, neoclassical',
  family: 'harmonic-minor',
  commonProgressions: [
    ['i', 'V', 'i'],
    ['i', 'iv', 'V', 'i'],
    ['i', '♭VI', '♭III+', 'V'],
    ['i', 'vii°', 'i'],
  ],
  characteristics: [
    'V7 creates strong tension (like major)',
    'Augmented 2nd (♭6 → 7) creates exotic sound',
    'Used in classical, metal, neoclassical',
  ],
};

const LOCRIAN_SHARP6_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'locrian-sharp6',
  modeName: 'Locrian ♯6 (II)',
  description: 'Diminished with major 6th - unstable, tense, exotic',
  family: 'harmonic-minor',
  commonProgressions: [
    ['ii°', '♭III+'],
    ['ii°', 'V', '♭III+'],
  ],
  characteristics: ['Diminished center with major 6th', 'Very unstable and tense', 'Rarely used as tonal center'],
};

const IONIAN_SHARP5_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'ionian-sharp5',
  modeName: 'Ionian ♯5 (III)',
  description: 'Major with augmented 5th - bright, uplifting, dreamy',
  family: 'harmonic-minor',
  commonProgressions: [
    ['III+', '♭VI', 'III+'],
    ['III+', 'IV', 'V'],
  ],
  characteristics: ['Augmented tonic creates floating sensation', 'Dreamy and surreal sound', 'Used in film scores and jazz'],
};

const DORIAN_SHARP4_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'dorian-sharp4',
  modeName: 'Dorian ♯4 (IV)',
  description: 'Minor with sharp 4 - folk, Eastern European, gypsy',
  family: 'harmonic-minor',
  commonProgressions: [
    ['iv', 'V', 'i'],
    ['iv', '♭VI', 'V'],
  ],
  characteristics: ['Minor subdominant with augmented 4th', 'Gypsy and Eastern European flavor', 'Bright minor sound'],
};

const PHRYGIAN_DOMINANT_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'phrygian-dominant',
  modeName: 'Phrygian Dominant (V)',
  description: 'Major with flat 2 and 6 - Spanish, metal, exotic dominant',
  family: 'harmonic-minor',
  commonProgressions: [
    ['V', 'i'],
    ['V', '♭VI', 'V'],
    ['V', '♭II', 'V'],
  ],
  characteristics: ['THE dominant chord of harmonic minor', 'Creates strong pull to minor tonic', 'Used in flamenco, metal, Spanish music'],
};

const LYDIAN_SHARP2_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'lydian-sharp2',
  modeName: 'Lydian ♯2 (VI)',
  description: 'Major with sharp 2 and 4 - bright, exotic, otherworldly',
  family: 'harmonic-minor',
  commonProgressions: [
    ['♭VI', '♭VII', 'i'],
    ['♭VI', 'V', 'i'],
  ],
  characteristics: ['Augmented 2nd creates exotic flavor', 'Very bright and open', 'Rare but distinctive sound'],
};

const SUPER_LOCRIAN_BB7_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'super-locrian-bb7',
  modeName: 'Super Locrian ♭♭7 (VII)',
  description: 'Fully diminished - ultra tense, chromatic, leading tone',
  family: 'harmonic-minor',
  commonProgressions: [
    ['vii°', 'i'],
    ['vii°', '♭III+', 'i'],
  ],
  characteristics: ['Diminished 7th chord (symmetrical)', 'Maximum tension before tonic', 'Creates strong pull to I'],
};

// ===================================
// MODE TEMPLATES - MELODIC MINOR
// ===================================

const MELODIC_MINOR_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'melodic-minor',
  modeName: 'Melodic Minor (I)',
  description: 'Minor with major 6 and 7 - jazz, sophisticated, modern',
  family: 'melodic-minor',
  commonProgressions: [
    ['i', 'ii', 'I'],
    ['i', 'IV', 'V'],
    ['i', '♭III+', 'V'],
  ],
  characteristics: ['Dark but bright simultaneously', 'Standard scale for jazz improvisation', 'Used by Bill Evans, Herbie Hancock'],
};

const DORIAN_B2_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'dorian-b2',
  modeName: 'Dorian ♭2 (II)',
  description: 'Minor with flat 2 and major 6 - exotic minor, ethnic',
  family: 'melodic-minor',
  commonProgressions: [
    ['ii', 'V', 'i'],
    ['ii', '♭III+', 'ii'],
  ],
  characteristics: ['Combines Phrygian darkness with Dorian brightness', 'Exotic and sophisticated', 'Used in modern jazz'],
};

const LYDIAN_AUGMENTED_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'lydian-augmented',
  modeName: 'Lydian Augmented (III)',
  description: 'Major augmented with sharp 4 - dreamy, floating, impressionistic',
  family: 'melodic-minor',
  commonProgressions: [
    ['III+', 'IV', 'III+'],
    ['III+', '♭VI', 'III+'],
  ],
  characteristics: ['Augmented tonic + #4 = maximum openness', 'Debussy-like impressionistic sound', 'Used in jazz and film scores'],
};

const LYDIAN_DOMINANT_MELODIC_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'lydian-dominant-melodic',
  modeName: 'Lydian Dominant (IV)',
  description: 'Dominant with sharp 4 - jazz, blues-influenced, funky',
  family: 'melodic-minor',
  commonProgressions: [
    ['IV', 'i'],
    ['IV', '♭VII', 'i'],
    ['IV', 'V', 'i'],
  ],
  characteristics: ['THE jazz dominant sound', 'Sharp 4 adds brightness to dominant', 'Used by bebop and modern jazz'],
};

const MIXOLYDIAN_B6_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'mixolydian-b6',
  modeName: 'Mixolydian ♭6 (V)',
  description: 'Dominant with flat 6 - dark dominant, blues, rock',
  family: 'melodic-minor',
  commonProgressions: [
    ['V', 'i'],
    ['V', 'iv', 'i'],
  ],
  characteristics: ['Dominant with minor color', 'Darker than regular Mixolydian', 'Used in blues, rock, fusion'],
};

const LOCRIAN_NATURAL2_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'locrian-natural2',
  modeName: 'Locrian ♮2 (VI)',
  description: 'Half-diminished with major 2 - lighter diminished, jazz',
  family: 'melodic-minor',
  commonProgressions: [
    ['vi°', 'V', 'i'],
    ['vi°', 'ii', 'V', 'i'],
  ],
  characteristics: ['Less dark than regular Locrian', 'Standard for m7♭5 chords in jazz', 'Used in ii-V-i progressions'],
};

const ALTERED_TEMPLATE: Omit<ScaleHarmonization, 'key' | 'degrees'> = {
  mode: 'altered',
  modeName: 'Altered (Super Locrian) (VII)',
  description: 'Fully altered dominant - maximum tension, bebop, modern jazz',
  family: 'melodic-minor',
  commonProgressions: [
    ['VII', 'I'],
    ['VII', 'III+', 'I'],
  ],
  characteristics: [
    'All extensions are altered (♭9, ♯9, ♯11, ♭13)',
    'Maximum dissonance before resolution',
    'THE sound of modern jazz (Coltrane, Parker)',
  ],
};

// ===================================
// DEGREE PATTERNS - MAJOR MODES
// ===================================

interface DegreePattern {
  degree: string;
  name: string;
  chordQuality: 'maj7' | 'm7' | '7' | 'm7b5' | 'mMaj7' | 'maj7#5' | 'dim7' | '7alt';
  function: string;
  role: string;
  icon: string;
}

const IONIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Tonic', chordQuality: 'maj7', function: 'Tonic', role: '"Home", point of rest', icon: '🏠' },
  { degree: 'ii', name: 'Supertonic', chordQuality: 'm7', function: 'Pre-dominant', role: 'Prepares dominant', icon: '🚶' },
  { degree: 'iii', name: 'Mediant', chordQuality: 'm7', function: 'Weak/Modal', role: 'Tonic alternative', icon: '💫' },
  { degree: 'IV', name: 'Subdominant', chordQuality: 'maj7', function: 'Pre-dominant', role: 'Introduces tension', icon: '⬆️' },
  { degree: 'V', name: 'Dominant', chordQuality: '7', function: 'Dominant', role: 'Creates strong tension', icon: '🔥' },
  { degree: 'vi', name: 'Submediant', chordQuality: 'm7', function: 'Tonic Alternative', role: 'Minor "sigh"', icon: '🌙' },
  { degree: 'vii°', name: 'Leading tone', chordQuality: 'm7b5', function: 'Weak Dominant', role: 'Tends back to tonic', icon: '↩️' },
];

const DORIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Modal center', chordQuality: 'm7', function: 'Center', role: 'Modal rest', icon: '🏠' },
  { degree: 'ii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭III', name: 'Light', chordQuality: 'maj7', function: 'Color', role: 'Bright contrast', icon: '✨' },
  { degree: 'IV', name: 'Characteristic', chordQuality: '7', function: 'Dorian signature', role: 'Key chord of mode', icon: '⭐' },
  { degree: 'v', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vi°', name: 'Unstable', chordQuality: 'm7b5', function: 'Unstable', role: 'Passing', icon: '🌀' },
  { degree: '♭VII', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
];

const PHRYGIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Center', chordQuality: 'm7', function: 'Center', role: 'Tense rest', icon: '🏠' },
  { degree: '♭II', name: 'Characteristic', chordQuality: 'maj7', function: 'Phrygian signature', role: 'Key chord', icon: '⭐' },
  { degree: '♭III', name: 'Color', chordQuality: '7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iv', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'v°', name: 'Unstable', chordQuality: 'm7b5', function: 'Unstable', role: 'Passing', icon: '🌀' },
  { degree: '♭VI', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VII', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
];

const LYDIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Center', chordQuality: 'maj7', function: 'Center', role: 'Open rest', icon: '🏠' },
  { degree: 'II', name: 'Color', chordQuality: '7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '#IV°', name: 'Characteristic', chordQuality: 'm7b5', function: 'Lydian signature', role: '#4 openness', icon: '⭐' },
  { degree: 'V', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vi', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
];

const MIXOLYDIAN_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Modal center', chordQuality: '7', function: 'Center', role: 'Dominant that does NOT resolve', icon: '🏠' },
  { degree: 'ii', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iii°', name: 'Unstable', chordQuality: 'm7b5', function: 'Unstable', role: 'Passing', icon: '🌀' },
  { degree: 'IV', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'v', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vi', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VII', name: 'Characteristic', chordQuality: 'maj7', function: 'Mixolydian signature', role: 'Key chord', icon: '⭐' },
];

const AEOLIAN_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Minor tonic', chordQuality: 'm7', function: 'Tonic', role: 'Rest, sadness', icon: '🏠' },
  { degree: 'ii°', name: 'Minor supertonic', chordQuality: 'm7b5', function: 'Pre-dominant', role: 'Weak but useful', icon: '🚶' },
  { degree: '♭III', name: 'Mediant', chordQuality: 'maj7', function: 'Tonic Alternative', role: 'Major light', icon: '✨' },
  { degree: 'iv', name: 'Subdominant', chordQuality: 'm7', function: 'Pre-dominant', role: 'Movement', icon: '⬆️' },
  { degree: 'v', name: 'Weak dominant', chordQuality: 'm7', function: 'Weak', role: 'No strong tension', icon: '🌫️' },
  { degree: '♭VI', name: 'Submediant', chordQuality: 'maj7', function: 'Tonic Alternative', role: 'Emotional lift', icon: '💫' },
  { degree: '♭VII', name: 'Subtonic', chordQuality: '7', function: 'Modal Dominant', role: 'Prepares tonic', icon: '🔄' },
];

const LOCRIAN_DEGREES: DegreePattern[] = [
  { degree: 'i°', name: 'Unstable center', chordQuality: 'm7b5', function: 'Center', role: 'Unstable', icon: '🌀' },
  { degree: '♭II', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭III', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'iv', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭V', name: 'Color', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VI', name: 'Color', chordQuality: '7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VII', name: 'Color', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
];

// ===================================
// DEGREE PATTERNS - HARMONIC MINOR
// ===================================

const HARMONIC_MINOR_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Minor tonic', chordQuality: 'mMaj7', function: 'Tonic', role: 'Dark but resolved', icon: '🏠' },
  { degree: 'ii°', name: 'Diminished', chordQuality: 'm7b5', function: 'Pre-dominant', role: 'Tense', icon: '⚠️' },
  { degree: '♭III+', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Floating', icon: '✨' },
  { degree: 'iv', name: 'Minor subdominant', chordQuality: 'm7', function: 'Pre-dominant', role: 'Support', icon: '⬆️' },
  { degree: 'V', name: 'Major dominant', chordQuality: '7', function: 'Dominant', role: 'Strong pull to I', icon: '🔥' },
  { degree: '♭VI', name: 'Major submediant', chordQuality: 'maj7', function: 'Color', role: 'Contrast', icon: '💫' },
  { degree: 'vii°', name: 'Diminished 7th', chordQuality: 'dim7', function: 'Leading tone', role: 'Maximum tension', icon: '⚡' },
];

const LOCRIAN_SHARP6_DEGREES: DegreePattern[] = [
  { degree: 'i°', name: 'Diminished center', chordQuality: 'm7b5', function: 'Center', role: 'Unstable', icon: '🌀' },
  { degree: '♭II', name: 'Major', chordQuality: 'mMaj7', function: 'Color', role: 'Resolution', icon: '🎨' },
  { degree: '♭III+', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Floating', icon: '✨' },
  { degree: 'iv', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'V', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'VI', name: 'Major sharp 6', chordQuality: 'maj7', function: 'Color', role: 'Bright spot', icon: '💫' },
  { degree: 'vii°', name: 'Diminished', chordQuality: 'dim7', function: 'Color', role: 'Tension', icon: '🎨' },
];

const IONIAN_SHARP5_DEGREES: DegreePattern[] = [
  { degree: 'I+', name: 'Augmented tonic', chordQuality: 'maj7#5', function: 'Tonic', role: 'Floating home', icon: '🏠' },
  { degree: 'ii', name: 'Minor', chordQuality: 'm7b5', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'III', name: 'Major dominant', chordQuality: '7', function: 'Color', role: 'Pull', icon: '🎨' },
  { degree: 'iv', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'V', name: 'Major', chordQuality: 'maj7#5', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭VI', name: 'Major', chordQuality: 'maj7', function: 'Color', role: 'Contrast', icon: '🎨' },
  { degree: 'vii°', name: 'Diminished', chordQuality: 'dim7', function: 'Color', role: 'Leading', icon: '🎨' },
];

const DORIAN_SHARP4_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Minor center', chordQuality: 'm7', function: 'Center', role: 'Rest', icon: '🏠' },
  { degree: 'II', name: 'Major', chordQuality: 'maj7', function: 'Color', role: 'Bright', icon: '💫' },
  { degree: '♭III+', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Floating', icon: '✨' },
  { degree: '#iv°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'V', name: 'Dominant', chordQuality: '7', function: 'Pull', role: 'Resolution', icon: '🔥' },
  { degree: 'vi', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vii°', name: 'Diminished', chordQuality: 'dim7', function: 'Color', role: 'Leading', icon: '🎨' },
];

const PHRYGIAN_DOMINANT_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Major dominant', chordQuality: '7', function: 'Dominant', role: 'Strong pull', icon: '🔥' },
  { degree: '♭II', name: 'Phrygian color', chordQuality: 'maj7', function: 'Color', role: 'Exotic', icon: '⭐' },
  { degree: 'iii°', name: 'Diminished', chordQuality: 'dim7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'iv', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'v°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Unstable', icon: '🎨' },
  { degree: '♭VI', name: 'Major', chordQuality: 'maj7', function: 'Color', role: 'Contrast', icon: '🎨' },
  { degree: '♭vii', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
];

const LYDIAN_SHARP2_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Major tonic', chordQuality: 'maj7', function: 'Tonic', role: 'Bright home', icon: '🏠' },
  { degree: '#II', name: 'Diminished', chordQuality: 'dim7', function: 'Color', role: 'Exotic', icon: '⭐' },
  { degree: 'iii', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: '#iv°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Lydian flavor', icon: '✨' },
  { degree: 'V', name: 'Major', chordQuality: 'maj7#5', function: 'Pull', role: 'Resolution', icon: '🔥' },
  { degree: 'VI', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: 'vii', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Leading', icon: '🎨' },
];

const SUPER_LOCRIAN_BB7_DEGREES: DegreePattern[] = [
  { degree: 'i°', name: 'Diminished 7', chordQuality: 'dim7', function: 'Leading', role: 'Maximum tension', icon: '⚡' },
  { degree: '♭II', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Resolution', icon: '🎨' },
  { degree: '♭III', name: 'Major', chordQuality: 'maj7', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭iv', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Support', icon: '🎨' },
  { degree: '♭V', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Contrast', icon: '🎨' },
  { degree: '♭vi', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: '♭♭VII', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Floating', icon: '🎨' },
];

// ===================================
// DEGREE PATTERNS - MELODIC MINOR
// ===================================

const MELODIC_MINOR_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Minor tonic', chordQuality: 'mMaj7', function: 'Tonic', role: 'Sophisticated minor', icon: '🏠' },
  { degree: 'ii', name: 'Minor', chordQuality: 'm7', function: 'Pre-dominant', role: 'Dorian flavor', icon: '🚶' },
  { degree: '♭III+', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Floating', icon: '✨' },
  { degree: 'IV', name: 'Major dominant', chordQuality: '7', function: 'Pre-dominant', role: 'Lydian dominant', icon: '⬆️' },
  { degree: 'V', name: 'Major dominant', chordQuality: '7', function: 'Dominant', role: 'Strong pull', icon: '🔥' },
  { degree: 'vi°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Half-diminished', icon: '🌙' },
  { degree: 'vii°', name: 'Altered', chordQuality: '7alt', function: 'Leading', role: 'Altered dominant', icon: '⚡' },
];

const DORIAN_B2_DEGREES: DegreePattern[] = [
  { degree: 'i', name: 'Minor center', chordQuality: 'm7', function: 'Center', role: 'Exotic minor', icon: '🏠' },
  { degree: '♭II', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Phrygian touch', icon: '⭐' },
  { degree: 'III', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Pull', icon: '🎨' },
  { degree: 'IV', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'v°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'vi°', name: 'Altered', chordQuality: '7alt', function: 'Color', role: 'Altered', icon: '🎨' },
  { degree: 'VII', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Melodic minor', icon: '🎨' },
];

const LYDIAN_AUGMENTED_DEGREES: DegreePattern[] = [
  { degree: 'I+', name: 'Augmented tonic', chordQuality: 'maj7#5', function: 'Tonic', role: 'Dreamy floating', icon: '🏠' },
  { degree: 'II', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Bright', icon: '💫' },
  { degree: 'III', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: '#iv°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'v°', name: 'Altered', chordQuality: '7alt', function: 'Color', role: 'Altered', icon: '🎨' },
  { degree: 'VI', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Contrast', icon: '🎨' },
  { degree: 'vii', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Support', icon: '🎨' },
];

const LYDIAN_DOMINANT_MELODIC_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Lydian dominant', chordQuality: '7', function: 'Dominant', role: 'Jazz dominant', icon: '🔥' },
  { degree: 'II', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'iii°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: '#iv°', name: 'Altered', chordQuality: '7alt', function: 'Color', role: 'Altered', icon: '⚡' },
  { degree: 'V', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Melodic minor', icon: '🎨' },
  { degree: 'vi', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Dorian', icon: '🎨' },
  { degree: '♭VII', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Lydian augmented', icon: '🎨' },
];

const MIXOLYDIAN_B6_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Dominant', chordQuality: '7', function: 'Dominant', role: 'Dark dominant', icon: '🔥' },
  { degree: 'ii°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: 'iii°', name: 'Altered', chordQuality: '7alt', function: 'Color', role: 'Altered', icon: '🎨' },
  { degree: 'IV', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Melodic minor', icon: '🎨' },
  { degree: 'v', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Dorian', icon: '🎨' },
  { degree: '♭VI', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Lydian augmented', icon: '🎨' },
  { degree: '♭vii', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Lydian dominant', icon: '🎨' },
];

const LOCRIAN_NATURAL2_DEGREES: DegreePattern[] = [
  { degree: 'i°', name: 'Half-diminished', chordQuality: 'm7b5', function: 'Center', role: 'Softer Locrian', icon: '🌀' },
  { degree: 'II', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Floating', icon: '✨' },
  { degree: '♭III', name: 'Lydian dominant', chordQuality: '7', function: 'Color', role: 'Jazz dominant', icon: '🎨' },
  { degree: 'iv', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Tension', icon: '🎨' },
  { degree: '♭V', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Melodic minor', icon: '🎨' },
  { degree: '♭vi', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Dorian', icon: '🎨' },
  { degree: '♭vii°', name: 'Altered', chordQuality: '7alt', function: 'Color', role: 'Altered dominant', icon: '🎨' },
];

const ALTERED_DEGREES: DegreePattern[] = [
  { degree: 'I', name: 'Altered dominant', chordQuality: '7alt', function: 'Dominant', role: 'Maximum tension', icon: '⚡' },
  { degree: '♭II', name: 'Minor', chordQuality: 'mMaj7', function: 'Color', role: 'Resolution', icon: '🎨' },
  { degree: '♭III', name: 'Minor', chordQuality: 'm7', function: 'Color', role: 'Dorian', icon: '🎨' },
  { degree: '♭IV', name: 'Augmented', chordQuality: 'maj7#5', function: 'Color', role: 'Lydian augmented', icon: '🎨' },
  { degree: '♭V', name: 'Lydian dominant', chordQuality: '7', function: 'Color', role: 'Jazz dominant', icon: '🎨' },
  { degree: '♭VI', name: 'Dominant', chordQuality: '7', function: 'Color', role: 'Mixolydian ♭6', icon: '🎨' },
  { degree: '♭vii°', name: 'Diminished', chordQuality: 'm7b5', function: 'Color', role: 'Locrian ♮2', icon: '🎨' },
];

// ===================================
// MODE PATTERNS MAP
// ===================================

const MODE_PATTERNS: Record<ScaleMode, DegreePattern[]> = {
  // Major modes
  ionian: IONIAN_DEGREES,
  dorian: DORIAN_DEGREES,
  phrygian: PHRYGIAN_DEGREES,
  lydian: LYDIAN_DEGREES,
  mixolydian: MIXOLYDIAN_DEGREES,
  aeolian: AEOLIAN_DEGREES,
  locrian: LOCRIAN_DEGREES,
  // Harmonic minor modes
  'harmonic-minor': HARMONIC_MINOR_DEGREES,
  'locrian-sharp6': LOCRIAN_SHARP6_DEGREES,
  'ionian-sharp5': IONIAN_SHARP5_DEGREES,
  'dorian-sharp4': DORIAN_SHARP4_DEGREES,
  'phrygian-dominant': PHRYGIAN_DOMINANT_DEGREES,
  'lydian-sharp2': LYDIAN_SHARP2_DEGREES,
  'super-locrian-bb7': SUPER_LOCRIAN_BB7_DEGREES,
  // Melodic minor modes
  'melodic-minor': MELODIC_MINOR_DEGREES,
  'dorian-b2': DORIAN_B2_DEGREES,
  'lydian-augmented': LYDIAN_AUGMENTED_DEGREES,
  'lydian-dominant-melodic': LYDIAN_DOMINANT_MELODIC_DEGREES,
  'mixolydian-b6': MIXOLYDIAN_B6_DEGREES,
  'locrian-natural2': LOCRIAN_NATURAL2_DEGREES,
  altered: ALTERED_DEGREES,
};

const MODE_TEMPLATES: Record<ScaleMode, Omit<ScaleHarmonization, 'key' | 'degrees'>> = {
  // Major modes
  ionian: IONIAN_TEMPLATE,
  dorian: DORIAN_TEMPLATE,
  phrygian: PHRYGIAN_TEMPLATE,
  lydian: LYDIAN_TEMPLATE,
  mixolydian: MIXOLYDIAN_TEMPLATE,
  aeolian: AEOLIAN_TEMPLATE,
  locrian: LOCRIAN_TEMPLATE,
  // Harmonic minor modes
  'harmonic-minor': HARMONIC_MINOR_TEMPLATE,
  'locrian-sharp6': LOCRIAN_SHARP6_TEMPLATE,
  'ionian-sharp5': IONIAN_SHARP5_TEMPLATE,
  'dorian-sharp4': DORIAN_SHARP4_TEMPLATE,
  'phrygian-dominant': PHRYGIAN_DOMINANT_TEMPLATE,
  'lydian-sharp2': LYDIAN_SHARP2_TEMPLATE,
  'super-locrian-bb7': SUPER_LOCRIAN_BB7_TEMPLATE,
  // Melodic minor modes
  'melodic-minor': MELODIC_MINOR_TEMPLATE,
  'dorian-b2': DORIAN_B2_TEMPLATE,
  'lydian-augmented': LYDIAN_AUGMENTED_TEMPLATE,
  'lydian-dominant-melodic': LYDIAN_DOMINANT_MELODIC_TEMPLATE,
  'mixolydian-b6': MIXOLYDIAN_B6_TEMPLATE,
  'locrian-natural2': LOCRIAN_NATURAL2_TEMPLATE,
  altered: ALTERED_TEMPLATE,
};

// ===================================
// GENERATE HARMONIZATION
// ===================================

/**
 * Genera armonizzazione completa per key + mode
 */
export function generateScaleHarmonization(key: string, mode: ScaleMode): ScaleHarmonization {
  const template = MODE_TEMPLATES[mode];
  const degreePatterns = MODE_PATTERNS[mode];

  // Build scale from key
  const scale = buildScale(key, mode);

  // Generate chord degrees
  const degrees: ChordDegree[] = degreePatterns.map((pattern, index) => {
    const chordRoot = scale[index];
    const symbol = buildChordSymbol(chordRoot, pattern.chordQuality);

    return {
      degree: pattern.degree,
      name: pattern.name,
      symbol,
      function: pattern.function,
      role: pattern.role,
      icon: pattern.icon,
    };
  });

  return {
    key,
    mode,
    modeName: template.modeName,
    description: template.description,
    degrees,
    commonProgressions: template.commonProgressions,
    characteristics: template.characteristics,
    family: template.family,
  };
}

/**
 * Build scale from key and mode
 */
function buildScale(key: string, mode: ScaleMode): string[] {
  const modePatterns = SCALE_PATTERNS[mode];

  if (!modePatterns) {
    console.error('Mode not found:', mode);
    return [key];
  }

  const scale = modePatterns[key];

  if (!scale) {
    console.error('Key not found for mode:', key, mode);
    return [key];
  }

  return scale;
}

/**
 * Build chord symbol from root and quality
 */
function buildChordSymbol(root: string, quality: 'maj7' | 'm7' | '7' | 'm7b5' | 'mMaj7' | 'maj7#5' | 'dim7' | '7alt'): string {
  const displayRoot = root.replace('##', '#').replace('bb', 'b');

  switch (quality) {
    case 'maj7':
      return `${displayRoot}maj7`;
    case 'm7':
      return `${displayRoot}m7`;
    case '7':
      return `${displayRoot}7`;
    case 'm7b5':
      return `${displayRoot}m7♭5`;
    case 'mMaj7':
      return `${displayRoot}m△7`;
    case 'maj7#5':
      return `${displayRoot}maj7♯5`;
    case 'dim7':
      return `${displayRoot}°7`;
    case '7alt':
      return `${displayRoot}7alt`;
    default:
      return displayRoot;
  }
}
