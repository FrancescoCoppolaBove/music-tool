import { NoteName } from '@shared/types/music.types';
import { buildChordFromIntervals, noteToMidi } from '@shared/utils/musicTheory';
import { ParsedChord, NoteWithOctave } from '../types/chord.types';
import type { ChordVoicing, VoicingGeneratorOptions, VoicingStyle } from '../types/chord.types';

/**
 * Genera voicings per un accordo parsato
 */
export function generateVoicings(parsedChord: ParsedChord, options: Partial<VoicingGeneratorOptions> = {}): ChordVoicing[] {
  const opts: VoicingGeneratorOptions = {
    style: options.style || 'basic',
    includeRoot: options.includeRoot !== undefined ? options.includeRoot : true,
    leftHandOctave: options.leftHandOctave || 3,
    rightHandOctave: options.rightHandOctave || 4,
    maxStretch: options.maxStretch || 12,
  };

  const voicings: ChordVoicing[] = [];

  // Determina le note dell'accordo
  const chordTones = getChordTones(parsedChord);

  switch (opts.style) {
    case 'basic':
      voicings.push(...generateBasicTriads(parsedChord, chordTones, opts));
      break;
    case 'quadriads':
      voicings.push(...generateQuadriads(parsedChord, chordTones, opts));
      break;
    case 'extensions':
      voicings.push(...generateExtensions(parsedChord, chordTones, opts));
      break;
    case 'jazz-rootless':
      voicings.push(...generateJazzRootlessVoicings(parsedChord, chordTones, opts));
      break;
    case 'drop-2':
      voicings.push(...generateDrop2Voicings(parsedChord, chordTones, opts));
      break;
    case 'drop-3':
      voicings.push(...generateDrop3Voicings(parsedChord, chordTones, opts));
      break;
    case 'shell':
      voicings.push(...generateShellVoicings(parsedChord, chordTones, opts));
      break;
    default:
      voicings.push(...generateBasicTriads(parsedChord, chordTones, opts));
  }

  return voicings;
}

/**
 * Determina le note dell'accordo seguendo la teoria musicale completa
 */
