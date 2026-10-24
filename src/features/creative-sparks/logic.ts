import type { Dimension, DimId } from './constraints';

export type Rng = () => number;

export interface BriefItem { dim: DimId; value: string }

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

/** Random item, different from `avoid` whenever there is an alternative. */
export function pickDifferent<T>(items: readonly T[], avoid: T | undefined, rng: Rng): T {
  const pool = items.length > 1 ? items.filter(i => i !== avoid) : items;
  return pick(pool, rng);
}

/**
 * Next card: never one of the `recent` ids (unless the pool is that small),
 * so a session doesn't keep showing the same few cards.
 */
export function drawCard<T extends { id: string }>(pool: readonly T[], recent: readonly string[], rng: Rng): T | null {
  if (!pool.length) return null;
  const fresh = pool.filter(c => !recent.includes(c.id));
  return pick(fresh.length ? fresh : pool, rng);
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A creative brief: every base dimension plus `ruleCount` rule dimensions.
 * Locked items keep their value (locked rules always stay, even beyond
 * `ruleCount`); everything else is re-drawn with a different value.
 * Output follows the order of `dims`.
 */
export function rollBrief(
  dims: readonly Dimension[],
  prev: readonly BriefItem[],
  locked: ReadonlySet<DimId>,
  ruleCount: number,
  rng: Rng,
): BriefItem[] {
  const prevValue = new Map(prev.map(i => [i.dim, i.value]));
  const keep = (d: Dimension) => locked.has(d.id) && prevValue.has(d.id);
  const rules = dims.filter(d => d.kind === 'rule');
  const lockedRules = rules.filter(keep);
  const extra = shuffle(rules.filter(d => !keep(d)), rng).slice(0, Math.max(0, ruleCount - lockedRules.length));
  const chosen = new Set<DimId>([...lockedRules, ...extra].map(d => d.id));

  return dims
    .filter(d => d.kind === 'base' || chosen.has(d.id))
    .map(d => ({ dim: d.id, value: keep(d) ? prevValue.get(d.id)! : pickDifferent(d.options, prevValue.get(d.id), rng) }));
}

export function briefToText(items: readonly BriefItem[], dims: readonly Dimension[]): string {
  const label = new Map(dims.map(d => [d.id, d.label]));
  return ['Brief creativo — tonic', ...items.map(i => `• ${label.get(i.dim)}: ${i.value}`)].join('\n');
}
