export interface EuclidPreset {
  n: number;
  k: number;
  label: string;
  name: string;
  description: string;
}

export interface Polyrhythm {
  against: number;
  over: number;
  label: string;
  description: string;
}

export interface TimeSignatureDef {
  label: string;
  numerator: number;
  denominator: number;
  groupings: number[][];
  defaultGrouping: number;
  feel: string;
  category: 'simple' | 'compound' | 'odd' | 'large';
  artists: string[];
  tip: string;
  euclideanIdeas: string[];
}

export const CHROMATIC_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export function euclidean(beats: number, slots: number): number[] {
  if (beats >= slots) return Array(slots).fill(1);
  if (beats <= 0)    return Array(slots).fill(0);
  let pattern: number[][] = [
    ...Array(beats).fill(null).map(() => [1]),
    ...Array(slots - beats).fill(null).map(() => [0]),
  ];
  let b = beats;
  let remainder = slots - beats;
  while (remainder > 1) {
    const iterations = Math.min(b, remainder);
    const newPattern: number[][] = [];
    for (let i = 0; i < iterations; i++) {
      newPattern.push([...pattern[i], ...pattern[pattern.length - 1 - i]]);
    }
    if (b > remainder) {
      for (let i = iterations; i < b; i++) newPattern.push(pattern[i]);
      b = b - remainder;
    } else {
      for (let i = iterations; i < remainder; i++) newPattern.push(pattern[b + i]);
      remainder = remainder - b;
      b = iterations;
    }
    pattern = newPattern;
  }
  return pattern.flat();
}

export function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
export function lcm(a: number, b: number): number { return (a * b) / gcd(a, b); }

export const EUCLIDEAN_PRESETS: EuclidPreset[] = [
  { n: 3, k: 8,  label: 'E(3,8)',  name: 'Tresillo',        description: '3 hits in 8 — the foundational Afro-Cuban tresillo. Underlies bossa nova, salsa, and reggaeton.' },
  { n: 5, k: 8,  label: 'E(5,8)',  name: 'Cinquillo',       description: '5 in 8 — the dense cinquillo. Five evenly-distributed accents across 8 eighth-note slots.' },
  { n: 5, k: 16, label: 'E(5,16)', name: 'Sparse Funk',     description: '5 in 16 — open pockets between each hit. Lettuce territory: maximum air, maximum groove.' },
  { n: 7, k: 16, label: 'E(7,16)', name: 'Snarky Pocket',   description: '7 in 16 — the Snarky Puppy groove engine. Syncopated but mathematically inevitable.' },
  { n: 9, k: 16, label: 'E(9,16)', name: 'Dense Fusion',    description: '9 in 16 — complex, interlocking. Used in prog and fusion for maximum rhythmic saturation.' },
  { n: 5, k: 12, label: 'E(5,12)', name: '12/8 Overlay',    description: '5 in 12 — bossa pattern inside compound meter. Creates a floating 5 against the 4-beat 12/8 pulse.' },
  { n: 2, k: 5,  label: 'E(2,5)',  name: '5/8 Skeletal',    description: '2 hits in 5 slots — the bare bones of 5/8. Marks beat 1 and the midpoint, leaving maximum space.' },
  { n: 3, k: 5,  label: 'E(3,5)',  name: '5/8 Natural',     description: '3 hits in 5 — the natural accent pattern for 5/8. Evenly-spaced across all 5 positions.' },
  { n: 3, k: 7,  label: 'E(3,7)',  name: '7/8 Sparse',      description: '3 hits in 7 — widely-spaced hits inside 7/8. Creates a lot of air and rhythmic ambiguity.' },
  { n: 4, k: 7,  label: 'E(4,7)',  name: '7/8 Medium',      description: '4 hits in 7 — balanced density. Works well as a melodic rhythm in 7/8 contexts.' },
  { n: 5, k: 7,  label: 'E(5,7)',  name: '7/8 Dense',       description: '5 hits in 7 — very active. Each gap is surrounded by multiple hits; creates urgency.' },
  { n: 5, k: 9,  label: 'E(5,9)',  name: '9/8 Fill',        description: '5 hits in 9 — evenly-distributed accents in a 9/8 compound frame. Rare and disorienting.' },
];