function getChordTones(chord: ParsedChord): NoteName[] {
  const { root, quality, hasSeventh, hasNinth, extensions, alterations, addedTones } = chord;

  const intervals: number[] = [0]; // root (1)

  // ============================================================
  // STEP 1: TRIADE BASE (1-3-5)
  // ============================================================

  if (quality === 'sus2') {
    intervals.push(2, 7); // 1 - 2 - 5
  } else if (quality === 'sus4') {
    intervals.push(5, 7); // 1 - 4 - 5
  } else if (quality === 'power') {
    intervals.push(7); // 1 - 5
  } else {
    // Terza
    if (quality === 'minor' || quality === 'diminished' || quality === 'half-diminished') {
      intervals.push(3); // ♭3
    } else {
      intervals.push(4); // 3
    }

    // Quinta
    if (quality === 'diminished' || quality === 'half-diminished') {
      intervals.push(6); // ♭5
    } else if (quality === 'augmented') {
      intervals.push(8); // ♯5
    } else {
      intervals.push(7); // 5
    }
  }

  // ============================================================
  // STEP 2: SETTIMA (♭7 o 7)
  // ============================================================

  if (hasSeventh) {
    if (quality === 'minor' && extensions.includes('M7')) {
      intervals.push(11); // M7 su accordo minore
      const idxM7 = extensions.indexOf('M7');
      if (idxM7 !== -1) extensions.splice(idxM7, 1);
    } else if (quality === 'major') {
      intervals.push(11); // M7
    } else if (quality === 'diminished') {
      intervals.push(9); // ♭♭7 (dim7)
    } else {
      intervals.push(10); // ♭7
    }
  }

  // ============================================================
  // STEP 3: SESTA (6) - Esclusiva con settima
  // ============================================================

  if (extensions.includes('6')) {
    intervals.push(9); // M6

    if ((extensions.includes('9') || hasNinth) && !intervals.includes(2)) {
      intervals.push(2); // M9
    }

    const idx7 = intervals.indexOf(10);
    const idxM7 = intervals.indexOf(11);
    if (idx7 !== -1) intervals.splice(idx7, 1);
    if (idxM7 !== -1) intervals.splice(idxM7, 1);
  }

  // ============================================================
  // STEP 4: ESTENSIONI (9, 11, 13)
  // ============================================================

  const hasExtension9 = extensions.includes('9') || hasNinth;
  const hasExtension11 = extensions.includes('11');
  const hasExtension13 = extensions.includes('13');

  if ((hasExtension9 || hasExtension11 || hasExtension13) && !hasSeventh && !extensions.includes('6')) {
    if (quality === 'major') {
      intervals.push(11); // M7
    } else {
      intervals.push(10); // m7
    }
  }

  if (hasExtension13) {
    if (!intervals.includes(2)) intervals.push(2); // 9
    if (!intervals.includes(5)) intervals.push(5); // 11
    if (!intervals.includes(9)) intervals.push(9); // 13
  } else if (hasExtension11) {
    if (!intervals.includes(2)) intervals.push(2); // 9
    if (!intervals.includes(5)) intervals.push(5); // 11
  } else if (hasExtension9) {
    if (!intervals.includes(2)) intervals.push(2); // 9
  }

  // ============================================================
  // STEP 5: ALTERAZIONI
  // ============================================================

  alterations.forEach((alt) => {
    const match = alt.match(/([#b])(\d+)/);
    if (!match) return;

    const [, accidental, degreeStr] = match;
    const degree = parseInt(degreeStr);

    switch (degree) {
      case 5:
        const idx5 = intervals.indexOf(7);
        if (idx5 !== -1) intervals.splice(idx5, 1);
        if (accidental === '#') {
          intervals.push(8);
        } else {
          intervals.push(6);
        }
        break;

      case 9:
        const idx9 = intervals.indexOf(2);
        if (idx9 !== -1) intervals.splice(idx9, 1);
        if (accidental === '#') {
          intervals.push(3);
        } else {
          intervals.push(1);
        }
        break;

      case 11:
        const idx11 = intervals.indexOf(5);
        if (idx11 !== -1) intervals.splice(idx11, 1);
        if (accidental === '#') {
          intervals.push(6);
        }
        break;

      case 13:
        const idx13Natural = intervals.indexOf(9);
        if (idx13Natural !== -1) intervals.splice(idx13Natural, 1);
        if (accidental === 'b') {
          intervals.push(8);
          if (!intervals.includes(2)) intervals.push(2);
          if (!intervals.includes(5)) intervals.push(5);
        }
        break;
    }
  });

  // ============================================================
  // STEP 6: ADDED TONES
  // ============================================================

  addedTones.forEach((add) => {
    const match = add.match(/add(\d+)/);
    if (!match) return;

    const degree = parseInt(match[1]);

    switch (degree) {
      case 2:
      case 9:
        if (!intervals.includes(2)) {
          intervals.push(2);
        }
        break;
      case 4:
      case 11:
        if (!intervals.includes(5)) {
          intervals.push(5);
        }
        break;
    }
  });

  // ============================================================
  // STEP 7: FINALIZZAZIONE
  // ============================================================

  const uniqueIntervals = [...new Set(intervals)].sort((a, b) => a - b);
  return buildChordFromIntervals(root, uniqueIntervals);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Determina la categoria dell'accordo
 */
function getChordCategory(tones: NoteName[], chord: ParsedChord): 'triad' | 'quadriad' | 'extension' {
  const hasExt = chord.extensions.some((ext) => ['9', '11', '13'].includes(ext));

  if (tones.length === 3) return 'triad';
  if (tones.length === 4 && !hasExt) return 'quadriad';
  return 'extension';
}

// ============================================================
// GENERATORS - BASIC TRIADS (Solo 3 note)
// ============================================================

function generateBasicTriads(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { root, bass } = chord;
  const { leftHandOctave, rightHandOctave } = opts;

  // Se l'accordo ha più di 3 note, suggerisci di usare 'quadriads' o 'extensions'
  if (tones.length > 3) {
    console.warn(`Chord has ${tones.length} notes. Consider using 'quadriads' or 'extensions' style.`);
    // Limitiamo comunque a 3 note per il basic
    tones = tones.slice(0, 3);
  }

  if (tones.length < 3) {
    return voicings;
  }

  // ROOT POSITION (Posizione fondamentale)
  const lh1: NoteName[] = [bass || root];
  const rh1: NoteName[] = tones.slice(0, 3);

  voicings.push(
    createVoicing(
      'triad-root',
      'Root Position',
      'Fundamental position: 1-3-5',
      lh1,
      rh1,
      leftHandOctave,
      rightHandOctave,
      'easy',
      'basic',
      tones
    )
  );

  // FIRST INVERSION (Primo rivolto - terza al basso)
  const lh2: NoteName[] = [bass || tones[1]];
  const rh2: NoteName[] = [tones[2], tones[0], tones[1]];

  voicings.push(
    createVoicing(
      'triad-first-inv',
      '1st Inversion',
      'Third in bass: 3-5-1',
      lh2,
      rh2,
      leftHandOctave,
      rightHandOctave,
      'easy',
      'basic',
      tones
    )
  );

  // SECOND INVERSION (Secondo rivolto - quinta al basso)
  const lh3: NoteName[] = [bass || tones[2]];
  const rh3: NoteName[] = [tones[0], tones[1], tones[2]];

  voicings.push(
    createVoicing(
      'triad-second-inv',
      '2nd Inversion',
      'Fifth in bass: 5-1-3',
      lh3,
      rh3,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'basic',
      tones
    )
  );

  return voicings;
}

// ============================================================
// GENERATORS - QUADRIADS (4 note: 7ths, 6ths)
// ============================================================

function generateQuadriads(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { root, bass } = chord;
  const { leftHandOctave, rightHandOctave } = opts;

  // Verifica che sia effettivamente una quadriade
  if (tones.length < 4) {
    console.warn('Chord has less than 4 notes. Use "basic" style for triads.');
    return generateBasicTriads(chord, tones, opts);
  }

  if (tones.length > 4) {
    console.warn(`Chord has ${tones.length} notes. Consider using 'extensions' style.`);
    // Limitiamo a 4 note per le quadriadi
    tones = tones.slice(0, 4);
  }

  // ROOT POSITION - Close voicing
  const lh1: NoteName[] = [bass || root];
  const rh1: NoteName[] = tones.slice(0, 4);

  voicings.push(
    createVoicing(
      'quad-root-close',
      'Root Position (Close)',
      'Close voicing: 1-3-5-7',
      lh1,
      rh1,
      leftHandOctave,
      rightHandOctave,
      'easy',
      'quadriads',
      tones
    )
  );

  // ROOT POSITION - Open voicing (Drop-2 style)
  const lh2: NoteName[] = [bass || root, tones[1]];
  const rh2: NoteName[] = [tones[2], tones[3]];

  voicings.push(
    createVoicing(
      'quad-root-open',
      'Root Position (Open)',
      'Open voicing with spread',
      lh2,
      rh2,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'quadriads',
      tones
    )
  );

  // FIRST INVERSION (Terza al basso)
  const lh3: NoteName[] = [bass || tones[1]];
  const rh3: NoteName[] = [tones[2], tones[3], tones[0]];

  voicings.push(
    createVoicing(
      'quad-first-inv',
      '1st Inversion',
      'Third in bass: 3-5-7-1',
      lh3,
      rh3,
      leftHandOctave,
      rightHandOctave,
      'easy',
      'quadriads',
      tones
    )
  );

  // SECOND INVERSION (Quinta al basso)
  const lh4: NoteName[] = [bass || tones[2]];
  const rh4: NoteName[] = [tones[3], tones[0], tones[1]];

  voicings.push(
    createVoicing(
      'quad-second-inv',
      '2nd Inversion',
      'Fifth in bass: 5-7-1-3',
      lh4,
      rh4,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'quadriads',
      tones
    )
  );

  // THIRD INVERSION (Settima al basso)
  const lh5: NoteName[] = [bass || tones[3]];
  const rh5: NoteName[] = [tones[0], tones[1], tones[2]];

  voicings.push(
    createVoicing(
      'quad-third-inv',
      '3rd Inversion',
      'Seventh in bass: 7-1-3-5',
      lh5,
      rh5,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'quadriads',
      tones
    )
  );

  return voicings;
}

// ============================================================
// GENERATORS - EXTENSIONS (5+ note: 9ths, 11ths, 13ths)
// ============================================================

function generateExtensions(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { root, bass } = chord;
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length < 5) {
    console.warn('Chord has less than 5 notes. Use "quadriads" for 7th chords.');
    return generateQuadriads(chord, tones, opts);
  }

  // VOICING 1: Root in bass, omit 5th
  // LH: Root | RH: 3rd, 7th, 9th, (11th/13th)
  const lh1: NoteName[] = [bass || root];
  const rh1: NoteName[] = tones.filter((_, idx) => idx !== 0 && idx !== 2).slice(0, 4);

  voicings.push(
    createVoicing(
      'ext-root-no5',
      'Root Position (no 5th)',
      'Essential tones: 1, 3, 7, 9+',
      lh1,
      rh1,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'extensions',
      tones
    )
  );

  // VOICING 2: Root + 5th in bass, extensions in RH
  // LH: Root, 5th | RH: 3rd, 7th, 9th, (11th/13th)
  const lh2: NoteName[] = [bass || root, tones[2]];
  const rh2: NoteName[] = [tones[1], tones[3], ...tones.slice(4, 6)].filter(Boolean);

  voicings.push(
    createVoicing(
      'ext-root-with5',
      'Root + 5th in Bass',
      'Full harmony with extensions',
      lh2,
      rh2,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'extensions',
      tones
    )
  );

  // VOICING 3: So What voicing (quartal harmony)
  // LH: Root | RH: Stacked fourths
  if (tones.length >= 5) {
    const lh3: NoteName[] = [bass || root];
    const rh3: NoteName[] = [tones[4], tones[1], tones[3]]; // 9, 3, 7

    voicings.push(
      createVoicing(
        'ext-so-what',
        'So What Voicing',
        'Modern quartal voicing',
        lh3,
        rh3,
        leftHandOctave,
        rightHandOctave + 1,
        'hard',
        'extensions',
        tones
      )
    );
  }

  // VOICING 4: Upper structure
  // LH: Root, 3rd | RH: 7th, 9th, 11th/13th
  const lh4: NoteName[] = [bass || root, tones[1]];
  const rh4: NoteName[] = [tones[3], ...tones.slice(4, 7)].filter(Boolean);

  voicings.push(
    createVoicing(
      'ext-upper-structure',
      'Upper Structure',
      'Guide tones in bass, colors above',
      lh4,
      rh4,
      leftHandOctave,
      rightHandOctave,
      'hard',
      'extensions',
      tones
    )
  );

  return voicings;
}

// ============================================================
// ALTRI GENERATORS (Jazz, Drop, Shell)
// ============================================================

function generateJazzRootlessVoicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length < 4) {
    return generateBasicTriads(chord, tones, opts);
  }

  const third = tones[1];
  const seventh = tones[3] || tones[2];
  const lh: NoteName[] = [third, seventh];

  let rh: NoteName[];
  if (tones.length >= 5) {
    rh = [tones[2], tones[4], ...(tones.length > 5 ? [tones[5]] : [])].slice(0, 3);
  } else {
    rh = [tones[0], tones[2]];
  }

  voicings.push(
    createVoicing(
      'jazz-shell-3-7',
      'Jazz Shell (3-7)',
      'Rootless: 3rd & 7th in LH',
      lh,
      rh,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'jazz-rootless',
      tones
    )
  );

  const lh2: NoteName[] = [seventh, third];
  let rh2: NoteName[];
  if (tones.length >= 5) {
    rh2 = [tones[0], tones[4], ...(tones.length > 5 ? [tones[5]] : [])].slice(0, 3);
  } else {
    rh2 = [tones[2], tones[0]];
  }

  voicings.push(
    createVoicing(
      'jazz-shell-7-3',
      'Jazz Shell (7-3)',
      'Rootless: 7th & 3rd in LH',
      lh2,
      rh2,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'jazz-rootless',
      tones
    )
  );

  if (tones.length >= 5) {
    const lh3: NoteName[] = [tones[1], tones[3]];
    const rh3: NoteName[] = [tones[4], tones[2], ...(tones.length > 5 ? [tones[5]] : [tones[0]])].slice(0, 3);

    voicings.push(
      createVoicing(
        'jazz-a-voicing',
        'Jazz A Voicing',
        'Guide tones with colors',
        lh3,
        rh3,
        leftHandOctave,
        rightHandOctave + 1,
        'hard',
        'jazz-rootless',
        tones
      )
    );
  }

  return voicings;
}

function generateDrop2Voicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length < 4) {
    return generateBasicTriads(chord, tones, opts);
  }

  const topFour = tones.slice(0, 4);
  const dropped = topFour[1];
  const lh: NoteName[] = [dropped];
  const rh: NoteName[] = [topFour[0], topFour[2], topFour[3]];

  voicings.push(
    createVoicing('drop2-root', 'Drop-2 (Root)', 'Second voice dropped', lh, rh, leftHandOctave, rightHandOctave, 'medium', 'drop-2', tones)
  );

  const inv1 = [topFour[1], topFour[2], topFour[3], topFour[0]];
  const dropped1 = inv1[1];
  const lh1: NoteName[] = [dropped1];
  const rh1: NoteName[] = [inv1[0], inv1[2], inv1[3]];

  voicings.push(
    createVoicing('drop2-inv1', 'Drop-2 (1st Inv)', 'Third in bass', lh1, rh1, leftHandOctave, rightHandOctave, 'medium', 'drop-2', tones)
  );

  return voicings;
}

