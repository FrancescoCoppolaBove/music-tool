import { NoteName } from '@shared/types/music.types';
import { buildChordFromIntervals, transposeNote, noteToMidi } from '@shared/utils/musicTheory';
import { ParsedChord, NoteWithOctave } from '../types/chord.types';
import type { ChordVoicing, VoicingHand, VoicingGeneratorOptions, VoicingStyle } from '../types/chord.types';

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
      voicings.push(...generateBasicVoicings(parsedChord, chordTones, opts));
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
      voicings.push(...generateBasicVoicings(parsedChord, chordTones, opts));
  }

  return voicings;
}

/**
 * Determina le note (pitch classes) dell'accordo - FIXED VERSION
 */
function getChordTones(chord: ParsedChord): NoteName[] {
  const { root, quality, hasSeventh, hasNinth, extensions, alterations, addedTones } = chord;

  const intervals: number[] = [0]; // root sempre presente

  // --- QUALITY BASE (3rd e 5th) ---
  switch (quality) {
    case 'major':
      intervals.push(4, 7); // M3, P5
      break;
    case 'minor':
      intervals.push(3, 7); // m3, P5
      break;
    case 'dominant':
      intervals.push(4, 7); // M3, P5
      break;
    case 'diminished':
      intervals.push(3, 6); // m3, d5
      break;
    case 'half-diminished':
      intervals.push(3, 6); // m3, d5
      break;
    case 'augmented':
      intervals.push(4, 8); // M3, A5
      break;
    case 'sus2':
      intervals.push(2, 7); // M2, P5 (no 3rd)
      break;
    case 'sus4':
      intervals.push(5, 7); // P4, P5 (no 3rd)
      break;
    case 'power':
      intervals.push(7); // P5 only
      break;
  }

  // --- SEVENTH ---
  if (hasSeventh) {
    if (quality === 'major') {
      intervals.push(11); // M7
    } else if (quality === 'diminished') {
      intervals.push(9); // dim7 (bb7, enharmonic A6)
    } else if (quality === 'half-diminished') {
      intervals.push(10); // m7
    } else if (quality === 'dominant' || quality === 'minor') {
      intervals.push(10); // m7
    }
  }

  // --- SIXTH ---
  if (extensions.includes('6')) {
    intervals.push(9); // M6
    // Rimuovi 7th se presente (6 e 7 non coesistono)
    const index7 = intervals.indexOf(10);
    if (index7 !== -1) intervals.splice(index7, 1);
    const indexM7 = intervals.indexOf(11);
    if (indexM7 !== -1) intervals.splice(indexM7, 1);
  }

  // --- EXTENSIONS (9, 11, 13) ---
  // IMPORTANTE: Queste sono extensions oltre l'ottava, ma qui teniamo solo pitch classes
  if (extensions.includes('9') || hasNinth) {
    // 9 = 2 + octave, quindi pitch class = 2
    intervals.push(2); // M2 (stessa pitch class della 9)
  }

  if (extensions.includes('11')) {
    // 11 = 4 + octave, quindi pitch class = 5
    intervals.push(5); // P4 (stessa pitch class dell'11)
  }

  if (extensions.includes('13')) {
    // 13 = 6 + octave, quindi pitch class = 9
    intervals.push(9); // M6 (stessa pitch class della 13)
  }

  // --- ALTERATIONS ---
  alterations.forEach((alt) => {
    const match = alt.match(/([#b])(\d+)/);
    if (!match) return;

    const [, accidental, degreeStr] = match;
    const degree = parseInt(degreeStr);

    let interval = 0;
    let replaceInterval: number | null = null;

    switch (degree) {
      case 5:
        if (accidental === '#') {
          interval = 8; // #5 (augmented 5th)
          replaceInterval = 7; // sostituisce P5
        } else {
          interval = 6; // b5 (diminished 5th)
          replaceInterval = 7;
        }
        break;
      case 9:
        if (accidental === '#') {
          interval = 3; // #9 (pitch class = 3)
          replaceInterval = 2; // sostituisce M9 (pitch class 2)
        } else {
          interval = 1; // b9 (pitch class = 1)
          replaceInterval = 2;
        }
        break;
      case 11:
        if (accidental === '#') {
          interval = 6; // #11 (pitch class = 6)
          replaceInterval = 5; // sostituisce P11 (pitch class 5)
        }
        break;
      case 13:
        if (accidental === 'b') {
          interval = 8; // b13 (pitch class = 8)
          replaceInterval = 9; // sostituisce M13 (pitch class 9)
        }
        break;
    }

    if (interval > 0) {
      // Rimuovi l'intervallo naturale se presente
      if (replaceInterval !== null) {
        const idx = intervals.indexOf(replaceInterval);
        if (idx !== -1) intervals.splice(idx, 1);
      }
      intervals.push(interval);
    }
  });

  // --- ADDED TONES ---
  addedTones.forEach((add) => {
    const match = add.match(/add(\d+)/);
    if (!match) return;

    const degree = parseInt(match[1]);
    switch (degree) {
      case 2:
        if (!intervals.includes(2)) {
          intervals.push(2); // M2
        }
        break;
      case 9:
        if (!intervals.includes(2)) {
          intervals.push(2); // M9 (pitch class = M2)
        }
        break;
      case 11:
        if (!intervals.includes(5)) {
          intervals.push(5); // P11 (pitch class = P4)
        }
        break;
    }
  });

  // Rimuovi duplicati e ordina
  const uniqueIntervals = [...new Set(intervals)].sort((a, b) => a - b);

  // Converti in note
  return buildChordFromIntervals(root, uniqueIntervals);
}

/**
 * BASIC VOICINGS - Triadi e accordi semplici
 */
function generateBasicVoicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { root, bass } = chord;
  const { leftHandOctave, rightHandOctave } = opts;

  // Root position close
  if (tones.length >= 3) {
    const lh: NoteName[] = [bass || root];
    const rh: NoteName[] = tones.slice(0, 4); // max 4 note mano dx

    voicings.push(
      createVoicing(
        'basic-root-close',
        'Root Position (Close)',
        'Standard close voicing with root in bass',
        lh,
        rh,
        leftHandOctave,
        rightHandOctave,
        'easy',
        'basic'
      )
    );
  }

  // First inversion
  if (tones.length >= 3) {
    const third = tones[1];
    const lh: NoteName[] = [bass || third];
    const rh: NoteName[] = [tones[2], tones[0], ...tones.slice(1)].slice(0, 4);

    voicings.push(
      createVoicing('basic-first-inv', 'First Inversion', 'Third in bass', lh, rh, leftHandOctave, rightHandOctave, 'easy', 'basic')
    );
  }

  // Second inversion
  if (tones.length >= 3) {
    const fifth = tones[2];
    const lh: NoteName[] = [bass || fifth];
    const rh: NoteName[] = [tones[0], tones[1], ...tones.slice(3)].slice(0, 4);

    voicings.push(
      createVoicing('basic-second-inv', 'Second Inversion', 'Fifth in bass', lh, rh, leftHandOctave, rightHandOctave, 'medium', 'basic')
    );
  }

  // Spread voicing
  if (tones.length >= 4) {
    const lh: NoteName[] = [bass || root, tones[2]]; // root + 5th
    const rh: NoteName[] = [tones[1], tones[3]]; // 3rd + 7th

    voicings.push(
      createVoicing(
        'basic-spread',
        'Spread Voicing',
        'Wide interval distribution',
        lh,
        rh,
        leftHandOctave,
        rightHandOctave + 1,
        'medium',
        'spread'
      )
    );
  }

  return voicings;
}

/**
 * JAZZ ROOTLESS VOICINGS
 */
function generateJazzRootlessVoicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { root } = chord;
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length < 4) {
    return generateBasicVoicings(chord, tones, opts);
  }

  // Shell voicing (LH: 3rd + 7th, RH: extensions)
  const third = tones[1];
  const seventh = tones[3] || tones[2];
  const lh: NoteName[] = [third, seventh];
  const rh: NoteName[] = tones.slice(4).length > 0 ? [tones[0], ...tones.slice(4, 7)] : [tones[0], tones[2]];

  voicings.push(
    createVoicing(
      'jazz-shell-3-7',
      'Jazz Shell (3-7)',
      'Rootless voicing: 3rd & 7th in LH, extensions in RH',
      lh,
      rh,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'jazz-rootless'
    )
  );

  // Shell voicing (LH: 7th + 3rd)
  const lh2: NoteName[] = [seventh, third];
  const rh2: NoteName[] = tones.slice(4).length > 0 ? [tones[2], ...tones.slice(4, 7)] : [tones[2], tones[0]];

  voicings.push(
    createVoicing(
      'jazz-shell-7-3',
      'Jazz Shell (7-3)',
      'Rootless voicing: 7th & 3rd in LH, extensions in RH',
      lh2,
      rh2,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'jazz-rootless'
    )
  );

  // A voicing (guide tones in LH)
  if (tones.length >= 5) {
    const lh3: NoteName[] = [tones[1], tones[3]]; // 3, 7
    const rh3: NoteName[] = [tones[4], tones[2], tones[5] || tones[0]]; // 9, 5, (13 or root)

    voicings.push(
      createVoicing(
        'jazz-a-voicing',
        'Jazz A Voicing',
        'Guide tones (3-7) with color tones above',
        lh3,
        rh3,
        leftHandOctave,
        rightHandOctave + 1,
        'hard',
        'jazz-rootless'
      )
    );
  }

  return voicings;
}

