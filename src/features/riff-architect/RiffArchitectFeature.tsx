import { useState } from 'react';
import { Scale, Note, Interval } from 'tonal';

interface RiffStyle {
  id: string;
  label: string;
  color: string;
  scaleName: string;
  feel: string;
  rhythmPattern: number[];
  emphasis: number[];
  approach: string;
  characteristics: string[];
  avoid: string[];
  seedMotif: string;
}

const STYLES: RiffStyle[] = [
  {
    id: 'blues',
    label: 'Blues / Soul',
    color: '#f59e0b',
    scaleName: 'minor pentatonic',
    feel: 'Shuffle / Swing triplet feel',
    rhythmPattern: [2,0,1,0,1,0,2,0,1,1,0,0,1,0,1,0],
    emphasis: [0,2,4],
    approach: 'Center the riff around the b3 and b7. Use call-and-response: state a short phrase, leave space, echo it.',
    characteristics: [
      'The b3 and b7 are the "blue notes" — lean on them',
      'Leave rests: silence is as important as the notes',
      'Call-and-response: a phrase followed by space for an answer',
      'Syncopate: land notes just before or after the beat',
    ],
    avoid: [
      'Running all sixteenth notes with no rests',
      'Starting every phrase on beat 1',
      'Avoiding the b5 (blues note) completely',
    ],
    seedMotif: 'b7 → Root → b3 → Root (leave a beat of silence after)',
  },
  {
    id: 'funk',
    label: 'Funk / Groove',
    color: '#10b981',
    scaleName: 'dorian',
    feel: 'Straight 16ths with heavy syncopation',
    rhythmPattern: [2,0,0,1,0,1,0,0,2,0,0,1,0,0,1,0],
    emphasis: [0,1,4,6],
    approach: 'Build around the root and b7. Place accents on the "e" and "ah" of beats (16th syncopation). The groove lives in the rhythm.',
    characteristics: [
      'The rhythm IS the riff — pitch matters less than pocket',
      'Accent the upbeats (the "and" and "ah" of each beat)',
      'Root and b7 create the harmonic foundation',
      'The 9th (2nd) adds a modern color above the root',
    ],
    avoid: [
      'Placing all notes on downbeats',
      'Overly busy lines that disrupt the groove',
      'Neglecting rests between phrases',
    ],
    seedMotif: 'Root (beat 1) → b7 ("and" of 2) → 9th ("e" of 3) → Root (beat 4)',
  },
  {
    id: 'modal',
    label: 'Modal / Cinematic',
    color: '#8b5cf6',
    scaleName: 'dorian',
    feel: 'Sparse, flowing — free from strict pulse',
    rhythmPattern: [2,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0],
    emphasis: [0,2,5],
    approach: 'Anchor on the root as a drone, then explore the characteristic tone (6th in Dorian, #4 in Lydian, b2 in Phrygian). Use long tones and space.',
    characteristics: [
      'The characteristic tone defines the mode — feature it',
      'Long sustained notes create atmosphere',
      'Melodic leaps (4ths, 5ths) sound open and cinematic',
      'Repetition of a motif with subtle variation builds hypnosis',
    ],
    avoid: [
      'Dense rhythmic activity',
      'Functional dominant→tonic motion (destroys the modal feeling)',
      'Ignoring the characteristic interval of the mode',
    ],
    seedMotif: 'Root (long) → characteristic degree → 5th → Root',
  },
  {
    id: 'jazz',
    label: 'Jazz / Bebop Line',
    color: '#06b6d4',
    scaleName: 'bebop major',
    feel: 'Swing 8ths — long-short, long-short',
    rhythmPattern: [2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    emphasis: [0,2,4,6],
    approach: 'Place chord tones (root, 3rd, 5th, 7th) on downbeats. Fill between with diatonic/chromatic passing tones. Approach any chord tone from a half-step below.',
    characteristics: [
      'Chord tones land on beats 1, 2, 3, 4 — passing tones on upbeats',
      'Chromatic approach: half-step below any target note',
      'Encircling: approach a note from above AND below alternately',
      'Lines flow continuously — think in long 8th-note streams',
    ],
    avoid: [
      'Landing on avoid notes (b9, natural 11 over major) on strong beats',
      'Stopping the line with rests mid-phrase',
      'Ignoring chord tone placement',
    ],
    seedMotif: 'Root → (chromatic passing) → 3rd → (diatonic) → 5th → approach → Root (octave)',
  },
  {
    id: 'minimalist',
    label: 'Minimalist / Ostinato',
    color: '#ec4899',
    scaleName: 'major',
    feel: 'Steady pulse — each repetition slightly varied',
    rhythmPattern: [2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0],
    emphasis: [0,2,4],
    approach: 'Take a 2-4 note cell and repeat it. Vary one element per repetition: change one pitch, shift the rhythm by one step, or add one note. Build density slowly.',
    characteristics: [
      'A short cell (2-4 notes) is your entire material',
      'Change only ONE thing per repetition — pitch OR rhythm, not both',
      'Let the pattern "phase" by shifting it rhythmically',
      'Silence (rests) makes the returning motif feel inevitable',
    ],
    avoid: [
      'Introducing too many different ideas',
      'Varying everything at once',
      'Losing the metric grid that anchors the ostinato',
    ],
    seedMotif: 'Root → 3rd → 5th → 3rd (repeat, then on rep 3: raise 3rd to 4th for tension)',
  },
];

const ROOTS = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

// Compute interval label between two consecutive scale notes
function getIntervalLabel(noteA: string, noteB: string): string {
  const semitones = Note.midi(`${noteB}4`) !== null && Note.midi(`${noteA}4`) !== null
    ? (Note.midi(`${noteB}4`)! - Note.midi(`${noteA}4`)! + 12) % 12
    : null;
  if (semitones === null) return '?';
  if (semitones === 1) return 'H';
  if (semitones === 2) return 'W';
  if (semitones === 3) return 'WH';
  if (semitones === 4) return '2W';
  return `${semitones}st`;
}

const DEVELOPMENT_TECHNIQUES = [
  {
    icon: '↻',
    title: 'Sequence',
    description: 'Repeat the motif transposed up by a diatonic step each time. Same shape, rising through the scale.',
    detail: 'Example: motif on root → same motif from 2nd → same from 3rd. The pattern stays recognizable while the pitch rises.',
  },
  {
    icon: '↕',
    title: 'Inversion',
    description: 'Flip every interval upside down: ascending becomes descending, descending becomes ascending. Same rhythm kept intact.',
    detail: 'Example: Root → up a 3rd → up a 2nd becomes Root → down a 3rd → down a 2nd. Mirror image of the original.',
  },
  {
    icon: '→',
    title: 'Displacement',
    description: 'Shift the motif one or two beats later in the bar. Same notes, new rhythmic feel against the downbeat.',
    detail: 'Example: if the motif starts on beat 1, restart it from beat 2 or the "and" of 1. The listener hears the same idea in a new light.',
  },
];

export default function RiffArchitectFeature() {
  const [styleId, setStyleId] = useState('blues');
  const [root, setRoot] = useState('A');

  const style = STYLES.find(s => s.id === styleId)!;
  const scaleData = Scale.get(`${root} ${style.scaleName}`);
  const notes = scaleData.notes.length > 0 ? scaleData.notes : ['C','D','E','F','G','A','B'];

  // Compute intervals between consecutive scale degrees
  const intervalLabels: string[] = [];
  for (let i = 0; i < notes.length - 1; i++) {
    intervalLabels.push(getIntervalLabel(notes[i], notes[i + 1]));
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: '#0d1117',
    minHeight: '100vh',
    color: '#e6edf3',
    padding: '0 0 64px 0',
  };

  const headerStyle: React.CSSProperties = {
    padding: '40px 32px 32px',
    borderBottom: '1px solid #21262d',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: '#e6edf3',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '6px',
  };

  const sectionPadStyle: React.CSSProperties = {
    padding: '24px 32px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6b7280',
    marginBottom: '10px',
  };

  const pillRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  };

  const mainGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    padding: '0 32px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#161b22',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #21262d',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#e6edf3',
    marginBottom: '4px',
  };

  const mutedTextStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Riff Architect</h1>
        <p style={subtitleStyle}>Build a riff from the ground up — theory-first, style-driven.</p>
      </div>

      {/* Controls */}
      <div style={{ ...sectionPadStyle, borderBottom: '1px solid #21262d' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={labelStyle}>Style</div>
          <div style={pillRowStyle}>
            {STYLES.map((s) => {
              const isActive = s.id === styleId;
              return (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '999px',
                    border: `1px solid ${isActive ? s.color : '#30363d'}`,
                    background: isActive ? `${s.color}22` : '#161b22',
                    color: isActive ? s.color : '#8b949e',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? `0 0 0 1px ${s.color}44, 0 0 12px ${s.color}22` : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={labelStyle}>Root Note</div>
          <div style={pillRowStyle}>
            {ROOTS.map((r) => {
              const isActive = r === root;
              return (
                <button
                  key={r}
                  onClick={() => setRoot(r)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: `1px solid ${isActive ? style.color : '#30363d'}`,
                    background: isActive ? `${style.color}22` : '#161b22',
                    color: isActive ? style.color : '#8b949e',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                    minWidth: '42px',
                    textAlign: 'center' as const,
                    boxShadow: isActive ? `0 0 0 1px ${style.color}44` : 'none',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-column grid */}
      <div style={{ padding: '24px 32px' }}>
        <div style={mainGridStyle}>
          {/* LEFT: Rhythm Blueprint */}
          <div>
            {/* Rhythm grid card */}
            <div style={{ ...cardStyle, marginBottom: '16px' }}>
              <div style={sectionTitleStyle}>Rhythmic Blueprint</div>
              <div style={mutedTextStyle}>{style.feel}</div>

              {/* 16-step grid */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' as const }}>
                {style.rhythmPattern.map((step, i) => {
                  const isAccent = step === 2;
                  const isNote = step === 1;
                  const isRest = step === 0;
                  return (
                    <div
                      key={i}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        border: isRest
                          ? '1px dashed #30363d'
                          : `1px solid ${isAccent ? style.color : `${style.color}66`}`,
                        background: isAccent
                          ? `${style.color}cc`
                          : isNote
                          ? `${style.color}44`
                          : '#21262d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isAccent ? `0 0 8px ${style.color}55` : 'none',
                        position: 'relative' as const,
                        flexShrink: 0,
                      }}
                    >
                      {isAccent && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d1117' }} />
                      )}
                      {isNote && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.color, opacity: 0.8 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Beat markers */}
              <div style={{ display: 'flex', marginBottom: '10px' }}>
                {[1,2,3,4].map((beat) => (
                  <div
                    key={beat}
                    style={{
                      width: `${4 * 44}px`,
                      fontSize: '11px',
                      color: '#6b7280',
                      fontWeight: 600,
                      paddingLeft: '2px',
                    }}
                  >
                    {beat}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#6b7280' }}>
                <span>
                  <span style={{ color: style.color, fontWeight: 700 }}>■</span> Accent
                </span>
                <span>
                  <span style={{ color: style.color, opacity: 0.6, fontWeight: 700 }}>▪</span> Note
                </span>
                <span>
                  <span style={{ color: '#30363d' }}>□</span> Rest
                </span>
              </div>
            </div>

            {/* Scale notes card */}
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Notes in this riff</div>
              <div style={{ ...mutedTextStyle, marginBottom: '12px' }}>
                {root} {style.scaleName} — emphasize the highlighted degrees
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                {notes.map((note, i) => {
                  const isEmphasized = style.emphasis.includes(i);
                  return (
                    <div
                      key={`${note}-${i}`}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: isEmphasized ? `${style.color}33` : '#21262d',
                        border: `1px solid ${isEmphasized ? style.color : '#30363d'}`,
                        fontSize: '13px',
                        fontWeight: isEmphasized ? 700 : 400,
                        color: isEmphasized ? style.color : '#8b949e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isEmphasized ? `0 0 6px ${style.color}33` : 'none',
                      }}
                    >
                      {note}
                      <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 400 }}>
                        {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Construction Guide */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
            {/* Seed Motif */}
            <div style={{ ...cardStyle, borderLeft: `3px solid ${style.color}` }}>
              <div style={{ ...labelStyle, color: style.color, marginBottom: '8px' }}>Starting point</div>
              <p style={{
                fontSize: '16px',
                fontStyle: 'italic',
                color: '#e6edf3',
                lineHeight: 1.5,
                margin: 0,
                fontWeight: 500,
              }}>
                "{style.seedMotif}"
              </p>
            </div>

            {/* Characteristics */}
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Characteristics</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                {style.characteristics.map((c, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#c9d1d9', lineHeight: 1.5 }}>
                    <span style={{ color: '#7c3aed', marginTop: '2px', fontSize: '10px', flexShrink: 0 }}>●</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Construction Approach */}
            <div style={{ ...cardStyle, background: '#1a1f2e', border: '1px solid #2d3348' }}>
              <div style={sectionTitleStyle}>Construction Approach</div>
              <p style={{ fontSize: '13px', color: '#c9d1d9', lineHeight: 1.6, margin: '10px 0 0 0' }}>
                {style.approach}
              </p>
            </div>

            {/* Interval Palette */}
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Interval Palette</div>
              <div style={{ ...mutedTextStyle, marginBottom: '12px' }}>Steps between scale degrees</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' as const }}>
                {notes.map((note, i) => (
                  <div key={`interval-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: '#21262d',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#e6edf3',
                      fontFamily: 'monospace',
                    }}>
                      {note}
                    </div>
                    {i < notes.length - 1 && (
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#06b6d4',
                        minWidth: '28px',
                        textAlign: 'center' as const,
                        background: '#06b6d412',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        border: '1px solid #06b6d422',
                      }}>
                        {intervalLabels[i]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid section */}
            <div style={{ ...cardStyle, background: '#1f1616', border: '1px solid #5c2020' }}>
              <div style={{ ...sectionTitleStyle, color: '#f87171' }}>Avoid</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0 0', display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                {style.avoid.map((a, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#f87171cc', lineHeight: 1.5 }}>
                    <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>✕</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Motif Development */}
      <div style={{ padding: '0 32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionTitleStyle}>Motif Development</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Three universal techniques to expand any motif into a full phrase or section.
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {DEVELOPMENT_TECHNIQUES.map((tech) => (
            <div
              key={tech.title}
              style={{
                ...cardStyle,
                borderTop: `2px solid ${style.color}66`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${style.color}22`,
                  border: `1px solid ${style.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: style.color,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {tech.icon}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e6edf3' }}>{tech.title}</div>
              </div>
              <p style={{ fontSize: '13px', color: '#c9d1d9', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                {tech.description}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, margin: 0, borderTop: '1px solid #21262d', paddingTop: '10px' }}>
                {tech.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
