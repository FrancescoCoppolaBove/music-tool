// Must be the first import: the functions read the env at module load.
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { handler as account } from '../../netlify/functions/account';
import { handler as buddy } from '../../netlify/functions/buddy';
import { handler as score } from '../../netlify/functions/score';

/**
 * Local dev server: runs the SAME Netlify Functions used in production, so
 * there is one implementation per endpoint. Mirrors netlify.toml routing:
 *   /api/<fn>/...                → netlify/functions/<fn>.ts
 *   /.netlify/functions/<fn>/... → netlify/functions/<fn>.ts
 * To add an endpoint: create the Netlify function and register it below.
 */
const FUNCTIONS: Record<string, Handler> = { account, buddy, score };

const app = express();
const PORT = process.env.PORT || 3001;

// Keep the raw body: handlers parse it themselves, as on Netlify.
// Score uploads carry base64 images (max 6 × 5 MB).
app.use(express.text({ type: () => true, limit: '40mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function runFunction(req: Request, res: Response) {
  const fn = FUNCTIONS[req.params.fn];
  if (!fn) return res.status(404).json({ error: 'Endpoint not found' });

  const event = {
    httpMethod: req.method,
    path: req.path,
    rawUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    rawQuery: req.originalUrl.split('?')[1] ?? '',
    headers: req.headers as Record<string, string>,
    multiValueHeaders: {},
    queryStringParameters: req.query as Record<string, string>,
    multiValueQueryStringParameters: null,
    body: typeof req.body === 'string' && req.body.length ? req.body : null,
    isBase64Encoded: false,
  } as HandlerEvent;

  try {
    const result = await fn(event, {} as HandlerContext, () => {});
    if (!result) return res.status(500).json({ error: 'Function returned no response' });
    res.status(result.statusCode).set(result.headers ?? {}).send(result.body ?? '');
  } catch (err) {
    console.error(`[dev] function ${req.params.fn} crashed:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

app.all(['/api/:fn', '/api/:fn/*', '/.netlify/functions/:fn', '/.netlify/functions/:fn/*'], runFunction);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🎹 tonic dev API (Netlify functions: ${Object.keys(FUNCTIONS).join(', ')}) on http://localhost:${PORT}`);
});

export default app;
