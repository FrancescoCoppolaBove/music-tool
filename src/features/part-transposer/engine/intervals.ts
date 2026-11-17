import { Key } from 'tonal';
import type { KeySpec } from './textScore';

export type { KeySpec };

/** Key signature (MusicXML fifths) of a major or minor key. */
export function keyFifths(key: KeySpec): number {
  return (key.minor ? Key.minorKey(key.tonic) : Key.majorKey(key.tonic)).alteration;
}
