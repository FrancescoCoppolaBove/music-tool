import { useState, useMemo } from 'react';
import { Chord, Note } from 'tonal';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VoiceAssignment {
  voiceName: string;
  noteA: string;
  noteB: string;
  semitones: number; // signed, shortest path
  isGuideTone: boolean;
  direction: 'up' | 'down' | 'same';
}

interface VoiceLeadingSuggestion {
  id: string;
  name: string;
  description: string;
  voices: VoiceAssignment[];
  totalMovement: number;
  tag: 'smooth' | 'guidetone' | 'contrary' | 'oblique' | 'parallel';
  artistExample?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const QUALITIES: { id: string; label: string }[] = [
  { id: 'maj7',    label: 'maj7' },
  { id: 'm7',      label: 'm7' },
  { id: '7',       label: '7 (dominant)' },
  { id: 'm7b5',    label: 'm7♭5 (half-dim)' },
  { id: 'dim7',    label: 'dim7' },
  { id: 'maj',     label: 'maj (triad)' },
  { id: 'm',       label: 'm (triad)' },
  { id: 'sus4',    label: 'sus4' },
  { id: '7sus4',   label: '7sus4' },
  { id: 'maj9',    label: 'maj9' },
  { id: 'm9',      label: 'm9' },
  { id: '9',       label: '9 (dominant)' },
  { id: 'aug',     label: 'aug' },
  { id: '6',       label: '6' },
  { id: 'm6',      label: 'm6' },
  { id: 'add9',    label: 'add9' },
];

const STYLE_FILTER: { id: string; label: string; color: string }[] = [
  { id: 'all',      label: 'All',       color: '#7c3aed' },
  { id: 'smooth',   label: 'Smooth',    color: '#10b981' },
  { id: 'guidetone',label: 'Guide Tones', color: '#f59e0b' },
  { id: 'contrary', label: 'Contrary',  color: '#ef4444' },
  { id: 'oblique',  label: 'Oblique',   color: '#06b6d4' },
];

const VOICE_NAMES = ['Lead', 'Alto', 'Tenor', 'Bass'];

// ─── Music utilities ────────────────────────────────────────────────────────────

function noteToSemi(note: string): number {
  return Note.midi(`${note}4`) ?? 60;
}

/** Shortest signed semitone path between two pitch classes */
function shortestSemi(noteA: string, noteB: string): number {
  const sA = (noteToSemi(noteA)) % 12;
  const sB = (noteToSemi(noteB)) % 12;
  let d = (sB - sA + 12) % 12;
  if (d > 6) d -= 12;
  return d;
}

/** Is this note the 3rd or 7th of a chord? */
function isGuideTone(note: string, chordNotes: string[]): boolean {
  if (chordNotes.length < 3) return false;
  const thirdSemi = noteToSemi(chordNotes[1]) % 12;
  const seventhSemi = chordNotes.length >= 4 ? (noteToSemi(chordNotes[3]) % 12) : -1;
  const noteSemi = noteToSemi(note) % 12;
  return noteSemi === thirdSemi || noteSemi === seventhSemi;
}

/** Get all permutations of an array */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((item, i) =>
    permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [item, ...p])
  );
}

/** Find optimal voice assignment minimizing total movement */
function findSmoothAssignment(notesA: string[], notesB: string[]): { a: string; b: string; semi: number }[] {
  const n = Math.min(notesA.length, 4);
  const aSlice = notesA.slice(0, n);
  const bPadded = notesB.length >= n ? notesB.slice(0, n) : [...notesB, ...notesB].slice(0, n);
  const perms = permutations(bPadded);
  let bestCost = Infinity;
  let bestPerm = bPadded;
  for (const perm of perms) {
    const cost = aSlice.reduce((sum, a, i) => sum + Math.abs(shortestSemi(a, perm[i])), 0);
    if (cost < bestCost) { bestCost = cost; bestPerm = perm; }
  }
  return aSlice.map((a, i) => ({ a, b: bestPerm[i], semi: shortestSemi(a, bestPerm[i]) }));
}

