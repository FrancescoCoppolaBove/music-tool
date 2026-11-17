import { INSTRUMENTS, type TransposingInstrument } from '../../../shared/utils/transposingInstruments';

/** Instruments offered by Part Transposer, in display order. */
const IDS = ['keyboard', 'bass', 'guitar', 'tenorsax', 'altosax', 'sopsax', 'trumpet'];

export const PART_INSTRUMENTS: TransposingInstrument[] = IDS.map(id => INSTRUMENTS.find(i => i.id === id)!);

export function partInstrument(id: string): TransposingInstrument {
  const found = PART_INSTRUMENTS.find(i => i.id === id);
  if (!found) throw new Error(`Unknown instrument: ${id}`);
  return found;
}
