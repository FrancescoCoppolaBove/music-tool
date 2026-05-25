import { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { images } = JSON.parse(event.body || '{}') as {
      images: { base64: string; mimeType: string }[];
    };

    if (!images || images.length === 0) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No images provided' }) };
    }

    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 503,
        headers: CORS,
        body: JSON.stringify({ error: 'AI_API_KEY not configured in Netlify environment variables' }),
      };
    }

    const anthropic = new Anthropic({ apiKey });

    const imageContents: Anthropic.ImageBlockParam[] = images.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.base64,
      },
    }));

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `Analyze this chord chart / lead sheet carefully. Extract all musical information.

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
- Return ONLY the JSON object, nothing else`,
          },
        ],
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const songData = JSON.parse(jsonStr);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, song: songData }),
    };
  } catch (error) {
    console.error('Score analysis error:', error);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
