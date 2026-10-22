import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { entitlementFromEvent, verifyPaddleSignature, type PaddleSubscriptionEvent } from '../netlify/lib/billing';

const SECRET = 'pdl_ntfset_test_secret';
const sign = (body: string, ts: number, secret = SECRET) =>
  `ts=${ts};h1=${createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex')}`;
const now = 1_760_000_000;

test('webhook signature: valid, tampered, wrong secret, replayed, malformed', () => {
  const body = '{"event_type":"subscription.created"}';
  assert.equal(verifyPaddleSignature(body, sign(body, now), SECRET, now), true);
  assert.equal(verifyPaddleSignature(body + ' ', sign(body, now), SECRET, now), false);
  assert.equal(verifyPaddleSignature(body, sign(body, now, 'other'), SECRET, now), false);
  assert.equal(verifyPaddleSignature(body, sign(body, now - 600), SECRET, now), false);
  assert.equal(verifyPaddleSignature(body, 'garbage', SECRET, now), false);
  assert.equal(verifyPaddleSignature(body, undefined, SECRET, now), false);
  assert.equal(verifyPaddleSignature(body, sign(body, now), '', now), false);
});

const event = (status: string, extra: Partial<PaddleSubscriptionEvent['data']> = {}): PaddleSubscriptionEvent => ({
  event_type: 'subscription.updated',
  occurred_at: '2026-10-22T10:00:00.000000Z',
  data: {
    id: 'sub_1', status, customer_id: 'ctm_1', custom_data: { firebase_uid: 'u1' },
    current_billing_period: { ends_at: '2026-10-29T10:00:00Z' },
    items: [{ price: { id: 'pri_monthly' } }],
    ...extra,
  },
});

test('entitlement: trialing, active and past_due are Pro', () => {
  for (const status of ['trialing', 'active', 'past_due']) {
    assert.equal(entitlementFromEvent(event(status)).plan, 'pro', status);
  }
});

test('entitlement: canceled and paused are Free', () => {
  for (const status of ['canceled', 'paused']) {
    assert.equal(entitlementFromEvent(event(status)).plan, 'free', status);
  }
});

test('entitlement: scheduled cancellation stays Pro until the effective date', () => {
  const e = entitlementFromEvent(event('active', { scheduled_change: { action: 'cancel', effective_at: '2026-11-22T10:00:00Z' } }));
  assert.equal(e.plan, 'pro');
  assert.equal(e.cancelAt, '2026-11-22T10:00:00Z');
});

test('entitlement: maps ids, price and period', () => {
  const e = entitlementFromEvent(event('active'));
  assert.deepEqual(
    { c: e.paddleCustomerId, s: e.paddleSubscriptionId, p: e.priceId, end: e.currentPeriodEnd, at: e.lastEventAt },
    { c: 'ctm_1', s: 'sub_1', p: 'pri_monthly', end: '2026-10-29T10:00:00Z', at: '2026-10-22T10:00:00.000000Z' },
  );
});
