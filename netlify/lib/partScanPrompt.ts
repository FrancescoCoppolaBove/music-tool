/** Prompt + model for Part Transposer photo reading, shared by the Netlify function and the Express dev server. */
export const PART_SCAN_MODEL = 'claude-opus-5-5';

export const PART_SCAN_PROMPT = `You are reading a photographed or scanned music part. Transcribe ONE staff into the plain-text format below.

Return ONLY the text — no markdown code fences, no explanation.

FORMAT
title: <title if printed; omit this line otherwise>
key: <tonic of the key signature as written, e.g. Eb, F#, Bb; add m for minor, e.g. Cm>
time: <time signature, e.g. 4/4, 3/4, 6/8>
clef: <treble or bass>
| bar 1 | bar 2 | ...

Inside a bar, space-separated tokens in order:
- Note: <letter><accidental><octave>:<duration>, e.g. Eb4:q, F#5:8, C4:h.
  * Pitch is ABSOLUTE: always write the accidental the note really has, including the ones from the key signature (in Eb major a written B is Bb4).
  * Middle C is C4.
  * Durations: w (whole) h (half) q (quarter) 8 (eighth) 16 (sixteenth); add "." for a dotted value (q.).
- Rest: r:<duration>, e.g. r:q, r:h.
- Tie to the next note: append ~ (C5:h~ | C5:q).
- Triplet: (3 C5:8 D5:8 E5:8)
- Chord symbol: in brackets immediately before the note or rest it sits above: [Ebmaj7] [F7#9] [Cm7/Bb].
- A bar with only chord symbols over slashes: write only the symbols, e.g. | [F7] [Bb7] |

RULES
- Transcribe pitches exactly as written on the page. Never transpose.
- With several staves, transcribe only the top staff (the melody) plus the chord symbols.
- The durations in every bar must add up to the time signature.
- Write out repeat signs (%) by copying the previous bar. Ignore dynamics, articulations and lyrics.
- Start a new line every 4 bars.
- If a passage is hard to read, write your best guess instead of skipping bars.

EXAMPLE
key: Eb
time: 4/4
clef: treble
| [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Cm7] C5:h. r:q | [Fm7] [Bb7] | [Ebmaj7] Eb4:w |`;

/** The model's answer without code fences or surrounding whitespace. */
export function extractPartText(raw: string): string {
  return raw.trim().replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
}
