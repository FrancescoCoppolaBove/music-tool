import type { Handler, HandlerEvent } from '@netlify/functions';
import { applySubscriptionEvent, verifyPaddleSignature, type PaddleSubscriptionEvent } from '../lib/billing';

// Paddle → POST /api/paddle-webhook. Configure in Paddle: Developer tools →
// Notifications → destination URL https://<site>/api/paddle-webhook, events
// subscription.* ; copy its secret into PADDLE_WEBHOOK_SECRET.
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  // The signature covers the exact raw bytes Paddle sent.
  const raw = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : (event.body ?? '');
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? '';
  if (!verifyPaddleSignature(raw, event.headers['paddle-signature'], secret)) {
    console.warn('paddle-webhook: invalid signature');
    return { statusCode: 401, body: '' };
  }

  let payload: PaddleSubscriptionEvent;
  try {
    payload = JSON.parse(raw) as PaddleSubscriptionEvent;
  } catch {
    return { statusCode: 400, body: '' };
  }

  // Only subscription lifecycle events change the plan; acknowledge the rest.
  if (!payload.event_type?.startsWith('subscription.')) return { statusCode: 200, body: '' };

  try {
    const result = await applySubscriptionEvent(payload);
    console.log(`paddle-webhook: ${payload.event_type} ${payload.data.id} → ${result}`);
    return { statusCode: 200, body: '' };
  } catch (err) {
    // 5xx makes Paddle retry with backoff.
    console.error('paddle-webhook error:', err);
    return { statusCode: 500, body: '' };
  }
};
