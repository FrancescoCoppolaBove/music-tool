type Tab =
  | 'home' | 'voicings' | 'scales' | 'dictionary' | 'ear'
  | 'circle' | 'harmonization' | 'modal' | 'progressions' | 'scaleadvisor'
  | 'analysis' | 'riff' | 'melody' | 'score' | 'landing' | 'quiz'
  | 'chorddetect' | 'nailpitch';

interface HomePageProps { onNavigate: (tab: Tab) => void; }

// ── Injected styles ───────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Playfair+Display:ital@1&display=swap');

  @keyframes float-down {
    0%, 100% { transform: translateY(0);   opacity: 0.4; }
    50%       { transform: translateY(8px); opacity: 1;   }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.85; }
  }

  .tw { font-family: 'Syne', sans-serif; }
  .ts { font-family: 'Playfair Display', Georgia, serif; }

  .fu1 { animation: fade-up 0.6s ease 0.05s both; }
  .fu2 { animation: fade-up 0.6s ease 0.18s both; }
  .fu3 { animation: fade-up 0.6s ease 0.30s both; }
  .fu4 { animation: fade-up 0.6s ease 0.42s both; }
  .fu5 { animation: fade-up 0.6s ease 0.54s both; }

  .scroll-cue { animation: float-down 2.4s ease-in-out infinite; }
  .glow-ring  { animation: glow-pulse 5s ease-in-out infinite; }

  .cta-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 32px;
    background: #7c3aed; border: none; border-radius: 10px;
    color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; letter-spacing: -0.1px;
    transition: box-shadow 0.2s, background 0.2s;
  }
  .cta-primary:hover {
    background: #6d28d9;
    box-shadow: 0 0 0 4px #7c3aed28, 0 12px 40px rgba(124,58,237,0.4);
  }

  .cta-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 32px;
    background: none; border: 1px solid #30363d; border-radius: 10px;
    color: #6b7280; font-size: 15px; font-weight: 500;
    cursor: pointer; transition: border-color 0.2s, color 0.2s;
  }
  .cta-ghost:hover { border-color: #7c3aed80; color: #c4b5fd; }

  .open-link {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; padding: 0;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: gap 0.2s;
    letter-spacing: 0.02em;
  }
  .open-link:hover { gap: 12px; }

  .tool-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 18px;
    background: #161b22; border: 1px solid #21262d; border-radius: 10px;
    cursor: pointer; transition: border-color 0.18s, background 0.18s;
    text-align: left;
  }
  .tool-chip:hover {
    border-color: #30363d;
    background: #1c2128;
  }

  .mission-card { transition: border-color 0.2s, background 0.2s; }
  .mission-card:hover { border-color: #7c3aed40; background: #7c3aed06; }

  .feature-divider {
    height: 1px; background: linear-gradient(90deg, transparent, #21262d 30%, #21262d 70%, transparent);
    margin: 0;
  }
`;

// ── Preview Components ────────────────────────────────────────────────────────

function PreviewScaleAdvisor() {
  const notes = [
    { n: 'D', c: '#f59e0b', role: 'R' }, { n: 'E', c: '#06b6d4', role: '9' },
    { n: 'F', c: '#a78bfa', role: '♭3' }, { n: 'G', c: '#06b6d4', role: '11' },
    { n: 'A', c: '#a78bfa', role: '5' }, { n: 'B', c: '#06b6d4', role: '13' },
    { n: 'C', c: '#a78bfa', role: '♭7' },
  ];
  return (
    <div style={{ padding: '26px 22px', background: '#080c12', borderRadius: 14, border: '1px solid #a78bfa30', borderTop: '2px solid #a78bfa', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3' }}>Dm7</span>
        <span style={{ color: '#30363d', fontSize: 16 }}>→</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>D Dorian</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4b5563', background: '#a78bfa12', border: '1px solid #a78bfa20', borderRadius: 4, padding: '2px 7px' }}>PRIMARY</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {notes.map(({ n, c, role }) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${c}16`, border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: c }}>
              {n}
            </div>
            <span style={{ fontSize: 9, color: `${c}80` }}>{role}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: '#10b981', background: '#10b98110', border: '1px solid #10b98125', borderRadius: 6, padding: '4px 10px' }}>
          💡 Bb Melodic Minor — min. 7th above
        </div>
        <div style={{ fontSize: 11, color: '#06b6d4', background: '#06b6d410', border: '1px solid #06b6d425', borderRadius: 6, padding: '4px 10px' }}>
          Extensions: 9, 11, 13
        </div>
      </div>
    </div>
  );
}

