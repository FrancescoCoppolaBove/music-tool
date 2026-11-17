import { Interval, Key, Note } from 'tonal';
import type { TransposingInstrument } from '../../../shared/utils/transposingInstruments';
import type { KeySpec } from './textScore';

export type { KeySpec };
export type Direction = 'up' | 'down';

/** Key signature (MusicXML fifths) of a major or minor key. */
export function keyFifths(key: KeySpec): number {
  return (key.minor ? Key.minorKey(key.tonic) : Key.majorKey(key.tonic)).alteration;
}

/** Major tonic of a key signature, e.g. -3 → Eb. */
export function fifthsTonic(fifths: number): string {
  return Note.transposeFifths('C', fifths)!;
}

// tonal types these as `string | undefined` (invalid input); every call here passes valid names.
const add = (a: string, b: string) => Interval.add(a, b)!;
const subtract = (a: string, b: string) => Interval.subtract(a, b)!;
const transpose = (note: string, ivl: string) => Note.transpose(note, ivl)!;

const ascending = (from: string, to: string) => Interval.distance(Note.pitchClass(from), Note.pitchClass(to));
const semitonesMod12 = (ivl: string) => (((Interval.semitones(ivl) ?? 0) % 12) + 12) % 12;

/** Concert key-change interval between two tonics, in the given direction. */
export function keyChangeInterval(fromTonic: string, toTonic: string, direction: Direction): string {
  const up = ascending(fromTonic, toTonic);
  if (semitonesMod12(up) === 0) return '1P';
  return direction === 'up' ? up : subtract(up, '8P');
}

/** Direction with the smaller jump; a tritone goes down. */
export function nearestDirection(fromTonic: string, toTonic: string): Direction {
  return semitonesMod12(ascending(fromTonic, toTonic)) < 6 ? 'up' : 'down';
}

/** Concert key of a part written for `instrument`. */
export function concertKey(written: KeySpec, instrument: TransposingInstrument): KeySpec {
  return { tonic: transpose(written.tonic, subtract('1P', instrument.toWritten)), minor: written.minor };
}

/** Written key of a concert key for `instrument`. */
export function writtenKey(concert: KeySpec, instrument: TransposingInstrument): KeySpec {
  return { tonic: transpose(concert.tonic, instrument.toWritten), minor: concert.minor };
}

/**
 * Interval from the source written pitch to the target written pitch: undo
 * the source instrument, change key, apply the target instrument. When the
 * target's written key would need more than 6 accidentals, the interval is
 * respelled enharmonically (± diminished 2nd = same pitch, 12 fifths apart).
 */
export function partInterval(opts: {
  source: TransposingInstrument;
  target: TransposingInstrument;
  keyChange: string;
  sourceFifths: number;
}): string {
  let ivl = add(subtract(opts.keyChange, opts.source.toWritten), opts.target.toWritten);
  const fifths = Key.majorKey(transpose(fifthsTonic(opts.sourceFifths), ivl)).alteration;
  if (fifths > 6) ivl = add(ivl, 'd2');
  else if (fifths < -6) ivl = subtract(ivl, 'd2');
  return ivl;
}