export const POLYRHYTHMS: Polyrhythm[] = [
  { against: 3, over: 4, label: '3 against 4', description: 'Play 3 evenly-spaced notes in the space of 4 beats. Each note = 1⅓ beats apart. The classic African/Cuban tension.' },
  { against: 4, over: 3, label: '4 against 3', description: 'Play 4 notes in the space of 3 beats. Common in 6/8 hemiola. The "duple against triple" foundation.' },
  { against: 5, over: 4, label: '5 against 4', description: 'Play 5 evenly-spaced notes in 4 beats. Each note = 4/5 of a beat. Disorienting and very modern.' },
  { against: 3, over: 2, label: '3 against 2', description: 'The most fundamental polyrhythm. Play triplets against duplets. The base of all African and Cuban feel.' },
  { against: 7, over: 4, label: '7 against 4', description: 'Play 7 notes in 4 beats. Advanced — used by Jacob Collier and fusion drummers for metric superimposition.' },
  { against: 5, over: 3, label: '5 against 3', description: 'Play 5 equally-spaced notes in the space of 3 beats. Very disorienting. Used in Collier\'s metric modulations.' },
  { against: 4, over: 7, label: '4 against 7', description: 'Play 4 notes in the space of 7. Creates a wide rhythmic superimposition ideal over odd-meter grooves.' },
  { against: 7, over: 8, label: '7 against 8', description: 'Play 7 notes in 8 slots. Extremely subtle feel — almost triplet-like but metrically distinct. Ghost Note / advanced fusion.' },
];

