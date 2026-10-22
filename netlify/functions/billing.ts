import type { Handler, HandlerEvent } from '@netlify/functions';
import { assertOrigin, authenticate, corsHeaders, GuardError, toErrorResponse } from '../lib/aiGuard';
import { createCheckout, createPortalSession, type Interval } from '../lib/billing';

// POST /api/billing/checkout {interval: 'monthly'|'yearly'} → { transactionId } for Paddle.Checkout
// POST /api/billing/portal                                  → { url } of the Paddle customer portal
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
    if (caller.anonymousDev) throw new GuardError(400, 'auth_required', 'Billing needs a real signed-in user');
    if (caller.owner && event.path.endsWith('/checkout')) {
      throw new GuardError(409, 'owner_account', 'Creator account: everything is already unlocked');
    }
    const action = event.path.split('/').pop();
    const json = (data: unknown) => ({ statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

    if (action === 'checkout') {
      let interval: Interval = 'monthly';
      try {
        const body = JSON.parse(event.body || '{}') as { interval?: string };
        if (body.interval === 'yearly') interval = 'yearly';
      } catch { /* default monthly */ }
      return json(await createCheckout(caller.uid, interval));
    }
    if (action === 'portal') return json(await createPortalSession(caller.uid));
    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Unknown billing action' }) };
  } catch (err) {
    const { status, body } = toErrorResponse(err, 'billing error');
    return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
  }
};
