import { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are Modal Buddy, a friendly and expert music theory assistant integrated into Tonic, a music theory web app. You answer questions about music theory, harmony, scales, chords, ear training, and composition — with a focus on jazz, contemporary, and pop/rock harmony.

Rules:
- Be concise and practical: musicians want answers they can use immediately
- When relevant, relate your answer to the context the user is working in (scale, chord, feature described)
- Use standard music theory terminology but explain it clearly
- Keep responses under 200 words unless a longer explanation is truly needed
- Respond in the same language the user writes in (Italian or English)
- Never refuse a music theory question — these are all legitimate educational topics`;

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { message, context, history } = JSON.parse(event.body || '{}') as {
      message: string;
      context?: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!message?.trim()) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'message required' }) };
    }

    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'AI_API_KEY not configured' }) };
    }

    const anthropic = new Anthropic({ apiKey });

    // Build context prefix if current feature state is provided
    const contextNote = context
      ? `[User is currently in: ${context}]\n\n`
      : '';

    // Build message history for multi-turn
    const messages: Anthropic.MessageParam[] = [
      ...(history ?? []).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: `${contextNote}${message}` },
    ];

    const structuredHarmonyRequest = context === 'HARMONY_LAB_PROPOSAL';
    const system = structuredHarmonyRequest
      ? `${SYSTEM_PROMPT}\n\nFor HARMONY_LAB_PROPOSAL requests, return only one valid JSON object with exactly these fields: {"title":string,"explanation":string,"tonic":string,"mode":string,"bpm":number,"meter":string,"chords":string[]}. Do not wrap it in markdown. Use standard chord symbols. Do not claim the proposal has been validated; the application will validate chord symbols and settings. Keep the user's key, mode, tempo, and meter unless their request asks to change them. If the request is musically ambiguous, make a reasonable proposal and state your assumption in explanation.`
      : SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system,
      messages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: text }),
    };
  } catch (err) {
    console.error('buddy error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Failed to get response' }),
    };
  }
};