/** Assign voices keeping guide tones (3/7) anchored, move others smoothly */
function findGuideToneAssignment(notesA: string[], notesB: string[], notesAChord: string[], notesBChord: string[]): { a: string; b: string; semi: number }[] {
  const n = Math.min(notesA.length, 4);
  const aSlice = notesA.slice(0, n);
  const bPadded = notesB.length >= n ? notesB.slice(0, n) : [...notesB, ...notesB].slice(0, n);

  // Identify guide tones in B chord
  const bGuideTones = bPadded.filter(n => isGuideTone(n, notesBChord));
  const bNonGuide = bPadded.filter(n => !isGuideTone(n, notesBChord));

  // Assign guide tones first (by minimal movement from their A counterpart)
  const assigned: { a: string; b: string; semi: number }[] = [];
  const usedA = new Set<number>();
  const usedB = new Set<number>();

  for (const bg of bGuideTones) {
    let bestI = -1, bestCost = Infinity;
    for (let i = 0; i < aSlice.length; i++) {
      if (usedA.has(i)) continue;
      const cost = Math.abs(shortestSemi(aSlice[i], bg));
      if (cost < bestCost) { bestCost = cost; bestI = i; }
    }
    if (bestI >= 0) {
      assigned.push({ a: aSlice[bestI], b: bg, semi: shortestSemi(aSlice[bestI], bg) });
      usedA.add(bestI);
      usedB.add(bPadded.indexOf(bg));
    }
  }

  // Assign remaining notes smoothly
  const remainA = aSlice.filter((_, i) => !usedA.has(i));
  const remainB = bNonGuide;
  const smoothRest = findSmoothAssignment(remainA, remainB);
  return [...assigned, ...smoothRest];
}

/** Force contrary motion: bass goes opposite direction to top voices */
function findContraryAssignment(notesA: string[], notesB: string[]): { a: string; b: string; semi: number }[] {
  const smooth = findSmoothAssignment(notesA, notesB);
  if (smooth.length < 2) return smooth;
  // Flip bass movement: try the assignment where bass moves opposite to average upper movement
  const avgUpperMovement = smooth.slice(1).reduce((s, v) => s + v.semi, 0) / (smooth.length - 1);
  // Find a B note for bass that goes opposite direction to avgUpperMovement
  const bassA = smooth[0].a;
  const bOptions = notesB.slice();
  const bassB = avgUpperMovement >= 0
    ? bOptions.reduce((best, b) => shortestSemi(bassA, b) < shortestSemi(bassA, best) ? b : best)
    : bOptions.reduce((best, b) => shortestSemi(bassA, b) > shortestSemi(bassA, best) ? b : best);
  const result = [...smooth];
  result[result.length - 1] = { a: bassA, b: bassB, semi: shortestSemi(bassA, bassB) };
  return result;
}

/** Oblique: one voice stays on common tone, others move */
function findObliqueAssignment(notesA: string[], notesB: string[]): { a: string; b: string; semi: number }[] {
  const smooth = findSmoothAssignment(notesA, notesB);
  // Find the voice with movement closest to 0 that has a common tone in B
  const n = Math.min(notesA.length, 4);
  const aSlice = notesA.slice(0, n);
  let bestI = 0, bestMatch = Infinity;
  for (let i = 0; i < aSlice.length; i++) {
    const sA = noteToSemi(aSlice[i]) % 12;
    const hasCommon = notesB.some(b => (noteToSemi(b) % 12) === sA);
    if (hasCommon && Math.abs(smooth[i]?.semi ?? 12) < bestMatch) {
      bestMatch = Math.abs(smooth[i]?.semi ?? 12);
      bestI = i;
    }
  }
  const result = [...smooth];
  if (result[bestI]) {
    const anchored = aSlice[bestI];
    const matchInB = notesB.find(b => (noteToSemi(b) % 12) === (noteToSemi(anchored) % 12)) ?? anchored;
    result[bestI] = { a: anchored, b: matchInB, semi: 0 };
  }
  return result;
}

// ─── Build suggestions ─────────────────────────────────────────────────────────

