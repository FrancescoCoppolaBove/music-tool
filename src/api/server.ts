// Must be the first import: aiGuard reads the env at module load.
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import {
  assertOrigin, authenticate, consumeQuota, corsHeaders, parseScoreInput, toErrorResponse,
} from '../../netlify/lib/aiGuard';
import { SCORE_MODEL, SCORE_PROMPT } from '../../netlify/lib/scorePrompt';
import { deleteUserAccount, exportUserData } from '../../netlify/lib/account';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || 'Access-Control-Allow-Origin' in corsHeaders(origin)),
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Score uploads carry base64 images (max 6 × 5 MB).
app.use(express.json({ limit: '40mb' }));

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
    assertOrigin(req.headers.origin);
    const caller = await authenticate(req.headers.authorization);
    const images = parseScoreInput(req.body);

    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Anthropic API key not configured. Add AI_API_KEY to server .env file.',
        code: 'ai_not_configured',
      });
    }

    await consumeQuota(caller, 'score');

    const anthropic = new Anthropic({ apiKey });

    const imageContents: Anthropic.ImageBlockParam[] = images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
    }));

    const response = await anthropic.messages.create({
      model: SCORE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [...imageContents, { type: 'text', text: SCORE_PROMPT }],
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const songData = JSON.parse(jsonStr);
    res.json({ success: true, song: songData });
  } catch (error) {
    const { status, body } = toErrorResponse(error, 'Score analysis error');
    res.status(status).json(body);
  }
});

// ─── Account (GDPR export / erasure) ──────────────────────────────────────────
app.post('/api/account/:action', async (req: Request, res: Response) => {
  try {
    assertOrigin(req.headers.origin);
    const caller = await authenticate(req.headers.authorization);
    if (req.params.action === 'export') return res.json(await exportUserData(caller));
    if (req.params.action === 'delete') {
      await deleteUserAccount(caller);
      return res.json({ deleted: true });
    }
    res.status(404).json({ error: 'Unknown account action' });
  } catch (error) {
    const { status, body } = toErrorResponse(error, 'account error');
    res.status(status).json(body);
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
