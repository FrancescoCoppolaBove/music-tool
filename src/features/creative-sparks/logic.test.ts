import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from './cards';
import { DIMENSIONS, type DimId } from './constraints';
import { EXERCISES } from './exercises';
import { drawCard, pickDifferent, rollBrief } from './logic';

// Deterministic PRNG (mulberry32) so failures are reproducible.
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const baseIds = DIMENSIONS.filter(d => d.kind === 'base').map(d => d.id);
const ruleIds = new Set(DIMENSIONS.filter(d => d.kind === 'rule').map(d => d.id));

test('content: ids are unique and every text is filled', () => {
  assert.equal(new Set(CARDS.map(c => c.id)).size, CARDS.length);
  assert.equal(new Set(EXERCISES.map(e => e.id)).size, EXERCISES.length);
  assert.ok(CARDS.every(c => c.text.trim() && c.how.trim()));
  assert.ok(DIMENSIONS.every(d => d.options.length >= 2));
});

test('drawCard: never repeats a recent card while fresh ones exist', () => {
  const rng = seeded(1);
  const recent: string[] = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = drawCard(CARDS, recent, rng)!;
    assert.ok(!recent.includes(card.id), `repeated ${card.id}`);
    recent.push(card.id);
  }
  // All cards seen: falls back to the full pool instead of returning nothing.
  assert.ok(drawCard(CARDS, recent, rng));
  assert.equal(drawCard([], [], rng), null);
});

test('pickDifferent: avoids the previous value unless it is the only one', () => {
  const rng = seeded(2);
  for (let i = 0; i < 50; i++) assert.notEqual(pickDifferent(['a', 'b', 'c'], 'a', rng), 'a');
  assert.equal(pickDifferent(['a'], 'a', rng), 'a');
});

test('rollBrief: all base dimensions plus the requested number of rules, in order', () => {
  const rng = seeded(3);
  for (const count of [2, 4, 6]) {
    const brief = rollBrief(DIMENSIONS, [], new Set(), count, rng);
    assert.deepEqual(brief.filter(i => !ruleIds.has(i.dim)).map(i => i.dim), baseIds);
    assert.equal(brief.filter(i => ruleIds.has(i.dim)).length, count);
    const order = DIMENSIONS.map(d => d.id);
    assert.deepEqual(brief.map(i => i.dim), [...brief.map(i => i.dim)].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  }
});

test('rollBrief: locked items keep their value, unlocked ones change', () => {
  const rng = seeded(4);
  const first = rollBrief(DIMENSIONS, [], new Set(), 4, rng);
  const lockedRule = first.find(i => ruleIds.has(i.dim))!.dim;
  const locked = new Set<DimId>(['tempo', lockedRule]);
  const next = rollBrief(DIMENSIONS, first, locked, 4, rng);
  const value = (b: typeof first, d: DimId) => b.find(i => i.dim === d)?.value;

  assert.equal(value(next, 'tempo'), value(first, 'tempo'));
  assert.equal(value(next, lockedRule), value(first, lockedRule));
  for (const d of ['metro', 'centro', 'durata'] as DimId[]) assert.notEqual(value(next, d), value(first, d));
  assert.equal(next.filter(i => ruleIds.has(i.dim)).length, 4);
});

test('rollBrief: locked rules survive even when they exceed the rule count', () => {
  const rng = seeded(5);
  const first = rollBrief(DIMENSIONS, [], new Set(), 6, rng);
  const locked = new Set(first.filter(i => ruleIds.has(i.dim)).map(i => i.dim));
  const next = rollBrief(DIMENSIONS, first, locked, 2, rng);
  assert.equal(next.filter(i => ruleIds.has(i.dim)).length, 6);
});
