import type { Subsection } from './types';

// Original explanations and exercises; references are for further reading.
export const diminishedLessons: Subsection[] = [
  {
    id: '7.diminished-families',
    title: 'Diminished and Half-Diminished: Different Jobs',
    topics: ['dim triad', 'dim7', 'm7b5', 'Minor ii-V-i'],
    teoria: `A diminished triad is 1-b3-b5. Adding b7 produces a half-diminished seventh (m7b5); adding bb7 produces a fully diminished seventh (dim7). These are not interchangeable spellings.

Cdim = C-Eb-Gb; Cm7b5 = C-Eb-Gb-Bb; Cdim7 = C-Eb-Gb-Bbb. Bbb sounds like A in equal temperament but names the diminished seventh correctly.

In a minor cadence, ii m7b5 usually prepares V7: Dm7b5-G7b9-Cm6. Its C moves to B on G7; Ab can then resolve to G on Cm. The chord's function depends on its destination: the same pitch collection can play a different role elsewhere.

For m7b5, compare Locrian (b9), Locrian natural 2 (9), and harmonic-minor mode 2, Locrian natural 6. Select the colour against the melody rather than treating one scale as compulsory.`,
    esempi: 'Dm7b5-G7b9-Cm6; Bm7b5-E7alt-Am6. Over Dm7b5 compare Eb versus E: the b9 and natural 9 give different melodic colours.',
    esercizi: ['Spell dim, dim7 and m7b5 on C, F# and Bb, including the correct seventh.', 'Write a four-bar minor cadence with two guide-tone lines, then transpose it to three keys.', 'Keep the same Dm7b5 voicing and compare a melody with Eb to one with E.'],
    obiettivo: 'Distinguish chord structure from harmonic function and write a controlled minor cadence.',
    tools: [{ tabId: 'scaleadvisor', label: 'Scale Advisor', icon: '', desc: 'Compare the three half-diminished palettes.' }],
    visuals: [{ type: 'progression', key: 'C minor', steps: [{ chord: 'Dm7b5', function: 'ii half-diminished' }, { chord: 'G7b9', function: 'V7' }, { chord: 'Cm6', function: 'i6' }] }],
  },
  {
    id: '7.diminished-functions',
    title: 'Three Diminished Approaches',
    topics: ['Ascending diminished', 'Descending passing diminished', 'Common-tone diminished'],
    teoria: `Do not label every dim7 as a dominant. First identify what its voices do.

Ascending: Cmaj7-C#dim7-Dm7. C#dim7 has the upper notes of A7b9; it can act as a rootless secondary dominant into Dm7. C# rises to D, while Bb can fall to A.

Descending: Em7-Ebdim7-Dm7. The chromatic bass E-Eb-D and inner lines explain this passing chord more directly than forcing a dominant label onto it.

Common-tone: C6-Cdim7-C6. Hold C and A (spelled Bbb in the dim7); move Eb to E and Gb to G on the return. This decorates the tonic instead of establishing a new key.

Whole-half diminished is a useful symmetric palette for dim7. Functional lines may instead use the destination's key. Symmetry permits enharmonic reinterpretation but does not make every resolution equally convincing.

Further reading: Mulholland and Hojnacki, The Berklee Book of Jazz Harmony, chapter 7, especially the three functions introduced on page 148.`,
    esempi: 'Cmaj7-C#dim7-Dm7-G7; Em7-Ebdim7-Dm7-G7; C6-Cdim7-C6. Compare the bass direction and retained voices.',
    esercizi: ['Insert one ascending dim7 between two chords in your own section A.', 'Write a descending E-Eb-D bass and retain at least one inner common tone.', 'Decorate a tonic without changing key; then remove the decoration and compare the phrase.'],
    obiettivo: 'Use diminished harmony for direction, connection or embellishment, with an explicit voice-leading reason.',
    tools: [{ tabId: 'landing', label: 'Chord Landing', icon: '', desc: 'Try diminished approaches in every target key.' }],
    visuals: [{ type: 'progression', key: 'C major', steps: [{ chord: 'Cmaj7' }, { chord: 'C#dim7', annotation: 'Ascending approach' }, { chord: 'Dm7' }, { chord: 'G7' }] }],
  },
  {
    id: '8.altered-resolution-lab',
    title: 'Altered Dominants: Choose a Resolution',
    topics: ['7alt', '7b9', 'Half-whole diminished', 'Guide tones', 'Melody compatibility'],
    teoria: `A dominant retains its major third and minor seventh. The alt symbol offers b9, #9, b5/#11 and #5/b13; it does not require all four tensions in one voicing. The altered scale does not contain natural 9, perfect 5 or natural 13.

On G7alt resolving to Cmaj7, try Ab-G, Bb-B and Eb-E in separate voices or successive phrases. Keep B and F audible enough to establish dominant quality. Into Cm, Eb can remain as the tonic minor third instead.

G7b9 with natural 13 is a different colour: half-whole diminished supplies Ab, Bb, B, Db, D, E and F above G. G altered supplies Eb instead of E and lacks D. For G7b9(b13), C harmonic minor offers a further functional option. Match the actual chord extensions and melody before choosing a scale.

For a funk vamp, an altered chord need not resolve immediately. Sustain it deliberately, then make the release audible through register, rhythm or a clear target tone.`,
    esempi: 'Dm7-G7alt-Cmaj7 versus Dm7b5-G7b9-Cm6. Compare G7b9(13) with G7alt while holding E in the melody: the first supports E, the second requires a deliberate clash or a changed melody.',
    esercizi: ['Write three different G7alt-Cmaj7 resolutions using one altered tension at a time.', 'Reharmonize a cadence without changing its melody; reject scales that contradict a sustained extension.', 'Write a two-bar dominant vamp and a contrasting tonic release, then transpose the whole phrase.'],
    obiettivo: 'Choose alterations by melodic destination rather than by a generic maximum-tension label.',
    tools: [{ tabId: 'landing', label: 'Chord Landing', icon: '', desc: 'Compare minor ii-V and diminished-to-dominant routes.' }, { tabId: 'scaleadvisor', label: 'Scale Advisor', icon: '', desc: 'Inspect altered and symmetric dominant collections.' }],
  },
];
