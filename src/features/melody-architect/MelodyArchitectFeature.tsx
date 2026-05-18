import { useState } from 'react';
import { Scale, Note } from 'tonal';

// ─── Data Structures ────────────────────────────────────────────────────────

interface ContourType {
  id: string;
  label: string;
  description: string;
  feel: string;
  points: { x: number; y: number }[];
  phraseTip: string;
}

const CONTOURS: ContourType[] = [
  {
    id: 'arch',
    label: 'Arch',
    description: 'Rises to a climax then resolves downward',
    feel: 'Satisfying, complete, vocal',
    points: [{ x: 0, y: 80 }, { x: 15, y: 65 }, { x: 30, y: 45 }, { x: 50, y: 10 }, { x: 70, y: 35 }, { x: 85, y: 60 }, { x: 100, y: 75 }],
    phraseTip: 'Place your highest note around beat 5-6 of an 8-bar phrase. Let the second half descend step by step to the root.',
  },
  {
    id: 'descending',
    label: 'Descending',
    description: 'Continuous downward motion from high to low',
    feel: 'Settling, resolving, introspective',
    points: [{ x: 0, y: 10 }, { x: 20, y: 25 }, { x: 40, y: 45 }, { x: 60, y: 60 }, { x: 80, y: 72 }, { x: 100, y: 85 }],
    phraseTip: 'Start on the 5th or octave, descend scale-wise. Use the 7th as a brief resting point before landing on the root.',
  },
  {
    id: 'ascending',
    label: 'Ascending',
    description: 'Continuous upward motion — building energy',
    feel: 'Growing tension, excitement, anticipation',
    points: [{ x: 0, y: 85 }, { x: 20, y: 72 }, { x: 40, y: 55 }, { x: 60, y: 38 }, { x: 80, y: 22 }, { x: 100, y: 10 }],
    phraseTip: 'Begin on the root or 3rd. Each sub-phrase should end slightly higher than the last. Reserve the peak for the final cadence.',
  },
  {
    id: 'wave',
    label: 'Wave',
    description: 'Multiple rises and falls — complex, conversational',
    feel: 'Dynamic, storytelling, unpredictable',
    points: [{ x: 0, y: 60 }, { x: 15, y: 30 }, { x: 30, y: 65 }, { x: 45, y: 20 }, { x: 60, y: 55 }, { x: 75, y: 25 }, { x: 90, y: 50 }, { x: 100, y: 75 }],
    phraseTip: 'Each "wave" should crest slightly lower or higher than the previous. Avoid landing on the same pitch too many times.',
  },
  {
    id: 'reciting',
    label: 'Reciting Tone',
    description: 'Centered on one pitch with brief departures',
    feel: 'Meditative, modal, chant-like',
    points: [{ x: 0, y: 50 }, { x: 12, y: 50 }, { x: 20, y: 30 }, { x: 30, y: 50 }, { x: 45, y: 50 }, { x: 55, y: 70 }, { x: 65, y: 50 }, { x: 80, y: 50 }, { x: 90, y: 35 }, { x: 100, y: 50 }],
    phraseTip: 'Choose the 5th as your reciting tone. Dip to the 3rd for color, rise to the 7th for tension. Always return to the center note.',
  },
  {
    id: 'stepLeap',
    label: 'Step → Leap',
    description: 'Scalar motion followed by a surprise leap',
    feel: 'Dramatic, unexpected, memorable',
    points: [{ x: 0, y: 70 }, { x: 20, y: 58 }, { x: 40, y: 45 }, { x: 55, y: 35 }, { x: 60, y: 10 }, { x: 75, y: 35 }, { x: 90, y: 55 }, { x: 100, y: 70 }],
    phraseTip: 'Walk stepwise for 3-4 notes, then leap an octave or a 6th. After the leap, step back down — the contrast creates drama.',
  },
];

// ─── Approach Techniques ────────────────────────────────────────────────────

interface ApproachTechnique {
  id: string;
  label: string;
  description: string;
  example: string;
  sound: string;
  usage: string;
}

