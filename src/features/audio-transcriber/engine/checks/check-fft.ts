// src/features/audio-transcriber/engine/checks/check-fft.ts
import { hannWindow, magnitudeSpectrum } from '../dsp';

function assert(cond: boolean, msg: string): void {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}

const SR = 44100;
const N = 4096;
const freq = 1000;
const signal = new Float32Array(N);
for (let i = 0; i < N; i++) signal[i] = Math.sin((2 * Math.PI * freq * i) / SR);

const mag = magnitudeSpectrum(signal, hannWindow(N));

let peakBin = 0;
for (let i = 1; i < mag.length; i++) if (mag[i] > mag[peakBin]) peakBin = i;

const expectedBin = Math.round(freq / (SR / N)); // ≈ 93
assert(Math.abs(peakBin - expectedBin) <= 1, `peak bin ${peakBin}, expected ~${expectedBin}`);
assert(mag.length === N / 2, `mag length ${mag.length}, expected ${N / 2}`);

console.log('OK check-fft — peak bin', peakBin);