function buildSuggestions(
  notesA: string[],
  notesB: string[],
  chordAFull: string[],
  chordBFull: string[],
): VoiceLeadingSuggestion[] {
  const n = Math.min(Math.max(notesA.length, notesB.length), 4);
  const aFilled = notesA.length >= n ? notesA.slice(0, n) : [...notesA, ...notesA].slice(0, n);
  const bFilled = notesB.length >= n ? notesB.slice(0, n) : [...notesB, ...notesB].slice(0, n);

  const makeVoices = (assignments: { a: string; b: string; semi: number }[]): VoiceAssignment[] =>
    assignments.map((asgn, i) => ({
      voiceName: VOICE_NAMES[i] ?? `V${i + 1}`,
      noteA: asgn.a,
      noteB: asgn.b,
      semitones: asgn.semi,
      isGuideTone: isGuideTone(asgn.b, chordBFull),
      direction: asgn.semi > 0 ? 'up' : asgn.semi < 0 ? 'down' : 'same',
    }));

  const smooth = findSmoothAssignment(aFilled, bFilled);
  const guideAssign = findGuideToneAssignment(aFilled, bFilled, chordAFull, chordBFull);
  const contrary = findContraryAssignment(aFilled, bFilled);
  const oblique = findObliqueAssignment(aFilled, bFilled);

  const suggestions: VoiceLeadingSuggestion[] = [
    {
      id: 'smooth',
      name: 'Smooth Voice Leading',
      description: 'Minimizes total semitone movement. Each voice moves by the smallest possible interval. The classical and jazz gold standard — avoids large leaps, maintains vocal comfort.',
      voices: makeVoices(smooth),
      totalMovement: smooth.reduce((s, v) => s + Math.abs(v.semi), 0),
      tag: 'smooth',
      artistExample: 'Bill Evans, Snarky Puppy — every note takes the shortest path.',
    },
    {
      id: 'guidetone',
      name: 'Guide Tone Priority',
      description: 'Locks in the 3rd and 7th (guide tones) by assigning them first. The tritone relationship between 3 and 7 defines the chord — these are the two most important voices to voice-lead carefully.',
      voices: makeVoices(guideAssign),
      totalMovement: guideAssign.reduce((s, v) => s + Math.abs(v.semi), 0),
      tag: 'guidetone',
      artistExample: 'Jazz comping principle: 7 → 3 or 3 → 7. Guide tones resolve first, others fill around them.',
    },
    {
      id: 'contrary',
      name: 'Contrary Motion',
      description: 'Upper voices and bass move in opposite directions. Creates maximum independence between bass line and harmony. Classical counterpoint staple — avoids parallel motion.',
      voices: makeVoices(contrary),
      totalMovement: contrary.reduce((s, v) => s + Math.abs(v.semi), 0),
      tag: 'contrary',
      artistExample: 'Bach chorales: soprano goes up while bass goes down. Arrangement: Joe Dart bass vs. Woody Goss melody.',
    },
    {
      id: 'oblique',
      name: 'Oblique / Common Tone',
      description: 'One voice stays on a common tone shared by both chords, while others move. Creates a smooth pedal-point effect and strong harmonic connection between the chords.',
      voices: makeVoices(oblique),
      totalMovement: oblique.reduce((s, v) => s + Math.abs(v.semi), 0),
      tag: 'oblique',
      artistExample: 'Yussef Dayes vamps: Rhodes holds a note across chord changes. Snarky Puppy pedal tones.',
    },
  ];

  return suggestions;
}

// ─── Components ─────────────────────────────────────────────────────────────────

