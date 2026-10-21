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
    let lastAttack = -Infinity;
    let trackingThreshold = settings.frame;
    const close = (end: number) => {
      if (start >= 0 && end - start >= settings.minFrames && count >= settings.minFrames) {
        notes.push({ startFrame: start, durationFrames: end - start, pitchMidi: midi, amplitude: sum / count });
      }
      start = -1; lastVoiced = -1; sum = 0; count = 0;
    };
    for (let f = 0; f < frames.length; f++) {
      const activation = frames[f][column] ?? 0;
      const onset = onsets[f]?.[column] ?? 0;
      const localPeak = onset > (onsets[f - 1]?.[column] ?? 0) && onset >= (onsets[f + 1]?.[column] ?? 0);
      // Short runs may have weaker onsets than the surrounding chords. Recover
      // only when a pitch-specific onset and a fresh frame rise agree.
      const previousActivation = Math.max(frames[f - 1]?.[column] ?? 0, frames[f - 2]?.[column] ?? 0);
      const supportedAttack = onset >= settings.onset * 0.75 && activation >= settings.frame &&
        activation - previousActivation >= 0.15;
      const attack = localPeak && (onset >= settings.onset || supportedAttack);
      // Frame activation often rises a few frames after the onset peak. Look on
      // both sides so a softer repeated strike over pedal sustain is not merged.
      let precedingValley = activation, followingPeak = activation;
      if (attack && start >= 0) {
        for (let t = Math.max(start, f - 6); t < f; t++) {
          precedingValley = Math.min(precedingValley, frames[t][column] ?? 0);
        }
        for (let t = f + 1; t <= Math.min(frames.length - 1, f + 3); t++) {
          followingPeak = Math.max(followingPeak, frames[t][column] ?? 0);
        }
      }
      const renewedEnergy = onset >= settings.onset && followingPeak >= settings.frame &&
        followingPeak - precedingValley >= 0.12;
      // A broad onset can contain several local peaks. A weak later peak on a
      // sustained pitch is not a repeated key strike without renewed frame energy.
      const retrigger = attack && f - lastAttack >= Math.max(8, settings.minFrames) &&
        (onset >= Math.max(0.65, settings.onset) || supportedAttack || renewedEnergy);
      if (retrigger && start >= 0 && f - start >= settings.minFrames) close(f);
      if (start < 0) {
        sustainedFrames = activation >= settings.sustain ? sustainedFrames + 1 : 0;
        const recovered = sustainedFrames >= settings.sustainFrames;
        // A quiet sustained pitch can lack an onset peak. Require consecutive
        // evidence before recovering it, then retain its original start time.
        if (attack || activation >= Math.max(0.5, settings.frame + 0.15) || recovered) {
          start = recovered ? f - sustainedFrames + 1 : f;
          lastAttack = f;
          trackingThreshold = settings.frame;
          // A quiet melody attack over a held chord should not need the same
          // frame strength as a loud chord. Do not relax candidates sharing an
          // attack with stronger pitches: these may be harmonics or subharmonics.
          if (attack && onset >= Math.max(0.55, settings.onset)) {
            const simultaneousAttack = frames[f].some((_, other) => {
              if (other === column) return false;
              const lowerHarmonic = [12, 19, 24, 28, 31, 36].includes(column - other);
              for (let t = Math.max(0, f - 2); t <= Math.min(frames.length - 1, f + 2); t++) {
                if ((onsets[t]?.[other] ?? 0) >= settings.onset &&
                    (frames[t]?.[other] ?? 0) >= settings.frame * (lowerHarmonic ? 0.6 : 1)) return true;
              }
              return false;
            });
            if (!simultaneousAttack) trackingThreshold = settings.frame * 0.6;
          }
          lastVoiced = f;
          for (let previous = start; previous < f; previous++) {
            sum += frames[previous][column] ?? 0;
            count++;
          }
          sustainedFrames = 0;
        }
      }
      if (start >= 0) {
        if (activation >= trackingThreshold) { lastVoiced = f; sum += activation; count++; }
        if (f - lastVoiced >= settings.releaseFrames) close(lastVoiced + 1);
      }
    }
    close(lastVoiced + 1);
  }
  return notes;
}