/**
 * DROP-2 VOICINGS
 */
function generateDrop2Voicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length < 4) {
    return generateBasicVoicings(chord, tones, opts);
  }

  const topFour = tones.slice(0, 4);
  const dropped = topFour[1];

  const lh: NoteName[] = [dropped];
  const rh: NoteName[] = [topFour[0], topFour[2], topFour[3]];

  voicings.push(
    createVoicing(
      'drop2-root',
      'Drop-2 (Root Position)',
      'Second voice dropped an octave',
      lh,
      rh,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'drop-2'
    )
  );

  const inv1 = [topFour[1], topFour[2], topFour[3], topFour[0]];
  const dropped1 = inv1[1];
  const lh1: NoteName[] = [dropped1];
  const rh1: NoteName[] = [inv1[0], inv1[2], inv1[3]];

  voicings.push(
    createVoicing(
      'drop2-inv1',
      'Drop-2 (1st Inversion)',
      'Drop-2 with third in bass',
      lh1,
      rh1,
      leftHandOctave,
      rightHandOctave,
      'medium',
      'drop-2'
    )
  );

  return voicings;
}

/**
 * DROP-3 VOICINGS
 */
function generateDrop3Voicings(chord: ParsedChord, tones: NoteName[], opts: VoicingGeneratorOptions): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const { leftHandOctave, rightHandOctave } = opts;

  if (tones.length < 4) {
    return generateBasicVoicings(chord, tones, opts);
  }

  const topFour = tones.slice(0, 4);
  const dropped = topFour[2];

  const lh: NoteName[] = [dropped];
  const rh: NoteName[] = [topFour[0], topFour[1], topFour[3]];

  voicings.push(
    createVoicing(
      'drop3-root',
      'Drop-3 (Root Position)',
      'Third voice dropped an octave',
      lh,
      rh,
      leftHandOctave,
      rightHandOctave,
      'hard',
      'drop-3'
    )
  );

  return voicings;
}