const APPROACHES: ApproachTechnique[] = [
  {
    id: 'scale',
    label: 'Scale Approach',
    description: 'Approach target from one step above or below using a diatonic note',
    example: 'B → C  (approaching C from a step below)',
    sound: 'Smooth, natural, folk-like',
    usage: 'Use for simple, diatonic melodies. Natural and flowing.',
  },
  {
    id: 'chromatic',
    label: 'Chromatic Approach',
    description: 'A single half-step below the target note',
    example: 'Ab → A  (half-step below)',
    sound: 'Jazzy, smooth, sophisticated',
    usage: 'Approaching any note from exactly a semitone below. Works in any style for sophistication.',
  },
  {
    id: 'double_chromatic',
    label: 'Double Chromatic',
    description: 'Two consecutive half-steps leading to the target',
    example: 'Gb → G → Ab  (approaching Ab from two semitones below)',
    sound: 'Very jazz, bluesy, dramatic',
    usage: 'Add before an important chord tone. Creates strong forward motion.',
  },
  {
    id: 'encircling',
    label: 'Encircling',
    description: 'Approach from above AND below alternately before landing',
    example: 'Bb → G# → A  (above, then below, then target A)',
    sound: 'Bebop, sophisticated, playful',
    usage: 'Best on chord tones at phrase peaks. Creates a sense of "orbiting" before landing.',
  },
  {
    id: 'indirect',
    label: 'Indirect (Delayed)',
    description: 'Approach with a neighbor note — arrive at target after one extra step',
    example: 'C → B → C  (neighbor tone returning)',
    sound: 'Ornamental, classical, expressive',
    usage: 'Adds a gentle ornament to any note. Common in lyrical, vocal melodies.',
  },
];

// ─── Phrase Structures ──────────────────────────────────────────────────────

interface PhraseStructure {
  id: string;
  label: string;
  description: string;
  bars: string[];
  tip: string;
}

const PHRASE_STRUCTURES: PhraseStructure[] = [
  {
    id: 'qa',
    label: 'Question – Answer',
    description: 'First phrase ends on tension (5th or 7th), second resolves to root',
    bars: ['Phrase A: rises, ends on 5th', 'Phrase B: descends, resolves to root'],
    tip: 'The "question" creates expectation by ending on the 5th. The "answer" satisfies it by resolving to the root. Keep the rhythm similar in both halves.',
  },
  {
    id: 'statement',
    label: 'Statement – Elaboration',
    description: 'Bold opening phrase, then decorative elaboration of the same idea',
    bars: ['Statement: clear, direct', 'Elaboration: same idea, more notes'],
    tip: 'Play your motif simply first. Then repeat it with added passing tones, ornaments, or a different rhythmic subdivision.',
  },
  {
    id: 'sequence',
    label: 'Motivic Sequence',
    description: 'Repeat the opening motif transposed up or down by one scale step each time',
    bars: ['Motif on degree 1', 'Motif on degree 2', 'Motif on degree 3', 'Cadence'],
    tip: 'Sequences create immediate forward momentum. After 3 repetitions, break the pattern with a cadential figure — the ear expects the sequence to stop.',
  },
  {
    id: 'symmetric',
    label: 'Arch (Symmetric)',
    description: '8-bar arch: 4 bars of ascent, 4 bars mirroring back down',
    bars: ['Rise: bars 1-2', 'Peak: bars 3-4', 'Mirror: bars 5-6', 'Resolution: bars 7-8'],
    tip: 'The mirror descent does not have to be exact. Vary the rhythm or add a chromatic note to keep the descent fresh.',
  },
];

// ─── Motif Techniques ───────────────────────────────────────────────────────

interface MotifTechnique {
  id: string;
  label: string;
  description: string;
  before: string;
  after: string;
}

