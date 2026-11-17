import { Chord, Note } from 'tonal';
import { keyFifths } from './intervals';

/**
 * Plain-text part syntax, used for manual input and as the photo reader's output:
 *   key: Eb / time: 4/4 / clef: treble / title: …
 *   | [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Fm7] [Bb7] |
 * Pitches are absolute (not relative to the key signature).
 */
export type DurationCode = 'w' | 'h' | 'q' | '8' | '16';

export interface ScoreEvent {
  rest: boolean;
  pitch: string;        // 'Eb4'; '' for rests
  dur: DurationCode;
  dotted: boolean;
  triplet: boolean;
  tieStart: boolean;
  tieStop: boolean;
  chord?: string;
}

/** A bar holds events, or only chord symbols (rendered as slash beats). */
export interface TextBar { events: ScoreEvent[]; chords: string[] }

export interface KeySpec { tonic: string; minor: boolean }

export interface TextScore {
  title: string;
  key: KeySpec | null;
  time: { beats: number; beatType: number };
  clef: 'treble' | 'bass';
  bars: TextBar[];
}

export interface ParseError { bar: number; message: string }

/** Ticks per quarter note: integer for dotted 16ths (9) and 16th triplets (4). */
export const DIVISIONS = 24;
const BASE_TICKS: Record<DurationCode, number> = { w: 96, h: 48, q: 24, '8': 12, '16': 6 };

export function eventTicks(e: Pick<ScoreEvent, 'dur' | 'dotted' | 'triplet'>): number {
  let ticks = BASE_TICKS[e.dur];
  if (e.dotted) ticks = ticks * 3 / 2;
  if (e.triplet) ticks = ticks * 2 / 3;
  return ticks;
}

export function barTicks(time: TextScore['time']): number {
  return time.beats * 96 / time.beatType;
}

