export interface ActivationNote {
  startFrame: number;
  durationFrames: number;
  pitchMidi: number;
  amplitude: number;
}

/** Independent pitch tracks: neighboring semitones may be genuine chord tones. */
export function decodeActivations(
  frames: number[][], onsets: number[][],
  settings: { onset: number; frame: number; minFrames: number; releaseFrames: number; minMidi: number; maxMidi: number },
): ActivationNote[] {
  const notes: ActivationNote[] = [];
  for (let midi = settings.minMidi; midi <= settings.maxMidi; midi++) {
    const column = midi - 21;
    let start = -1, lastVoiced = -1, sum = 0, count = 0;
    const close = (end: number) => {
      if (start >= 0 && end - start >= settings.minFrames && count >= settings.minFrames) {
        notes.push({ startFrame: start, durationFrames: end - start, pitchMidi: midi, amplitude: sum / count });
      }
      start = -1; lastVoiced = -1; sum = 0; count = 0;
    };
    for (let f = 0; f < frames.length; f++) {
      const activation = frames[f][column] ?? 0;
      const onset = onsets[f]?.[column] ?? 0;
      const attack = onset >= settings.onset &&
        onset > (onsets[f - 1]?.[column] ?? 0) && onset >= (onsets[f + 1]?.[column] ?? 0);
      if (attack && start >= 0 && f - start >= settings.minFrames) close(f);
      // Strong sustained activity can start a note even if its attack is absent.
      if (start < 0 && (attack || activation >= Math.max(0.5, settings.frame + 0.15))) {
        start = f;
        lastVoiced = f;
      }
      if (start >= 0) {
        if (activation >= settings.frame) { lastVoiced = f; sum += activation; count++; }
        if (f - lastVoiced >= settings.releaseFrames) close(lastVoiced + 1);
      }
    }
    close(lastVoiced + 1);
  }
  return notes;
}
