import { useState, useMemo, useEffect } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { Note, Scale } from 'tonal';

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = 'thirds' | 'fourths' | 'step' | 'tritone' | 'modal' | 'relative';
type StyleTag = 'funk' | 'soul' | 'jazz-funk' | 'nu-jazz' | 'advanced' | 'art-rock' | 'world' | 'gospel' | 'blues';

interface Movement {
  id: string;
  label: string;
  semitones: number;
  category: Category;
  targetModeOverride?: string;
  complexity: 1 | 2 | 3;
  shortDesc: string;
  rationale: string;
  transitionTip: string;
  pivotHint?: string;
  styleTags: StyleTag[];
  artistExamples: string[];
  emotionalEffect: string;
}

interface Progression {
  id: string;
  name: string;
  numerals: string[];
  feel: string;
  styleTags: StyleTag[];
  artistRef?: string;
  complexity: 1 | 2 | 3;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const HOME_MODES = [
  { name: 'major',           label: 'Major (Ionian)',      color: '#10b981' },
  { name: 'dorian',          label: 'Dorian',              color: '#06b6d4' },
  { name: 'phrygian',        label: 'Phrygian',            color: '#f59e0b' },
  { name: 'lydian',          label: 'Lydian',              color: '#8b5cf6' },
  { name: 'mixolydian',      label: 'Mixolydian',          color: '#7c3aed' },
  { name: 'aeolian',         label: 'Aeolian (Nat. Minor)', color: '#ef4444' },
  { name: 'harmonic minor',  label: 'Harmonic Minor',      color: '#ec4899' },
  { name: 'lydian dominant', label: 'Lydian Dominant',     color: '#06b6d4' },
];

const CAT_COLORS: Record<Category, string> = {
  thirds:   '#06b6d4',
  fourths:  '#7c3aed',
  step:     '#f59e0b',
  tritone:  '#ef4444',
  modal:    '#10b981',
  relative: '#ec4899',
};

const CAT_LABELS: Record<Category, string> = {
  thirds:   'Third Relation',
  fourths:  'Fourth / Fifth',
  step:     'Stepwise',
  tritone:  'Tritone',
  modal:    'Modal Shift',
  relative: 'Relative Key',
};

const STYLE_LABELS: { id: StyleTag; label: string; artists: string }[] = [
  { id: 'funk',      label: 'Funk',         artists: 'James Brown, Tower of Power, Lettuce' },
  { id: 'jazz-funk', label: 'Jazz-Funk',    artists: 'Snarky Puppy, Ghost Note' },
  { id: 'nu-jazz',   label: 'Nu-Jazz',      artists: 'Tom Misch, Yussef Dayes, Robert Glasper' },
  { id: 'advanced',  label: 'Advanced',     artists: 'Jacob Collier, Tigran Hamasyan' },
  { id: 'soul',      label: 'Soul / Gospel', artists: 'Stevie Wonder, D\'Angelo, Erykah Badu' },
  { id: 'art-rock',  label: 'Art Rock',     artists: 'Radiohead, Björk' },
  { id: 'world',     label: 'World / Fusion', artists: 'Coltrane, Flamenco' },
];

const MINOR_MODES = new Set(['aeolian', 'dorian', 'phrygian', 'locrian', 'harmonic minor', 'melodic minor', 'dorian b2']);

// ── Movements ─────────────────────────────────────────────────────────────────

const MOVEMENTS: Movement[] = [
  {
    id: 'min3-up', label: '♭III — Minor 3rd ↑', semitones: 3, category: 'thirds', complexity: 2,
    shortDesc: 'Up a minor third — modal jazz signature',
    rationale: 'Shares ~2 diatonic notes with the home key, generating a smooth surprise. The tonic of the new section acts as the ♭III borrowed chord color of home — familiar yet fresh.',
    transitionTip: 'Use the iv chord of the home key (e.g., Fm7 in C Dorian) as a chromatic approach into the new tonic. Or jump directly — the abrupt shift is part of the effect in funk/jazz contexts.',
    pivotHint: 'Home iv → New key tonic (shared chromatic approach)',
    styleTags: ['jazz-funk', 'nu-jazz', 'advanced'],
    artistExamples: ['Snarky Puppy', 'Ghost Note', 'Tigran Hamasyan', 'Wayne Shorter'],
    emotionalEffect: 'Unexpected brightness — lifts the groove to a higher plane',
  },
  {
    id: 'maj3-up', label: 'III — Major 3rd ↑', semitones: 4, category: 'thirds', complexity: 3,
    shortDesc: 'Up a major third — Coltrane changes territory',
    rationale: 'One axis of the Coltrane changes cycle (C→E→Ab→C). Maximum surprise with minimal common tones. The ear perceives it as a kaleidoscope turn rather than a traditional modulation.',
    transitionTip: 'Use the V7alt of the new key to prepare the landing (e.g., B7alt → E section). Or common-tone pivot: the 5th of your home tonic becomes an inner voice in the new key.',
    pivotHint: 'Home V7 ≈ Target ♭II7 (shared tritone)',
    styleTags: ['advanced', 'jazz-funk'],
    artistExamples: ['John Coltrane', 'Jacob Collier', 'Chick Corea', 'McCoy Tyner'],
    emotionalEffect: 'Kaleidoscopic — reality shifts under the listener',
  },
  {
    id: 'min3-down', label: 'VI — Minor 3rd ↓', semitones: 9, category: 'thirds', complexity: 2,
    shortDesc: 'Down a minor third — dark descent',
    rationale: 'Sinks the energy. The ♭VII of the home key (e.g., B♭ in C) becomes the III of the new lower key, retaining a color tone. Film scores and dark neo-soul use this to go "deeper in".',
    transitionTip: 'Drop through the iv minor of home, then sink to the new tonic. Especially effective with a pedal bass point sustaining through the shift.',
    pivotHint: 'Home ♭VII → New V (forward momentum preserved)',
    styleTags: ['nu-jazz', 'soul', 'advanced'],
    artistExamples: ['Tom Misch', 'Yussef Dayes', 'Karriem Riggins', 'D\'Angelo'],
    emotionalEffect: 'Weight, introspection — the groove goes deeper underground',
  },
  {
    id: 'maj3-down', label: '♭VI — Major 3rd ↓', semitones: 8, category: 'thirds', complexity: 3,
    shortDesc: 'Down a major third — cinematic wonder',
    rationale: 'The second Coltrane axis, descending. Used in film scores for dream-like or surreal moments. Almost no shared diatonic notes; the contrast is the composition.',
    transitionTip: 'Let the bass drop chromatically or use a tritone sub of V7 into the new key. Works powerfully after a peak moment — sudden drop into new harmonic world.',
    pivotHint: 'Home III → New tonic (chromatic common tone)',
    styleTags: ['advanced', 'nu-jazz', 'art-rock'],
    artistExamples: ['Joe Hisaishi', 'Jacob Collier', 'Radiohead', 'Massive Attack'],
    emotionalEffect: 'Dark wonder — dreamlike, ethereal detachment',
  },
  {
    id: 'fourth-up', label: 'IV — Perfect 4th ↑', semitones: 5, category: 'fourths', complexity: 1,
    shortDesc: 'Up a perfect fourth — the soul lift',
    rationale: 'The subdominant relationship — the most natural modulation in gospel, soul and jazz. The new key\'s tonic IS already diatonic in the home key as the IV chord — zero friction.',
    transitionTip: 'The IV chord of home IS the new tonic. Simply land on it and reharmonize outward. No preparation needed — the ear accepts it instantly.',
    pivotHint: 'Home IV = New I — seamless, zero-friction pivot',
    styleTags: ['gospel', 'soul', 'funk', 'jazz-funk'],
    artistExamples: ['Tower of Power', 'James Brown', 'Stevie Wonder', 'Lettuce'],
    emotionalEffect: 'Uplift, warmth — resolution into wider harmonic space',
  },
  {
    id: 'fifth-up', label: 'V — Perfect 5th ↑', semitones: 7, category: 'fourths', complexity: 1,
    shortDesc: 'Up a perfect fifth — dominant brightness',
    rationale: 'The dominant relationship. Many shared diatonic notes (5 of 7). Creates a brighter, more resolved feel for a B or C section. Very common in jazz standards.',
    transitionTip: 'Use the V7 of home as an extended cadence into the new key\'s tonic. Or simply hit the new I — the shared notes do the smoothing work.',
    pivotHint: 'Home V = New I — or ride the ii-V-I chain',
    styleTags: ['jazz-funk', 'gospel', 'soul', 'nu-jazz'],
    artistExamples: ['Herbie Hancock', 'Miles Davis', 'Robert Glasper', 'Bill Evans'],
    emotionalEffect: 'Brightness, forward energy — ascending emotional arc',
  },
  {
    id: 'whole-up', label: 'II — Whole Step ↑', semitones: 2, category: 'step', complexity: 1,
    shortDesc: 'Up a whole step — the universal key change',
    rationale: 'The most universally understood key change. Heard in countless gospel finales, pop songs, soul records. Raises energy immediately and decisively.',
    transitionTip: 'Repeat the last bar of your A section in the original key, then jump. No pivot needed — the audience\'s ear accepts the lift instinctively.',
    styleTags: ['gospel', 'soul', 'funk'],
    artistExamples: ['Stevie Wonder', 'Whitney Houston', 'Tower of Power', 'Aretha Franklin'],
    emotionalEffect: 'Immediate energy peak — climactic, anthemic, audience-rousing',
  },
  {
    id: 'half-up', label: '♭II — Half Step ↑ (Neapolitan)', semitones: 1, category: 'step', complexity: 3,
    shortDesc: 'Up a semitone — Phrygian tension',
    rationale: 'The Neapolitan relationship — creates a Phrygian-adjacent color. Radiohead and modern jazz composers use this for unsettling, gravity-defying sections. Maximum chromatic tension.',
    transitionTip: 'The ♭II chord of home IS the new tonic. Arrive via V7alt or simply by chromatic voice-leading. Flamenco uses this constantly. The shock is the point.',
    pivotHint: 'Home ♭II = New I — zero preparation, let the friction speak',
    styleTags: ['art-rock', 'advanced', 'world'],
    artistExamples: ['Radiohead', 'Björk', 'Massive Attack', 'flamenco tradition'],
    emotionalEffect: 'Unsettling, dark, anti-gravitational — Phrygian mystery',
  },
  {
    id: 'tritone', label: '♭V — Tritone', semitones: 6, category: 'tritone', complexity: 3,
    shortDesc: 'Tritone away — maximum harmonic distance',
    rationale: 'Maximum tonal distance from the home key. The tritone substitution principle connects the two V7 chords — they share the same tritone (3rd↔7th), giving the ear a hidden thread to follow across the vast harmonic leap.',
    transitionTip: 'Home V7 = New ♭II7 (tritone sub relationship). Lean into this enharmonic pivot for a seamless but shocking modulation. The ♭9 of one is the major 3rd of the other.',
    pivotHint: 'Home V7 = Target ♭II7 (shared tritone: 3rd↔7th)',
    styleTags: ['advanced', 'nu-jazz'],
    artistExamples: ['John Coltrane', 'Thelonious Monk', 'Jacob Collier', 'Scriabin'],
    emotionalEffect: 'Harmonic vertigo — the abyss opens and closes in an instant',
  },
  // Modal shifts (same root)
  {
    id: 'to-dorian', label: '→ Dorian (same root)', semitones: 0, category: 'modal',
    targetModeOverride: 'dorian', complexity: 1,
    shortDesc: 'Parallel Dorian — funk\'s favorite mode',
    rationale: 'From major: lower the 3rd and 7th. The defining color is the IV7 chord (major 4th) — this is what makes Dorian swing and groove. Modal jazz\'s most-used mode.',
    transitionTip: 'Sustain the bass note, shift upper harmony to minor. Hit the IV7 immediately (e.g., F7 in C Dorian) — that chord announces the mode to any listener.',
    styleTags: ['funk', 'jazz-funk', 'nu-jazz'],
    artistExamples: ['Snarky Puppy', 'Lettuce', 'Miles Davis (So What)', 'Tower of Power'],
    emotionalEffect: 'Groove deepens — minor feel with a bright, swinging natural 6th',
  },
  {
    id: 'to-mixolydian', label: '→ Mixolydian (same root)', semitones: 0, category: 'modal',
    targetModeOverride: 'mixolydian', complexity: 1,
    shortDesc: 'Parallel Mixolydian — dominant blues groove',
    rationale: 'From major: lower the 7th. Makes the tonic a dominant 7th chord — the blues, soul and rock foundation. The ♭VII chord is the defining borrowed color.',
    transitionTip: 'Hit the ♭VII chord (e.g., B♭ in C Mixolydian) — the ear immediately hears the mode shift. The tonic becomes a 7th chord: let it sit.',
    styleTags: ['funk', 'soul', 'blues', 'jazz-funk'],
    artistExamples: ['James Brown', 'Jimi Hendrix', 'Ghost Note', 'Lettuce', 'Beatles'],
    emotionalEffect: 'Raw, bluesy, groove-centric — dominant energy without resolution',
  },
  {
    id: 'to-lydian', label: '→ Lydian (same root)', semitones: 0, category: 'modal',
    targetModeOverride: 'lydian', complexity: 2,
    shortDesc: 'Parallel Lydian — floating brightness',
    rationale: 'From major: raise the 4th. Creates a ♯IV chord and a floating, dreamy quality. The II major chord (whole step up) is the Lydian signature — film composers and Jacob Collier use this for transcendent moments.',
    transitionTip: 'The II major chord (e.g., D major in C Lydian) announces the mode. Use it as the first chord of the new section — the ♯11 in the melody or harmony is the tell.',
    styleTags: ['advanced', 'nu-jazz', 'art-rock'],
    artistExamples: ['Jacob Collier', 'Joe Hisaishi', 'John Williams', 'Radiohead'],
    emotionalEffect: 'Floating wonder — suspended brightness, magical realism',
  },
  {
    id: 'to-phrygian', label: '→ Phrygian (same root)', semitones: 0, category: 'modal',
    targetModeOverride: 'phrygian', complexity: 2,
    shortDesc: 'Parallel Phrygian — dark, ancient fire',
    rationale: 'The ♭II chord defines Phrygian immediately — ancient, Spanish, dark. Radiohead uses Phrygian inflections for alien textures. The ♭II in context creates a gravitational pull downward.',
    transitionTip: 'Hit the ♭II chord immediately (e.g., D♭ in C Phrygian) — no preparation. The contrast IS the modulation. Works powerfully after a major or Mixolydian section.',
    styleTags: ['art-rock', 'world', 'advanced'],
    artistExamples: ['Radiohead', 'Björk', 'Flamenco tradition', 'Carlos Santana'],
    emotionalEffect: 'Dark, mysterious, ancient — gravity pulls the music downward',
  },
  {
    id: 'to-lydian-dom', label: '→ Lydian Dominant (same root)', semitones: 0, category: 'modal',
    targetModeOverride: 'lydian dominant', complexity: 3,
    shortDesc: 'Lydian ♭7 — the jazz chromatic mode',
    rationale: 'Mode IV of melodic minor. Combines Lydian brightness (♯11) with the bluesy ♭7. The most sophisticated dominant color in jazz-funk — Herbie Hancock and Snarky Puppy live here.',
    transitionTip: 'Replace a Mixolydian vamp by raising the 4th. The ♯11 appears in a melody or chord voicing and the mode is announced. Works over any dom7♯11 groove.',
    styleTags: ['advanced', 'jazz-funk', 'nu-jazz'],
    artistExamples: ['Herbie Hancock', 'Wayne Shorter', 'Snarky Puppy', 'Tigran Hamasyan'],
    emotionalEffect: 'Sophisticated brightness — jazz-funk at maximum harmonic richness',
  },
  {
    id: 'to-harmonic-minor', label: '→ Harmonic Minor (same root)', semitones: 0, category: 'modal',
    targetModeOverride: 'harmonic minor', complexity: 2,
    shortDesc: 'Parallel Harmonic Minor — classical drama',
    rationale: 'The raised 7th creates a leading tone to the tonic. The V7 (major dominant in a minor key) creates tension the ear deeply craves to resolve. Classical weight in a contemporary context.',
    transitionTip: 'Introduce the V7 chord of the minor key (e.g., G7 in C harmonic minor) — the major 3rd (B natural) signals the mode change. Follow with the im chord for maximum drama.',
    styleTags: ['world', 'advanced', 'art-rock'],
    artistExamples: ['Robert Glasper', 'Tigran Hamasyan', 'Middle Eastern jazz fusion'],
    emotionalEffect: 'Gravitas, tragedy, classical weight — timeless darkness',
  },
  {
    id: 'relative', label: '↔ Relative Major / Minor', semitones: 0, category: 'relative', complexity: 1,
    shortDesc: 'Same notes, new tonal center',
    rationale: 'The relative major/minor shares all 7 diatonic notes. The entire harmonic world recontextualizes around a new tonal center using the exact same pitch set — maximum smoothness.',
    transitionTip: 'Shift bass and melody emphasis to the new tonic. In major→minor: the vi chord becomes the new im. In minor→major: the ♭III becomes the new I. Bass movement does the work.',
    pivotHint: 'Home vi = New im (major→minor) / Home ♭III = New I (minor→major)',
    styleTags: ['soul', 'gospel', 'jazz-funk', 'nu-jazz'],
    artistExamples: ['Tom Misch', 'D\'Angelo', 'Erykah Badu', 'Robert Glasper'],
    emotionalEffect: 'Emotional reframing — same harmonic world, completely different feeling',
  },
];

// ── Progressions Library ──────────────────────────────────────────────────────

const PROG_LIBRARY: Record<string, Progression[]> = {
  'major': [
    { id: 'maj-neosoul', name: 'Neo-Soul Sway', numerals: ['Imaj9', 'IIm9', 'V7sus4', 'V7'], feel: 'Smooth, contemporary, floating', styleTags: ['nu-jazz', 'soul'], artistRef: 'Tom Misch, Robert Glasper', complexity: 2 },
    { id: 'maj-lydian', name: 'Lydian Color', numerals: ['Imaj7', '♯IVm7♭5', 'IIIm7', 'VImaj7'], feel: 'Floating, bright, cinematic', styleTags: ['advanced', 'nu-jazz'], artistRef: 'Snarky Puppy, Joe Hisaishi', complexity: 3 },
    { id: 'maj-gospel', name: 'Gospel Lift', numerals: ['I', 'IVmaj7', 'IVm7', 'I'], feel: 'Soulful, warm, uplifting', styleTags: ['gospel', 'soul'], artistRef: 'Gospel tradition, Stevie Wonder', complexity: 1 },
    { id: 'maj-coltrane', name: 'Giant Steps Arc', numerals: ['Imaj7', '♭VImaj7', '♭IIImaj7', 'Imaj7'], feel: 'Kaleidoscopic, jazz', styleTags: ['advanced'], artistRef: 'John Coltrane', complexity: 3 },
    { id: 'maj-radio', name: 'Chromatic Plane', numerals: ['I', '♭VII', '♭VI', '♭VII'], feel: 'Dark, driving, art-rock', styleTags: ['art-rock', 'nu-jazz'], artistRef: 'Radiohead', complexity: 2 },
    { id: 'maj-funk', name: 'Major Funk', numerals: ['Imaj7', 'IVmaj7', 'Imaj7', 'V7sus4'], feel: 'Bright, funky, smooth', styleTags: ['funk', 'soul'], complexity: 1 },
  ],
  'dorian': [
    { id: 'dor-funk', name: 'Funk Pocket', numerals: ['im7', 'IV7'], feel: 'Groove, hypnotic, one-chord vamp', styleTags: ['funk', 'jazz-funk'], artistRef: 'Miles Davis (So What), Lettuce', complexity: 1 },
    { id: 'dor-snarky', name: 'Snarky Sway', numerals: ['im7', 'IV7', '♭VII7', 'im7'], feel: 'Jazz-funk, swinging, modern', styleTags: ['jazz-funk', 'nu-jazz'], artistRef: 'Snarky Puppy', complexity: 2 },
    { id: 'dor-glasper', name: 'Hip-Hop Jazz', numerals: ['im9', '♭VImaj7', '♭VII7sus4', 'im9'], feel: 'Laid-back, sophisticated', styleTags: ['nu-jazz', 'advanced'], artistRef: 'Robert Glasper', complexity: 2 },
    { id: 'dor-yussef', name: 'Nu-Jazz Drive', numerals: ['im7', 'IVm7', '♭IIImaj7', 'im7'], feel: 'Energetic, modal, driving', styleTags: ['nu-jazz', 'jazz-funk'], artistRef: 'Yussef Dayes, Tom Misch', complexity: 2 },
    { id: 'dor-ascending', name: 'Modal Ascent', numerals: ['im7', 'IIm7♭5', '♭VIImaj7', 'im7'], feel: 'Cinematic, floating, mysterious', styleTags: ['nu-jazz', 'advanced'], complexity: 3 },
    { id: 'dor-ghost', name: 'Ghost Groove', numerals: ['im9', 'IV9', 'im9', '♭IIImaj7'], feel: 'Deep groove, polyrhythmic', styleTags: ['jazz-funk', 'funk'], artistRef: 'Ghost Note', complexity: 2 },
  ],
  'mixolydian': [
    { id: 'mix-blues', name: 'Blues-Funk', numerals: ['I7', 'IV7', 'I7', 'V7'], feel: 'Raw, driving, funky', styleTags: ['funk', 'blues'], artistRef: 'James Brown, Tower of Power', complexity: 1 },
    { id: 'mix-soul', name: 'Soul Groove', numerals: ['I7', '♭VII', 'IV', 'I7'], feel: 'Driving, soulful, classic', styleTags: ['soul', 'funk'], artistRef: 'Jimi Hendrix, Lettuce', complexity: 1 },
    { id: 'mix-modern', name: 'Modern Funk', numerals: ['I7', '♭VI7', '♭VII7', 'I7'], feel: 'Dark funk, Meters-influenced', styleTags: ['funk', 'nu-jazz'], artistRef: 'Ghost Note, The Meters', complexity: 2 },
    { id: 'mix-lyddom', name: 'Lydian-Mixo Color', numerals: ['I7', '♯IV7', 'IV7', 'I7'], feel: 'Bright, sophisticated, jazz-funk', styleTags: ['jazz-funk', 'advanced'], artistRef: 'Snarky Puppy, Herbie Hancock', complexity: 3 },
    { id: 'mix-top', name: 'Tower Groove', numerals: ['I7', 'IIm7', 'IV7', 'I7'], feel: 'Horn-section funk, tight', styleTags: ['funk', 'soul'], artistRef: 'Tower of Power', complexity: 1 },
  ],
  'lydian': [
    { id: 'lyd-dream', name: 'Dream Float', numerals: ['Imaj7♯11', 'IImaj7', 'Imaj7♯11', 'VImaj7'], feel: 'Floating, dreamy, weightless', styleTags: ['advanced', 'nu-jazz'], artistRef: 'Joe Hisaishi, Jacob Collier', complexity: 2 },
    { id: 'lyd-collier', name: 'Non-Functional Bright', numerals: ['Imaj7♯11', 'IImaj7', '♭VIImaj7', 'Imaj7♯11'], feel: 'Colorful, non-functional, ethereal', styleTags: ['advanced'], artistRef: 'Jacob Collier', complexity: 3 },
    { id: 'lyd-soul', name: 'Lydian Soul', numerals: ['Imaj9♯11', 'II9', 'Imaj9♯11', 'VImaj7'], feel: 'Smooth, contemporary, optimistic', styleTags: ['nu-jazz', 'soul'], complexity: 2 },
  ],
  'phrygian': [
    { id: 'phr-flamenco', name: 'Flamenco Drama', numerals: ['i', '♭II', 'i', '♭VII', 'i'], feel: 'Intense, passionate, ancient', styleTags: ['world', 'art-rock'], artistRef: 'Flamenco tradition, Carlos Santana', complexity: 1 },
    { id: 'phr-radiohead', name: 'Radiohead Dark', numerals: ['i', '♭II', '♭VI', '♭VII'], feel: 'Dark, alien, art-rock', styleTags: ['art-rock', 'advanced'], artistRef: 'Radiohead', complexity: 2 },
    { id: 'phr-modern', name: 'Metal-Jazz Drift', numerals: ['im7', '♭IImaj7', '♭VIImaj7', 'im7'], feel: 'Dark, sophisticated, modern', styleTags: ['advanced', 'nu-jazz'], complexity: 3 },
  ],
  'aeolian': [
    { id: 'aeo-classic', name: 'Natural Minor Drive', numerals: ['im', '♭VII', '♭VI', '♭VII'], feel: 'Dark, melancholic, driving', styleTags: ['art-rock', 'soul'], complexity: 1 },
    { id: 'aeo-soul', name: 'Soul Darkness', numerals: ['im7', '♭VImaj7', '♭VII7', 'im7'], feel: 'Cinematic, soulful, floating', styleTags: ['soul', 'nu-jazz'], artistRef: 'D\'Angelo, Erykah Badu', complexity: 1 },
    { id: 'aeo-glasper', name: 'Hip-Hop Slow', numerals: ['im9', '♭VImaj9', '♭IIImaj7', '♭VII7'], feel: 'Smooth, hip-hop, laid-back', styleTags: ['nu-jazz', 'advanced'], artistRef: 'Robert Glasper', complexity: 2 },
    { id: 'aeo-snarky', name: 'Minor Interchange', numerals: ['im7', 'IV7', '♭VImaj7', '♭VII7'], feel: 'Modal, jazz-funk, color tones', styleTags: ['jazz-funk', 'nu-jazz'], artistRef: 'Snarky Puppy', complexity: 2 },
  ],
  'harmonic minor': [
    { id: 'harm-classical', name: 'Classical Resolution', numerals: ['im', 'ivm', 'V7', 'im'], feel: 'Dramatic, resolving, classical weight', styleTags: ['world', 'advanced'], complexity: 2 },
    { id: 'harm-fusion', name: 'Fusion Drama', numerals: ['im(maj7)', 'ivm7', 'V7alt', 'im(maj7)'], feel: 'Intense, jazz-classical fusion', styleTags: ['advanced', 'jazz-funk'], artistRef: 'Chick Corea, Al Di Meola', complexity: 3 },
    { id: 'harm-spanish', name: 'Spanish Fire', numerals: ['im', '♭II', 'V7', 'im'], feel: 'Passionate, flamenco-adjacent', styleTags: ['world', 'art-rock'], complexity: 2 },
  ],
  'lydian dominant': [
    { id: 'lyddom-groove', name: 'Lydian Dom Vamp', numerals: ['I7♯11', '♭VII7', 'I7♯11', '♭VII7'], feel: 'Sophisticated funk, dominant color', styleTags: ['jazz-funk', 'advanced'], artistRef: 'Herbie Hancock, Snarky Puppy', complexity: 3 },
    { id: 'lyddom-flow', name: 'Color Flow', numerals: ['I7♯11', 'IV7', '♭VII7', 'I7♯11'], feel: 'Jazz-funk, harmonic richness', styleTags: ['advanced', 'jazz-funk'], artistRef: 'Wayne Shorter', complexity: 3 },
  ],
};

// ── Helper Functions ──────────────────────────────────────────────────────────

function semitoneTranspose(notePC: string, semitones: number): string {
  if (semitones === 0) return notePC;
  const n = Note.get(notePC + '4');
  if (!n.midi) return notePC;
  const result = Note.fromMidi((n.midi + semitones + 1200) % 12 + 60);
  return Note.pitchClass(result);
}

function computeTargetRoot(homeRoot: string, homeMode: string, mv: Movement): string {
  if (mv.id === 'relative') {
    const isMinor = MINOR_MODES.has(homeMode);
    return semitoneTranspose(homeRoot, isMinor ? 3 : -3);
  }
  return semitoneTranspose(homeRoot, mv.semitones);
}

function computeTargetMode(homeMode: string, mv: Movement): string {
  if (mv.targetModeOverride) return mv.targetModeOverride;
  if (mv.id === 'relative') return MINOR_MODES.has(homeMode) ? 'major' : 'aeolian';
  return homeMode;
}

const ROMAN_TO_IDX: Record<string, number> = {
  'VII': 6, 'VI': 5, 'IV': 3, 'V': 4, 'III': 2, 'II': 1, 'I': 0,
  'vii': 6, 'vi': 5, 'iv': 3, 'v': 4, 'iii': 2, 'ii': 1, 'i': 0,
};

function numeralToChordName(numeral: string, scaleNotes: string[]): string {
  const m = numeral.match(/^([♭♯]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/);
  if (!m) return numeral;
  const [, acc, rom, quality] = m;
  const idx = ROMAN_TO_IDX[rom];
  if (idx === undefined) return numeral;
  let noteRoot = scaleNotes[idx] ?? scaleNotes[0];
  if (acc === '♭') noteRoot = semitoneTranspose(noteRoot, -1);
  else if (acc === '♯') noteRoot = semitoneTranspose(noteRoot, 1);
  return noteRoot + (quality ?? '');
}

function buildChordNames(root: string, mode: string, numerals: string[]): string[] {
  const scale = Scale.get(`${root} ${mode}`);
  if (scale.empty || scale.notes.length < 7) return numerals;
  return numerals.map(n => numeralToChordName(n, scale.notes));
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SongArchitectFeature() {
  const { globalKey } = useGlobalKey();
  const [homeKey, setHomeKey] = useState(globalKey);

  useEffect(() => { setHomeKey(globalKey); }, [globalKey]);
  const [homeMode, setHomeMode] = useState('dorian');
  const [activeStyles, setActiveStyles] = useState<StyleTag[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>('min3-up');

  const homeModeColor = HOME_MODES.find(m => m.name === homeMode)?.color ?? '#7c3aed';

  function toggleStyle(s: StyleTag) {
    setActiveStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  const filteredMovements = useMemo(() => {
    if (activeStyles.length === 0) return MOVEMENTS;
    return MOVEMENTS.filter(mv => mv.styleTags.some(t => activeStyles.includes(t)));
  }, [activeStyles]);

  const selected = MOVEMENTS.find(m => m.id === selectedId) ?? null;

  const targetRoot = useMemo(() =>
    selected ? computeTargetRoot(homeKey, homeMode, selected) : homeKey,
    [homeKey, homeMode, selected]
  );

  const targetMode = useMemo(() =>
    selected ? computeTargetMode(homeMode, selected) : homeMode,
    [homeMode, selected]
  );

  const targetModeColor = HOME_MODES.find(m => m.name === targetMode)?.color ?? '#06b6d4';
  const targetModeLabel = HOME_MODES.find(m => m.name === targetMode)?.label ?? targetMode;

  const progressions = useMemo(() => {
    const progs = PROG_LIBRARY[targetMode] ?? PROG_LIBRARY['major'] ?? [];
    if (activeStyles.length === 0) return progs;
    const filtered = progs.filter(p => p.styleTags.some(t => activeStyles.includes(t)));
    return filtered.length > 0 ? filtered : progs;
  }, [targetMode, activeStyles]);

  const homeChordNames = useMemo(() => {
    const scale = Scale.get(`${homeKey} ${homeMode}`);
    return scale.notes ?? [];
  }, [homeKey, homeMode]);

  const catGroups = useMemo(() => {
    const groups: Partial<Record<Category, Movement[]>> = {};
    for (const mv of filteredMovements) {
      if (!groups[mv.category]) groups[mv.category] = [];
      groups[mv.category]!.push(mv);
    }
    return groups;
  }, [filteredMovements]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>Song Architect</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          Define your A section, then explore harmonic strategies for your B and C. Techniques from jazz, funk, nu-jazz, soul and art-rock — Snarky Puppy to Radiohead.
        </p>
      </div>

      {/* A Section + Song Map */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* A Section Input */}
        <div style={{ flex: '1 1 340px', background: '#161b22', border: `1px solid ${homeModeColor}40`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: homeModeColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🏠 Section A — Home Key
          </div>

          {/* Key */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 6 }}>Root</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {KEYS.map(k => (
                <button key={k} onClick={() => setHomeKey(k)} style={{
                  padding: '5px 10px',
                  background: homeKey === k ? `${homeModeColor}20` : '#0d1117',
                  border: `1px solid ${homeKey === k ? homeModeColor : '#30363d'}`,
                  borderRadius: 6, color: homeKey === k ? homeModeColor : '#6b7280',
                  fontSize: 12, cursor: 'pointer', fontWeight: homeKey === k ? 700 : 400, fontFamily: 'monospace',
                }}>{k}</button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#8b949e', marginBottom: 6 }}>Mode / Tonality</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {HOME_MODES.map(m => (
                <button key={m.name} onClick={() => setHomeMode(m.name)} style={{
                  padding: '5px 10px',
                  background: homeMode === m.name ? `${m.color}20` : 'none',
                  border: `1px solid ${homeMode === m.name ? m.color : '#30363d'}`,
                  borderRadius: 6, color: homeMode === m.name ? m.color : '#6b7280',
                  fontSize: 12, cursor: 'pointer',
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          {/* Home scale notes */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid #21262d' }}>
            <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>Tones:</span>
            {homeChordNames.map((n, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: i === 0 ? homeModeColor : '#e6edf3', background: '#0d1117', border: '1px solid #30363d', borderRadius: 4, padding: '2px 7px' }}>{n}</span>
            ))}
          </div>
        </div>

        {/* Song Map (visual) */}
        {selected && (
          <div style={{ flex: '1 1 280px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 240 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Song Map</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* A box */}
              <div style={{ background: '#161b22', border: `2px solid ${homeModeColor}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 10, color: homeModeColor, fontWeight: 700, letterSpacing: '0.06em' }}>A SECTION</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#e6edf3', marginTop: 2 }}>{homeKey}</div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{HOME_MODES.find(m => m.name === homeMode)?.label ?? homeMode}</div>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                <div style={{ fontSize: 10, color: CAT_COLORS[selected.category], fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {CAT_LABELS[selected.category]}
                </div>
                <div style={{ width: '100%', height: 2, background: `linear-gradient(90deg, ${CAT_COLORS[selected.category]}80, ${CAT_COLORS[selected.category]})`, borderRadius: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', right: -4, top: -4, width: 10, height: 10, borderTop: `2px solid ${CAT_COLORS[selected.category]}`, borderRight: `2px solid ${CAT_COLORS[selected.category]}`, transform: 'rotate(45deg)' }} />
                </div>
                <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>{selected.label}</div>
              </div>

              {/* B box */}
              <div style={{ background: '#161b22', border: `2px solid ${targetModeColor}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 10, color: targetModeColor, fontWeight: 700, letterSpacing: '0.06em' }}>B SECTION</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#e6edf3', marginTop: 2 }}>{targetRoot}</div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{targetModeLabel}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Style filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#8b949e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Filter by style</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STYLE_LABELS.map(s => {
            const on = activeStyles.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggleStyle(s.id)} title={s.artists} style={{
                padding: '5px 12px',
                background: on ? '#7c3aed20' : 'none',
                border: `1px solid ${on ? '#7c3aed' : '#30363d'}`,
                borderRadius: 20, color: on ? '#c4b5fd' : '#6b7280',
                fontSize: 12, cursor: 'pointer', transition: 'none',
              }}>{s.label}</button>
            );
          })}
          {activeStyles.length > 0 && (
            <button onClick={() => setActiveStyles([])} style={{ padding: '5px 12px', background: 'none', border: '1px solid #30363d', borderRadius: 20, color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>Clear ✕</button>
          )}
        </div>
      </div>

      {/* Movement palette — grouped by category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {(Object.entries(catGroups) as [Category, Movement[]][]).map(([cat, mvs]) => (
          <div key={cat}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[cat], textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[cat], display: 'inline-block', marginRight: 7 }} />
              {CAT_LABELS[cat]}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {mvs.map(mv => {
                const isSelected = selectedId === mv.id;
                const tRoot = computeTargetRoot(homeKey, homeMode, mv);
                const tMode = computeTargetMode(homeMode, mv);
                const tColor = HOME_MODES.find(m => m.name === tMode)?.color ?? CAT_COLORS[cat];
                return (
                  <button key={mv.id} onClick={() => setSelectedId(prev => prev === mv.id ? null : mv.id)} style={{
                    padding: '12px 14px',
                    background: isSelected ? `${CAT_COLORS[cat]}15` : '#161b22',
                    border: `1px solid ${isSelected ? CAT_COLORS[cat] : '#30363d'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    boxShadow: isSelected ? `0 0 16px ${CAT_COLORS[cat]}25` : 'none',
                    minWidth: 140, maxWidth: 200, transition: 'none',
                  }}>
                    <div style={{ fontSize: 10, color: CAT_COLORS[cat], fontWeight: 600, marginBottom: 4 }}>{mv.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: tColor }}>{tRoot}</span>
                      <span style={{ fontSize: 10, color: '#6b7280' }}>{HOME_MODES.find(m => m.name === tMode)?.label ?? tMode}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>{mv.shortDesc}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {[1, 2, 3].map(d => (
                        <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d <= mv.complexity ? CAT_COLORS[cat] : '#30363d', display: 'inline-block' }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ background: '#161b22', border: `1px solid ${CAT_COLORS[selected.category]}40`, borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Detail header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: CAT_COLORS[selected.category], fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {CAT_LABELS[selected.category]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#e6edf3', fontFamily: "'Syne', sans-serif", marginBottom: 2 }}>
                {homeKey} {HOME_MODES.find(m => m.name === homeMode)?.label} → {targetRoot} {targetModeLabel}
              </div>
              <div style={{ fontSize: 13, color: '#8b949e' }}>{selected.emotionalEffect}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignSelf: 'center' }}>
              {selected.artistExamples.map(a => (
                <span key={a} style={{ fontSize: 11, padding: '3px 9px', background: `${CAT_COLORS[selected.category]}15`, border: `1px solid ${CAT_COLORS[selected.category]}40`, borderRadius: 20, color: CAT_COLORS[selected.category] }}>{a}</span>
              ))}
            </div>
          </div>

          {/* 2-col info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {/* Why it works */}
            <div style={{ background: '#0d1117', borderRadius: 8, padding: '14px 16px', border: '1px solid #21262d' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Why it works</div>
              <p style={{ margin: 0, fontSize: 13, color: '#c9d1d9', lineHeight: 1.65 }}>{selected.rationale}</p>
            </div>

            {/* How to transition */}
            <div style={{ background: '#0d1117', borderRadius: 8, padding: '14px 16px', border: '1px solid #21262d' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>How to transition</div>
              <p style={{ margin: 0, fontSize: 13, color: '#c9d1d9', lineHeight: 1.65 }}>{selected.transitionTip}</p>
              {selected.pivotHint && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: `${CAT_COLORS[selected.category]}10`, border: `1px solid ${CAT_COLORS[selected.category]}30`, borderRadius: 6, fontSize: 12, color: CAT_COLORS[selected.category], fontFamily: 'monospace' }}>
                  💡 {selected.pivotHint}
                </div>
              )}
            </div>
          </div>

          {/* Progressions for the new section */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: targetModeColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Progressions for {targetRoot} {targetModeLabel}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {progressions.map(prog => {
                const chords = buildChordNames(targetRoot, targetMode, prog.numerals);
                return (
                  <div key={prog.id} style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>{prog.name}</div>
                        {prog.artistRef && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 1 }}>{prog.artistRef}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: d <= prog.complexity ? targetModeColor : '#30363d', display: 'inline-block' }} />)}
                      </div>
                    </div>

                    {/* Chord chips */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {chords.map((chord, i) => (
                        <span key={i} style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: i === 0 ? targetModeColor : '#e6edf3', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: '4px 10px' }}>
                          {chord}
                        </span>
                      ))}
                    </div>

                    {/* Numeral row */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {prog.numerals.map((n, i) => (
                        <span key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: '#4b5563', background: '#161b22', borderRadius: 4, padding: '2px 6px' }}>{n}</span>
                      ))}
                    </div>

                    <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{prog.feel}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Style tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid #21262d' }}>
            <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>Works in:</span>
            {selected.styleTags.map(t => (
              <span key={t} style={{ fontSize: 11, padding: '2px 8px', background: '#21262d', border: '1px solid #30363d', borderRadius: 20, color: '#8b949e' }}>
                {STYLE_LABELS.find(s => s.id === t)?.label ?? t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick reference guide */}
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          📖 Harmonic Movement Quick Reference
        </summary>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {[
            { title: 'Minor 3rd movements', color: '#06b6d4', tip: 'Snarky Puppy signature. Same mode, 3 semitones up or down. Shares enough notes to feel connected yet fresh.' },
            { title: 'Major 3rd / Coltrane', color: '#06b6d4', tip: 'C→E→Ab→C cycle (Giant Steps). Each move is +4 semitones. Near-zero shared diatonic notes — pure harmonic surprise.' },
            { title: 'Perfect 4th up', color: '#7c3aed', tip: 'Gospel and soul staple. Home IV = new I. Maximum smoothness. Stevie Wonder, Tower of Power.' },
            { title: 'Modal shift (same root)', color: '#10b981', tip: 'Bass stays, harmony shifts mode. Dorian↔Major is the most common. IV7 announces Dorian; ♭VII announces Mixolydian.' },
            { title: 'Tritone axis', color: '#ef4444', tip: 'Home V7 shares its tritone (3rd↔7th) with the new ♭II7. The ear accepts the leap via this hidden thread.' },
            { title: 'Relative key', color: '#ec4899', tip: 'All 7 notes shared. Major→relative minor: vi becomes new im. Zero friction, full emotional reframe.' },
            { title: 'Neo-Riemannian (L/P/R)', color: '#f59e0b', tip: 'P: same root major↔minor. R: relative major↔minor. L: root moves semitone (C→Em). Smooth voice-leading.' },
            { title: 'Chromatic planing', color: '#f59e0b', tip: 'Radiohead technique: same chord shape moves chromatically. No functional logic — pure sonority. e.g., I→♭VII→♭VI.' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>{item.tip}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
