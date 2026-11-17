import { Note } from 'tonal';
import { escapeXml, harmonyXml } from '../../../shared/utils/musicXmlHarmony';
import { keyFifths } from './intervals';
import { DIVISIONS, barTicks, eventTicks, type ScoreEvent, type TextScore } from './textScore';

const NOTE_TYPES: Record<string, string> = { w: 'whole', h: 'half', q: 'quarter', '8': 'eighth', '16': '16th' };
const BEAT_TYPES: Record<number, string> = { 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th' };

function pitchXml(name: string): string {
  const n = Note.get(name);
  return `<pitch><step>${n.letter}</step>${n.alt ? `<alter>${n.alt}</alter>` : ''}<octave>${n.oct}</octave></pitch>`;
}

function noteXml(e: ScoreEvent, tuplet: 'start' | 'stop' | null): string {
  const ties = `${e.tieStop ? '<tie type="stop"/>' : ''}${e.tieStart ? '<tie type="start"/>' : ''}`;
  const tied = `${e.tieStop ? '<tied type="stop"/>' : ''}${e.tieStart ? '<tied type="start"/>' : ''}`;
  const notations = tied || tuplet ? `<notations>${tied}${tuplet ? `<tuplet type="${tuplet}"/>` : ''}</notations>` : '';
  const triplet = e.triplet ? '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>' : '';
  return `<note>${e.rest ? '<rest/>' : pitchXml(e.pitch)}<duration>${eventTicks(e)}</duration>${ties}<voice>1</voice><type>${NOTE_TYPES[e.dur]}</type>${e.dotted ? '<dot/>' : ''}${triplet}${notations}</note>`;
}

/** Single-part MusicXML for a parsed text score. Chord-only bars are written as slash beats. */
export function textToMusicXml(score: TextScore): string {
  const key = score.key ? `<key><fifths>${keyFifths(score.key)}</fifths><mode>${score.key.minor ? 'minor' : 'major'}</mode></key>` : '';
  const clef = score.clef === 'bass' ? '<clef><sign>F</sign><line>4</line></clef>' : '<clef><sign>G</sign><line>2</line></clef>';
  const beatTicks = 96 / score.time.beatType;
  // Placeholder pitch on the middle line: slash noteheads only show the beat.
  const slash = `<note>${pitchXml(score.clef === 'bass' ? 'D3' : 'B4')}<duration>${beatTicks}</duration><voice>1</voice><type>${BEAT_TYPES[score.time.beatType]}</type><stem>none</stem><notehead>slash</notehead></note>`;

  const measures = score.bars.map((bar, i) => {
    const attributes = i === 0
      ? `<attributes><divisions>${DIVISIONS}</divisions>${key}<time><beats>${score.time.beats}</beats><beat-type>${score.time.beatType}</beat-type></time>${clef}</attributes>`
      : '';
    let content = '';
    if (bar.events.length) {
      let tripletRun = 0;
      for (const e of bar.events) {
        let tuplet: 'start' | 'stop' | null = null;
        if (e.triplet) {
          const position = tripletRun % 3;
          tuplet = position === 0 ? 'start' : position === 2 ? 'stop' : null;
          tripletRun++;
        } else {
          tripletRun = 0;
        }
        content += (e.chord ? harmonyXml(e.chord) : '') + noteXml(e, tuplet);
      }
    } else {
      const beatsPerChord = barTicks(score.time) / bar.chords.length / beatTicks;
      for (const symbol of bar.chords) content += harmonyXml(symbol) + slash.repeat(beatsPerChord);
    }
    return `<measure number="${i + 1}">${attributes}${content}</measure>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${escapeXml(score.title || 'Untitled')}</work-title></work><part-list><score-part id="P1"><part-name>Part</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}
