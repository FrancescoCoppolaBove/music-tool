/** Chord symbol ↔ MusicXML <harmony>, shared by the Audio Transcriber score and Part Transposer. */
export const escapeXml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);

export const CHORD_KINDS: Record<string, string> = { '': 'major', M: 'major', m: 'minor', min: 'minor', '7': 'dominant', maj7: 'major-seventh', M7: 'major-seventh', m7: 'minor-seventh', '6': 'major-sixth', m6: 'minor-sixth', dim: 'diminished', dim7: 'diminished-seventh', m7b5: 'half-diminished', aug: 'augmented', sus4: 'suspended-fourth', sus2: 'suspended-second', '9': 'dominant-ninth', maj9: 'major-ninth', m9: 'minor-ninth', '13': 'dominant-13th' };

/** MusicXML kind → its first (preferred) symbol suffix in CHORD_KINDS. */
export const KIND_SYMBOLS: Record<string, string> = {};
for (const [symbol, kind] of Object.entries(CHORD_KINDS)) KIND_SYMBOLS[kind] ??= symbol;

export const CHORD_SYMBOL_RE = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/;

const alterXml = (tag: string, accidental: string) => accidental ? `<${tag}>${accidental === '#' ? 1 : -1}</${tag}>` : '';

/** Bold chord label as a text direction (OSMD drops custom kind text). */
export function chordWordsXml(symbol: string): string {
  return `<direction placement="above"><direction-type><words font-weight="bold">${escapeXml(symbol)}</words></direction-type></direction>`;
}

/** Exchange-file <harmony> for a chord symbol; custom qualities keep their text with kind "other". */
export function harmonyXml(symbol: string): string {
  const parsed = symbol.match(CHORD_SYMBOL_RE);
  if (!parsed) return `<direction placement="above"><direction-type><words>${escapeXml(symbol)}</words></direction-type></direction>`;
  const [, root, accidental, quality, bass, bassAccidental] = parsed;
  return `<harmony><root><root-step>${root}</root-step>${alterXml('root-alter', accidental)}</root><kind text="${escapeXml(quality)}" use-symbols="no">${CHORD_KINDS[quality] ?? 'other'}</kind>${bass ? `<bass><bass-step>${bass}</bass-step>${alterXml('bass-alter', bassAccidental)}</bass>` : ''}</harmony>`;
}