const NOTE_RE = /^([A-G](?:##|#|bb|b)?)(\d):(w|h|q|8|16)(\.?)(~?)$/;
const REST_RE = /^r:(w|h|q|8|16)(\.?)$/;
const TOKEN_RE = /\[[^\]]*\]|\(3|\)|[^\s[\]()]+/g;
const TONIC_RE = /^([A-Ga-g](?:#|b)?)(m?)$/;
const LOWER_NOTE_RE = /^[a-g](?:##|#|bb|b)?\d:/;
const HEADER_RE = /^(key|time|clef|title)\s*:\s*(.*)$/i;

function formatBeats(ticks: number, beatType: number): string {
  const beats = ticks / (96 / beatType);
  return Number.isInteger(beats) ? String(beats) : String(Number(beats.toFixed(2)));
}

/** Applies header lines to `score` and returns the remaining body lines. */
function parseHeaders(lines: string[], score: TextScore, errors: ParseError[]): string[] {
  const body: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const header = line.match(HEADER_RE);
    if (!header) {
      if (line) body.push(line);
      continue;
    }
    const value = header[2].trim();
    switch (header[1].toLowerCase()) {
      case 'title':
        score.title = value;
        break;
      case 'key': {
        const m = value.match(TONIC_RE);
        const key = m ? { tonic: m[1][0].toUpperCase() + m[1].slice(1), minor: m[2] === 'm' } : null;
        if (key && Math.abs(keyFifths(key)) <= 7) score.key = key;
        else if (key) errors.push({ bar: 0, message: `Tonalità non valida: «${value}» (usa l'enarmonica, es. E)` });
        else errors.push({ bar: 0, message: `Tonalità non valida: «${value}» (es. Eb, Cm, F#m)` });
        break;
      }
      case 'time': {
        const m = value.match(/^(\d{1,2})\/(2|4|8|16)$/);
        if (m && Number(m[1]) > 0) score.time = { beats: Number(m[1]), beatType: Number(m[2]) };
        else errors.push({ bar: 0, message: `Tempo non valido: «${value}» (es. 4/4, 3/4, 6/8)` });
        break;
      }
      case 'clef': {
        const v = value.toLowerCase();
        if (v === 'treble' || v === 'bass') score.clef = v;
        else errors.push({ bar: 0, message: `Chiave non valida: «${value}» (treble o bass)` });
        break;
      }
    }
  }
  return body;
}

export function parseTextScore(source: string): { score: TextScore | null; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const score: TextScore = { title: '', key: null, time: { beats: 4, beatType: 4 }, clef: 'treble', bars: [] };
  const body = parseHeaders(source.replace(/♭/g, 'b').replace(/♯/g, '#').split('\n'), score, errors);

  const segments = body.join(' ').split('|').map(s => s.trim()).filter(Boolean);
  if (!segments.length) errors.push({ bar: 0, message: 'Nessuna battuta: scrivi le battute tra | … |' });

  let openTie: string | null = null; // spelled name of a note waiting for its tied continuation
  segments.forEach((segment, i) => {
    const barNo = i + 1;
    const fail = (message: string) => errors.push({ bar: barNo, message: `Battuta ${barNo}: ${message}` });
    const bar: TextBar = { events: [], chords: [] };
    let pending: string[] = [];
    let tripletCount = -1; // -1 = outside a triplet group
    let tokenError = false;

    for (const raw of segment.match(TOKEN_RE) ?? []) {
      const token = LOWER_NOTE_RE.test(raw) ? raw[0].toUpperCase() + raw.slice(1) : raw;
      if (token.startsWith('[')) {
        const symbol = token.slice(1, -1).trim();
        if (Chord.get(symbol).empty) { tokenError = true; fail(`sigla non riconosciuta «${symbol}»`); }
        else pending.push(symbol);
        continue;
      }
      if (token === '(3') {
        if (tripletCount >= 0) fail('terzina annidata');
        tripletCount = 0;
        continue;
      }
      if (token === ')') {
        if (tripletCount < 0) fail('«)» senza «(3»');
        else if (tripletCount !== 3) fail('una terzina deve contenere 3 valori');
        tripletCount = -1;
        continue;
      }
      const note = token.match(NOTE_RE);
      const rest = token.match(REST_RE);
      if (!note && !rest) {
        tokenError = true;
        fail(`simbolo non riconosciuto «${token}»`);
        continue;
      }
      const triplet = tripletCount >= 0;
      const event: ScoreEvent = note
        ? { rest: false, pitch: `${note[1]}${note[2]}`, dur: note[3] as DurationCode, dotted: note[4] === '.', triplet, tieStart: note[5] === '~', tieStop: false }
        : { rest: true, pitch: '', dur: rest![1] as DurationCode, dotted: rest![2] === '.', triplet, tieStart: false, tieStop: false };
      if (triplet) tripletCount++;
      if (openTie !== null) {
        if (event.rest || Note.get(event.pitch).name !== openTie) fail('la legatura ~ deve collegare due note uguali');
        else event.tieStop = true;
        openTie = null;
      }
      if (event.tieStart) openTie = Note.get(event.pitch).name;
      if (pending.length > 1) fail('più sigle sulla stessa nota');
      if (pending.length) event.chord = pending[0];
      pending = [];
      bar.events.push(event);
    }

    if (openTie !== null && !bar.events.length) {
      fail('legatura ~ verso una battuta senza note');
      openTie = null;
    }
    if (tripletCount >= 0) fail('terzina non chiusa: manca «)»');
    if (!bar.events.length) bar.chords = pending;
    else if (pending.length) fail('sigla senza nota dopo: mettila prima della nota');

    if (bar.events.length) {
      const total = bar.events.reduce((sum, e) => sum + eventTicks(e), 0);
      if (total !== barTicks(score.time)) {
        fail(`durata ${formatBeats(total, score.time.beatType)}/${score.time.beatType} invece di ${score.time.beats}/${score.time.beatType}`);
      }
    } else if (bar.chords.length) {
      if (score.time.beats % bar.chords.length) {
        fail(`${bar.chords.length} sigle non dividono una battuta da ${score.time.beats}/${score.time.beatType}: aggiungi le note`);
      }
    } else if (!tokenError) {
      fail('battuta vuota');
    }
    score.bars.push(bar);
  });
  if (openTie !== null) errors.push({ bar: segments.length, message: `Battuta ${segments.length}: legatura ~ senza nota successiva` });

  return { score: errors.length ? null : score, errors };
}
