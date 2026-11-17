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
import { extractPartText, PART_SCAN_MODEL, PART_SCAN_PROMPT } from '../lib/partScanPrompt';

/** Part Transposer: reads one staff of a photographed part into the tool's text syntax. Shares the score quota. */
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
      console.error('part-scan: AI_API_KEY not configured');
      return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'AI service is not configured', code: 'ai_not_configured' }) };
    }

    await consumeQuota(caller, 'score', caller.anonymousDev || caller.owner ? 'pro' : await getPlan(caller.uid));

    const anthropic = new Anthropic({ apiKey });
    const imageContents: Anthropic.ImageBlockParam[] = images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
    }));

    const response = await anthropic.messages.create({
      model: PART_SCAN_MODEL,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [...imageContents, { type: 'text', text: PART_SCAN_PROMPT }],
      }],
    });

    const block = response.content.find(b => b.type === 'text');
    const raw = block?.type === 'text' ? block.text : '';
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: extractPartText(raw), ...(response.stop_reason === 'max_tokens' ? { truncated: true } : {}) }),
    };
  } catch (err) {
    const { status, body } = toErrorResponse(err, 'Part scan error');
    return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
  }
};