function generateDrop3Voicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length < 4) {
    return generateBasicTriads(chord, tones, opts);
  }

  const topFour = tones.slice(0, 4);
  const dropped = topFour[2];
  const lh: NoteName[] = [dropped];
  const rh: NoteName[] = [topFour[0], topFour[1], topFour[3]];

  voicings.push(
    createVoicing('drop3-root', 'Drop-3', 'Third voice dropped', lh, rh, leftHandOctave, rightHandOctave, 'hard', 'drop-3', tones)
  );

  return voicings;
}

function generateShellVoicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { root, bass } = chord;
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length >= 3) {
    const third = tones[1];
    const seventh = tones.length >= 4 ? tones[3] : tones[2];

    const lh: NoteName[] = [bass || root];
    const rh: NoteName[] = [third, seventh];

    voicings.push(
      createVoicing('shell-basic', 'Shell Voicing', 'Root, 3rd, 7th', lh, rh, leftHandOctave, rightHandOctave, 'easy', 'shell', tones)
    );
  }

  if (tones.length >= 3) {
    const lh: NoteName[] = [bass || root, tones[2]];

    let rh: NoteName[];
    if (tones.length >= 5) {
      rh = [tones[1], tones[3], tones[4]].filter(Boolean);
    } else if (tones.length >= 4) {
      rh = [tones[1], tones[3]];
    } else {
      rh = [tones[1]];
    }

    voicings.push(
      createVoicing('shell-with-5th', 'Shell + 5th', 'With extensions', lh, rh, leftHandOctave, rightHandOctave, 'easy', 'shell', tones)
    );
  }

  return voicings;
}