const MOTIF_TECHNIQUES: MotifTechnique[] = [
  {
    id: 'transpose',
    label: 'Transpose',
    description: 'Shift all notes up or down by the same interval',
    before: 'C → E → G',
    after: 'D → F# → A  (up a major 2nd)',
  },
  {
    id: 'invert',
    label: 'Invert',
    description: 'Flip all intervals: ascending becomes descending and vice versa',
    before: 'C → E → G  (up 3rd, up 3rd)',
    after: 'C → Ab → F  (down 3rd, down 3rd)',
  },
  {
    id: 'augment',
    label: 'Augment',
    description: 'Double all note durations — spacious, majestic feel',
    before: '♩ ♩ ♩  (quarter notes)',
    after: '𝅗 𝅗 𝅗  (half notes — same pitches)',
  },
  {
    id: 'diminish',
    label: 'Diminish',
    description: 'Halve all note durations — urgency and momentum',
    before: '♩ ♩ ♩  (quarter notes)',
    after: '♪♪ ♪♪ ♪♪  (eighth notes — same pitches)',
  },
  {
    id: 'rhythm_only',
    label: 'Rhythm Variation',
    description: 'Keep the same pitches, change the rhythm entirely',
    before: 'C E G  — ♩♩♩',
    after: 'C E G  — ♪ ♪♩ ♩  (same notes, new feel)',
  },
  {
    id: 'fragment',
    label: 'Fragmentation',
    description: 'Use only the first 1-2 notes of the motif as a cell',
    before: 'C → E → G → E → C',
    after: 'C → E  (just the opening interval, repeated)',
  },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const MODES = [
  { id: 'major', label: 'Major' },
  { id: 'dorian', label: 'Dorian' },
  { id: 'phrygian', label: 'Phrygian' },
  { id: 'lydian', label: 'Lydian' },
  { id: 'mixolydian', label: 'Mixolydian' },
  { id: 'minor', label: 'Minor (Aeolian)' },
];

const BEAT_GUIDE = [
  { beat: 1, strength: 'Strong', color: '#7c3aed', targets: 'Root, 5th, 3rd', sub: 'stable tones' },
  { beat: 2, strength: 'Medium', color: '#06b6d4', targets: '3rd, 7th', sub: 'color tones' },
  { beat: 3, strength: 'Med-Strong', color: '#7c3aed', targets: '5th, Root', sub: 'stability' },
  { beat: 4, strength: 'Weak', color: '#6b7280', targets: 'Leading tone, chromatic', sub: 'create motion' },
];

// ─── Helper: points to SVG polyline string ──────────────────────────────────

function pointsToPolyline(points: { x: number; y: number }[], w: number, h: number): string {
  return points.map(p => `${(p.x / 100) * w},${(p.y / 100) * h}`).join(' ');
}

function pointsToFillPath(points: { x: number; y: number }[], w: number, h: number): string {
  if (points.length === 0) return '';
  const linePoints = points.map(p => `${(p.x / 100) * w},${(p.y / 100) * h}`);
  return `M ${linePoints[0]} L ${linePoints.slice(1).join(' L ')} L ${w},${h} L 0,${h} Z`;
}

// ─── Degree color helper ─────────────────────────────────────────────────────

function degreeColor(index: number): string {
  if (index === 0) return '#f59e0b';
  if (index === 2) return '#7c3aed';
  if (index === 4) return '#06b6d4';
  if (index === 6) return '#ec4899';
  return '#4b5563';
}

function degreeName(index: number): string {
  const names = ['1st (Root)', '2nd', '3rd', '4th', '5th', '6th', '7th'];
  return names[index] ?? `${index + 1}th`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e6edf3' }}>{title}</h3>
      {subtitle && (
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{subtitle}</p>
      )}
    </div>
  );
}

