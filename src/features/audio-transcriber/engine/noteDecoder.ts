export interface ActivationNote {
  startFrame: number;
  durationFrames: number;
  pitchMidi: number;
  amplitude: number;
}

/** Independent pitch tracks: neighboring semitones may be genuine chord tones. */
export function decodeActivations(
  frames: number[][], onsets: number[][],
  settings: { onset: number; frame: number; minFrames: number; releaseFrames: number; minMidi: number; maxMidi: number; sustain: number; sustainFrames: number },
): ActivationNote[] {
  const notes: ActivationNote[] = [];
  for (let midi = settings.minMidi; midi <= settings.maxMidi; midi++) {
    const column = midi - 21;
    let start = -1, lastVoiced = -1, sum = 0, count = 0;
    let sustainedFrames = 0;
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
      if (start < 0) {
        sustainedFrames = activation >= settings.sustain ? sustainedFrames + 1 : 0;
        const recovered = sustainedFrames >= settings.sustainFrames;
        // A quiet sustained pitch can lack an onset peak. Require consecutive
        // evidence before recovering it, then retain its original start time.
        if (attack || activation >= Math.max(0.5, settings.frame + 0.15) || recovered) {
          start = recovered ? f - sustainedFrames + 1 : f;
          lastVoiced = f;
          for (let previous = start; previous < f; previous++) {
            sum += frames[previous][column] ?? 0;
            count++;
          }
          sustainedFrames = 0;
        }
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
