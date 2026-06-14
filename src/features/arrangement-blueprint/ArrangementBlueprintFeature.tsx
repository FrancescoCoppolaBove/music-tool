import { useState } from 'react';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InstrumentLayer {
  name: string;
  icon: string;
  role: string;
  styleGuide: string;
  doThis: string[];
  dontDoThis: string[];
  rangeHint?: string;
}

interface IntensityStage {
  name: string;
  bars: string;
  description: string;
  layersActive: string[];
  tip: string;
}

interface ArtistBlueprint {
  id: string;
  name: string;
  color: string;
  philosophy: string;
  coreRule: string;
  instruments: InstrumentLayer[];
  intensityArc: IntensityStage[];
  commonMistakes: string[];
  quickStart: string[];
}

// ─── Blueprint Data ─────────────────────────────────────────────────────────────

const BLUEPRINTS: ArtistBlueprint[] = [
  {
    id: 'snarky',
    name: 'Snarky Puppy',
    color: '#f59e0b',
    philosophy: 'Orchestral density through layering. Start with a unison figure between multiple instruments, then expand outward as intensity builds. Every instrument adds a specific color — nothing is decorative.',
    coreRule: 'The unison figure between bass + keyboard (+ sometimes sax) IS the composition hook. Everything else is texture around it.',
    instruments: [
      {
        name: 'Drums',
        icon: '🥁',
        role: 'Groove anchor + ensemble conductor',
        styleGuide: 'Larnell Lewis / Robert Sput Searight style: complex but LOCKED. Every fill is intentional, every accent supports the ensemble.',
        doThis: [
          'Euclidean kick patterns (E(7,16)) — mathematically distributed, not random',
          'Snare on 2 and 4 for the anchor, but ghost notes everywhere in between',
          'Accent the downbeats of the unison figure with a crash or accent hit',
          'Build density across sections: brushes → sticks → full kit + tambourine',
        ],
        dontDoThis: [
          'Fill every bar — leave space for the melodic content',
          'Swing the hi-hats unless going for a ballad section',
          'Overplay in the intro — save the energy for the climax',
        ],
        rangeHint: 'Intro: groove only. A section: full pattern. B section: +percussion layer. Climax: full density + fills.',
      },
      {
        name: 'Bass',
        icon: '🎸',
        role: 'Melodic foundation + unison doubling',
        styleGuide: 'Michael League style: bass plays the main composed line, often in unison with keyboard. Active, melodic, never just root notes.',
        doThis: [
          'Double the keyboard riff in the A section unison — bass IS the hook',
          'Lydian Dominant color: use the #11 (tritone above tonic) as approach tone',
          'Pedal tones under modal vamps — lock on root while harmony shifts above',
          'Walking bass lines for transitions between sections (avoid clichés)',
        ],
        dontDoThis: [
          'Play root on every beat in the groove section',
          'Add too many fills — the groove is the statement',
          'Go above the 12th fret in the main groove (keep it mid-range and powerful)',
        ],
        rangeHint: 'Unison figure: play it EXACTLY with keyboard. No variations until B section. Then improvise in C section.',
      },
      {
        name: 'Keyboard',
        icon: '🎹',
        role: 'Harmonic color + unison lead + texture',
        styleGuide: 'Bill Laurence style: comp sparsely, but the composed line is EXACT and locked. Upper structure triads for dominant chords.',
        doThis: [
          'A section: play the unison figure with bass, then comp around it',
          'Upper structure triads over dominant 7ths (bVI triad, II triad)',
          'Rhodes for warmth in grooves, synth pad for buildup sections',
          'Voicings: drop-2 or quartal — avoid thick block chords unless climax',
        ],
        dontDoThis: [
          'Comp on every beat during the unison hook section',
          'Play full 7-note chords — leave room for other instruments',
          'Change voicing style mid-section unless it\'s structural',
        ],
        rangeHint: 'Main groove: Wurlitzer or Rhodes stabs on beats 2 and 4. B section: pad opens up below the melody.',
      },
      {
        name: 'Horns / Sax',
        icon: '🎷',
        role: 'Color + countermelody + tutti climax',
        styleGuide: 'Bob Lanzetti / Marcus Lewis style: horns are texture in the A section and only become melodic in the B section.',
        doThis: [
          'A section: long tones or pads behind the rhythm section',
          'B section: countermelody above or below the main line',
          'Climax: tutti hit in unison with bass + keyboard for maximum punch',
          'Use the 9th and 13th of chords as sustained tones for color',
        ],
        dontDoThis: [
          'Play in the same register as the keyboard in the A section',
          'Add jazz licks in the main groove — save improvisation for the B section',
          'tutti too early — the impact comes from restraint before the hit',
        ],
        rangeHint: 'Intro + A: sustained pads (pp–mp). B section: lines (mf). Climax: full unison hit (ff).',
      },
    ],
    intensityArc: [
      { name: 'Intro', bars: '1–4', description: 'Drums alone or drums + bass groove only. Establish the feel.', layersActive: ['Drums', 'Bass'], tip: 'No harmony yet. Just groove. Make it feel inevitable.' },
      { name: 'A Section', bars: '5–16', description: 'Add keyboard unison figure with bass. This is the hook.', layersActive: ['Drums', 'Bass', 'Keyboard'], tip: 'The unison IS the song. Don\'t add anything else until it\'s landed.' },
      { name: 'Build', bars: '17–24', description: 'Horns enter with long tones. Keyboard adds upper structure triads.', layersActive: ['Drums', 'Bass', 'Keyboard', 'Horns / Sax'], tip: 'The energy increases through density, not volume. Stay controlled.' },
      { name: 'B Section', bars: '25–36', description: 'Harmonic movement. Countermelody from horns. Keyboard opens voicings.', layersActive: ['Drums', 'Bass', 'Keyboard', 'Horns / Sax'], tip: 'Explore the modal shift here. Let it breathe — don\'t overplay.' },
      { name: 'Climax', bars: '37–44', description: 'Full tutti unison hit. All instruments on the figure simultaneously.', layersActive: ['Drums', 'Bass', 'Keyboard', 'Horns / Sax'], tip: 'This is why you built restraint earlier. Hit it hard and together.' },
      { name: 'Outro', bars: '45–end', description: 'Peel layers back. Drums + bass groove only. Mirror the intro.', layersActive: ['Drums', 'Bass'], tip: 'End where you started. Circular structure is satisfying.' },
    ],
    commonMistakes: [
      'Adding too many layers in the A section — the hook gets buried',
      'Not playing the unison figure exactly in sync between bass and keyboard',
      'Horns comping in the main groove instead of holding long tones',
      'Climax arrives too early (before bar 36) — the impact needs the buildup',
    ],
    quickStart: [
      '1. Write a 4-bar unison figure (bass + keyboard) in Lydian Dominant',
      '2. Build a Euclidean groove under it (E(7,16) kick, snare on 2+4)',
      '3. Loop it for 8 bars before adding anything else',
      '4. Add horns with sustained pads on bars 9–16',
      '5. Shift harmony by a minor 3rd up for the B section (Snarky Puppy signature)',
    ],
  },
  {
    id: 'ghostnote',
    name: 'Ghost Note',
    color: '#a855f7',
    philosophy: 'The drum kit composes the structure. Every other instrument fills rhythmic spaces carved out by the drums. The meter is the melody.',
    coreRule: 'Choose the odd meter FIRST. Then write everything else to fit its rhythmic feel. The music is the groove — harmony is secondary.',
    instruments: [
      {
        name: 'Drums',
        icon: '🥁',
        role: 'Structural architect — the composition starts here',
        styleGuide: 'Sput Searight / Nate Werth style: the kit IS the composition. Two drummers is the Ghost Note sound, but one can do it with layering.',
        doThis: [
          'Choose an odd meter (5/4, 7/8, 7/4, 11/8) — this defines the piece',
          'Group the meter explicitly: 3+2+2 for 7/8, 3+2 or 2+3 for 5/4',
          'Polyrhythmic layering: one drum in triple, another in quadruple',
          'Long sections with minimal drum fills — the groove is the statement',
        ],
        dontDoThis: [
          'Play in 4/4 unless doing it for contrast against an odd-meter section',
          'Over-fill — Ghost Note\'s power comes from the groove, not the fills',
          'Stabilize the meter with a strong downbeat — let the lurch be the feel',
        ],
        rangeHint: 'The drum pattern IS the composition seed. Define it before touching any other instrument.',
      },
      {
        name: 'Bass',
        icon: '🎸',
        role: 'Rhythmic mirror + occasional harmonic foundation',
        styleGuide: 'The bass follows the drum accents, not the harmonic rhythm. Bass notes land where the kick lands, creating a percussive bass line.',
        doThis: [
          'Accent where the kick drum accents — bass and kick move together',
          'Pedal on root for long stretches — harmonic movement is rare and powerful',
          'Short, punchy notes that lock with the drum figure (not long sustained tones)',
          'Occasionally slide between pitches to add "dirt" in the groove',
        ],
        dontDoThis: [
          'Change notes every beat — this dilutes the rhythmic impact',
          'Walk the bass — too much harmonic information',
          'Play legato — staccato is the Ghost Note bass sound',
        ],
        rangeHint: 'Lock with kick: whatever the kick does rhythmically, the bass reinforces it on the root (or b5 for tension).',
      },
      {
        name: 'Keyboard / Synth',
        icon: '🎹',
        role: 'Harmonic texture + rhythmic punctuation',
        styleGuide: 'Stacked 4ths and 5ths create the ambiguous, open harmonic sound. Chords are rhythmic stabs that follow the drum accents, not harmonic progressions.',
        doThis: [
          'Quartal and quintal voicings (stacked 4ths) — major/minor quality is ambiguous',
          'Chord stabs on the drum accent points only — silence between them',
          'Short, percussive attacks (Wurlitzer, clav, or synth pluck)',
          'Modal vamps: stay on one "tonal area" for many bars, shift rarely',
        ],
        dontDoThis: [
          'Play chord progressions with regular harmonic rhythm',
          'Sustain chords between drum accents',
          'Use full 7th or 9th chord voicings that feel too "jazzy" and tonal',
        ],
        rangeHint: 'Rhythmic stabs on accent points of the drum pattern. Between accents: silence. Duration: very short.',
      },
    ],
    intensityArc: [
      { name: 'Groove Intro', bars: '1–8', description: 'Drums alone (or drums + bass). Establish the meter completely.', layersActive: ['Drums'], tip: 'Don\'t add anything until the meter is locked in the listener\'s body.' },
      { name: 'Bass Enters', bars: '9–16', description: 'Bass joins, locking with kick. Meter becomes undeniable.', layersActive: ['Drums', 'Bass'], tip: 'Bass doesn\'t harmonize yet — it amplifies the rhythm.' },
      { name: 'Keyboard Stabs', bars: '17–28', description: 'Quartal chord stabs on accent points. Minimal harmony.', layersActive: ['Drums', 'Bass', 'Keyboard / Synth'], tip: 'The chords are rhythmic events, not harmonic events. Treat them percussively.' },
      { name: 'Metric Shift', bars: '29–36', description: 'Insert a bar of different meter (4/4 inside 7/8 = 4+3 metric modulation)', layersActive: ['Drums', 'Bass', 'Keyboard / Synth'], tip: 'The shift should feel inevitable when it happens. Build toward it rhythmically.' },
      { name: 'Release', bars: '37–end', description: 'Return to original meter with added density. Then strip back.', layersActive: ['Drums', 'Bass', 'Keyboard / Synth'], tip: 'The contrast of return creates the satisfaction. Mirror the intro.' },
    ],
    commonMistakes: [
      'Writing the harmony before the rhythm — it should always be drums first',
      'Choosing 7/8 but not deciding on a grouping (3+2+2 vs. 2+2+3) — the grouping IS the feel',
      'Adding too many harmonic changes — Ghost Note grooves on 1–2 chords for very long stretches',
      'Keyboard playing on every beat instead of on accent points only',
    ],
    quickStart: [
      '1. Choose 7/8 in 3+2+2 grouping — program or play the drum pattern first',
      '2. Add bass on kick accents only: 3 notes per bar (beats 1, 4, 6)',
      '3. Add quartal chord stabs (stack 4ths from Phrygian root) on beats 1 and 4',
      '4. Loop for 16 bars before considering any change',
      '5. Then shift ONE element (bass note moves to b5) for 4 bars, return',
    ],
  },
  {
    id: 'vulfpeck',
    name: 'Vulfpeck',
    color: '#f97316',
    philosophy: 'Subtraction as composition. The power of Vulfpeck is not what they play — it\'s what they don\'t play. Every instrument has a specific, limited role. Nothing is decorative.',
    coreRule: 'Jack Stratton\'s law: "If you have 4 parts, try 3. If 3 sounds complete, you have room to remove one more." Remove until removing one more would make it worse.',
    instruments: [
      {
        name: 'Drums',
        icon: '🥁',
        role: 'Tight pocket machine — the smallest groove that works',
        styleGuide: 'Theo Katzman / Mark Lettieri style: simple, incredibly tight, no fills unless absolutely necessary. The pocket IS the performance.',
        doThis: [
          'Kick on beat 1 and 3, snare on 2 and 4 — start there, deviate very rarely',
          'Ghost notes on every 16th between main hits — they\'re the "bounce"',
          'Hi-hat on 8th notes, tight and consistent',
          'Fills: one note maximum, on the "e" of 4 going into bar 2',
        ],
        dontDoThis: [
          'Complex kick patterns — simplicity is the technique',
          'Fills in the groove section — fills pull attention from the bass',
          'Any cymbal work other than hi-hat in the main groove',
          'Swing the 16ths — straight feels more like Motown, which is the reference',
        ],
        rangeHint: 'The groove is the whole performance. Stay in it completely. All dynamics should serve the bass line.',
      },
      {
        name: 'Bass',
        icon: '🎸',
        role: 'THE melody — this is the composition',
        styleGuide: 'Joe Dart style: bass lines are composed melodies, not accompaniment. Every note is intentional. The bass IS the hook.',
        doThis: [
          'Write the bass first — it\'s the composition, not the rhythm section',
          'Melodic lines using mainly scale tones: root, 2nd, 3rd, 5th, 6th',
          '"Dean Town" descending lines: clear directional melodic movement',
          'One strong idea per 2 bars, then vary it slightly on bars 3–4',
          'Leave space after strong melodic notes — don\'t fill every 16th',
        ],
        dontDoThis: [
          'Root-note-only bass lines — the bass needs to be interesting',
          'Slapping unless the track is explicitly slap-funk',
          'Chromatic approach notes unless extremely intentional',
          'Go above the 12th fret in the main groove',
        ],
        rangeHint: 'The bass line is the composition. Write it first. Record it solo and see if it stands alone as a melody.',
      },
      {
        name: 'Keys',
        icon: '🎹',
        role: 'Harmonic support + rhythmic response to bass',
        styleGuide: 'Woody Goss style: keys RESPOND to the bass. When the bass rests, keys fill. When bass plays, keys comp sparsely.',
        doThis: [
          'Chord voicings: shell voicings (root + 3 + 7) or bare triads only',
          'Stab on beat 2 and beat 4 — the backbeat of the harmony',
          'Call and response with bass: bass rests → keys answer, bass plays → keys hold',
          'If the bass is melodic, keep keys very minimal (one chord per bar max)',
        ],
        dontDoThis: [
          'Full block chords on every beat',
          'Play in the same rhythmic space as the bass — they need different rhythmic roles',
          'Piano lines that compete with the bass melody',
          'Extensions (9, 11, 13) unless it\'s a quiet "jazz" section',
        ],
        rangeHint: 'Stabs on backbeats. When bass plays a phrase, keys hold a long chord. When bass rests, keys have a small fill.',
      },
      {
        name: 'Vocals / Melody',
        icon: '🎤',
        role: 'Simple melodic statement above the groove',
        styleGuide: 'Antwaun Stanley / Cody Fry style: the melody is simple, singable, and leaves space. Never competes with the bass.',
        doThis: [
          'Simple, singable phrases that a 10-year-old could hum',
          'Rest for at least as long as you sing — the rests are as important as the notes',
          'Counterpoint with bass: if bass goes up, melody can go down',
          'Limit melody to 3–4 notes maximum per phrase in the A section',
        ],
        dontDoThis: [
          'Elaborate melisma or runs — wrong register for Vulfpeck',
          'Fill every bar with melody',
          'Sing while the bass is doing something interesting — let the bass breathe',
          'Thick vocal harmonies in the main groove (save for a B section)',
        ],
        rangeHint: 'Melody and bass have different rhythmic positions. Map them so they breathe in opposite directions.',
      },
    ],
    intensityArc: [
      { name: 'Intro', bars: '1–4', description: 'Bass line alone, or bass + very sparse drums.', layersActive: ['Bass', 'Drums'], tip: 'The bass line should be interesting enough to stand completely alone.' },
      { name: 'Verse', bars: '5–12', description: 'Add drums fully. Keys stab on 2 and 4.', layersActive: ['Drums', 'Bass', 'Keys'], tip: 'At this point you have 3 parts. Ask: do you need anything else?' },
      { name: 'Chorus / Hook', bars: '13–20', description: 'Melody enters. Simple, 3–4 notes.', layersActive: ['Drums', 'Bass', 'Keys', 'Vocals / Melody'], tip: 'This is the maximum density of a Vulfpeck track. 4 parts. Nothing more.' },
      { name: 'Breakdown', bars: '21–24', description: 'Remove keys. Bass + drums + sparse melody.', layersActive: ['Drums', 'Bass', 'Vocals / Melody'], tip: 'The breakdown creates contrast through SUBTRACTION, not addition.' },
      { name: 'Return', bars: '25–end', description: 'Keys return. Everything locks in. End on the groove.', layersActive: ['Drums', 'Bass', 'Keys', 'Vocals / Melody'], tip: 'Mirror the start. End where you started.' },
    ],
    commonMistakes: [
      'Writing keys before the bass — the bass IS the composition, it always comes first',
      'Too many chords — Vulfpeck uses I and IV almost exclusively',
      'Overly complex drum fills — every fill steals attention from the bass line',
      'Melody in the same rhythmic space as the bass — they must breathe in different rhythms',
      'Not subtracting enough — when in doubt, take something out',
    ],
    quickStart: [
      '1. Write a 2-bar bass melody using only root, 2nd, 5th, 6th',
      '2. Record it solo. Does it stand alone as interesting? If no, rewrite it.',
      '3. Add kick on 1+3, snare on 2+4, hi-hat 8ths',
      '4. Add keys: stabs on beat 2 and beat 4 only',
      '5. Can you remove the keys and it still works? If yes, remove them.',
    ],
  },
  {
    id: 'yussef',
    name: 'Yussef Dayes',
    color: '#38bdf8',
    philosophy: 'The drum kit breathes, and everything breathes with it. The composition starts with the rhythm section (drums + bass), then harmony fills the spaces the rhythm leaves open.',
    coreRule: 'Record the drums first with a floating, slightly-behind-the-beat feel. Let the drums breathe before adding anything. Never rush to add harmony.',
    instruments: [
      {
        name: 'Drums',
        icon: '🥁',
        role: 'Compositional seed — everything else serves the drum feel',
        styleGuide: 'Yussef Dayes style: technically complex but spiritually loose. The groove breathes — it\'s slightly behind the beat in a way that feels human and expressive.',
        doThis: [
          'Play slightly BEHIND the beat — the "float" is the signature',
          'Triplet subdivisions inside a 4/4 framework for ambiguous meter feel',
          'Cross-rhythms between kick and hat (3:2 or 3:4) for polyrhythmic texture',
          'Long stretches of the same groove with micro-variations in dynamics',
        ],
        dontDoThis: [
          'Play exactly on the grid — the floating behind-the-beat feel is essential',
          'Heavy fills — Yussef\'s fills are subtle, tasteful, and rare',
          'Busy 16th-note patterns — the feel is spacious, not dense',
          'Make the groove too "locked in" — looseness IS the technique',
        ],
        rangeHint: 'Set a tempo. Record a 2–4 bar groove. Listen back. Does it float? Does it breathe? If it sounds like a drum machine, try again.',
      },
      {
        name: 'Bass',
        icon: '🎸',
        role: 'Pedal point foundation + occasional melodic movement',
        styleGuide: 'Bass pedals on root for very long stretches. Movement is rare and powerful. When the bass finally moves, it\'s an event.',
        doThis: [
          'Pedal on root for 8–16 bars before moving at all',
          'When you move: go to the 5th or ♭VII for maximum impact',
          'Quarter notes or half notes only — no 16th-note walking',
          'Very light touch — the bass supports, it doesn\'t lead',
        ],
        dontDoThis: [
          'Change bass notes every bar',
          'Walk the bass or add passing tones',
          'Play in the high register — stay in the low mid-range',
          'Compete with the drum feel — bass and drums are ONE unit',
        ],
        rangeHint: 'Think of bass + drums as one unit. The bass IS the bottom of the kit. Pedal, pedal, pedal — then move.',
      },
      {
        name: 'Rhodes / Piano',
        icon: '🎹',
        role: 'Harmonic atmosphere + sparse comping',
        styleGuide: 'Tom Misch / Yussef Dayes collaborations: Rhodes is texture, not chords. Very sparse voicings, lots of silence, vibrato for expressiveness.',
        doThis: [
          '2–3 note voicings maximum — no full chords',
          'Play on strong rhythmic hits only (beats 2 and 4, or on accents)',
          'Use Rhodes vibrato/tremolo for warmth and movement within held notes',
          'Stay in mid-range (around middle C to C an octave above)',
          'Leave 2–4 bars of pure drums + bass before comping again',
        ],
        dontDoThis: [
          'Fill every bar with comping',
          'Block chords or dense voicings',
          'Busy bebop comping rhythms — space is the language',
          'High-register twinkling — keep it warm and mid-range',
        ],
        rangeHint: 'Rule of thumb: if you\'re playing on more than 2 beats per bar on average, you\'re playing too much.',
      },
      {
        name: 'Lead / Melody',
        icon: '🎵',
        role: 'Simple, pentatonic theme that repeats with micro-variation',
        styleGuide: 'Tom Misch guitar style: a 4-note melodic cell that repeats many times. The repetition with subtle variation is the composition.',
        doThis: [
          'Write a 4-note cell using minor pentatonic — no more than 4 notes in the theme',
          'Repeat it 4+ times before varying it',
          'Vary only the TIMING of the notes, not the notes themselves (first variation)',
          'Then vary one note by a semitone (chromatic approach) for color',
          'Leave at least 2 bars of silence between melodic statements',
        ],
        dontDoThis: [
          'Complex bebop-influenced melodic lines',
          'Fast runs or scale passages',
          'Change the melodic material too often — repetition IS the composition',
          'Play over the Rhodes comping — one speaks at a time',
        ],
        rangeHint: 'The melody is a 4-note idea that breathes. More space = more power. "Tioga Pass" melody = 4 notes, played slowly, with space.',
      },
    ],
    intensityArc: [
      { name: 'Drum Intro', bars: '1–8', description: 'Drums alone. The floating feel must establish itself fully.', layersActive: ['Drums'], tip: '8 bars of drums before ANYTHING else. This is not optional.' },
      { name: 'Bass Pedal', bars: '9–24', description: 'Bass enters on root, pedaling. Don\'t move it yet.', layersActive: ['Drums', 'Bass'], tip: 'The bass pedal creates harmonic gravity. Everything that comes after is relative to this root.' },
      { name: 'Rhodes Enters', bars: '25–36', description: 'First chord voicing, very sparse. Maybe one chord every 2 bars.', layersActive: ['Drums', 'Bass', 'Rhodes / Piano'], tip: 'The first chord is a major event. Don\'t underestimate its impact after 24 bars of rhythm.' },
      { name: 'Melody Theme', bars: '37–52', description: '4-note melodic cell enters. Repeats with subtle variations.', layersActive: ['Drums', 'Bass', 'Rhodes / Piano', 'Lead / Melody'], tip: 'Repeat the theme 4 times before changing anything. Trust the repetition.' },
      { name: 'Space Section', bars: '53–60', description: 'Melody drops out. Just drums + bass again. Breathing space.', layersActive: ['Drums', 'Bass'], tip: 'The contrast of removing the melody makes its return more powerful.' },
      { name: 'Return', bars: '61–end', description: 'All elements return, with more energy. Gradual increase.', layersActive: ['Drums', 'Bass', 'Rhodes / Piano', 'Lead / Melody'], tip: 'The long journey makes the return deeply satisfying.' },
    ],
    commonMistakes: [
      'Adding Rhodes before the drums and bass have established the feel completely',
      'Playing too many notes on the Rhodes — silence is the technique',
      'Melody theme that\'s too long or too complex — 4 notes is enough',
      'Not letting the bass pedal for long enough — movement is most powerful after stillness',
      'Quantizing the drums too tightly — the loose, floating feel is lost on a grid',
    ],
    quickStart: [
      '1. Set a tempo (92–108 BPM). Record drums with a deliberately behind-the-beat feel.',
      '2. Add bass: pedal on D (or any root). Nothing else for 16 bars.',
      '3. Add a single Rhodes voicing (Dm7 no 3rd = D + A + C) on beat 2 of bar 17.',
      '4. Let it breathe. Another Rhodes stab 2 bars later.',
      '5. Now write your 4-note melodic cell. Play it slowly. Repeat it 8 times.',
    ],
  },
];

