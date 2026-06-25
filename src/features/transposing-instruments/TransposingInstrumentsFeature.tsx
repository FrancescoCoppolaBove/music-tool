import { useState, useMemo } from 'react';
import { Note, Interval, Key } from 'tonal';
import { audioPlayer } from '../ear-training/utils/audio-player';

// ── Instrument data ───────────────────────────────────────────────────────────
// `toWritten` is the interval applied to a CONCERT (sounding) pitch to obtain the
// WRITTEN pitch the player reads. A Bb trumpet sounds a major 2nd lower than
// written, so written = concert + M2.

interface Instrument {
  id: string;
  name: string;
  pitch: string;        // "Bb", "Eb", "F", "A", "C"
  toWritten: string;    // Tonal interval: concert → written
  group: string;
  sounds: string;       // human description
}

const INSTRUMENTS: Instrument[] = [
  // Concert pitch (non-transposing)
  { id: 'flute',    name: 'Flute / Oboe / Piano', pitch: 'C',  toWritten: '1P',  group: 'Concert (C)',    sounds: 'Sounds as written — no transposition.' },
  { id: 'cello',    name: 'Strings / Voice / Bassoon', pitch: 'C', toWritten: '1P', group: 'Concert (C)', sounds: 'Sounds as written — no transposition.' },
  // Bb instruments
  { id: 'trumpet',  name: 'Trumpet in B♭',        pitch: 'Bb', toWritten: '2M',  group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.' },
  { id: 'clarinet', name: 'Clarinet in B♭',       pitch: 'Bb', toWritten: '2M',  group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.' },
  { id: 'sopsax',   name: 'Soprano Sax in B♭',    pitch: 'Bb', toWritten: '2M',  group: 'B♭ instruments', sounds: 'Sounds a major 2nd LOWER than written.' },
  { id: 'tenorsax', name: 'Tenor Sax in B♭',      pitch: 'Bb', toWritten: '9M',  group: 'B♭ instruments', sounds: 'Sounds a major 9th LOWER (octave + tone).' },
  // Eb instruments
  { id: 'altosax',  name: 'Alto Sax in E♭',       pitch: 'Eb', toWritten: '6M',  group: 'E♭ instruments', sounds: 'Sounds a major 6th LOWER than written.' },
  { id: 'barisax',  name: 'Baritone Sax in E♭',   pitch: 'Eb', toWritten: '13M', group: 'E♭ instruments', sounds: 'Sounds an octave + major 6th LOWER.' },
  { id: 'ebclar',   name: 'Clarinet in E♭',       pitch: 'Eb', toWritten: '-3m', group: 'E♭ instruments', sounds: 'Sounds a minor 3rd HIGHER than written.' },
  // F instruments
  { id: 'horn',     name: 'French Horn in F',     pitch: 'F',  toWritten: '5P',  group: 'F instruments',  sounds: 'Sounds a perfect 5th LOWER than written.' },
  { id: 'enghorn',  name: 'English Horn in F',    pitch: 'F',  toWritten: '5P',  group: 'F instruments',  sounds: 'Sounds a perfect 5th LOWER than written.' },
  // A instrument
  { id: 'aclar',    name: 'Clarinet in A',        pitch: 'A',  toWritten: '3m',  group: 'A instruments',  sounds: 'Sounds a minor 3rd LOWER than written.' },
];

const GROUPS = ['Concert (C)', 'B♭ instruments', 'E♭ instruments', 'F instruments', 'A instruments'];

const CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function invertInterval(ivl: string): string {
  // Reverse direction: written → concert is the inverse of concert → written.
  const semis = Interval.semitones(ivl) ?? 0;
  return Interval.fromSemitones(-semis);
}

function simpleKeySig(tonicPc: string): { text: string; alteration: number } {
  try {
    const k = Key.majorKey(tonicPc);
    return { text: k.keySignature || '(none)', alteration: k.alteration ?? 0 };
  } catch {
    return { text: '—', alteration: 0 };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransposingInstrumentsFeature() {
  const [instId, setInstId] = useState('trumpet');
  const [direction, setDirection] = useState<'concertToWritten' | 'writtenToConcert'>('concertToWritten');
  const [noteIdx, setNoteIdx] = useState(0); // index into CHROMATIC
  const [octave, setOctave] = useState(4);

  const inst = INSTRUMENTS.find(i => i.id === instId)!;
  const inputPc = CHROMATIC[noteIdx];
  const inputNote = `${inputPc}${octave}`;

  // The interval to apply, given the chosen direction.
  const appliedIvl = direction === 'concertToWritten' ? inst.toWritten : invertInterval(inst.toWritten);

  const outputNote = useMemo(() => Note.transpose(inputNote, appliedIvl), [inputNote, appliedIvl]);
  const outputPc = Note.pitchClass(outputNote);

  const inputLabel = direction === 'concertToWritten' ? 'Concert (sounding)' : 'Written (on the page)';
  const outputLabel = direction === 'concertToWritten' ? 'Written (on the page)' : 'Concert (sounding)';

  // Key signature comparison — treat the chosen pitch class as a major tonic.
  const inputSig = simpleKeySig(inputPc);
  const outputSig = simpleKeySig(outputPc);

  // A concert C major scale, as the instrument must read it (written).
  const cMajorConcert = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const writtenScale = useMemo(
    () => cMajorConcert.map(n => Note.pitchClass(Note.transpose(`${n}4`, inst.toWritten))),
    [inst.toWritten],
  );

  async function playComparison() {
    // Play input note, then output note, so the relationship is audible.
    await audioPlayer.playNote(inputNote, 1);
    await audioPlayer.delay(650);
    await audioPlayer.playNote(outputNote, 1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>Transposing Instruments</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          See the difference between the note an instrument <em>reads</em> and the note it actually <em>sounds</em>. Essential for arranging, score-reading and conducting.
        </p>
      </div>

      {/* Instrument picker */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Instrument</label>
        {GROUPS.map(g => (
          <div key={g}>
            <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 6, fontWeight: 600 }}>{g}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INSTRUMENTS.filter(i => i.group === g).map(i => (
                <button key={i.id} onClick={() => setInstId(i.id)} style={{
                  padding: '6px 12px',
                  background: instId === i.id ? '#7c3aed20' : '#0d1117',
                  border: `1px solid ${instId === i.id ? '#7c3aed' : '#30363d'}`,
                  borderRadius: 8, color: instId === i.id ? '#c4b5fd' : '#8b949e',
                  fontSize: 12.5, cursor: 'pointer', fontWeight: instId === i.id ? 600 : 400,
                }}>{i.name}</button>
              ))}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12.5, color: '#06b6d4', background: '#06b6d410', border: '1px solid #06b6d430', borderRadius: 8, padding: '8px 12px' }}>
          🎺 {inst.sounds}
        </div>
      </div>

      {/* Direction toggle */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([
          { id: 'concertToWritten', label: 'Concert → Written', hint: 'I have the sounding pitch, what does the player read?' },
          { id: 'writtenToConcert', label: 'Written → Concert', hint: 'I see the part, what pitch actually sounds?' },
        ] as const).map(d => (
          <button key={d.id} onClick={() => setDirection(d.id)} title={d.hint} style={{
            flex: '1 1 220px', padding: '12px 16px', textAlign: 'left',
            background: direction === d.id ? '#7c3aed18' : '#161b22',
            border: `1px solid ${direction === d.id ? '#7c3aed' : '#30363d'}`,
            borderRadius: 10, cursor: 'pointer',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: direction === d.id ? '#c4b5fd' : '#e6edf3' }}>{d.label}</div>
            <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{d.hint}</div>
          </button>
        ))}
      </div>

      {/* Note picker */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{inputLabel} note</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CHROMATIC.map((pc, i) => (
            <button key={pc} onClick={() => setNoteIdx(i)} style={{
              padding: '6px 11px',
              background: noteIdx === i ? '#7c3aed20' : '#0d1117',
              border: `1px solid ${noteIdx === i ? '#7c3aed' : '#30363d'}`,
              borderRadius: 6, color: noteIdx === i ? '#c4b5fd' : '#6b7280',
              fontSize: 13, cursor: 'pointer', fontFamily: 'monospace', fontWeight: noteIdx === i ? 700 : 400,
            }}>{pc}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Octave:</span>
          {[3, 4, 5].map(o => (
            <button key={o} onClick={() => setOctave(o)} style={{
              padding: '4px 12px',
              background: octave === o ? '#7c3aed20' : '#0d1117',
              border: `1px solid ${octave === o ? '#7c3aed' : '#30363d'}`,
              borderRadius: 6, color: octave === o ? '#c4b5fd' : '#6b7280',
              fontSize: 12, cursor: 'pointer', fontFamily: 'monospace',
            }}>{o}</button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div style={{ background: '#0d1117', border: '1px solid #7c3aed40', borderRadius: 12, padding: '20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
        {/* input */}
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{inputLabel}</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'monospace', color: '#e6edf3' }}>{inputPc}</div>
          <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{inputNote}</div>
        </div>

        {/* arrow + interval */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>{Interval.semitones(appliedIvl)! >= 0 ? '+' : ''}{appliedIvl}</div>
          <div style={{ fontSize: 26, color: '#7c3aed' }}>→</div>
          <button onClick={playComparison} style={{ fontSize: 11, color: '#c4b5fd', background: '#7c3aed20', border: '1px solid #7c3aed', borderRadius: 20, padding: '3px 12px', cursor: 'pointer' }}>🔊 Hear both</button>
        </div>

        {/* output */}
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: 11, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{outputLabel}</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'monospace', color: '#c4b5fd' }}>{outputPc}</div>
          <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{outputNote}</div>
        </div>
      </div>

      {/* Key signature comparison */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{inputLabel} key</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace' }}>{inputPc} major</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            {inputSig.alteration === 0 ? 'no sharps/flats' : `${inputSig.text} (${Math.abs(inputSig.alteration)} ${inputSig.alteration > 0 ? 'sharp' : 'flat'}${Math.abs(inputSig.alteration) > 1 ? 's' : ''})`}
          </div>
        </div>
        <div style={{ flex: '1 1 200px', background: '#161b22', border: '1px solid #7c3aed40', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{outputLabel} key</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd', fontFamily: 'monospace' }}>{outputPc} major</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            {outputSig.alteration === 0 ? 'no sharps/flats' : `${outputSig.text} (${Math.abs(outputSig.alteration)} ${outputSig.alteration > 0 ? 'sharp' : 'flat'}${Math.abs(outputSig.alteration) > 1 ? 's' : ''})`}
          </div>
        </div>
      </div>

      {/* Concert C scale as written for instrument */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
          A concert C-major scale, as {inst.name} reads it
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>
          When the ensemble plays a concert C major, this is what the {inst.name} part shows on the page.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {cMajorConcert.map((concert, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{concert}</span>
              <span style={{ fontSize: 16, color: '#7c3aed' }}>↓</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#c4b5fd', fontFamily: 'monospace', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '4px 9px' }}>{writtenScale[i]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: '#4b5563' }}>
          <span>↑ concert (sounds)</span>
          <span style={{ color: '#7c3aed' }}>↓ written (on the page)</span>
        </div>
      </div>

      {/* Theory note */}
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 18px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          📖 Why transposing instruments exist
        </summary>
        <div style={{ marginTop: 12, fontSize: 13, color: '#c9d1d9', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 10px' }}>
            A transposing instrument is named after the pitch that sounds when the player reads a written <strong>C</strong>.
            A B♭ trumpet plays a written C and you hear a concert B♭. This lets a player switch between
            instruments of the same family (e.g. clarinets in B♭ and A) using the same fingerings — only the part is rewritten.
          </p>
          <p style={{ margin: 0 }}>
            <strong>The rule:</strong> to write a part for a transposing instrument, transpose the concert pitch
            <em> up</em> by the instrument's interval. To find what actually sounds, transpose the written part
            <em> down</em> by the same interval. The key signature shifts with it — that's why a B♭ trumpet
            reads two sharps when the band is in concert C.
          </p>
        </div>
      </details>
    </div>
  );
}
