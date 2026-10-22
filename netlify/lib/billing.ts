/**
 * Subscriptions (Paddle Billing — Merchant of Record).
 *
 * Source of truth for a user's plan: `entitlements/{uid}` in Firestore, written
 * ONLY here (webhook) with the Admin SDK. Clients can read their own document
 * (firestore.rules) but never write it.
 *
 * Billing is "off" until PADDLE_API_KEY is set: then every user is treated as
 * Pro, matching the client (no VITE_PADDLE_CLIENT_TOKEN → nothing is locked).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp, GuardError } from './aiGuard';

export type Plan = 'free' | 'pro';
export type Interval = 'monthly' | 'yearly';

export const billingEnabled = Boolean(process.env.PADDLE_API_KEY);

const API_BASE = process.env.PADDLE_ENV === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';

export interface Entitlement {
  plan: Plan;
  /** Paddle subscription status: active | trialing | past_due | paused | canceled */
  status: string;
  paddleCustomerId: string | null;
  paddleSubscriptionId: string | null;
  priceId: string | null;
  /** ISO date: end of the current billing period / trial. */
  currentPeriodEnd: string | null;
  /** ISO date when a scheduled cancellation takes effect (still Pro until then). */
  cancelAt: string | null;
  /** occurred_at of the last applied webhook event — older events are ignored. */
  lastEventAt: string;
}

// past_due keeps access during Paddle's payment retries (dunning).
const PRO_STATUSES = new Set(['active', 'trialing', 'past_due']);

function db() {
  const app = adminApp();
  if (!app) throw new GuardError(503, 'not_configured', 'Billing service is not configured');
  return getFirestore(app);
}

// ─── Plan lookup (used by AI quotas) ──────────────────────────────────────────

export async function getPlan(uid: string): Promise<Plan> {
  if (!billingEnabled) return 'pro';
  const snap = await db().doc(`entitlements/${uid}`).get();
  return snap.exists && snap.get('plan') === 'pro' ? 'pro' : 'free';
}

// ─── Paddle API ───────────────────────────────────────────────────────────────

async function paddle<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({})) as { data?: T; error?: { detail?: string } };
  if (!res.ok || !json.data) {
    throw new Error(`Paddle ${path} failed (${res.status}): ${json.error?.detail ?? 'no detail'}`);
  }
  return json.data;
}

function priceFor(interval: Interval): string {
  const id = interval === 'yearly' ? process.env.PADDLE_PRICE_YEARLY : process.env.PADDLE_PRICE_MONTHLY;
  if (!id) throw new GuardError(503, 'not_configured', 'Billing prices are not configured');
  return id;
}

/**
 * Creates a Paddle transaction for the signed-in user. The uid travels in
 * custom_data, so the webhook knows whose plan to update; the client only
 * opens Paddle Checkout with the returned transaction id.
 */
export async function createCheckout(uid: string, interval: Interval): Promise<{ transactionId: string }> {
  if (!billingEnabled) throw new GuardError(503, 'billing_disabled', 'Subscriptions are not available yet');
  const existing = await db().doc(`entitlements/${uid}`).get();
  if (existing.get('plan') === 'pro') throw new GuardError(409, 'already_pro', 'You already have Pro');

  const customerId = existing.get('paddleCustomerId') as string | undefined;
  const txn = await paddle<{ id: string }>('/transactions', {
    items: [{ price_id: priceFor(interval), quantity: 1 }],
    custom_data: { firebase_uid: uid },
    ...(customerId ? { customer_id: customerId } : {}),
  });
  return { transactionId: txn.id };
}

/** Paddle customer portal: change card, switch plan, cancel, invoices. */
export async function createPortalSession(uid: string): Promise<{ url: string }> {
  if (!billingEnabled) throw new GuardError(503, 'billing_disabled', 'Subscriptions are not available yet');
  const ent = (await db().doc(`entitlements/${uid}`).get()).data() as Entitlement | undefined;
  if (!ent?.paddleCustomerId) throw new GuardError(404, 'no_subscription', 'No subscription found for this account');

  const session = await paddle<{ urls: { general: { overview: string } } }>(
    `/customers/${ent.paddleCustomerId}/portal-sessions`,
    { subscription_ids: ent.paddleSubscriptionId ? [ent.paddleSubscriptionId] : [] },
  );
  return { url: session.urls.general.overview };
}

/** Account deletion: stop billing immediately, then forget the entitlement. */
export async function cancelSubscriptionForDeletion(uid: string): Promise<void> {
  const ref = db().doc(`entitlements/${uid}`);
  const ent = (await ref.get()).data() as Entitlement | undefined;
  if (billingEnabled && ent?.paddleSubscriptionId && ent.status !== 'canceled') {
    await paddle(`/subscriptions/${ent.paddleSubscriptionId}/cancel`, { effective_from: 'immediately' });
  }
  await ref.delete();
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

/**
 * Verifies the `Paddle-Signature` header (`ts=…;h1=…`): HMAC-SHA256 of
 * `${ts}:${rawBody}` with the notification secret. Rejects replays older than 5 min.
 */
export function verifyPaddleSignature(rawBody: string, header: string | undefined, secret: string, nowSeconds = Date.now() / 1000): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(';').map(p => p.split('=') as [string, string]));
  const ts = Number(parts.ts);
  if (!parts.h1 || !Number.isFinite(ts) || Math.abs(nowSeconds - ts) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret).update(`${parts.ts}:${rawBody}`).digest();
  const given = Buffer.from(parts.h1, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export interface PaddleSubscriptionEvent {
  event_type: string;
  occurred_at: string;
  data: {
    id: string;
    status: string;
    customer_id: string;
    custom_data?: { firebase_uid?: string } | null;
    current_billing_period?: { ends_at: string } | null;
    scheduled_change?: { action: string; effective_at: string } | null;
    items?: { price?: { id?: string } }[];
  };
}

/** Pure mapping, unit-tested: Paddle subscription event → entitlement document. */
export function entitlementFromEvent(event: PaddleSubscriptionEvent): Entitlement {
  const s = event.data;
  return {
    plan: PRO_STATUSES.has(s.status) ? 'pro' : 'free',
    status: s.status,
    paddleCustomerId: s.customer_id,
    paddleSubscriptionId: s.id,
    priceId: s.items?.[0]?.price?.id ?? null,
    currentPeriodEnd: s.current_billing_period?.ends_at ?? null,
    cancelAt: s.scheduled_change?.action === 'cancel' ? s.scheduled_change.effective_at : null,
    lastEventAt: event.occurred_at,
  };
}

/**
 * Applies a subscription.* event. Idempotent and order-safe: Paddle may retry
 * or deliver out of order, so events older than the stored one are ignored.
 * Returns what happened, for logging.
 */
export async function applySubscriptionEvent(event: PaddleSubscriptionEvent): Promise<'applied' | 'stale' | 'unknown_user'> {
  const firestore = db();
  let uid = event.data.custom_data?.firebase_uid;

  if (!uid) {
    // Subscriptions created outside our checkout (e.g. by support): match on customer.
    const match = await firestore.collection('entitlements').where('paddleCustomerId', '==', event.data.customer_id).limit(1).get();
    uid = match.docs[0]?.id;
  }
  if (!uid) return 'unknown_user';

  const ref = firestore.doc(`entitlements/${uid}`);
  const next = entitlementFromEvent(event);
  return firestore.runTransaction(async tx => {
    const current = (await tx.get(ref)).data() as Entitlement | undefined;
    if (current && current.lastEventAt > next.lastEventAt) return 'stale' as const;
    tx.set(ref, next);
    return 'applied' as const;
  });
}
