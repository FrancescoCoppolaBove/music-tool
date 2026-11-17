export const EXAMPLE = `title: Esempio
key: Eb
time: 4/4
| [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Cm7] C5:h. r:q | [Fm7] [Bb7] | [Ebmaj7] Eb4:w |`;

export const TRUMPET = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>Blue Bossa</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Trumpet in B♭</part-name>
      <part-name-display><display-text>Trumpet in B</display-text><accidental-text>flat</accidental-text></part-name-display>
      <part-abbreviation>Tpt.</part-abbreviation>
      <part-abbreviation-display><display-text>Tpt.</display-text></part-abbreviation-display>
      <score-instrument id="P1-I1"><instrument-name>B♭ Trumpet</instrument-name></score-instrument>
      <midi-device id="P1-I1" port="1"></midi-device>
      <midi-instrument id="P1-I1"><midi-program>57</midi-program></midi-instrument>
    </score-part>
    <score-part id="P2"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>-1</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef><transpose><diatonic>-1</diatonic><chromatic>-2</chromatic></transpose></attributes>
      <direction placement="below"><direction-type><dynamics><mf/></dynamics></direction-type></direction>
      <harmony><root><root-step>F</root-step></root><kind text="">major</kind></harmony>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type><lyric><text>la</text></lyric></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><instrument id="P1-I1"/><voice>1</voice><type>quarter</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1"><attributes><divisions>1</divisions></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure>
  </part>
</score-partwise>`;

export const SLASH_CHORD_MINOR = `<score-partwise version="4.0"><part-list><score-part id="P1"><part-name>X</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>-3</fifths><mode>minor</mode></key></attributes><harmony><root><root-step>C</root-step></root><kind text="m7">minor-seventh</kind><bass><bass-step>B</bass-step><bass-alter>-1</bass-alter></bass></harmony><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure></part></score-partwise>`;
