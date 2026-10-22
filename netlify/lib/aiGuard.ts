/**
 * Shared protection for the AI endpoints (Netlify Functions + Express dev server).
 *
 * Every AI request must:
 *   1. come from an allowed origin (CORS allowlist, no wildcard)
 *   2. carry a valid Firebase ID token (`Authorization: Bearer <token>`)
 *   3. pass input validation (size limits, whitelisted fields)
 *   4. fit inside the user's daily quota (counted server-side in Firestore)
 *
 * The module fails CLOSED: if the Firebase Admin credentials are missing, AI
 * endpoints answer 503 instead of running unprotected. For local development
 * without credentials set `AI_AUTH_DISABLED=true` — this is refused on the
 * Netlify production context.
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ─── Errors ───────────────────────────────────────────────────────────────────

export class GuardError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const isNetlifyProduction = process.env.CONTEXT === 'production';

function allowedOrigins(): string[] {
  const list = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  // Netlify injects the site URLs at runtime.
  if (process.env.URL) list.push(process.env.URL);
  if (process.env.DEPLOY_PRIME_URL) list.push(process.env.DEPLOY_PRIME_URL);
  if (!isNetlifyProduction) {
    list.push('http://localhost:3000', 'http://localhost:8888');
  }
  return list;
}

/** CORS headers for a request. Unknown origins get no Allow-Origin header. */
export function corsHeaders(origin: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (origin && allowedOrigins().includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

/**
 * Browsers always send Origin on cross-site POSTs. Same-origin calls (the app
 * itself, via relative URLs) may omit it, which is fine. A foreign Origin is rejected.
 */
export function assertOrigin(origin: string | undefined): void {
  if (origin && !allowedOrigins().includes(origin)) {
    throw new GuardError(403, 'origin_not_allowed', 'Origin not allowed');
  }
}

// ─── Firebase Admin ───────────────────────────────────────────────────────────

const authDisabled = process.env.AI_AUTH_DISABLED === 'true';

if (authDisabled && isNetlifyProduction) {
  console.error('[aiGuard] AI_AUTH_DISABLED is ignored in production.');
}

function adminApp(): App | null {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Netlify / .env store the key with literal "\n" sequences.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export interface Caller {
  uid: string;
  /** True only in local dev with AI_AUTH_DISABLED — quotas are skipped. */
  anonymousDev: boolean;
}

/** Verifies the Firebase ID token in the Authorization header. */
export async function authenticate(authorization: string | undefined): Promise<Caller> {
  if (authDisabled && !isNetlifyProduction) {
    return { uid: 'local-dev', anonymousDev: true };
  }

  const app = adminApp();
  if (!app) {
    console.error('[aiGuard] FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY missing');
    throw new GuardError(503, 'ai_not_configured', 'AI service is not configured');
  }

  const match = /^Bearer (.+)$/.exec(authorization ?? '');
  if (!match) throw new GuardError(401, 'auth_required', 'Sign in to use the AI features');

  try {
    const decoded = await getAuth(app).verifyIdToken(match[1], true);
    return { uid: decoded.uid, anonymousDev: false };
  } catch {
    throw new GuardError(401, 'auth_invalid', 'Your session has expired — sign in again');
  }
}

// ─── Daily quota ──────────────────────────────────────────────────────────────

export type AiFeature = 'buddy' | 'score';

const DEFAULT_DAILY_LIMITS: Record<AiFeature, number> = { buddy: 30, score: 5 };

function dailyLimit(feature: AiFeature): number {
  const raw = Number(process.env[`AI_DAILY_LIMIT_${feature.toUpperCase()}`]);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_DAILY_LIMITS[feature];
}

/**
 * Atomically counts one call against today's quota (UTC day). Throws 429 when
 * exhausted. Stored in `aiUsage/{uid}` — the Firestore rules deny all client access.
 */
export async function consumeQuota(caller: Caller, feature: AiFeature): Promise<void> {
  if (caller.anonymousDev) return;
  const app = adminApp();
  if (!app) throw new GuardError(503, 'ai_not_configured', 'AI service is not configured');

  const limit = dailyLimit(feature);
  const today = new Date().toISOString().slice(0, 10);
  const db = getFirestore(app);
  const ref = db.collection('aiUsage').doc(caller.uid);

  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const used = data?.day === today ? Number(data[feature] ?? 0) : 0;
    if (used >= limit) {
      throw new GuardError(429, 'quota_exceeded', 'Daily AI limit reached — try again tomorrow');
    }
    if (data?.day === today) {
      tx.update(ref, { [feature]: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    } else {
      tx.set(ref, { day: today, [feature]: 1, updatedAt: FieldValue.serverTimestamp() });
    }
  });
}

// ─── Input validation ─────────────────────────────────────────────────────────

const MAX_MESSAGE_CHARS = 2000;
const MAX_CONTEXT_CHARS = 200;
const MAX_HISTORY_TURNS = 10;

export interface BuddyInput {
  message: string;
  context?: string;
  history: { role: 'user' | 'assistant'; content: string }[];
}

function bad(message: string): GuardError {
  return new GuardError(400, 'invalid_input', message);
}

export function parseBuddyInput(body: unknown): BuddyInput {
  const b = (body ?? {}) as Record<string, unknown>;

  if (typeof b.message !== 'string' || !b.message.trim()) throw bad('message required');
  if (b.message.length > MAX_MESSAGE_CHARS) throw bad(`message too long (max ${MAX_MESSAGE_CHARS} chars)`);

  let context: string | undefined;
  if (b.context !== undefined) {
    if (typeof b.context !== 'string') throw bad('invalid context');
    context = b.context.slice(0, MAX_CONTEXT_CHARS);
  }

  const rawHistory = Array.isArray(b.history) ? b.history.slice(-MAX_HISTORY_TURNS) : [];
  const history = rawHistory
    .filter((h): h is { role: 'user' | 'assistant'; content: string } => {
      const e = h as Record<string, unknown>;
      return (e?.role === 'user' || e?.role === 'assistant') && typeof e.content === 'string' && e.content.trim() !== '';
    })
    .map(h => ({ role: h.role, content: h.content.slice(0, MAX_MESSAGE_CHARS) }));
  // The Messages API requires the conversation to start with a user turn.
  while (history.length && history[0].role !== 'user') history.shift();

  return { message: b.message, context, history };
}

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // Anthropic per-image limit
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

export interface ScoreImage {
  base64: string;
  mimeType: ImageType;
}

export function parseScoreInput(body: unknown): ScoreImage[] {
  const images = (body as Record<string, unknown> | null)?.images;
  if (!Array.isArray(images) || images.length === 0) throw bad('No images provided');
  if (images.length > MAX_IMAGES) throw bad(`Too many images (max ${MAX_IMAGES})`);

  return images.map(img => {
    const i = img as Record<string, unknown>;
    if (typeof i?.base64 !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(i.base64)) throw bad('Invalid image data');
    if (!IMAGE_TYPES.includes(i.mimeType as ImageType)) throw bad('Unsupported image type (use JPEG, PNG, GIF or WebP)');
    if ((i.base64.length * 3) / 4 > MAX_IMAGE_BYTES) throw bad('Image too large (max 5 MB per page)');
    return { base64: i.base64, mimeType: i.mimeType as ImageType };
  });
}

// ─── Error → response ─────────────────────────────────────────────────────────

/** Maps any thrown error to a safe status + body. Internal details stay in the logs. */
export function toErrorResponse(err: unknown, logLabel: string): { status: number; body: { error: string; code: string } } {
  if (err instanceof GuardError) {
    return { status: err.status, body: { error: err.message, code: err.code } };
  }
  console.error(`${logLabel}:`, err);
  return { status: 500, body: { error: 'The AI service failed — try again later', code: 'internal_error' } };
}