/**
 * SHELL VOICINGS - Essenziali (root, 3rd, 7th)
 */
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
      createVoicing(
        'shell-basic',
        'Shell Voicing',
        'Essential tones: root, 3rd, 7th',
        lh,
        rh,
        leftHandOctave,
        rightHandOctave,
        'easy',
        'shell'
      )
    );
  }

  if (tones.length >= 3) {
    const lh: NoteName[] = [bass || root, tones[2]]; // root + 5th
    const rh: NoteName[] = tones.length >= 4 ? [tones[1], tones[3]] : [tones[1]];

    voicings.push(
      createVoicing('shell-with-5th', 'Shell + Fifth', 'Root, 3rd, 5th, 7th', lh, rh, leftHandOctave, rightHandOctave, 'easy', 'shell')
    );
  }

  return voicings;
}

/**
 * Helper per creare un ChordVoicing object - UPDATED CON specificNotes
 */
function createVoicing(
  id: string,
  label: string,
  description: string,
  leftHandNotes: NoteName[],
  rightHandNotes: NoteName[],
  lhOctave: number,
  rhOctave: number,
  difficulty: 'easy' | 'medium' | 'hard',
  style: VoicingStyle
): ChordVoicing {
  const lhMidi = leftHandNotes.map((note, i) => noteToMidi(note, lhOctave + Math.floor(i / 3)));
  const rhMidi = rightHandNotes.map((note, i) => noteToMidi(note, rhOctave + Math.floor(i / 4)));

  const lhOctaves = lhMidi.map((midi) => Math.floor(midi / 12) - 1);
  const rhOctaves = rhMidi.map((midi) => Math.floor(midi / 12) - 1);

  // NUOVO: crea array di note specifiche con ottave
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
    fullChord: [...leftHandNotes, ...rightHandNotes],
    specificNotes, // NUOVO
    difficulty,
    style,
  };
}

/**
 * Get all available voicing styles
 */
export function getAvailableStyles(): { value: VoicingStyle; label: string; description: string }[] {
  return [
    {
      value: 'basic',
      label: 'Basic',
      description: 'Simple triads and seventh chords',
    },
    {
      value: 'jazz-rootless',
      label: 'Jazz / Rootless',
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
      description: 'Essential tones only (root, 3rd, 7th)',
    },
  ];
}
