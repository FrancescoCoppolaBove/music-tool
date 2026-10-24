import type { ChordEvent, NoteEvent } from '../types';
import { Note } from 'tonal';

export const DIVISIONS = 12;
export const KEY_SIGNATURES: Record<'major' | 'minor', Record<string, number>> = {
  major: { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 },
  minor: { A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, 'D#': 6, 'A#': 7, D: -1, G: -2, C: -3, F: -4, Bb: -5, Eb: -6, Ab: -7 },
};
export function normalizeScoreKey(key: string): string {
  const [root, mode] = key.split(' ');
  if (mode !== 'major' && mode !== 'minor') return 'C major';
  if (KEY_SIGNATURES[mode][root] !== undefined) return key;
  const chroma = Note.chroma(root);
  const equivalent = Object.keys(KEY_SIGNATURES[mode]).find(name => chroma !== null && Note.chroma(name) === chroma);
  return equivalent ? `${equivalent} ${mode}` : 'C major';
}
export const METERS = ['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '11/4', '13/4', '5/8', '6/8', '7/8', '9/8', '11/8', '12/8', '13/8'];
export interface ScoreSection { id: string; name: string; bars: number; meter: string; bpm: number }
export interface BarAnchor { bar: number; seconds: number }
export interface ScoreSettings {
  offset: number; sections: ScoreSection[]; anchors: BarAnchor[];
  grid: 'eighth' | 'sixteenth' | 'triplet'; mode: 'harmony' | 'rhythm'; key: string;
}
export interface ScoreEvent {
  tick: number; duration: number; symbol: string; rest: boolean;
  tieIn?: boolean; tieOut?: boolean; review?: boolean;
}
export interface ScoreBar {
  number: number; section: string; meter: string; bpm: number;
  startSec: number; endSec: number; ticks: number; events: ScoreEvent[];
}
export type BarEdits = Record<number, ScoreEvent[]>;
export const gridTicks = (grid: ScoreSettings['grid']) => grid === 'sixteenth' ? 3 : grid === 'triplet' ? 4 : 6;

export function validateSettings(settings: ScoreSettings): void {
  if (!Number.isFinite(settings.offset) || settings.offset < 0) throw new Error('First bar start must be zero or greater.');
  if (!['eighth', 'sixteenth', 'triplet'].includes(settings.grid) || !['harmony', 'rhythm'].includes(settings.mode)) throw new Error('Invalid score mode or rhythm grid.');
  if (typeof settings.key !== 'string' || normalizeScoreKey(settings.key) !== settings.key) throw new Error('Choose a supported key signature.');
  if (!Array.isArray(settings.sections) || !settings.sections.length || settings.sections.length > 32) throw new Error('Use between 1 and 32 sections.');
  let bars = 0;
  for (const section of settings.sections) {
    if (!Number.isInteger(section.bars) || section.bars < 1 || !METERS.includes(section.meter)) throw new Error('Each section needs a supported meter and a positive whole number of bars.');
    if (!Number.isFinite(section.bpm) || section.bpm < 20 || section.bpm > 320) throw new Error('Quarter-note BPM must be between 20 and 320.');
    if (typeof section.name !== 'string' || section.name.length > 100) throw new Error('Section names must be at most 100 characters.');
    bars += section.bars;
  }
  if (bars > 512) throw new Error('A score can contain at most 512 bars.');
  if (!Array.isArray(settings.anchors)) throw new Error('Invalid bar anchors.');
  let previousBar = 1, previousTime = settings.offset;
  for (const anchor of [...settings.anchors].sort((a, b) => a.bar - b.bar)) {
    if (!Number.isInteger(anchor.bar) || anchor.bar <= previousBar || anchor.bar > bars ||
        !Number.isFinite(anchor.seconds) || anchor.seconds <= previousTime) throw new Error('Bar anchors must have distinct bar numbers after bar 1 and increasing audio times.');
    previousBar = anchor.bar; previousTime = anchor.seconds;
  }
}

export function buildBarTimeline(settings: ScoreSettings): ScoreBar[] {
  validateSettings(settings);
  const bars: ScoreBar[] = [];
  let seconds = settings.offset;
  for (const section of settings.sections) {
    const [count, unit] = section.meter.split('/').map(Number);
    const ticks = count * 4 / unit * DIVISIONS;
    for (let i = 0; i < section.bars; i++) {
      const endSec = seconds + ticks / DIVISIONS * 60 / section.bpm;
      bars.push({ number: bars.length + 1, section: i === 0 ? section.name : '', meter: section.meter,
        bpm: section.bpm, startSec: seconds, endSec, ticks, events: [] });
      seconds = endSec;
    }
  }
  const nominal = [...bars.map(bar => bar.startSec), seconds];
  const anchors = [{ bar: 1, seconds: settings.offset }, ...settings.anchors].sort((a, b) => a.bar - b.bar);
  const mapped = (index: number): number => {
    let a = 0;
    while (a + 1 < anchors.length && anchors[a + 1].bar - 1 <= index) a++;
    const left = anchors[a], right = anchors[a + 1];
    const delta = nominal[index] - nominal[left.bar - 1];
    return left.seconds + (right ? delta / (nominal[right.bar - 1] - nominal[left.bar - 1]) * (right.seconds - left.seconds) : delta);
  };
  return bars.map((bar, index) => ({ ...bar, startSec: mapped(index), endSec: mapped(index + 1) }));
}

/** Fill gaps with rests and reject conflicting edits rather than silently moving them. */
export function normalizeEvents(events: ScoreEvent[], ticks: number): ScoreEvent[] {
  const result: ScoreEvent[] = [];
  let cursor = 0;
  for (const event of [...events].sort((a, b) => a.tick - b.tick)) {
    if (!Number.isInteger(event.tick) || !Number.isInteger(event.duration) || event.duration <= 0 || event.tick < cursor || event.tick + event.duration > ticks || typeof event.rest !== 'boolean' || typeof event.symbol !== 'string' || event.symbol.length > 80) {
      throw new Error('Events must fit inside the bar, use positive durations and not overlap.');
    }
    if (event.tick > cursor) result.push({ tick: cursor, duration: event.tick - cursor, rest: true, symbol: '' });
    result.push({ ...event, symbol: event.symbol.trim() });
    cursor = event.tick + event.duration;
  }
  if (cursor < ticks) result.push({ tick: cursor, duration: ticks - cursor, rest: true, symbol: '' });
  return result;
}

export function buildScore(notes: NoteEvent[], chords: ChordEvent[], settings: ScoreSettings, edits: BarEdits = {}): ScoreBar[] {
  const bars = buildBarTimeline(settings);
  const step = gridTicks(settings.grid);
  const sorted = [...notes].sort((a, b) => a.startSec - b.startSec);
  const attacks: { start: number; end: number; confidence: number }[] = [];
  for (const note of sorted) {
    const last = attacks[attacks.length - 1];
    if (last && note.startSec - last.start <= 0.035) {
      last.end = Math.max(last.end, note.startSec + note.durationSec);
      last.confidence = Math.min(last.confidence, note.confidence ?? 1);
    } else attacks.push({ start: note.startSec, end: note.startSec + note.durationSec, confidence: note.confidence ?? 1 });
  }
  // A new attack supersedes the previous rhythmic gesture, even under pedal.
  attacks.forEach((attack, i) => { if (attacks[i + 1]) attack.end = Math.min(attack.end, attacks[i + 1].start); });
  const harmonyAt = (seconds: number): string => {
    const matches = chords.filter(c => c.startSec <= seconds + 0.04 && c.startSec + (c.durationSec ?? 0) > seconds);
    return matches.sort((a, b) => b.startSec - a.startSec)[0]?.symbol ?? '';
  };
  return bars.map(bar => {
    if (edits[bar.number]) return { ...bar, events: normalizeEvents(edits[bar.number], bar.ticks) };
    const secondsPerTick = (bar.endSec - bar.startSec) / bar.ticks;
    const snap = (seconds: number) => Math.round((seconds - bar.startSec) / secondsPerTick / step) * step;
    const events: ScoreEvent[] = [];
    if (settings.mode === 'rhythm') {
      for (const attack of attacks.filter(a => a.start < bar.endSec && a.end > bar.startSec)) {
        const tick = Math.max(0, Math.min(bar.ticks - 1, snap(attack.start)));
        const end = Math.min(bar.ticks, Math.max(tick + Math.min(step, bar.ticks - tick), snap(attack.end)));
        const previous = events[events.length - 1];
        if (previous?.tick === tick) { previous.duration = Math.max(previous.duration, end - tick); continue; }
        if (previous && previous.tick + previous.duration > tick) previous.duration = tick - previous.tick;
        events.push({ tick, duration: end - tick, symbol: harmonyAt(Math.max(bar.startSec, attack.start)), rest: false,
          tieIn: attack.start < bar.startSec - 0.04, tieOut: attack.end > bar.endSec + 0.04,
          review: attack.confidence < 0.4 || Math.abs(bar.startSec + tick * secondsPerTick - attack.start) > Math.min(0.12, secondsPerTick * step * 0.45) && attack.start >= bar.startSec });
      }
    } else {
      const unit = 4 / Number(bar.meter.split('/')[1]) * DIVISIONS;
      const boundaries = new Set<number>([0, bar.ticks]);
      for (let tick = unit; tick < bar.ticks; tick += unit) boundaries.add(tick);
      for (const chord of chords) if (chord.startSec >= bar.startSec && chord.startSec < bar.endSec) boundaries.add(Math.max(0, Math.min(bar.ticks, snap(chord.startSec))));
      const ticks = [...boundaries].sort((a, b) => a - b);
      for (let i = 0; i < ticks.length - 1; i++) {
        const tick = ticks[i], end = ticks[i + 1];
        const s = bar.startSec + tick * secondsPerTick, e = bar.startSec + end * secondsPerTick;
        const sounding = notes.some(n => n.startSec < e && n.startSec + n.durationSec > s);
        events.push({ tick, duration: end - tick, symbol: sounding ? harmonyAt(s) : '', rest: !sounding });
      }
    }
    return { ...bar, events: normalizeEvents(events, bar.ticks) };
  });
}
