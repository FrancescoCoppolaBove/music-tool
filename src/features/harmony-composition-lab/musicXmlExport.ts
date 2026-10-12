import { Chord, Note } from 'tonal';

function xmlEscape(value: string): string {
  return value.replace(/[<>&'\"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] ?? character);
}

function spellPitch(pitch: string, octave: number) {
  const match = pitch.match(/^([A-G])([#b]*)$/);
  if (!match) return null;
  const alter = [...match[2]].reduce((sum, accidental) => sum + (accidental === '#' ? 1 : -1), 0);
  return { step: match[1], alter, octave };
}

export function buildMusicXml(args: { title: string; chords: string[]; bpm: number; meter: string }): string {
  const [numeratorRaw, denominatorRaw] = args.meter.split('/').map(Number);
  const numerator = Math.max(1, Math.min(32, numeratorRaw || 4));
  const denominator = [2, 4, 8, 16].includes(denominatorRaw) ? denominatorRaw : 4;
  const divisions = 2;
  const duration = Math.round(numerator * (4 / denominator) * divisions);
  const measures = args.chords.map((symbol, index) => {
    const chord = Chord.get(symbol);
    let previousMidi = -1;
    const notes = chord.notes.map((pitch, noteIndex) => {
      let octave = noteIndex === 0 ? 3 : 4;
      let midi = Note.midi(`${pitch}${octave}`) ?? -1;
      while (midi >= 0 && midi <= previousMidi) {
        octave++;
        midi = Note.midi(`${pitch}${octave}`) ?? -1;
      }
      previousMidi = midi;
      const spelled = spellPitch(pitch, octave);
      if (!spelled) return '';
      return `<note>${noteIndex ? '<chord/>' : ''}<pitch><step>${spelled.step}</step>${spelled.alter ? `<alter>${spelled.alter}</alter>` : ''}<octave>${spelled.octave}</octave></pitch><duration>${duration}</duration><voice>1</voice></note>`;
    }).join('');
    const content = chord.empty || !notes ? `<note><rest measure="yes"/><duration>${duration}</duration></note>` : notes;
    const attributes = index === 0 ? `<attributes><divisions>${divisions}</divisions><time><beats>${numerator}</beats><beat-type>${denominator}</beat-type></time></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${Math.max(40, Math.min(220, Math.round(args.bpm)))}</per-minute></metronome></direction-type><sound tempo="${Math.max(40, Math.min(220, Math.round(args.bpm)))}"/></direction>` : '';
    return `<measure number="${index + 1}">${attributes}${content}</measure>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n<score-partwise version="4.0"><work><work-title>${xmlEscape(args.title)}</work-title></work><part-list><score-part id="P1"><part-name>Harmony sketch</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}
