import type { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import {
  assertOrigin,
  authenticate,
  consumeQuota,
  corsHeaders,
  parseScoreInput,
  toErrorResponse,
} from '../lib/aiGuard';
import { getPlan } from '../lib/billing';
import { SCORE_MODEL, SCORE_PROMPT } from '../lib/scorePrompt';

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin;
  const CORS = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    assertOrigin(origin);
    const caller = await authenticate(event.headers.authorization);

    let body: unknown;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON', code: 'invalid_input' }) };
    }
    const images = parseScoreInput(body);

    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('score: AI_API_KEY not configured');
      return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'AI service is not configured', code: 'ai_not_configured' }) };
    }

    await consumeQuota(caller, 'score', caller.anonymousDev ? 'pro' : await getPlan(caller.uid));

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

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, song: songData }),
    };
  } catch (err) {
    const { status, body } = toErrorResponse(err, 'Score analysis error');
    return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
  }
};