function ChordSelector({
  label,
  root,
  quality,
  onRootChange,
  onQualityChange,
  color,
}: {
  label: string;
  root: string;
  quality: string;
  onRootChange: (r: string) => void;
  onQualityChange: (q: string) => void;
  color: string;
}) {
  return (
    <div style={{
      flex: 1,
      background: '#161b22',
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: '16px 20px',
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: color,
        marginBottom: 12,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={root}
          onChange={e => onRootChange(e.target.value)}
          style={{
            flex: '0 0 auto',
            padding: '8px 12px',
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 8,
            color: '#e6edf3',
            fontSize: 15,
            fontWeight: 600,
            outline: 'none',
          }}
        >
          {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={quality}
          onChange={e => onQualityChange(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 8,
            color: '#e6edf3',
            fontSize: 14,
            outline: 'none',
          }}
        >
          {QUALITIES.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
        </select>
      </div>
      <div style={{
        marginTop: 8,
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        color: `${color}bb`,
        letterSpacing: '0.04em',
      }}>
        {root}{quality}
      </div>
    </div>
  );
}

function MovementArrow({ semitones, color }: { semitones: number; color: string }) {
  if (semitones === 0) {
    return <span style={{ color: '#6b7280', fontSize: 16 }}>→</span>;
  }
  const up = semitones > 0;
  const size = Math.min(Math.abs(semitones), 6);
  const opacity = 0.4 + (size / 6) * 0.6;
  return (
    <span style={{
      color: up ? '#10b981' : '#ef4444',
      opacity,
      fontSize: 16,
      fontWeight: 700,
    }}>
      {up ? '↑' : '↓'}
    </span>
  );
}

function VoiceRow({ voice, color }: { voice: VoiceAssignment; color: string }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '56px 52px 32px 52px 36px auto',
      alignItems: 'center',
      gap: 8,
      padding: '8px 0',
      borderBottom: '1px solid #21262d',
    }}>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#4b5563',
      }}>
        {voice.voiceName}
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 16,
        fontWeight: 700,
        color: '#e6edf3',
        textAlign: 'center',
      }}>
        {voice.noteA}
      </span>
      <MovementArrow semitones={voice.semitones} color={color} />
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 16,
        fontWeight: 700,
        color: voice.isGuideTone ? color : '#e6edf3',
        textAlign: 'center',
      }}>
        {voice.noteB}
        {voice.isGuideTone && (
          <span style={{ fontSize: 9, verticalAlign: 'super', marginLeft: 2, color }}>GT</span>
        )}
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: voice.semitones === 0 ? '#4b5563'
          : voice.semitones > 0 ? '#10b981'
          : '#ef4444',
        textAlign: 'right',
      }}>
        {voice.semitones === 0 ? 'unison' : `${voice.semitones > 0 ? '+' : ''}${voice.semitones}st`}
      </span>
      <div style={{
        height: 4,
        background: '#1c2128',
        borderRadius: 2,
        overflow: 'hidden',
        flex: 1,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(Math.abs(voice.semitones) / 6 * 100, 100)}%`,
          background: voice.semitones === 0 ? '#4b5563'
            : voice.semitones > 0 ? '#10b981'
            : '#ef4444',
          borderRadius: 2,
          marginLeft: voice.semitones < 0 ? 'auto' : 0,
        }} />
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  isSelected,
  onSelect,
  color,
}: {
  suggestion: VoiceLeadingSuggestion;
  isSelected: boolean;
  onSelect: () => void;
  color: string;
}) {
  const tagColors: Record<string, string> = {
    smooth: '#10b981',
    guidetone: '#f59e0b',
    contrary: '#ef4444',
    oblique: '#06b6d4',
    parallel: '#8b5cf6',
  };
  const tagColor = tagColors[suggestion.tag] ?? color;

  return (
    <div
      onClick={onSelect}
      style={{
        border: `1px solid ${isSelected ? color : '#30363d'}`,
        borderLeft: `3px solid ${isSelected ? color : tagColor}`,
        borderRadius: 10,
        background: isSelected ? `${color}0d` : '#161b22',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 4,
          background: `${tagColor}18`,
          color: tagColor,
          border: `1px solid ${tagColor}33`,
        }}>
          {suggestion.tag}
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: '#4b5563',
        }}>
          Σ {suggestion.totalMovement} semitones
        </span>
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 15,
        color: isSelected ? color : '#e6edf3',
        marginBottom: 4,
      }}>
        {suggestion.name}
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 10 }}>
        {suggestion.description}
      </div>

      {/* Voice rows */}
      <div style={{ borderTop: '1px solid #21262d', paddingTop: 8 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '56px 52px 32px 52px 36px auto',
          gap: 8,
          marginBottom: 4,
        }}>
          {['Voice', 'From', '', 'To', 'Δ', ''].map((h, i) => (
            <span key={i} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#4b5563',
              textAlign: i >= 3 ? 'right' : 'left',
            }}>
              {h}
            </span>
          ))}
        </div>
        {suggestion.voices.map(v => (
          <VoiceRow key={v.voiceName} voice={v} color={tagColor} />
        ))}
      </div>

      {suggestion.artistExample && (
        <div style={{
          marginTop: 10,
          padding: '6px 10px',
          background: '#0d1117',
          borderRadius: 6,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: '#4b5563',
          lineHeight: 1.5,
          borderLeft: `2px solid ${tagColor}44`,
        }}>
          💡 {suggestion.artistExample}
        </div>
      )}
    </div>
  );
}

// ─── Guide Tone Theory Panel ───────────────────────────────────────────────────

function GuideTonePanel({ notesA, notesB, chordA, chordB }: {
  notesA: string[];
  notesB: string[];
  chordA: string;
  chordB: string;
}) {
  if (notesA.length < 3 || notesB.length < 3) return null;
  const third = notesA[1];
  const seventh = notesA[3] ?? notesA[notesA.length - 1];
  const thirdResolution = notesB.reduce((best, n) => {
    return Math.abs(shortestSemi(third, n)) < Math.abs(shortestSemi(third, best)) ? n : best;
  }, notesB[0]);
  const seventhResolution = notesB.reduce((best, n) => {
    return Math.abs(shortestSemi(seventh, n)) < Math.abs(shortestSemi(seventh, best)) ? n : best;
  }, notesB[0]);

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 10,
      padding: '16px 20px',
      marginTop: 20,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#f59e0b',
        marginBottom: 12,
      }}>
        Guide Tone Theory
      </div>
      <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.6, margin: '0 0 12px' }}>
        The <strong style={{ color: '#e6edf3' }}>3rd and 7th</strong> of every chord are the guide tones — they define the chord's quality and carry the most harmonic information. In jazz voice leading, moving these two notes smoothly creates a strong sense of resolution.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 200px',
          padding: '10px 14px',
          background: '#0d1117',
          borderRadius: 8,
          border: '1px solid #f59e0b22',
        }}>
          <div style={{ fontSize: 11, color: '#f59e0b88', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
            3rd of {chordA}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
            {third}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            → resolves to <strong style={{ color: '#e6edf3' }}>{thirdResolution}</strong> in {chordB}
            {' '}({shortestSemi(third, thirdResolution) > 0 ? '+' : ''}{shortestSemi(third, thirdResolution)} st)
          </div>
        </div>
        <div style={{
          flex: '1 1 200px',
          padding: '10px 14px',
          background: '#0d1117',
          borderRadius: 8,
          border: '1px solid #f59e0b22',
        }}>
          <div style={{ fontSize: 11, color: '#f59e0b88', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
            7th of {chordA}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
            {seventh}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            → resolves to <strong style={{ color: '#e6edf3' }}>{seventhResolution}</strong> in {chordB}
            {' '}({shortestSemi(seventh, seventhResolution) > 0 ? '+' : ''}{shortestSemi(seventh, seventhResolution)} st)
          </div>
        </div>
      </div>
      <div style={{
        marginTop: 10,
        padding: '8px 12px',
        background: '#0d1117',
        borderRadius: 6,
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 1.6,
        borderLeft: '2px solid #f59e0b44',
      }}>
        <strong style={{ color: '#e6edf3' }}>The tritone rule:</strong> In a dominant 7th chord (e.g., G7), the 3rd (B) and 7th (F) form a tritone. This tritone resolves by half-step in opposite directions: B → C (up), F → E (down). This is the strongest resolution in Western harmony — it's why V7→I works.
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`;

export default function VoiceLeadingFeature() {
  const [rootA, setRootA] = useState('G');
  const [qualityA, setQualityA] = useState('7');
  const [rootB, setRootB] = useState('C');
  const [qualityB, setQualityB] = useState('maj7');
  const [selectedId, setSelectedId] = useState<string>('smooth');
  const [styleFilter, setStyleFilter] = useState('all');

  const color = '#7c3aed';

  const chordASymbol = `${rootA}${qualityA}`;
  const chordBSymbol = `${rootB}${qualityB}`;

  const notesA = useMemo(() => Chord.get(chordASymbol).notes, [chordASymbol]);
  const notesB = useMemo(() => Chord.get(chordBSymbol).notes, [chordBSymbol]);

  const suggestions = useMemo(() => {
    if (notesA.length === 0 || notesB.length === 0) return [];
    return buildSuggestions(notesA, notesB, notesA, notesB);
  }, [notesA, notesB]);

  const filtered = styleFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.tag === styleFilter);

  const isEmpty = notesA.length === 0 || notesB.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{ padding: '28px 0 20px', borderBottom: '1px solid #21262d', marginBottom: 28 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.12em', color: '#4b5563', textTransform: 'uppercase',
            }}>
              Music Theory · Composition
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26,
            letterSpacing: '-0.5px', color: '#e6edf3', margin: '0 0 6px',
          }}>
            Voice Leading Lab
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            Choose two chords and see exactly how to move each voice for smooth, guide-tone, contrary, or oblique motion.
            The gap between knowing <em>which</em> chord and knowing <em>how</em> to connect it.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* Chord pickers */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'stretch' }}>
          <ChordSelector
            label="Chord A (from)"
            root={rootA}
            quality={qualityA}
            onRootChange={setRootA}
            onQualityChange={setQualityA}
            color="#ef4444"
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, width: 40,
            fontFamily: "'DM Mono', monospace", fontSize: 22, color: '#30363d',
          }}>
            →
          </div>
          <ChordSelector
            label="Chord B (to)"
            root={rootB}
            quality={qualityB}
            onRootChange={setRootB}
            onQualityChange={setQualityB}
            color="#10b981"
          />
        </div>

        {/* Chord notes display */}
        {!isEmpty && (
          <div style={{
            display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap',
            padding: '10px 16px', background: '#161b22',
            border: '1px solid #21262d', borderRadius: 8,
            fontFamily: "'DM Mono', monospace", fontSize: 12,
          }}>
            <div>
              <span style={{ color: '#4b5563' }}>{chordASymbol}: </span>
              {notesA.map((n, i) => (
                <span key={i} style={{ color: '#ef4444', marginRight: 6 }}>{n}</span>
              ))}
            </div>
            <div style={{ color: '#21262d' }}>|</div>
            <div>
              <span style={{ color: '#4b5563' }}>{chordBSymbol}: </span>
              {notesB.map((n, i) => (
                <span key={i} style={{ color: '#10b981', marginRight: 6 }}>{n}</span>
              ))}
            </div>
            {(() => {
              const common = notesA.filter(a => notesB.some(b =>
                (noteToSemi(b) % 12) === (noteToSemi(a) % 12)
              ));
              return common.length > 0 ? (
                <div>
                  <span style={{ color: '#4b5563' }}>Common: </span>
                  {common.map((n, i) => (
                    <span key={i} style={{ color: '#f59e0b', marginRight: 6 }}>{n}</span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Style filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {STYLE_FILTER.map(f => (
            <button
              key={f.id}
              onClick={() => setStyleFilter(f.id)}
              style={{
                padding: '5px 14px', borderRadius: 6,
                border: `1px solid ${styleFilter === f.id ? f.color : '#30363d'}`,
                background: styleFilter === f.id ? `${f.color}18` : 'transparent',
                color: styleFilter === f.id ? f.color : '#6b7280',
                fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {isEmpty && (
          <div style={{
            padding: '32px', textAlign: 'center',
            color: '#4b5563', fontFamily: "'DM Mono', monospace", fontSize: 13,
          }}>
            Chord not recognized. Try a standard symbol like Cmaj7, Dm7, G7, Fmaj9.
          </div>
        )}

        {/* Suggestions */}
        {!isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                isSelected={selectedId === s.id}
                onSelect={() => setSelectedId(s.id)}
                color={color}
              />
            ))}
          </div>
        )}

        {/* Guide tone theory panel */}
        {!isEmpty && <GuideTonePanel
          notesA={notesA}
          notesB={notesB}
          chordA={chordASymbol}
          chordB={chordBSymbol}
        />}

        {/* Theory intro */}
        <div style={{
          marginTop: 24,
          background: '#161b22', border: '1px solid #21262d', borderRadius: 10,
          padding: '18px 22px',
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#4b5563', marginBottom: 12,
          }}>
            What is Voice Leading?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { label: 'GT (Guide Tone)', desc: 'The 3rd or 7th of the chord. These define the harmonic quality and must be voice-led carefully.' },
              { label: 'Smooth', desc: 'Total semitone movement is minimized. Each voice moves by the smallest possible interval.' },
              { label: 'Contrary', desc: 'Upper voices and bass move in opposite directions. Avoids parallel motion, creates independence.' },
              { label: 'Oblique', desc: 'One voice holds a common tone while others move. Creates pedal-point smoothness.' },
            ].map(item => (
              <div key={item.label} style={{
                background: '#0d1117', border: '1px solid #21262d',
                borderRadius: 8, padding: '10px 12px',
              }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                  color: color, marginBottom: 4,
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