// ─── Components ────────────────────────────────────────────────────────────────

function InstrumentCard({ instrument, color }: { instrument: InstrumentLayer; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${open ? color + '44' : '#21262d'}`,
      borderLeft: `3px solid ${open ? color : '#30363d'}`,
      borderRadius: 10,
      background: '#161b22',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>{instrument.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
            color: open ? color : '#e6edf3',
          }}>
            {instrument.name}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
            {instrument.role}
          </div>
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 16,
          color: '#4b5563', transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
        }}>
          ∨
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #21262d' }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280',
            fontStyle: 'italic', padding: '12px 0 14px', lineHeight: 1.6,
          }}>
            {instrument.styleGuide}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#10b981', marginBottom: 8,
              }}>
                Do this
              </div>
              {instrument.doThis.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: '#10b98188', fontSize: 10, flexShrink: 0, marginTop: 3 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#ef4444', marginBottom: 8,
              }}>
                Don't do this
              </div>
              {instrument.dontDoThis.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: '#ef444488', fontSize: 10, flexShrink: 0, marginTop: 3 }}>✗</span>
                  <span style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          {instrument.rangeHint && (
            <div style={{
              marginTop: 10, padding: '8px 12px',
              background: '#0d1117', borderRadius: 6,
              fontSize: 12, color: '#6b7280', lineHeight: 1.5,
              borderLeft: `2px solid ${color}44`,
            }}>
              <strong style={{ color: '#8b949e' }}>Intensity guide:</strong> {instrument.rangeHint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IntensityArc({ stages, color }: { stages: IntensityStage[]; color: string }) {
  return (
    <div>
      {stages.map((stage, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '80px 1fr', gap: 0,
          marginBottom: 2,
        }}>
          <div style={{
            padding: '12px 12px 12px 0',
            borderRight: `2px solid ${i === stages.length - 1 ? 'transparent' : '#21262d'}`,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', right: -5, top: 16,
              width: 8, height: 8, borderRadius: '50%',
              background: color, border: '2px solid #0d1117',
            }} />
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: '#4b5563', letterSpacing: '0.06em',
            }}>
              {stage.bars}
            </div>
          </div>
          <div style={{ padding: '10px 0 10px 18px' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: 13, color: color, marginBottom: 3,
            }}>
              {stage.name}
            </div>
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 6, lineHeight: 1.5 }}>
              {stage.description}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {stage.layersActive.map(l => (
                <span key={l} style={{
                  padding: '1px 7px', borderRadius: 4,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  fontFamily: "'DM Mono', monospace", fontSize: 10, color: `${color}aa`,
                }}>
                  {l}
                </span>
              ))}
            </div>
            <div style={{
              fontSize: 11, color: '#4b5563', fontFamily: "'DM Mono', monospace",
              fontStyle: 'italic',
            }}>
              💡 {stage.tip}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ArrangementBlueprintFeature() {
  const [activeId, setActiveId] = useState('snarky');
  const [activeSection, setActiveSection] = useState<'instruments' | 'arc' | 'quickstart'>('instruments');

  const blueprint = BLUEPRINTS.find(b => b.id === activeId) ?? BLUEPRINTS[0];
  const color = blueprint.color;

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{ padding: '28px 0 20px', borderBottom: '1px solid #21262d', marginBottom: 28 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.12em', color: '#4b5563', textTransform: 'uppercase',
            }}>
              Composition · Arrangement
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26,
            letterSpacing: '-0.5px', color: '#e6edf3', margin: '0 0 6px',
          }}>
            Arrangement Blueprint
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            From musical idea to complete arrangement. What each instrument plays,
            when it enters, and how to build intensity — artist by artist.
          </p>

          {/* Artist tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
            {BLUEPRINTS.map(b => (
              <button
                key={b.id}
                onClick={() => setActiveId(b.id)}
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  border: `1px solid ${activeId === b.id ? b.color : '#30363d'}`,
                  background: activeId === b.id ? `${b.color}18` : 'transparent',
                  color: activeId === b.id ? b.color : '#6b7280',
                  fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* Philosophy card */}
        <div style={{
          border: `1px solid ${color}33`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 10, background: '#161b22',
          padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19,
            color, marginBottom: 8,
          }}>
            {blueprint.name}
          </div>
          <div style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.7, marginBottom: 14 }}>
            {blueprint.philosophy}
          </div>
          <div style={{
            padding: '10px 14px', background: '#0d1117', borderRadius: 8,
            borderLeft: `2px solid ${color}66`,
            fontFamily: "'DM Mono', monospace", fontSize: 12, color: color,
            lineHeight: 1.6,
          }}>
            <strong>Core Rule:</strong> {blueprint.coreRule}
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {([
            { id: 'instruments', label: 'By Instrument' },
            { id: 'arc', label: 'Intensity Arc' },
            { id: 'quickstart', label: 'Quick Start' },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: '6px 16px', borderRadius: 6,
                border: `1px solid ${activeSection === s.id ? color : '#30363d'}`,
                background: activeSection === s.id ? `${color}18` : 'transparent',
                color: activeSection === s.id ? color : '#6b7280',
                fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Instruments section */}
        {activeSection === 'instruments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blueprint.instruments.map(inst => (
              <InstrumentCard key={inst.name} instrument={inst} color={color} />
            ))}

            {/* Common mistakes */}
            <div style={{
              border: '1px solid #30363d', borderLeft: '3px solid #ef4444',
              borderRadius: 10, background: '#161b22', padding: '18px 22px', marginTop: 8,
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#ef4444', marginBottom: 12,
              }}>
                Common Mistakes
              </div>
              {blueprint.commonMistakes.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#ef444466', fontSize: 10, flexShrink: 0, marginTop: 3 }}>✗</span>
                  <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.5 }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intensity Arc section */}
        {activeSection === 'arc' && (
          <div style={{
            background: '#161b22', border: '1px solid #21262d',
            borderRadius: 10, padding: '20px 24px',
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#4b5563', marginBottom: 18,
            }}>
              Section-by-Section Intensity Arc
            </div>
            <IntensityArc stages={blueprint.intensityArc} color={color} />
          </div>
        )}

        {/* Quick Start section */}
        {activeSection === 'quickstart' && (
          <div style={{
            background: '#161b22', border: '1px solid #21262d',
            borderRadius: 10, padding: '20px 24px',
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#4b5563', marginBottom: 16,
            }}>
              Quick Start — Start Composing Now
            </div>
            {blueprint.quickStart.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, marginBottom: 14,
                padding: '12px 16px', background: '#0d1117',
                borderRadius: 8, border: `1px solid ${color}22`,
              }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700,
                  color: `${color}66`, flexShrink: 0, lineHeight: 1.2,
                  minWidth: 28,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, color: '#e6edf3', lineHeight: 1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
