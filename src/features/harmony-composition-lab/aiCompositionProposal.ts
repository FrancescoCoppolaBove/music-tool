import { Chord } from 'tonal';

export type AiCompositionProposal = {
  title: string;
  explanation: string;
  tonic: string;
  mode: string;
  bpm: number;
  meter: string;
  chords: string[];
};

export function parseAiCompositionProposal(raw: string, keys: readonly string[], modes: readonly string[], meters: readonly string[]): AiCompositionProposal {
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The assistant did not return a JSON proposal. Try again with a more specific request.');

  let value: Partial<AiCompositionProposal>;
  try { value = JSON.parse(clean.slice(start, end + 1)) as Partial<AiCompositionProposal>; }
  catch { throw new Error('The assistant returned unreadable proposal data. Try again.'); }

  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 80
    || typeof value.explanation !== 'string' || !value.explanation.trim() || value.explanation.length > 600) {
    throw new Error('The proposal is missing a title or explanation. Try again.');
  }
  if (typeof value.tonic !== 'string' || !keys.includes(value.tonic)
    || typeof value.mode !== 'string' || !modes.includes(value.mode)) {
    throw new Error('The proposal uses a key or mode this lab does not support.');
  }
  if (typeof value.bpm !== 'number' || !Number.isInteger(value.bpm) || value.bpm < 40 || value.bpm > 220
    || typeof value.meter !== 'string' || !meters.includes(value.meter)) {
    throw new Error('The proposal has an unsupported tempo or meter.');
  }
  if (!Array.isArray(value.chords) || value.chords.length < 1 || value.chords.length > 24
    || value.chords.some(chord => typeof chord !== 'string' || chord.length > 24 || Chord.get(chord).empty)) {
    throw new Error('One or more proposed chord symbols could not be interpreted. The editor was not changed.');
  }
  return {
    title: value.title.trim(), explanation: value.explanation.trim(), tonic: value.tonic,
    mode: value.mode, bpm: value.bpm, meter: value.meter, chords: [...value.chords],
  };
}
