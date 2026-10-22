import { analyzeAudio } from '../workerClient';
import type { NoteEvent, DetectionSensitivity } from '../../types';

type Event = [name: string, start: number, duration: number, gain: number];
interface Fixture { name: string; events: Event[]; noise?: number }
const MIDI: Record<string, number> = {
  C2: 48, D2: 50, E2: 52, F2: 53, G2: 55, A2: 57, B2: 59,
  C3: 60, 'C-sharp3': 61, D3: 62, E3: 64, F3: 65, G3: 67, A3: 69, B3: 71,
};
const chord = (names: string[], start: number, duration: number, gain = 0.6): Event[] =>
  names.map(name => [name, start, duration, gain]);
const run = (names: string[], start: number, step: number, duration: number, gain = 0.45): Event[] =>
  names.map((name, i) => [name, start + i * step, duration, gain]);

export const PIANO_FIXTURES: Fixture[] = [
  { name: 'scale', events: run(['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'], .2, .35, .28) },
  { name: 'triads', events: [...chord(['C3', 'E3', 'G3'], .2, .7), ...chord(['F3', 'A3', 'C3'], 1.2, .7)] },
  { name: 'octaves', events: chord(['C2', 'C3', 'E3', 'G3'], .2, .8) },
  { name: 'repeated', events: run(['C3', 'C3', 'C3', 'C3'], .2, .45, .32) },
  { name: 'chords-quiet-scale', events: [...chord(['C3', 'E3', 'G3'], .2, .65), ...run(['D3', 'E3', 'F3', 'G3', 'A3', 'B3'], 1, .15, .12, .28), ...chord(['F3', 'A3', 'C3'], 2.2, .7)] },
  { name: 'legato-arpeggio', events: run(['C2', 'E2', 'G2', 'C3', 'E3', 'G3', 'E3', 'C3'], .2, .18, .27) },
  { name: 'staccato-run', events: run(['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'], .2, .12, .075) },
  { name: 'soft-top-line', events: [...chord(['C2', 'E2', 'G2'], .2, 2), ...run(['C3', 'D3', 'E3', 'G3', 'A3'], .4, .3, .2, .12)] },
  { name: 'octave-doublings-quiet', events: [...chord(['C2', 'E2', 'G2'], .2, .8), ...chord(['C3', 'E3', 'G3'], .2, .8, .18)] },
  { name: 'clusters', events: chord(['C3', 'C-sharp3', 'D3', 'G3'], .2, .9) },
  { name: 'inversions', events: [...chord(['E2', 'G2', 'C3'], .2, .7), ...chord(['G2', 'B2', 'D3', 'F3'], 1.2, .7)] },
  { name: 'quiet-after-loud', events: [...chord(['C3', 'E3', 'G3'], .2, .7), ...run(['D3', 'F3', 'A3', 'C3'], 1.2, .26, .18, .08)] },
  { name: 'repeated-over-pedal', events: [...chord(['C2', 'G2'], .2, 2), ...run(['C3', 'C3', 'C3', 'C3'], .3, .35, .22, .25)] },
  { name: 'long-windows', events: run(['C3', 'E3', 'G3', 'A3', 'F3', 'D3', 'B3', 'C3'], .2, 2.7, .25) },
  // Additional validation cases: do not tune thresholds to these results.
  { name: 'validation-low-scale', events: run(['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2'], .17, .19, .14) },
  { name: 'validation-sevenths', events: [...chord(['C2', 'E2', 'G2', 'B2'], .11, .6), ...chord(['D2', 'F2', 'A2', 'C3'], 1.1, .6)] },
  { name: 'validation-rapid-repeats', events: run(['D3', 'D3', 'D3', 'D3', 'D3'], .25, .12, .085) },
  { name: 'validation-descending-run', events: run(['B3', 'G3', 'E3', 'C3', 'B2', 'G2', 'E2'], .37, .21, .17) },
  { name: 'validation-soft-arpeggio', events: run(['A2', 'C3', 'E3', 'G3', 'E3', 'C3'], .34, .23, .29, .12) },
  { name: 'validation-octaves-delayed', events: [...chord(['D2', 'F2', 'A2'], .19, 1.4), ...chord(['D3', 'F3', 'A3'], .6, .45, .2)] },
  { name: 'validation-noisy-scale', events: run(['D3', 'F3', 'A3', 'C3'], .28, .3, .22), noise: .002 },
  { name: 'validation-noise-only', events: [], noise: .002 },
  { name: 'validation-silence', events: [] },
  { name: 'validation-chunk-seam', events: [...chord(['D3', 'F3', 'A3'], 19.7, 1), ...run(['C3', 'E3', 'G3'], 21, .24, .18)] },
];

