import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPartText } from '../netlify/lib/partScanPrompt';
import { handler } from '../netlify/functions/part-scan';

type Invoke = (event: unknown, context: unknown) => Promise<{ statusCode: number }>;
const call = (event: Record<string, unknown>) => (handler as unknown as Invoke)({ headers: {}, body: null, ...event }, {});

test('extractPartText strips code fences and whitespace', () => {
  assert.equal(extractPartText('```text\nkey: C\n| C4:w |\n```'), 'key: C\n| C4:w |');
  assert.equal(extractPartText('  key: C\n| C4:w |  '), 'key: C\n| C4:w |');
});

test('part-scan: preflight, method and origin guards', async () => {
  assert.equal((await call({ httpMethod: 'OPTIONS' })).statusCode, 204);
  assert.equal((await call({ httpMethod: 'GET' })).statusCode, 405);
  assert.equal((await call({ httpMethod: 'POST', headers: { origin: 'https://evil.example' }, body: '{}' })).statusCode, 403);
});

test('part-scan: unauthenticated empty input is rejected by the guards, never an unhandled 500', async () => {
  // 401 with Firebase admin configured, 503 ai_not_configured without credentials (CI), 400 if auth is disabled.
  const { statusCode } = await call({ httpMethod: 'POST', body: JSON.stringify({ images: [] }) });
  assert.ok([400, 401, 503].includes(statusCode), `unexpected status ${statusCode}`);
});