// ============================================================
// HELPER: Create Voicing
// ============================================================

function createVoicing(
  id: string,
  label: string,
  description: string,
  leftHandNotes: NoteName[],
  rightHandNotes: NoteName[],
  lhOctave: number,
  rhOctave: number,
  difficulty: 'easy' | 'medium' | 'hard',
  style: VoicingStyle,
  chordTones: NoteName[]
): ChordVoicing {
  const lhMidi = leftHandNotes.map((note, i) => noteToMidi(note, lhOctave + Math.floor(i / 3)));
  const rhMidi = rightHandNotes.map((note, i) => noteToMidi(note, rhOctave + Math.floor(i / 4)));

  const lhOctaves = lhMidi.map((midi) => Math.floor(midi / 12) - 1);
  const rhOctaves = rhMidi.map((midi) => Math.floor(midi / 12) - 1);

  const specificNotes: NoteWithOctave[] = [
    ...leftHandNotes.map((note, i) => ({
      note,
      octave: lhOctaves[i],
      midiNumber: lhMidi[i],
    })),
    ...rightHandNotes.map((note, i) => ({
      note,
      octave: rhOctaves[i],
      midiNumber: rhMidi[i],
    })),
  ];

  return {
    id,
    label,
    description,
    leftHand: {
      notes: leftHandNotes,
      midiNumbers: lhMidi,
      octaves: lhOctaves,
    },
    rightHand: {
      notes: rightHandNotes,
      midiNumbers: rhMidi,
      octaves: rhOctaves,
    },
    fullChord: chordTones,
    specificNotes,
    difficulty,
    style,
  };
}

export function getAvailableStyles(): { value: VoicingStyle; label: string; description: string }[] {
  return [
    {
      value: 'basic',
      label: 'Triads',
      description: 'Basic 3-note triads and inversions',
    },
    {
      value: 'quadriads',
      label: 'Seventh Chords',
      description: '4-note chords (7ths, 6ths) with inversions',
    },
    {
      value: 'extensions',
      label: 'Extensions',
      description: 'Extended chords (9ths, 11ths, 13ths)',
    },
    {
      value: 'jazz-rootless',
      label: 'Jazz Rootless',
      description: 'Modern jazz voicings without root',
    },
    {
      value: 'drop-2',
      label: 'Drop-2',
      description: 'Second voice dropped an octave',
    },
    {
      value: 'drop-3',
      label: 'Drop-3',
      description: 'Third voice dropped an octave',
    },
    {
      value: 'shell',
      label: 'Shell',
      description: 'Essential tones only',
    },
  ];
}
