// src/features/audio-transcriber/engine/keyEstimator.ts
// Krumhansl-Schmuckler: istogramma dei pitch class pesato per durata,
// correlato (Pearson) con i 24 profili maggiore/minore.

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

export function estimateKey(notes: { midi: number; durationSec: number }[]): string | null {
  if (notes.length === 0) return null;
  const hist = new Array<number>(12).fill(0);
  for (const n of notes) hist[((n.midi % 12) + 12) % 12] += n.durationSec;

  let best = '', bestR = -Infinity;
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = hist.map((_, i) => hist[(i + tonic) % 12]);
    const rMajor = pearson(rotated, MAJOR_PROFILE);
    const rMinor = pearson(rotated, MINOR_PROFILE);
    if (rMajor > bestR) { bestR = rMajor; best = `${KEY_NAMES[tonic]} major`; }
    if (rMinor > bestR) { bestR = rMinor; best = `${KEY_NAMES[tonic]} minor`; }
  }
  return best;
}
