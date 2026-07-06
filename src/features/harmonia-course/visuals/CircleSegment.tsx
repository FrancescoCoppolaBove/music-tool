const FIFTHS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];

const CX = 120, CY = 120;
const R_OUT = 105;
const R_IN  = 60;
const TEXT_R = 82; // midpoint of annular ring

// Maps enharmonic equivalents so "Gb" matches "F#" etc.
const ENHARMONIC: Record<string, string> = {
  'F#': 'Gb', 'Gb': 'F#',
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};

function isHighlighted(note: string, list: string[]): boolean {
  return list.includes(note) || list.includes(ENHARMONIC[note] ?? '__');
}

function wedgePath(i: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const a0 = toRad(i * 30 - 90);
  const a1 = toRad((i + 1) * 30 - 90);
  const pt = (r: number, a: number) =>
    [+(CX + r * Math.cos(a)).toFixed(3), +(CY + r * Math.sin(a)).toFixed(3)] as const;
  const [x0o, y0o] = pt(R_OUT, a0);
  const [x1o, y1o] = pt(R_OUT, a1);
  const [x1i, y1i] = pt(R_IN, a1);
  const [x0i, y0i] = pt(R_IN, a0);
  return [
    `M ${x0o} ${y0o}`,
    `A ${R_OUT} ${R_OUT} 0 0 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${R_IN} ${R_IN} 0 0 0 ${x0i} ${y0i}`,
    'Z',
  ].join(' ');
}

function textPos(i: number): { x: number; y: number } {
  const angle = ((i * 30 - 90 + 15) * Math.PI) / 180;
  return {
    x: +(CX + TEXT_R * Math.cos(angle)).toFixed(3),
    y: +(CY + TEXT_R * Math.sin(angle)).toFixed(3),
  };
}

export default function CircleSegment({
  title,
  highlight,
  tonic,
}: {
  title?: string;
  highlight: string[];
  tonic?: string;
}) {
  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          width={240} height={240}
          viewBox="0 0 240 240"
          style={{ overflow: 'visible' }}
        >
          {FIFTHS.map((note, i) => {
            const isTonic = tonic
              ? note === tonic || ENHARMONIC[note] === tonic
              : false;
            const isLit = isHighlighted(note, highlight);
            const fill = isTonic
              ? '#a78bfa'
              : isLit
              ? '#7c3aed'
              : '#21262d';
            const { x, y } = textPos(i);
            return (
              <g key={note}>
                <path
                  d={wedgePath(i)}
                  fill={fill}
                  stroke="#161b22"
                  strokeWidth={2}
                />
                <text
                  x={x} y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isLit || isTonic ? '#fff' : '#6b7280'}
                  fontSize={12}
                  fontWeight={isTonic ? 700 : 400}
                  fontFamily="'DM Sans', sans-serif"
                >
                  {note}
                </text>
              </g>
            );
          })}
          {/* Cover center with dark circle */}
          <circle cx={CX} cy={CY} r={R_IN - 2} fill="#161b22" />
        </svg>
      </div>
    </div>
  );
}
