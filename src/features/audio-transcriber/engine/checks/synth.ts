// src/features/audio-transcriber/engine/checks/synth.ts
// Generatori di segnali di test per gli script di verifica dell'engine.

export const SR = 44100;

/** Tono con armonici (ampiezze relative) e breve fade in/out anti-click. */
export function tone(
  freq: number,
  durSec: number,
  harmonics: number[] = [1, 0.5, 0.25],
  amp = 0.4,
): Float32Array {
  const n = Math.round(durSec * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let h = 0; h < harmonics.length; h++) {
      v += harmonics[h] * Math.sin((2 * Math.PI * freq * (h + 1) * i) / SR);
    }
    const fade = Math.min(1, i / (0.01 * SR), (n - i) / (0.01 * SR));
    out[i] = amp * v * fade;
  }
  return out;
}

export function silence(durSec: number): Float32Array {
  return new Float32Array(Math.round(durSec * SR));
}

export function concat(...sigs: Float32Array[]): Float32Array {
  const total = sigs.reduce((s, x) => s + x.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  for (const s of sigs) { out.set(s, off); off += s.length; }
  return out;
}

export function mix(...sigs: Float32Array[]): Float32Array {
  if (!sigs.length) return new Float32Array(0);
  const len = Math.max(...sigs.map(s => s.length));
  const out = new Float32Array(len);
  for (const s of sigs) for (let i = 0; i < s.length; i++) out[i] += s[i];
  return out;
}

/** Burst di rumore (20ms) a intervalli regolari — simula click ritmici. */
export function clicks(bpm: number, count: number): Float32Array {
  const beatSec = 60 / bpm;
  const out = new Float32Array(Math.round(count * beatSec * SR));
  const burst = Math.round(0.02 * SR);
  for (let c = 0; c < count; c++) {
    const start = Math.round(c * beatSec * SR);
    for (let i = 0; i < burst && start + i < out.length; i++) {
      out[start + i] = (Math.random() * 2 - 1) * 0.8 * (1 - i / burst);
    }
  }
  return out;
}

export function assert(cond: boolean, msg: string): void {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}
