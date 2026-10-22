import { Handler, HandlerEvent } from '@netlify/functions';
import { assertOrigin, authenticate, corsHeaders, toErrorResponse } from '../lib/aiGuard';
import { deleteUserAccount, exportUserData } from '../lib/account';

// POST /api/account/export → the user's data as JSON
// POST /api/account/delete → erases the account (needs a sign-in < 5 min old)
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
    const action = event.path.split('/').pop();

    if (action === 'export') {
      const data = await exportUserData(caller);
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }
    if (action === 'delete') {
      await deleteUserAccount(caller);
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ deleted: true }) };
    }
    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Unknown account action' }) };
  } catch (err) {
    const { status, body } = toErrorResponse(err, 'account error');
    return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
  }
};
