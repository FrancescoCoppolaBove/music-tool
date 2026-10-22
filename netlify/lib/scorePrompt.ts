/** Prompt + model for Score → iReal Pro analysis, shared by the Netlify function and the Express dev server. */
export const SCORE_MODEL = 'claude-opus-4-5';

export const SCORE_PROMPT = `Analyze this chord chart / lead sheet carefully. Extract all musical information.

Return ONLY a raw JSON object — no markdown code fences, no explanation, just the JSON.

Required structure:
{
  "title": "song title (string, use 'Untitled' if not found)",
  "composer": "composer name (string, use 'Unknown' if not found)",
  "style": "one of: Jazz Swing, Medium Jazz, Fast Swing, Slow Swing, Latin, Bossa Nova, Samba, Jazz Ballad, Pop Ballad, Funk, Rock, R&B, Gospel, Blues, Afro-Cuban, Waltz, Even 8ths",
  "key": "root note only, e.g. C, Bb, F#, Ab. For minor keys add dash: A-, D-, G-",
  "timeSignature": "one of: 4/4, 3/4, 6/8, 5/4, 7/4, 2/4",
  "sections": [
    {
      "type": "one of: Intro, A, B, C, D, Verse, Chorus, Bridge, Outro",
      "repeat": false,
      "bars": [
        { "chords": ["chord1", "chord2"] }
      ]
    }
  ]
}

Rules:
- Use standard chord notation: Cmaj7, Dm7, G7, Am7b5, Ddim7, Gsus4, Cm, C
- 1 chord in a bar's chords array = whole bar. 2 chords = half bar each. Up to 4.
- If a bar has a repeat symbol (%) use the same chords as the previous bar
- Analyze ALL pages if multiple images provided, combining into one complete sections array
- If a section has a repeat barline, set "repeat": true
- Return ONLY the JSON object, nothing else`;