export const TIME_SIGNATURES: TimeSignatureDef[] = [
  {
    label: '3/4', numerator: 3, denominator: 4,
    groupings: [[3], [1, 2], [2, 1]], defaultGrouping: 0,
    feel: 'Waltz / Lilt', category: 'simple',
    artists: ['Jacob Collier', 'Snarky Puppy'],
    tip: 'Think of each bar as one large breath. Beat 1 is the "fall," beat 2 is the "lift," beat 3 is the "release." In jazz contexts, beats 2 and 3 form a pickup into the next "1." Never think of 3/4 as "weak–weak" — it has its own gravity distinct from 4/4.',
    euclideanIdeas: ['E(2,3) — alternating accents, avoids the downbeat', 'E(1,3) — single pulse marker, maximum space'],
  },
  {
    label: '5/4', numerator: 5, denominator: 4,
    groupings: [[3, 2], [2, 3], [2, 2, 1]], defaultGrouping: 0,
    feel: 'Limping groove / Forward lurch', category: 'odd',
    artists: ['Ghost Note', 'Snarky Puppy'],
    tip: 'Decide your sub-grouping first: 3+2 or 2+3. The grouping determines where the "extra" beat sits. 3+2 = the longer group comes first, creating urgency. 2+3 = the longer group resolves last, feeling more settled. Dave Brubeck\'s "Take Five" uses 3+2. Ghost Note favors 2+3 for the lurch effect.',
    euclideanIdeas: ['E(3,5) — natural even spread across 5 beats', 'E(2,5) — skeletal, marks only beat 1 and midpoint', 'E(4,5) — very dense, one rest per bar'],
  },
  {
    label: '6/4', numerator: 6, denominator: 4,
    groupings: [[3, 3], [2, 2, 2], [4, 2]], defaultGrouping: 0,
    feel: 'Compound duple / Hemiola', category: 'odd',
    artists: ['Jacob Collier', 'Snarky Puppy'],
    tip: '6/4 is the hemiola time signature: it simultaneously implies two feels. As 3+3, it\'s a slow waltz double. As 2+2+2, it\'s three big beats — more like a march. The tension between these two interpretations IS the interest. Switch groupings mid-phrase for an instant metric modulation feel.',
    euclideanIdeas: ['E(4,6) — four hits in six, non-square', 'E(2,6) = E(1,3) — two hit markers across six beats', 'E(5,6) — very dense, creates anticipation before the rest'],
  },
  {
    label: '7/4', numerator: 7, denominator: 4,
    groupings: [[4, 3], [3, 4], [3, 2, 2], [2, 3, 2]], defaultGrouping: 0,
    feel: 'Uneven double / Dave Brubeck territory', category: 'odd',
    artists: ['Ghost Note', 'Snarky Puppy'],
    tip: '4+3 is the most common grouping: the longer group feels like "home," the shorter group lurches forward. 3+4 reverses this — the lurch arrives early, the resolution is long. Radiohead\'s "All I Need" uses 4+3. Try keeping a 4/4 hi-hat pattern under a 7/4 melodic riff — the collision is the texture.',
    euclideanIdeas: ['E(4,7) — balanced medium density', 'E(5,7) — dense, very active feel', 'E(3,7) — sparse, Balkan folk feel'],
  },
  {
    label: '11/4', numerator: 11, denominator: 4,
    groupings: [[4, 3, 4], [3, 4, 4], [3, 3, 3, 2], [5, 3, 3]], defaultGrouping: 0,
    feel: 'Asymmetric compound / Progessive', category: 'large',
    artists: ['Ghost Note'],
    tip: 'At this length, sub-grouping is not optional — it\'s survival. Choose your grouping (4+3+4 is symmetric and easier to navigate), then internalize each group as its own mini-bar. Tigran Hamasyan builds entire compositions in 11. Think of it as a bar of 4 + a bar of 3 + a bar of 4, played without stopping.',
    euclideanIdeas: ['E(5,11) — near-uniform spread, very even', 'E(7,11) — dense, only 4 rests in 11 positions', 'E(4,11) — sparse, creates a floating metric ambiguity'],
  },
  {
    label: '13/4', numerator: 13, denominator: 4,
    groupings: [[4, 4, 5], [4, 5, 4], [3, 4, 3, 3], [5, 4, 4]], defaultGrouping: 0,
    feel: 'Ultra-complex / Extreme asymmetry', category: 'large',
    artists: ['Ghost Note'],
    tip: 'Extremely rare in practice. The most practical approach is to treat it as a bar of 4/4 followed by a bar of 9/8 (at double tempo). Alternatively, use the 4+4+5 grouping and think of the "5" as a bar of 5/4. Never try to count all 13 beats in real-time — sub-group, feel the groups, and trust muscle memory.',
    euclideanIdeas: ['E(7,13) — near-prime distribution, very even', 'E(5,13) — medium density, mathematical elegance', 'E(4,13) — sparse, minimal accent structure'],
  },
  {
    label: '5/8', numerator: 5, denominator: 8,
    groupings: [[3, 2], [2, 3]], defaultGrouping: 0,
    feel: 'Hyper-compressed 5/4 / Balkan folk', category: 'odd',
    artists: ['Ghost Note', 'Snarky Puppy'],
    tip: 'All the mathematics of 5/4, at double the energy. Because the subdivisions are eighth-notes, the riff must be shorter and punchier — no time for long melodic lines. Balkan folk music lives here: fast, asymmetric, joyful. When a riff feels "too slow" in 5/4, try 5/8 at the same tempo. The energy changes completely.',
    euclideanIdeas: ['E(3,5) — the natural accent structure for 5/8', 'E(2,5) — very sparse, minimal skeleton'],
  },
  {
    label: '6/8', numerator: 6, denominator: 8,
    groupings: [[3, 3], [2, 2, 2]], defaultGrouping: 0,
    feel: 'Compound duple / Shuffle groove', category: 'compound',
    artists: ['Lettuce', 'Snarky Puppy', 'Jacob Collier'],
    tip: '6/8 is the shuffle feel foundation: two big beats, each subdivided into a triplet of eighth-notes. The "1–2–3 / 4–5–6" feel is compound duple. When Lettuce plays a slow blues, 6/8 is the subdivision under 4/4 — think of it as the triplet feel of swung 8th-notes written out. Jacob Collier often implies 6/8 inside a 4/4 context.',
    euclideanIdeas: ['E(2,6) — marks only the two main beats', 'E(4,6) — dense, hits within each group', 'E(5,6) — near-full density, one rest'],
  },
  {
    label: '7/8', numerator: 7, denominator: 8,
    groupings: [[3, 2, 2], [2, 3, 2], [2, 2, 3]], defaultGrouping: 0,
    feel: 'The lurch / Balkan groove', category: 'odd',
    artists: ['Ghost Note', 'Snarky Puppy'],
    tip: '7/8 always feels like it\'s "one step short" — there\'s a perpetual forward lean. The sub-grouping (3+2+2, 2+3+2, 2+2+3) determines where the lurch is located. 3+2+2 front-loads the long group for immediate pull. 2+2+3 is the "slow release" version where the tension arrives last. The 2+3+2 grouping is the rarest and most disorienting — the long group is buried in the middle.',
    euclideanIdeas: ['E(4,7) — balanced medium density inside 7/8', 'E(3,7) — sparse Balkan pattern', 'E(5,7) — very active, only two rests'],
  },
  {
    label: '12/8', numerator: 12, denominator: 8,
    groupings: [[3, 3, 3, 3], [4, 4, 4]], defaultGrouping: 0,
    feel: 'Compound quadruple / Blues / Gospel', category: 'compound',
    artists: ['Lettuce', 'Jacob Collier', 'Snarky Puppy'],
    tip: '12/8 is compound quadruple: four big beats, each divided into three eighth-notes. This is the blues and gospel subdivision — the triplet feel is structural, not swung. When Jacob Collier plays a "12/8 feel inside 4/4," he\'s subdividing each quarter-note into three eighth-notes mentally. Lettuce uses true 12/8 for slow, heavy funk ballads.',
    euclideanIdeas: ['E(5,12) — bossa pattern across 12 slots', 'E(7,12) — dense swing subdivision', 'E(3,12) = E(1,4) — marks the four main beats only'],
  },
  {
    label: '11/8', numerator: 11, denominator: 8,
    groupings: [[3, 3, 3, 2], [3, 4, 4], [4, 3, 4]], defaultGrouping: 0,
    feel: 'Mystic compound / Tigran territory', category: 'large',
    artists: ['Ghost Note'],
    tip: 'The "3+3+3+2" grouping is the most common: three equal groups of three followed by a short group of two. The final "2" feels unresolved — like there\'s one eighth-note missing. This creates the perpetual forward motion that Tigran Hamasyan and Ghost Note exploit. Think of it as "almost 12/8 but with one eighth-note removed from the last beat."',
    euclideanIdeas: ['E(5,11) — evenly-distributed accents across 11', 'E(7,11) — dense, only 4 rests', 'E(4,11) — sparse, creates open texture'],
  },
  {
    label: '13/8', numerator: 13, denominator: 8,
    groupings: [[3, 3, 3, 4], [4, 4, 5], [3, 4, 3, 3]], defaultGrouping: 0,
    feel: 'Extreme compound / Rare and powerful', category: 'large',
    artists: ['Ghost Note'],
    tip: 'The rarest of the requested meters. 3+3+3+4 is the most navigable: three equal triplet groups followed by a long "4" that provides a moment of relative stability. Think of it as "11/8 plus one extra beat at the end." The 4+4+5 grouping is more like 13/8 as a macro-bar: a bar of 4/4 followed by an accented 5/8 section. Either way, internalize the long group as "the goal" of each bar.',
    euclideanIdeas: ['E(5,13) — medium density, mathematical elegance', 'E(7,13) — near-prime distribution', 'E(8,13) — very dense, only 5 rests across 13 positions'],
  },
];
