import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Voicings endpoint (placeholder per future feature)
app.post('/api/voicings/ai', async (req: Request, res: Response) => {
  try {
    const { chordSymbol, parsedChord, style } = req.body;

    if (!chordSymbol || !parsedChord) {
      return res.status(400).json({
        error: 'Missing required fields: chordSymbol, parsedChord',
      });
    }

    // TODO: Implementare chiamata API AI (Anthropic/OpenAI)
    // Per ora ritorna un placeholder
    res.json({
      success: true,
      message: 'AI voicings generation not yet implemented',
      voicings: [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating AI voicings:', error);
    res.status(500).json({
      error: 'Failed to generate AI voicings',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ─── Score Analysis endpoint ──────────────────────────────────────────────────
app.post('/api/score/analyze', async (req: Request, res: Response) => {
  try {
    const { images } = req.body as { images: { base64: string; mimeType: string }[] };

    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Anthropic API key not configured. Add AI_API_KEY to server .env file.',
      });
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
    res.json({ success: true, song: songData });
  } catch (error) {
    console.error('Score analysis error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Analysis failed', details: msg });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎹 Piano Voicings API running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
