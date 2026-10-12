import { Chord, Note } from 'tonal';

const PPQ = 480;
type MidiEvent = { tick: number; priority: number; bytes: number[] };

function variableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function ascii(value: string): number[] { return [...value].map(char => char.charCodeAt(0)); }
function chunk(name: string, data: number[]): number[] {
  const size = data.length;
  return [...ascii(name), (size >>> 24) & 255, (size >>> 16) & 255, (size >>> 8) & 255, size & 255, ...data];
}

export function buildMidiFile(args: { chords: string[]; bpm: number; meter: string }): Uint8Array {
  const bpm = Math.max(40, Math.min(220, Math.round(args.bpm)));
  const [numeratorRaw, denominatorRaw] = args.meter.split('/').map(Number);
  const numerator = Math.max(1, Math.min(32, numeratorRaw || 4));
  const denominator = [2, 4, 8, 16].includes(denominatorRaw) ? denominatorRaw : 4;
  const barTicks = Math.round(numerator * (4 / denominator) * PPQ);
  const tempo = Math.round(60_000_000 / bpm);
  const events: MidiEvent[] = [
    { tick: 0, priority: -2, bytes: [0xff, 0x51, 0x03, (tempo >>> 16) & 255, (tempo >>> 8) & 255, tempo & 255] },
    { tick: 0, priority: -1, bytes: [0xff, 0x58, 0x04, numerator, Math.log2(denominator), 24, 8] },
  ];

  args.chords.forEach((symbol, index) => {
    const chord = Chord.get(symbol);
    if (chord.empty) return;
    const start = index * barTicks;
    let previousMidi = -1;
    chord.notes.forEach((pitch, noteIndex) => {
      let octave = noteIndex === 0 ? 3 : 4;
      let midi = Note.midi(`${pitch}${octave}`) ?? -1;
      while (midi <= previousMidi) { octave++; midi = Note.midi(`${pitch}${octave}`) ?? -1; }
      previousMidi = midi;
      if (midi < 0 || midi > 127) return;
      events.push({ tick: start, priority: 1, bytes: [0x90, midi, 82] });
      events.push({ tick: start + barTicks, priority: 0, bytes: [0x80, midi, 0] });
    });
  });

  const endTick = Math.max(barTicks, args.chords.length * barTicks);
  events.push({ tick: endTick, priority: 2, bytes: [0xff, 0x2f, 0x00] });
  events.sort((a, b) => a.tick - b.tick || a.priority - b.priority);
  const track: number[] = [];
  let lastTick = 0;
  for (const event of events) {
    track.push(...variableLength(event.tick - lastTick), ...event.bytes);
    lastTick = event.tick;
  }
  const header = [...ascii('MThd'), 0, 0, 0, 6, 0, 0, 0, 1, (PPQ >>> 8) & 255, PPQ & 255];
  return new Uint8Array([...header, ...chunk('MTrk', track)]);
}
