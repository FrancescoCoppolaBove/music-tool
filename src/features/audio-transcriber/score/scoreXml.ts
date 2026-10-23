import { DIVISIONS, KEY_SIGNATURES, type ScoreBar, type ScoreEvent } from './scoreModel';

export const escapeXml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
const KINDS: Record<string, string> = { '': 'major', M: 'major', m: 'minor', min: 'minor', '7': 'dominant', maj7: 'major-seventh', M7: 'major-seventh', m7: 'minor-seventh', '6': 'major-sixth', m6: 'minor-sixth', dim: 'diminished', dim7: 'diminished-seventh', m7b5: 'half-diminished', aug: 'augmented', sus4: 'suspended-fourth', sus2: 'suspended-second', '9': 'dominant-ninth', maj9: 'major-ninth', m9: 'minor-ninth', '13': 'dominant-13th' };
function harmony(symbol: string, display: boolean): string {
  const parsed = symbol.match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/);
  if (!parsed) return `<direction placement="above"><direction-type><words>${escapeXml(symbol)}</words></direction-type></direction>`;
  const [, root, accidental, quality, bass, bassAccidental] = parsed;
  const alter = (a: string) => a ? `<root-alter>${a === '#' ? 1 : -1}</root-alter>` : '';
  const custom = KINDS[quality] === undefined;
  // OSMD drops custom kind text. Keep the semantic harmony in the exchange
  // file, and use its exact written label in our display/print rendition.
  if (custom && display) return `<direction placement="above"><direction-type><words font-weight="bold">${escapeXml(symbol)}</words></direction-type></direction>`;
  return `<harmony><root><root-step>${root}</root-step>${alter(accidental)}</root><kind text="${escapeXml(quality)}" use-symbols="no">${KINDS[quality] ?? 'other'}</kind>${bass ? `<bass><bass-step>${bass}</bass-step>${bassAccidental ? `<bass-alter>${bassAccidental === '#' ? 1 : -1}</bass-alter>` : ''}</bass>` : ''}</harmony>`;
}
const VALUES = [
  { ticks: 48, type: 'whole' }, { ticks: 36, type: 'half', dot: true }, { ticks: 24, type: 'half' },
  { ticks: 18, type: 'quarter', dot: true }, { ticks: 12, type: 'quarter' }, { ticks: 9, type: 'eighth', dot: true },
  { ticks: 8, type: 'quarter', triplet: true }, { ticks: 6, type: 'eighth' },
  { ticks: 4, type: 'eighth', triplet: true }, { ticks: 3, type: '16th' }, { ticks: 2, type: '16th', triplet: true }, { ticks: 1, type: '32nd', triplet: true },
];
function eventXml(event: ScoreEvent, bar: ScoreBar, slashAlter: number): string {
  let remaining = event.duration, tick = event.tick, result = '';
  const pulse = Number(bar.meter.split('/')[1]) === 8 && Number(bar.meter.split('/')[0]) % 3 === 0 ? 18 : 12;
  while (remaining > 0) {
    const toPulse = pulse - tick % pulse;
    const limit = tick % pulse ? Math.min(remaining, toPulse) : remaining;
    const value = VALUES.find(v => v.ticks <= limit)!;
    const tieIn = !event.rest && (tick > event.tick || event.tieIn);
    const tieOut = !event.rest && (remaining > value.ticks || event.tieOut);
    result += `<note${event.review ? ' color="#B7791F"' : ''}>${event.rest ? '<rest/>' : `<pitch><step>B</step>${slashAlter ? `<alter>${slashAlter}</alter>` : ''}<octave>4</octave></pitch>`}<duration>${value.ticks}</duration>${tieIn ? '<tie type="stop"/>' : ''}${tieOut ? '<tie type="start"/>' : ''}<voice>1</voice><type>${value.type}</type>${value.dot ? '<dot/>' : ''}${value.triplet ? '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>' : ''}${event.rest ? '' : '<stem>up</stem><notehead>slash</notehead>'}${tieIn || tieOut ? `<notations>${tieIn ? '<tied type="stop"/>' : ''}${tieOut ? '<tied type="start"/>' : ''}</notations>` : ''}</note>`;
    tick += value.ticks; remaining -= value.ticks;
  }
  return result;
}
export function buildChartXml(bars: ScoreBar[], title: string, key: string, display = false): string {
  const [root, mode] = key.split(' ');
  const fifths = KEY_SIGNATURES[mode === 'minor' ? 'minor' : 'major'][root] ?? 0;
  const measures = bars.map((bar, index) => {
    const [beats, unit] = bar.meter.split('/');
    const changed = index === 0 || bars[index - 1].meter !== bar.meter;
    let xml = `<measure number="${bar.number}">${index % 4 === 0 && index > 0 ? '<print new-system="yes"/>' : ''}`;
    if (changed || index === 0) xml += `<attributes>${index === 0 ? `<divisions>${DIVISIONS}</divisions><key><fifths>${fifths}</fifths><mode>${mode === 'minor' ? 'minor' : 'major'}</mode></key>` : ''}<time><beats>${beats}</beats><beat-type>${unit}</beat-type></time>${index === 0 ? '<clef><sign>G</sign><line>2</line></clef>' : ''}</attributes>`;
    if (index === 0 || bars[index - 1].bpm !== bar.bpm) xml += `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bar.bpm}</per-minute></metronome></direction-type><sound tempo="${bar.bpm}"/></direction>`;
    if (bar.section) xml += `<direction placement="above"><direction-type><rehearsal relative-y="25">${escapeXml(bar.section)}</rehearsal></direction-type></direction>`;
    let lastSymbol = '';
    for (const [eventIndex, source] of bar.events.entries()) {
      const previousBar = bars[index - 1], nextBar = bars[index + 1];
      const previous = previousBar?.events[previousBar.events.length - 1];
      const next = nextBar?.events[0];
      // Only connect ties across a genuine, still-present bar boundary.
      // Preview pages and edited neighbours must not leave dangling ties.
      const event = { ...source,
        tieIn: Boolean(source.tieIn && eventIndex === 0 && source.tick === 0 && previous?.tieOut && !previous.rest && previous.tick + previous.duration === previousBar.ticks && previousBar.number + 1 === bar.number),
        tieOut: Boolean(source.tieOut && eventIndex === bar.events.length - 1 && source.tick + source.duration === bar.ticks && next?.tieIn && !next.rest && next.tick === 0 && nextBar.number === bar.number + 1),
      };
      if (event.symbol && event.symbol !== lastSymbol && !event.rest) xml += harmony(event.symbol, display);
      if (event.rest) lastSymbol = ''; else if (event.symbol) lastSymbol = event.symbol;
      xml += eventXml(event, bar, fifths < 0 ? -1 : fifths === 7 ? 1 : 0);
    }
    return xml + (index === bars.length - 1 ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>' : '') + '</measure>';
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${escapeXml(title)}</work-title></work><defaults><scaling><millimeters>7</millimeters><tenths>40</tenths></scaling></defaults><part-list><score-part id="P1"><part-name>Rhythm / Harmony</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}