export function matchNotes(notes: NoteEvent[], expected: { midi: number; startSec: number }[], tolerance: number) {
  const edges = expected.map(e => notes.map((n, i) => ({ i, distance: Math.abs(n.startSec - e.startSec), midi: n.midi }))
    .filter(n => n.midi === e.midi && n.distance <= tolerance).sort((a, b) => a.distance - b.distance).map(n => n.i));
  const owner = new Map<number, number>();
  const assign = (index: number, visited: Set<number>): boolean => {
    for (const candidate of edges[index]) {
      if (visited.has(candidate)) continue;
      visited.add(candidate);
      const previous = owner.get(candidate);
      if (previous === undefined || assign(previous, visited)) {
        owner.set(candidate, index);
        return true;
      }
    }
    return false;
  };
  expected.forEach((_, i) => assign(i, new Set()));
  const tp = owner.size, fp = notes.length - tp, fn = expected.length - tp;
  return { tp, fp, fn, precision: tp / Math.max(1, notes.length), recall: tp / Math.max(1, expected.length),
    f1: 2 * tp / Math.max(1, 2 * tp + fp + fn) };
}

/** Development-only browser benchmark. Samples stay on this device. */
export async function runPianoBenchmark(sensitivity: DetectionSensitivity = 'balanced') {
  const sampleRate = 22050;
  const context = new AudioContext({ sampleRate });
  try {
    const samples = new Map<string, Float32Array>();
    for (const name of Object.keys(MIDI)) {
      const url = new URL(`../../../../assets/audio/${name}.mp3`, import.meta.url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Missing benchmark sample: ${name}`);
      samples.set(name, (await context.decodeAudioData(await response.arrayBuffer())).getChannelData(0).slice());
    }
    const results = [];
    for (const fixture of PIANO_FIXTURES) {
      const duration = Math.max(1, ...fixture.events.map(e => e[1] + e[2])) + .3;
      const signal = new Float32Array(Math.ceil(duration * sampleRate));
      let random = 12345;
      if (fixture.noise) {
        for (let i = 0; i < signal.length; i++) {
          random = (Math.imul(1664525, random) + 1013904223) >>> 0;
          signal[i] = (random / 2 ** 32 * 2 - 1) * fixture.noise;
        }
      }
      for (const [name, start, length, gain] of fixture.events) {
        const sample = samples.get(name)!;
        for (let i = 0; i < Math.min(sample.length, length * sampleRate); i++) {
          signal[Math.round(start * sampleRate) + i] += sample[i] * gain * Math.min(1, (length * sampleRate - i) / (.015 * sampleRate));
        }
      }
      const peak = signal.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
      if (peak > .9) for (let i = 0; i < signal.length; i++) signal[i] *= .9 / peak;
      const expected = fixture.events.map(([name, startSec, durationSec]) => ({ midi: MIDI[name], startSec, durationSec }));
      const started = performance.now();
      const result = await analyzeAudio(signal, sampleRate, 'keyboard', undefined, { sensitivity });
      results.push({ name: fixture.name, expected, notes: result.notes, chords: result.chords,
        at50ms: matchNotes(result.notes, expected, .05), at100ms: matchNotes(result.notes, expected, .1),
        elapsedMs: performance.now() - started });
    }
    return { sensitivity, results };
  } finally {
    await context.close();
  }
}
