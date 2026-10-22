// Run with: npm run test:account (Firestore + Auth emulators).
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { PaddleSubscriptionEvent } from '../netlify/lib/billing';

// Billing must be "on" for plan lookups; no request reaches Paddle in these tests.
process.env.PADDLE_API_KEY = 'test_key';
const { applySubscriptionEvent, getPlan } = await import('../netlify/lib/billing');
const { adminApp, consumeQuota, GuardError } = await import('../netlify/lib/aiGuard');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(adminApp()!);

const ev = (uid: string | null, status: string, at: string, customer = `ctm_${uid}`): PaddleSubscriptionEvent => ({
  event_type: 'subscription.updated',
  occurred_at: at,
  data: { id: `sub_${customer}`, status, customer_id: customer, custom_data: uid ? { firebase_uid: uid } : null, items: [] },
});

before(() => { assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'run via npm run test:account'); });

test('no entitlement → free; trialing → pro; canceled → free', async () => {
  assert.equal(await getPlan('newbie'), 'free');
  assert.equal(await applySubscriptionEvent(ev('newbie', 'trialing', '2026-10-22T10:00:00Z')), 'applied');
  assert.equal(await getPlan('newbie'), 'pro');
  await applySubscriptionEvent(ev('newbie', 'canceled', '2026-10-29T10:00:00Z'));
  assert.equal(await getPlan('newbie'), 'free');
});

test('out-of-order delivery: an older event never overwrites a newer one', async () => {
  await applySubscriptionEvent(ev('late', 'canceled', '2026-10-22T12:00:00Z'));
  assert.equal(await applySubscriptionEvent(ev('late', 'active', '2026-10-22T11:00:00Z')), 'stale');
  assert.equal(await getPlan('late'), 'free');
});

test('event without uid is matched through the Paddle customer id', async () => {
  await applySubscriptionEvent(ev('known', 'active', '2026-10-22T10:00:00Z', 'ctm_shared'));
  assert.equal(await applySubscriptionEvent(ev(null, 'past_due', '2026-10-23T10:00:00Z', 'ctm_shared')), 'applied');
  assert.equal((await db.doc('entitlements/known').get()).get('status'), 'past_due');
  assert.equal(await applySubscriptionEvent(ev(null, 'active', '2026-10-23T10:00:00Z', 'ctm_nobody')), 'unknown_user');
});

test('AI quotas follow the plan: free gets upgrade_required, pro gets more', async () => {
  const free = { uid: 'quota-free', authTime: 0, anonymousDev: false };
  for (let i = 0; i < 5; i++) await consumeQuota(free, 'buddy', 'free');
  await assert.rejects(consumeQuota(free, 'buddy', 'free'), (e: unknown) => e instanceof GuardError && e.code === 'upgrade_required' && e.status === 402);
  await assert.rejects(consumeQuota(free, 'score', 'free'), (e: unknown) => e instanceof GuardError && e.code === 'upgrade_required');

  const pro = { uid: 'quota-pro', authTime: 0, anonymousDev: false };
  for (let i = 0; i < 10; i++) await consumeQuota(pro, 'score', 'pro');
  await assert.rejects(consumeQuota(pro, 'score', 'pro'), (e: unknown) => e instanceof GuardError && e.code === 'quota_exceeded' && e.status === 429);
});

test('creator account (owner claim) has no AI quota, even on a free plan', async () => {
  const owner = { uid: 'quota-owner', authTime: 0, anonymousDev: false, owner: true };
  for (let i = 0; i < 20; i++) await consumeQuota(owner, 'score', 'free');
  assert.equal((await db.doc('aiUsage/quota-owner').get()).exists, false);
});
