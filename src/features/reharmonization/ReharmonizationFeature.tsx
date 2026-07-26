import { useState, useMemo } from 'react';
import { Note } from 'tonal';

// ─── Font injection ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('reharm-fonts')) {
  const s = document.createElement('style');
  s.id = 'reharm-fonts';
  s.textContent = "@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Syne:wght@700;800&display=swap');";
  document.head.appendChild(s);
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface ParsedChord {
  root: string;
  quality: string;
  symbol: string;
}

interface JourneyOption {
  id: string;
  category: string;
  color: string;
  chords: string[];
  roles: string[];
  theory: string;
}

// ─── Colors ─────────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Float Chord':            '#f97316',
  'Secondary Dominant':     '#8b5cf6',
  'Secondary Dom. ii–V':    '#8b5cf6',
  'Tritone Sub':            '#06b6d4',
  'Minor Plagal':           '#10b981',
  'Secondary Subdominant':  '#84cc16',
  'Diminished Passing':     '#ef4444',
  'Minor-to-Major Trick':   '#ec4899',
};

// ─── Chord parsing ───────────────────────────────────────────────────────────
function parseChord(raw: string): ParsedChord | null {
  const m = raw.trim().match(/^([A-G][b#]?)(.*)$/);
  if (!m) return null;
  return { root: m[1], quality: m[2].trim(), symbol: raw.trim() };
}

function parseProgression(text: string): ParsedChord[] {
  return text
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(parseChord)
    .filter((c): c is ParsedChord => c !== null);
}

// ─── Journey chord computation ───────────────────────────────────────────────
function tp(root: string, interval: string): string {
  return Note.transpose(root, interval) || root;
}

function getJourneyOptions(target: ParsedChord): JourneyOption[] {
  const r = target.root;
  return [
    {
      id: 'float',
      category: 'Float Chord',
      color: CAT_COLORS['Float Chord'],
      chords: [`${tp(r, '5P')}13sus`],
      roles: ['V13sus (IVmaj7/V)'],
      theory: `Float: IVmaj7 over V bass = V13sus. In key of target: IV chord of ${r} floated over V bass. Open, suspended dominant — no 3rd. Lighter than V7. Characteristic of R&B, neo-soul, fusion.`,
    },
    {
      id: 'secondary-dom',
      category: 'Secondary Dominant',
      color: CAT_COLORS['Secondary Dominant'],
      chords: [`${tp(r, '5P')}7`],
      roles: ['V7 (secondary dom.)'],
      theory: `V7 of ${r}${target.quality}. Dominant a perfect 5th above your destination. Strong tonal pull. Add 13, b9, or b13 for extra color.`,
    },
    {
      id: 'secondary-dom-ii-V',
      category: 'Secondary Dom. ii–V',
      color: CAT_COLORS['Secondary Dom. ii–V'],
      chords: [`${tp(r, '2M')}m7`, `${tp(r, '5P')}7`],
      roles: ['ii7 (of dest.)', 'V7 (of dest.)'],
      theory: `Full ii–V targeting ${r}${target.quality}. The strongest jazz cadence — subdominant preparation (ii7) then dominant pull (V7).`,
    },
    {
      id: 'tritone-sub',
      category: 'Tritone Sub',
      color: CAT_COLORS['Tritone Sub'],
      chords: [`${tp(r, '2m')}7`],
      roles: ['bII7 (tritone sub)'],
      theory: `bII7 — a semitone above ${r}. Shares the same tritone as V7. Resolves down by half-step for a smooth, chromatic bass line. Classic bebop/jazz sound.`,
    },
    {
      id: 'minor-plagal',
      category: 'Minor Plagal',
      color: CAT_COLORS['Minor Plagal'],
      chords: [`${tp(r, '4P')}m7`],
      roles: ['ivm7 (minor plagal)'],
      theory: `iv minor of ${r}. Borrowed from the parallel minor — the "Dark Amen" cadence. Bittersweet pull. Works for both major and minor targets.`,
    },
    {
      id: 'secondary-subdominant',
      category: 'Secondary Subdominant',
      color: CAT_COLORS['Secondary Subdominant'],
      chords: [`${tp(r, '4P')}maj7`],
      roles: ['IVmaj7 (of dest.)'],
      theory: `IV major of ${r} — the IV of wherever you're going, not of the home key. Gentle, natural preparation. "The subdominant of any chord" — Schneider's key insight.`,
    },
    {
      id: 'diminished',
      category: 'Diminished Passing',
      color: CAT_COLORS['Diminished Passing'],
      chords: [`${tp(r, '7M')}dim7`],
      roles: ['#vii°7 (½ step below)'],
      theory: `dim7 built a half-step below ${r}. Two tritones — maximum harmonic tension. All four voices resolve by step. Symmetrical (same chord, 4 spellings).`,
    },
    {
      id: 'minor-to-major',
      category: 'Minor-to-Major Trick',
      color: CAT_COLORS['Minor-to-Major Trick'],
      chords: [
        `${tp(r, '5P')}m7`,
        `${tp(r, '5P')}7`,
        `${tp(r, '7M')}dim7`,
      ],
      roles: ['vim7', 'VI7 (majorized)', '#vii°7 (money chord)'],
      theory: `vi minor "majorized" to VI7 (raising the 3rd), then passing dim7 a half-step below ${r}. The m7→7 shift is the surprise moment. Works best approaching minor chords.`,
    },
  ];
}

// ─── Journey option card ─────────────────────────────────────────────────────
function JourneyCard({ option, targetSymbol, isSelected, onToggle }: {
  option: JourneyOption;
  targetSymbol: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [showTheory, setShowTheory] = useState(false);
  const color = option.color;

  return (
    <div style={{
      background: isSelected ? color + '12' : '#0d1117',
      border: `1px solid ${isSelected ? color + '55' : '#1c2128'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
      padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Category tag */}
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10, color,
          background: color + '18', border: `1px solid ${color}35`,
          borderRadius: 4, padding: '2px 7px',
          letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
        }}>
          {option.category}
        </span>

        {/* Chain preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', flex: 1 }}>
          {option.chords.map((ch, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500,
                color: '#e6edf3', background: '#161b22',
                border: `1px solid ${color}40`, borderRadius: 5, padding: '3px 9px',
              }}>
                {ch}
              </span>
              <span style={{ color: '#4b5563', fontSize: 12 }}>→</span>
            </span>
          ))}
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600,
            color: '#fff', background: color, borderRadius: 5, padding: '3px 10px',
            boxShadow: `0 0 8px ${color}45`,
          }}>
            {targetSymbol}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setShowTheory(x => !x)}
            style={{
              background: 'none', border: '1px solid #30363d', borderRadius: 4,
              cursor: 'pointer', color: '#6b7280',
              fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 7px',
            }}
          >
            {showTheory ? '▲' : 'ℹ️'}
          </button>
          <button
            onClick={onToggle}
            style={{
              background: isSelected ? color : 'transparent',
              border: `1px solid ${isSelected ? color : '#30363d'}`,
              borderRadius: 4, cursor: 'pointer',
              color: isSelected ? '#fff' : '#8b949e',
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              padding: '3px 10px', fontWeight: isSelected ? 600 : 400,
              transition: 'all 0.12s',
            }}
          >
            {isSelected ? '✓ Added' : '+ Add'}
          </button>
        </div>
      </div>

      {showTheory && (
        <div style={{
          marginTop: 10, background: '#161b22', borderRadius: 6,
          padding: '10px 12px',
          fontFamily: "'DM Mono', monospace", fontSize: 12,
          color: '#c9d1d9', lineHeight: 1.65,
        }}>
          {option.theory}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: 'ii–V–I (Jazz)', value: 'Dm7 G7 Cmaj7' },
  { label: 'I–vi–ii–V', value: 'Cmaj7 Am7 Dm7 G7' },
  { label: 'I–IV–V', value: 'Cmaj7 Fmaj7 G7' },
  { label: "Can't Help Falling", value: 'Cmaj7 Em7 Am7 Fmaj7 G7' },
];

export default function ReharmonizationFeature() {
  const [inputText, setInputText] = useState('Cmaj7 Am7 Dm7 G7');
  const [committed, setCommitted] = useState('Cmaj7 Am7 Dm7 G7');
  // journeyMap: transitionIndex → selected optionId (or null)
  const [journeyMap, setJourneyMap] = useState<Map<number, string>>(new Map());
  // openTransitionIndex: which transition is currently open for editing
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const chords = useMemo(() => parseProgression(committed), [committed]);

  function selectExample(value: string) {
    setInputText(value);
    setCommitted(value);
    setJourneyMap(new Map());
    setOpenIdx(null);
  }

  function commit() {
    setCommitted(inputText);
    setJourneyMap(new Map());
    setOpenIdx(null);
  }

  function toggleTransition(idx: number) {
    setOpenIdx(prev => (prev === idx ? null : idx));
  }

  function setJourneyFor(transitionIdx: number, optionId: string | null) {
    setJourneyMap(prev => {
      const next = new Map(prev);
      if (optionId === null) next.delete(transitionIdx);
      else next.set(transitionIdx, optionId);
      return next;
    });
  }

  const reharmonized = useMemo(() => {
    if (chords.length === 0) return [];
    const result: Array<{ symbol: string; isJourney: boolean; color?: string }> = [];
    result.push({ symbol: chords[0].symbol, isJourney: false });
    for (let i = 1; i < chords.length; i++) {
      const optId = journeyMap.get(i);
      if (optId) {
        const opts = getJourneyOptions(chords[i]);
        const opt = opts.find(o => o.id === optId);
        if (opt) {
          opt.chords.forEach(ch => result.push({ symbol: ch, isJourney: true, color: opt.color }));
        }
      }
      result.push({ symbol: chords[i].symbol, isJourney: false });
    }
    return result;
  }, [chords, journeyMap]);

  const hasJourney = journeyMap.size > 0;

  const mono = "'DM Mono', monospace";
  const syne = "'Syne', sans-serif";

  return (
    <div style={{ fontFamily: mono, background: '#0d1117', minHeight: '100vh', color: '#e6edf3' }}>
      {/* Header */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
        <h1 style={{ fontFamily: syne, fontSize: 24, fontWeight: 800, color: '#e6edf3', margin: '0 0 6px' }}>
          Reharmonization Lab
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
          Journey vs Destination — insert passing chords before any chord in your progression.
          Based on Jeff Schneider's harmonic approach method.
        </p>
      </div>

      {/* Input */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontFamily: syne, fontSize: 12, fontWeight: 700, color: '#8b949e', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
          Destination Progression
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {EXAMPLES.map(ex => (
            <button key={ex.label} onClick={() => selectExample(ex.value)} style={{
              background: committed === ex.value ? '#7c3aed22' : 'transparent',
              border: `1px solid ${committed === ex.value ? '#7c3aed' : '#30363d'}`,
              borderRadius: 6, cursor: 'pointer',
              color: committed === ex.value ? '#7c3aed' : '#8b949e',
              fontFamily: mono, fontSize: 11, padding: '4px 10px',
            }}>
              {ex.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); }}
            placeholder="e.g. Cmaj7 Am7 Dm7 G7"
            style={{
              flex: 1, background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 6, padding: '8px 12px',
              color: '#e6edf3', fontFamily: mono, fontSize: 13, outline: 'none',
            }}
          />
          <button onClick={commit} style={{
            background: '#7c3aed', border: 'none', borderRadius: 6,
            color: '#fff', cursor: 'pointer', fontFamily: mono, fontSize: 12,
            padding: '8px 16px', fontWeight: 500,
          }}>
            Parse
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#4b5563' }}>
          Enter chord symbols separated by spaces. Press Enter or click Parse.
        </div>
      </div>

      {/* Progression editor */}
      {chords.length > 0 && (
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontFamily: syne, fontSize: 12, fontWeight: 700, color: '#8b949e', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>
            Add Journey Chords
          </div>

          {/* Chord row with journey buttons */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {chords.map((chord, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Chord bubble */}
                <div style={{
                  padding: '7px 14px', borderRadius: 7,
                  background: journeyMap.has(i) && i > 0 ? '#0d1117' : '#1c2128',
                  border: `1px solid ${journeyMap.has(i) && i > 0 ? (getJourneyOptions(chord).find(o => o.id === journeyMap.get(i))?.color ?? '#30363d') + '70' : '#30363d'}`,
                  fontFamily: mono, fontSize: 15, fontWeight: 600,
                  color: '#e6edf3', letterSpacing: '-0.3px',
                }}>
                  {chord.symbol}
                </div>

                {/* Journey button (between chords) */}
                {i < chords.length - 1 && (
                  <button
                    onClick={() => toggleTransition(i + 1)}
                    style={{
                      background: openIdx === i + 1 ? '#8b5cf622' : journeyMap.has(i + 1) ? '#7c3aed22' : 'transparent',
                      border: `1px solid ${openIdx === i + 1 ? '#8b5cf6' : journeyMap.has(i + 1) ? '#7c3aed' : '#30363d'}`,
                      borderRadius: 12, cursor: 'pointer',
                      color: openIdx === i + 1 ? '#8b5cf6' : journeyMap.has(i + 1) ? '#7c3aed' : '#4b5563',
                      fontFamily: mono, fontSize: 10,
                      padding: '3px 9px', transition: 'all 0.12s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {journeyMap.has(i + 1) ? '✓ journey' : '+ journey'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Journey options panel (opens below chord row) */}
          {openIdx !== null && openIdx < chords.length && (
            <div style={{
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 10, padding: '16px',
              marginTop: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: syne, fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>
                  Journey →{' '}
                  <span style={{ color: '#7c3aed' }}>{chords[openIdx].symbol}</span>
                </div>
                <button
                  onClick={() => setOpenIdx(null)}
                  style={{
                    background: 'none', border: '1px solid #30363d', borderRadius: 6,
                    color: '#6b7280', cursor: 'pointer',
                    fontFamily: mono, fontSize: 11, padding: '3px 9px',
                  }}
                >
                  Close ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {getJourneyOptions(chords[openIdx]).map(opt => (
                  <JourneyCard
                    key={opt.id}
                    option={opt}
                    targetSymbol={chords[openIdx].symbol}
                    isSelected={journeyMap.get(openIdx) === opt.id}
                    onToggle={() => {
                      const cur = journeyMap.get(openIdx);
                      setJourneyFor(openIdx, cur === opt.id ? null : opt.id);
                      if (cur !== opt.id) setOpenIdx(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {openIdx === null && (
            <div style={{ fontSize: 11, color: '#4b5563' }}>
              Click{' '}<span style={{ color: '#8b5cf6' }}>+ journey</span>{' '}
              between any two chords to add a passing chord sequence.
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {chords.length > 0 && (
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: syne, fontSize: 12, fontWeight: 700, color: '#8b949e', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Result
            </div>
            {hasJourney && (
              <button onClick={() => setShowComparison(x => !x)} style={{
                background: 'none', border: '1px solid #30363d', borderRadius: 6,
                color: '#8b949e', cursor: 'pointer', fontFamily: mono, fontSize: 11, padding: '4px 10px',
              }}>
                {showComparison ? 'Hide original' : 'Compare with original'}
              </button>
            )}
          </div>

          {showComparison && hasJourney && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>ORIGINAL</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                {chords.map((ch, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: mono, fontSize: 14, fontWeight: 500,
                      color: '#6b7280', background: '#0d1117',
                      border: '1px solid #21262d', borderRadius: 6, padding: '5px 12px',
                    }}>{ch.symbol}</span>
                    {i < chords.length - 1 && <span style={{ color: '#30363d' }}>→</span>}
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: '#21262d', marginBottom: 14 }} />
              <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 8, letterSpacing: '0.5px' }}>REHARMONIZED</div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {reharmonized.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: mono,
                  fontSize: item.isJourney ? 12 : 15,
                  fontWeight: item.isJourney ? 400 : 600,
                  color: item.isJourney ? (item.color || '#8b949e') : '#e6edf3',
                  background: item.isJourney ? (item.color ? item.color + '15' : '#1c2128') : '#0d1117',
                  border: `1px solid ${item.isJourney ? (item.color ? item.color + '45' : '#21262d') : '#30363d'}`,
                  borderRadius: 6, padding: item.isJourney ? '4px 10px' : '6px 14px',
                }}>
                  {item.symbol}
                </span>
                {i < reharmonized.length - 1 && (
                  <span style={{ color: '#30363d', fontSize: 14 }}>→</span>
                )}
              </div>
            ))}
          </div>

          {!hasJourney && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>
              Add journey chords above to see the reharmonized progression here.
            </div>
          )}
        </div>
      )}

      {/* Schneider Framework reference */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '20px 24px' }}>
        <div style={{ fontFamily: syne, fontSize: 12, fontWeight: 700, color: '#8b949e', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>
          Jeff Schneider's Journey–Destination Framework
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {(Object.entries(CAT_COLORS) as [string, string][])
            .filter(([k]) => !k.includes('ii–V'))
            .map(([cat, color]) => (
              <div key={cat} style={{
                background: '#0d1117', border: `1px solid ${color}30`,
                borderLeft: `3px solid ${color}`, borderRadius: 8, padding: '10px 12px',
              }}>
                <div style={{ fontFamily: mono, fontSize: 11, color, fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {cat}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                  {{
                    'Float Chord': 'IVmaj7/V = V13sus. No 3rd. IV of destination over V bass.',
                    'Secondary Dominant': 'V7 of any chord. Pull to any destination with authentic cadence.',
                    'Tritone Sub': 'bII7 = half-step above. Same tritone as V7. Smooth bass descent.',
                    'Minor Plagal': 'ivm → destination. Dark "amen" cadence from parallel minor.',
                    'Secondary Subdominant': 'IVmaj7 of wherever you\'re going. Works for any chord.',
                    'Diminished Passing': '°7 half-step below target. Pop/drop voicing. Two tritones.',
                    'Minor-to-Major Trick': 'vim7 → VI7 (raise 3rd) → passing dim → minor dest.',
                  }[cat] ?? ''}
                </div>
              </div>
            ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: '#4b5563', lineHeight: 1.6 }}>
          <strong style={{ color: '#6b7280' }}>Framework:</strong>{' '}
          Enter your destination progression — chords you KNOW you want. Then work backwards: for each transition, pick a journey chord that creates tension before the destination. Journey chords are temporary — they exist only to make the landing more satisfying.
        </div>
      </div>
    </div>
  );
}