function PreviewProgressions() {
  const chords = [
    { s: 'Dm7',   fn: 'Tonic',       c: '#10b981' },
    { s: 'Em7♭5', fn: 'Subdominant', c: '#3b82f6' },
    { s: 'A7alt',  fn: 'Dominant',   c: '#ef4444' },
    { s: 'Dm7',   fn: 'Tonic',       c: '#10b981' },
  ];
  return (
    <div style={{ padding: '26px 22px', background: '#080c12', borderRadius: 14, border: '1px solid #f59e0b30', borderTop: '2px solid #f59e0b' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase' }}>D Dorian · Minor ii-V-i</div>
        <div style={{ fontSize: 10, color: '#f59e0b', background: '#f59e0b12', border: '1px solid #f59e0b25', borderRadius: 4, padding: '2px 7px' }}>4 chords</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {chords.map(({ s, fn, c }, i) => (
          <div key={i} style={{ background: '#161b22', border: `1px solid ${c}30`, borderLeft: `3px solid ${c}`, borderRadius: 8, padding: '10px 14px', flex: '1 1 auto' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#e6edf3', fontFamily: 'monospace', marginBottom: 3 }}>{s}</div>
            <div style={{ fontSize: 9, color: c, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{fn}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>100+ templates · any key · one click</div>
    </div>
  );
}

function PreviewHarmony() {
  const rows = [
    { d: 'I', n: 'Dm7', active: true }, { d: 'II', n: 'Em7', active: false },
    { d: '♭III', n: 'Fmaj7', active: false }, { d: 'IV', n: 'G7', active: true },
    { d: 'V', n: 'Am7', active: false }, { d: 'VI', n: 'Bm7♭5', active: false },
    { d: 'VII', n: 'Cmaj7', active: false },
  ];
  return (
    <div style={{ padding: '26px 22px', background: '#080c12', borderRadius: 14, border: '1px solid #06b6d430', borderTop: '2px solid #06b6d4', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>D Dorian — Scale Harmonization</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {rows.map(({ d, n, active }) => (
          <div key={d} style={{
            flex: 1, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center',
            padding: '10px 4px', background: active ? '#06b6d412' : '#161b22',
            border: `1px solid ${active ? '#06b6d440' : '#21262d'}`, borderRadius: 7,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#06b6d4' : '#4b5563' }}>{d}</span>
            <span style={{ fontSize: 9, color: active ? '#e6edf3' : '#30363d', textAlign: 'center' }}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>All 7 modes · chord-scale relationships</div>
    </div>
  );
}

function PreviewVoicings() {
  const whites = [
    { note: 'C', role: 'R', color: '#f59e0b' }, { note: 'D', role: null, color: null },
    { note: 'E', role: '3', color: '#a78bfa' }, { note: 'F', role: null, color: null },
    { note: 'G', role: '5', color: '#06b6d4' }, { note: 'A', role: null, color: null },
    { note: 'B', role: '7', color: '#10b981' },
  ];
  return (
    <div style={{ padding: '26px 22px', background: '#080c12', borderRadius: 14, border: '1px solid #10b98130', borderTop: '2px solid #10b981' }}>
      <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Cmaj7 · Drop 2 Voicing</div>
      <div style={{ display: 'flex', gap: 3, height: 76, marginBottom: 14 }}>
        {whites.map(({ note, role, color }) => (
          <div key={note} style={{
            flex: 1, borderRadius: '0 0 7px 7px',
            background: color ? `${color}bb` : '#1a2030',
            border: `1px solid ${color ? color + '80' : '#21262d'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, gap: 2,
          }}>
            {role && <span style={{ fontSize: 8, fontWeight: 800, color: '#0d1117', fontFamily: 'monospace' }}>{role}</span>}
            <span style={{ fontSize: 8, color: color ? '#0d1117' : '#30363d', fontFamily: 'monospace' }}>{note}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        {[['#f59e0b', 'Root'], ['#a78bfa', '3rd'], ['#06b6d4', '5th'], ['#10b981', '7th']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b7280' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewModal() {
  const modes = [
    { name: 'C Dorian', borrowed: 5, color: '#06b6d4' },
    { name: 'C Mixolydian', borrowed: 3, color: '#8b5cf6' },
    { name: 'C Aeolian', borrowed: 7, color: '#ef4444' },
  ];
  return (
    <div style={{ padding: '26px 22px', background: '#080c12', borderRadius: 14, border: '1px solid #8b5cf630', borderTop: '2px solid #8b5cf6' }}>
      <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>C Major — Modal Interchange</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {modes.map(({ name, borrowed, color }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: color, fontFamily: 'monospace', fontWeight: 600, flex: 1 }}>{name}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: borrowed }).map((_, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: `${color}30`, border: `1px solid ${color}60` }} />
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#4b5563' }}>{borrowed} chords</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>Borrow from parallel modes · any key</div>
    </div>
  );
}

function PreviewChordLanding() {
  const steps = [
    { chord: 'Abm7', role: 'ii of SubV', color: '#06b6d4' },
    { chord: 'Db7',  role: 'Tritone Sub', color: '#f59e0b' },
    { chord: 'Cmaj7', role: 'Target', color: '#10b981' },
  ];
  return (
    <div style={{ padding: '26px 22px', background: '#080c12', borderRadius: 14, border: '1px solid #10b98130', borderTop: '2px solid #10b981' }}>
      <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Landing on Cmaj7 · Complexity 4/5</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {steps.map(({ chord, role, color }, i) => (
          <div key={chord} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: '#161b22', border: `1px solid ${color}40`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e6edf3', fontFamily: 'monospace' }}>{chord}</div>
              <div style={{ fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{role}</div>
            </div>
            {i < steps.length - 1 && <span style={{ color: '#30363d', fontSize: 16 }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>27 approach patterns · 5 complexity levels</div>
    </div>
  );
}

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES: Array<{
  tab: Tab; num: string; accent: string;
  headline: string; body: string;
  preview: React.ReactNode;
}> = [
  {
    tab: 'scaleadvisor', num: '01', accent: '#a78bfa',
    headline: 'Know exactly which scale\nto play over any chord.',
    body: 'Chord-scale theory made actionable. Enter any chord — maj7, m7, 7alt, 7sus4, m6, dim7 — and get the primary scale, all alternatives (including pentatonics and blues scales), avoid notes, good extensions, and the Melodic Minor trick that unlocks the whole system.',
    preview: <PreviewScaleAdvisor />,
  },
  {
    tab: 'progressions', num: '02', accent: '#f59e0b',
    headline: 'Generate jazz, modal, and\ncinematic progressions.',
    body: 'Over 100 progression templates across 8 modes. Diatonic, modal interchange, tritone substitutions, altered dominants, backdoor cadences, Coltrane changes — all transposable to any key instantly.',
    preview: <PreviewProgressions />,
  },
  {
    tab: 'harmonization', num: '03', accent: '#06b6d4',
    headline: 'See how every chord degree\nrelates to its mode.',
    body: 'Scale harmonization lays out all seven chord-scale pairs for any mode. Understand why the IV is dominant in Dorian, why the ♭VII resolves in Mixolydian, and how modal writing functions at a structural level.',
    preview: <PreviewHarmony />,
  },
  {
    tab: 'voicings', num: '04', accent: '#10b981',
    headline: 'Visualize every voicing\non a real piano keyboard.',
    body: 'Closed position, drop 2, drop 3, shell, rootless, quartal, spread, and upper structure triads — all rendered on an interactive keyboard with color-coded intervals and precise voice ordering.',
    preview: <PreviewVoicings />,
  },
  {
    tab: 'modal', num: '05', accent: '#8b5cf6',
    headline: 'Borrow chords from\nparallel modes.',
    body: 'Modal interchange made visual. See every non-diatonic chord available in each parallel mode — with source mode, harmonic colour, jazz context, and usage examples — all updated live as you change key and tonality.',
    preview: <PreviewModal />,
  },
  {
    tab: 'landing', num: '06', accent: '#10b981',
    headline: 'Find the best way to\napproach any target chord.',
    body: '27 approach recipes from 5 complexity levels. From simple V7–I cadences to tritone substitutions, sus chord resolutions, and ii-V of the SubV. Each approach is dynamically computed for your exact target chord root and quality.',
    preview: <PreviewChordLanding />,
  },
];

// ── All tools directory ───────────────────────────────────────────────────────

const ALL_TOOLS: Array<{ tab: Tab; icon: string; label: string; desc: string; group: string }> = [
  { tab: 'scaleadvisor',  icon: '🧭', label: 'Scale Advisor',      desc: 'Find the right scale over any chord',       group: 'Composition' },
  { tab: 'progressions',  icon: '🎸', label: 'Chord Progressions', desc: 'Build jazz, modal & cinematic progressions', group: 'Composition' },
  { tab: 'landing',       icon: '🎯', label: 'Chord Landing',      desc: 'Approach any target chord with style',       group: 'Composition' },
  { tab: 'riff',          icon: '🎵', label: 'Riff Architect',     desc: 'Craft riffs in the style of Snarky Puppy',   group: 'Composition' },
  { tab: 'analysis',      icon: '🔬', label: 'Harmonic Analysis',  desc: 'Analyse key, Roman numerals & function',     group: 'Composition' },
  { tab: 'score',         icon: '📄', label: 'Score → iReal Pro',  desc: 'Import a score photo, export to iReal Pro',  group: 'Composition' },
  { tab: 'scales',        icon: '🔍', label: 'Scale Recognition',  desc: 'Identify a scale from its notes',            group: 'Scale' },
  { tab: 'dictionary',    icon: '📚', label: 'Scale Dictionary',   desc: 'Browse all scales and their modes',          group: 'Scale' },
  { tab: 'harmonization', icon: '🎶', label: 'Scale Harmony',      desc: 'See how chords relate to their mode',        group: 'Theory' },
  { tab: 'modal',         icon: '🔄', label: 'Modal Interchange',  desc: 'Borrow chords from parallel modes',          group: 'Theory' },
  { tab: 'voicings',      icon: '🎹', label: 'Piano Voicings',     desc: 'Visualize drop 2, quartal & upper structures', group: 'Theory' },
  { tab: 'circle',        icon: '🔵', label: 'Circle of Fifths',   desc: 'Explore key relationships at a glance',      group: 'Theory' },
  { tab: 'ear',           icon: '👂', label: 'Ear Training',       desc: 'Train your ear with interval exercises',     group: 'Training' },
  { tab: 'quiz',          icon: '🎯', label: 'Scale Degree Quiz',  desc: 'Master major scale degree knowledge',        group: 'Training' },
  { tab: 'chorddetect',   icon: '🎙️', label: 'Chord Detection',    desc: 'Play a chord — it\'s identified in real time', group: 'Training' },
  { tab: 'nailpitch',     icon: '🎤', label: 'Nail the Pitch',     desc: 'Sing and see which notes you hit, in tune',  group: 'Training' },
];

const GROUP_COLORS: Record<string, string> = {
  Composition: '#7c3aed',
  Scale:       '#06b6d4',
  Theory:      '#f59e0b',
  Training:    '#10b981',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <style>{STYLES}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 58px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px 72px',
        position: 'relative', overflow: 'hidden',
        background: `
          radial-gradient(ellipse 90% 60% at 50% -5%, #7c3aed1e 0%, transparent 60%),
          linear-gradient(#7c3aed05 1px, transparent 1px),
          linear-gradient(90deg, #7c3aed05 1px, transparent 1px)
        `,
        backgroundSize: 'auto, 52px 52px, 52px 52px',
      }}>
        <div className="glow-ring" style={{
          position: 'absolute', width: 640, height: 640, borderRadius: '50%',
          border: '1px solid #7c3aed15', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
        }} />
        <div className="glow-ring" style={{
          position: 'absolute', width: 960, height: 960, borderRadius: '50%',
          border: '1px solid #7c3aed0a', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          animationDelay: '2s',
        }} />

        <div className="fu1">
          <img src="/logo.png" alt="tonic" style={{ width: 84, height: 84, marginBottom: 32, mixBlendMode: 'screen' }} />
        </div>

        <h1 className="tw fu2" style={{
          margin: '0 0 18px',
          fontSize: 'clamp(64px, 13vw, 136px)',
          fontWeight: 800,
          color: '#e6edf3',
          letterSpacing: '-4px',
          lineHeight: 0.88,
        }}>
          tonic
        </h1>

        <p className="fu3" style={{
          margin: '0 0 32px',
          fontSize: 11, fontWeight: 700, color: '#7c3aed',
          letterSpacing: '0.24em', textTransform: 'uppercase',
        }}>
          Explore &nbsp;·&nbsp; Hear &nbsp;·&nbsp; Create
        </p>

        <p className="fu4" style={{
          margin: '0 0 48px',
          fontSize: 'clamp(17px, 2.8vw, 22px)',
          color: '#8b949e', maxWidth: 460, lineHeight: 1.65, fontWeight: 400,
        }}>
          Music theory, finally built for musicians
          who actually <em className="ts" style={{ color: '#c4b5fd' }}>compose</em>.
        </p>

        <div className="fu5" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="cta-primary" onClick={() => onNavigate('scaleadvisor')}>
            Start Exploring <span style={{ fontSize: 18 }}>→</span>
          </button>
          <button className="cta-ghost" onClick={() => {
            document.getElementById('tonic-features')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            See all tools
          </button>
        </div>

        <div className="scroll-cue" style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          color: '#30363d', fontSize: 20,
        }}>↓</div>
      </section>

      {/* ── STAT BAR ──────────────────────────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d',
        background: '#0d1117', padding: '28px 24px',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'flex', justifyContent: 'center',
          gap: 0, flexWrap: 'wrap',
        }}>
          {[
            { value: '14', label: 'Interactive tools' },
            { value: '100+', label: 'Progression templates' },
            { value: '8', label: 'Modes supported' },
            { value: '∞', label: 'Keys transposable' },
          ].map(({ value, label }, i) => (
            <div key={label} style={{
              flex: '1 1 140px', textAlign: 'center', padding: '12px 24px',
              borderRight: i < 3 ? '1px solid #21262d' : 'none',
            }}>
              <div className="tw" style={{ fontSize: 32, fontWeight: 800, color: '#e6edf3', letterSpacing: '-1px', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, letterSpacing: '0.02em' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION STRIP ─────────────────────────────────────────────────── */}
      <section style={{ background: '#161b22', borderBottom: '1px solid #21262d', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Philosophy</p>
            <h2 className="tw" style={{ margin: 0, fontSize: 'clamp(26px, 4.5vw, 40px)', fontWeight: 800, color: '#e6edf3', letterSpacing: '-1px' }}>
              Music theory that serves musicians.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              {
                icon: '🎷',
                title: 'Built on jazz theory',
                body: 'Chord-scale theory from Coltrane to Jacob Collier and Snarky Puppy, embedded into every tool. Not simplified — just made actionable.',
                accent: '#7c3aed',
              },
              {
                icon: '🔄',
                title: 'Modal-first thinking',
                body: '8 modes supported natively — Dorian, Phrygian, Lydian Dominant, Melodic Minor and beyond. Every tool understands modal harmony.',
                accent: '#06b6d4',
              },
              {
                icon: '⚡',
                title: 'No fluff, no gamification',
                body: 'Only practical tools for real musical problems. No quizzes with points, no progress bars. Just the theory you need, when you need it.',
                accent: '#f59e0b',
              },
            ].map(({ icon, title, body, accent }) => (
              <div key={title} className="mission-card" style={{
                padding: '32px 28px',
                background: '#0d1117',
                borderRadius: 12,
                border: '1px solid #21262d',
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#e6edf3', marginBottom: 10 }}>{title}</div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75 }}>{body}</div>
                <div style={{ marginTop: 20, width: 28, height: 2, background: accent, borderRadius: 1 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ──────────────────────────────────────────────── */}
      <section id="tonic-features" style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>The tools</p>
          <h2 className="tw" style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#e6edf3', letterSpacing: '-1.5px' }}>
            Built for every part of the process.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map(({ tab, num, accent, headline, body, preview }, i) => {
            const isEven = i % 2 === 0;
            return (
              <div key={tab}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 64,
                  padding: '72px 0',
                  alignItems: 'center',
                }}>
                  {/* Text side */}
                  <div style={{ order: isEven ? 0 : 1 }}>
                    <div style={{
                      fontSize: 11, color: accent, fontWeight: 700,
                      fontFamily: 'monospace', marginBottom: 20,
                      letterSpacing: '0.1em',
                    }}>
                      {num}
                    </div>
                    <h3 style={{
                      margin: '0 0 18px',
                      fontSize: 'clamp(22px, 3.2vw, 32px)',
                      fontWeight: 800, color: '#e6edf3',
                      lineHeight: 1.15, letterSpacing: '-0.8px',
                      whiteSpace: 'pre-line',
                    }}>
                      {headline}
                    </h3>
                    <p style={{ margin: '0 0 32px', fontSize: 15, color: '#6b7280', lineHeight: 1.8, maxWidth: 420 }}>
                      {body}
                    </p>
                    <button className="open-link" onClick={() => onNavigate(tab)} style={{ color: accent }}>
                      Open tool <span>→</span>
                    </button>
                  </div>

                  {/* Preview tile */}
                  <div style={{ order: isEven ? 1 : 0 }}>
                    {preview}
                  </div>
                </div>

                {/* Divider between features */}
                {i < FEATURES.length - 1 && <div className="feature-divider" />}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ALL TOOLS DIRECTORY ───────────────────────────────────────────── */}
      <section style={{ background: '#161b22', borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Complete toolkit</p>
            <h2 className="tw" style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#e6edf3', letterSpacing: '-1.5px' }}>
              Everything in one place.
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: '#6b7280', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              14 interconnected tools covering every dimension of music theory — from composition to ear training.
            </p>
          </div>

          {/* Group legend */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
            {Object.entries(GROUP_COLORS).map(([group, color]) => (
              <div key={group} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {group}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {ALL_TOOLS.map(({ tab, icon, label, desc, group }) => {
              const color = GROUP_COLORS[group];
              return (
                <button key={tab} className="tool-chip" onClick={() => onNavigate(tab)}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${color}14`, border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>How it works</p>
          <h2 className="tw" style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#e6edf3', letterSpacing: '-1.5px' }}>
            Three steps. Infinite harmony.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            {
              n: '01', title: 'Choose your context',
              body: 'Select a key, a mode, or paste a chord symbol. Set the harmonic framework you\'re working in.',
              accent: '#7c3aed',
            },
            {
              n: '02', title: 'Explore the harmony',
              body: 'See scales, progressions, voicings, and harmonic relationships — all computed for your exact context.',
              accent: '#06b6d4',
            },
            {
              n: '03', title: 'Apply to your music',
              body: 'Compose, improvise, transcribe, and analyze with theory that finally makes intuitive sense.',
              accent: '#f59e0b',
            },
          ].map(({ n, title, body, accent }) => (
            <div key={n} style={{
              padding: '40px 32px', background: '#161b22',
              borderRadius: 14, border: '1px solid #21262d',
              position: 'relative', overflow: 'hidden',
            }}>
              <div className="tw" style={{
                position: 'absolute', top: -16, right: 12,
                fontSize: 100, fontWeight: 800, color: `${accent}08`,
                lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
              }}>{n}</div>
              <div style={{
                fontSize: 11, color: accent, fontWeight: 700,
                fontFamily: 'monospace', marginBottom: 18, letterSpacing: '0.1em',
              }}>{n}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 12 }}>{title}</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUOTE ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 24px',
        borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d',
        textAlign: 'center',
        background: `radial-gradient(ellipse 55% 80% at 50% 50%, #7c3aed08 0%, transparent 70%)`,
      }}>
        <blockquote style={{ margin: '0 auto', maxWidth: 660 }}>
          <div style={{ fontSize: 40, color: '#7c3aed30', lineHeight: 1, marginBottom: 20, fontFamily: 'Georgia, serif' }}>"</div>
          <p className="ts" style={{
            margin: '0 0 28px',
            fontSize: 'clamp(20px, 3.5vw, 32px)',
            fontStyle: 'italic', color: '#c4b5fd',
            lineHeight: 1.55, fontWeight: 400, letterSpacing: '-0.2px',
          }}>
            The relationship between a chord and its scale is not a rule — it's a conversation.
          </p>
          <cite style={{
            fontSize: 12, color: '#4b5563',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontStyle: 'normal', fontWeight: 600,
          }}>
            — tonic
          </cite>
        </blockquote>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 24px 112px',
        textAlign: 'center',
        background: `radial-gradient(ellipse 70% 100% at 50% 100%, #7c3aed12 0%, transparent 70%)`,
      }}>
        <p style={{ margin: '0 0 16px', fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Ready?
        </p>
        <h2 className="tw" style={{
          margin: '0 0 14px',
          fontSize: 'clamp(32px, 6vw, 60px)',
          fontWeight: 800, color: '#e6edf3',
          letterSpacing: '-2.5px', lineHeight: 1,
        }}>
          Hear music differently.
        </h2>
        <p style={{ margin: '0 0 48px', fontSize: 16, color: '#6b7280', lineHeight: 1.65 }}>
          14 tools. No account required. Free.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="cta-primary" onClick={() => onNavigate('scaleadvisor')} style={{ fontSize: 16, padding: '16px 40px' }}>
            Open tonic <span style={{ fontSize: 20 }}>→</span>
          </button>
          <button className="cta-ghost" onClick={() => onNavigate('progressions')} style={{ fontSize: 15, padding: '16px 32px' }}>
            Explore progressions
          </button>
        </div>
      </section>

    </div>
  );
}