function ContourMiniCard({
  contour,
  isActive,
  onClick,
}: {
  contour: ContourType;
  isActive: boolean;
  onClick: () => void;
}) {
  const W = 120;
  const H = 60;
  const accentColor = isActive ? '#7c3aed' : '#06b6d4';
  const polyStr = pointsToPolyline(contour.points, W, H);

  return (
    <button
      onClick={onClick}
      style={{
        background: isActive ? '#1a1040' : '#161b22',
        border: `2px solid ${isActive ? '#7c3aed' : '#30363d'}`,
        borderRadius: 10,
        padding: '10px 10px 8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        transform: isActive ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.15s ease',
        outline: 'none',
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`mini-grad-${contour.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d={pointsToFillPath(contour.points, W, H)}
          fill={`url(#mini-grad-${contour.id})`}
        />
        <polyline
          points={polyStr}
          fill="none"
          stroke={accentColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#e6edf3' : '#8b949e' }}>
        {contour.label}
      </span>
    </button>
  );
}

function ContourDetail({ contour }: { contour: ContourType }) {
  const W = 800;
  const H = 120;
  const polyStr = pointsToPolyline(contour.points, W, H);

  return (
    <div
      style={{
        background: '#161b22',
        border: '1px solid #7c3aed',
        borderRadius: 12,
        padding: '20px 24px',
        marginTop: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3' }}>{contour.label}</span>
          <span style={{ marginLeft: 10, fontSize: 13, color: '#6b7280' }}>{contour.description}</span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#06b6d4',
          background: '#0d2535', border: '1px solid #06b6d4', borderRadius: 20,
          padding: '3px 10px',
        }}>
          {contour.feel}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 120, display: 'block', borderRadius: 8 }}
      >
        <defs>
          <linearGradient id="contour-detail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="contour-fill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={pointsToFillPath(contour.points, W, H)}
          fill="url(#contour-fill-grad)"
        />
        <polyline
          points={polyStr}
          fill="none"
          stroke="url(#contour-detail-grad)"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {contour.points.map((pt, i) => (
          <circle
            key={i}
            cx={(pt.x / 100) * W}
            cy={(pt.y / 100) * H}
            r={4}
            fill="#7c3aed"
            stroke="#0d1117"
            strokeWidth={2}
          />
        ))}
      </svg>

      <div style={{
        marginTop: 14,
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: 8,
        padding: '10px 14px',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', marginRight: 8 }}>Phrase Tip</span>
        <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.6 }}>{contour.phraseTip}</span>
      </div>
    </div>
  );
}

function ScaleNotes({ notes }: { notes: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Scale Degrees
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {notes.map((note, i) => {
          const color = degreeColor(i);
          const simplifiedNote = Note.simplify(note) || note;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div style={{
                background: `${color}22`,
                border: `1.5px solid ${color}`,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 15,
                fontWeight: 700,
                color,
                minWidth: 38,
                textAlign: 'center',
              }}>
                {simplifiedNote}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{degreeName(i)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BeatGuide() {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Beat Strength Guide
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {BEAT_GUIDE.map(b => (
          <div
            key={b.beat}
            style={{
              background: '#0d1117',
              border: `1.5px solid ${b.color}44`,
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: `${b.color}22`, border: `2px solid ${b.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: b.color, flexShrink: 0,
              }}>
                {b.beat}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: b.color }}>{b.strength}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{b.targets}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{b.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApproachCard({ approach, isActive, onClick }: { approach: ApproachTechnique; isActive: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? '#12103a' : '#161b22',
        border: `1.5px solid ${isActive ? '#7c3aed' : '#30363d'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>{approach.label}</div>
      <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8, lineHeight: 1.5 }}>{approach.description}</div>
      <div style={{
        fontFamily: 'monospace', fontSize: 13, color: '#06b6d4',
        background: '#0d1117', border: '1px solid #30363d',
        borderRadius: 6, padding: '6px 10px', marginBottom: 8,
      }}>
        {approach.example}
      </div>
      <div style={{ fontSize: 12, color: '#7c3aed', fontStyle: 'italic', marginBottom: 6 }}>{approach.sound}</div>
      <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.5 }}>{approach.usage}</div>
    </div>
  );
}

function PhraseTimeline({ bars }: { bars: string[] }) {
  const colors = ['#7c3aed', '#06b6d4', '#7c3aed', '#06b6d4'];
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 12, marginBottom: 12 }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: `${colors[i % colors.length]}22`,
            border: `1.5px solid ${colors[i % colors.length]}`,
            borderRadius: 6,
            padding: '8px 6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: colors[i % colors.length], marginBottom: 3 }}>
            Segment {i + 1}
          </div>
          <div style={{ fontSize: 11, color: '#c9d1d9', lineHeight: 1.4 }}>{bar}</div>
        </div>
      ))}
    </div>
  );
}

function PhraseCard({
  structure,
  isActive,
  onClick,
}: {
  structure: PhraseStructure;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? '#12103a' : '#161b22',
        border: `1.5px solid ${isActive ? '#7c3aed' : '#30363d'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>{structure.label}</div>
      <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{structure.description}</div>

      {isActive && (
        <>
          <PhraseTimeline bars={structure.bars} />
          <div style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 8,
            padding: '10px 14px',
            marginTop: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', marginRight: 8 }}>Tip</span>
            <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.6 }}>{structure.tip}</span>
          </div>
        </>
      )}
    </div>
  );
}

function MotifCard({ technique }: { technique: MotifTechnique }) {
  return (
    <div style={{
      background: '#161b22',
      border: '1.5px solid #30363d',
      borderRadius: 10,
      padding: '14px 16px',
      transition: 'border-color 0.15s ease',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>{technique.label}</div>
      <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5, marginBottom: 10 }}>{technique.description}</div>
      <div style={{
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: 8,
        padding: '10px 14px',
        fontFamily: 'monospace',
        fontSize: 12,
      }}>
        <div style={{ color: '#6b7280', marginBottom: 4, fontSize: 11 }}>Before</div>
        <div style={{ color: '#c9d1d9', marginBottom: 8 }}>{technique.before}</div>
        <div style={{
          borderTop: '1px solid #30363d',
          paddingTop: 8,
        }}>
          <div style={{ color: '#6b7280', marginBottom: 4, fontSize: 11 }}>After</div>
          <div style={{ color: '#06b6d4' }}>{technique.after}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MelodyArchitectFeature() {
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState('major');
  const [contourId, setContourId] = useState('arch');
  const [structureId, setStructureId] = useState('qa');
  const [activeApproachId, setActiveApproachId] = useState<string | null>(null);

  const scaleData = Scale.get(`${root} ${mode}`);
  const notes = scaleData.notes.length > 0 ? scaleData.notes : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  const activeContour = CONTOURS.find(c => c.id === contourId) ?? CONTOURS[0];

  const selectStyle = {
    background: '#161b22',
    border: '1.5px solid #30363d',
    borderRadius: 8,
    color: '#e6edf3',
    fontSize: 14,
    padding: '8px 12px',
    cursor: 'pointer',
    outline: 'none',
    WebkitAppearance: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, color: '#e6edf3' }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#e6edf3', letterSpacing: '-0.02em' }}>
          Melody Architect
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          Shape, approach, and develop a melody from first principles.
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#8b949e' }}>Root Key</label>
          <select value={root} onChange={e => setRoot(e.target.value)} style={selectStyle}>
            {ROOTS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#8b949e' }}>Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value)} style={selectStyle}>
            {MODES.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#7c3aed', boxShadow: '0 0 8px #7c3aed',
          }} />
          <span style={{ fontSize: 13, color: '#8b949e' }}>
            {root} {MODES.find(m => m.id === mode)?.label}
          </span>
        </div>
      </div>

      {/* Section 1: Contour Map */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        padding: '20px 24px',
      }}>
        <SectionTitle
          title="Melodic Contour"
          subtitle="Choose the shape your melody will trace."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}>
          {CONTOURS.map(c => (
            <ContourMiniCard
              key={c.id}
              contour={c}
              isActive={c.id === contourId}
              onClick={() => setContourId(c.id)}
            />
          ))}
        </div>

        <ContourDetail contour={activeContour} />
      </div>

      {/* Section 2: Scale & Target Notes */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 32,
      }}>
        <div>
          <SectionTitle title="Scale Notes" />
          <ScaleNotes notes={notes} />
        </div>
        <div>
          <SectionTitle title="Beat Strength Guide" />
          <BeatGuide />
        </div>
      </div>

      {/* Section 3: Approach Techniques */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        padding: '20px 24px',
      }}>
        <SectionTitle
          title="Approach Techniques"
          subtitle="How to arrive at any target note."
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {APPROACHES.map(a => (
            <ApproachCard
              key={a.id}
              approach={a}
              isActive={activeApproachId === a.id}
              onClick={() => setActiveApproachId(activeApproachId === a.id ? null : a.id)}
            />
          ))}
        </div>
      </div>

      {/* Section 4: Phrase Structure */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        padding: '20px 24px',
      }}>
        <SectionTitle title="Phrase Structure" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PHRASE_STRUCTURES.map(s => (
            <PhraseCard
              key={s.id}
              structure={s}
              isActive={s.id === structureId}
              onClick={() => setStructureId(s.id)}
            />
          ))}
        </div>
      </div>

      {/* Section 5: Motif Development */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        padding: '20px 24px',
      }}>
        <SectionTitle
          title="Develop Your Motif"
          subtitle="Take 2-4 notes. Apply these techniques."
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {MOTIF_TECHNIQUES.map(t => (
            <MotifCard key={t.id} technique={t} />
          ))}
        </div>
      </div>

    </div>
  );
}
