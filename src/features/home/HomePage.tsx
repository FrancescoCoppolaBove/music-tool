type Tab =
  | 'home' | 'voicings' | 'scales' | 'dictionary' | 'ear'
  | 'circle' | 'harmonization' | 'modal' | 'progressions' | 'scaleadvisor';

interface HomePageProps { onNavigate: (tab: Tab) => void; }

// ── Injected styles (fonts + animations) ─────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Playfair+Display:ital@1&display=swap');

  @keyframes float-down {
    0%, 100% { transform: translateY(0);   opacity: 0.5; }
    50%       { transform: translateY(8px); opacity: 1;   }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes glow {
    0%, 100% { opacity: 0.55; }
    50%       { opacity: 1;    }
  }

  .tonic-word   { font-family: 'Syne', sans-serif; }
  .tonic-serif  { font-family: 'Playfair Display', Georgia, serif; }

  .hero-fade-1  { animation: fade-up 0.7s ease 0.1s both; }
  .hero-fade-2  { animation: fade-up 0.7s ease 0.25s both; }
  .hero-fade-3  { animation: fade-up 0.7s ease 0.4s both; }
  .hero-fade-4  { animation: fade-up 0.7s ease 0.55s both; }
  .hero-fade-5  { animation: fade-up 0.7s ease 0.7s both; }

  .scroll-cue   { animation: float-down 2.2s ease-in-out infinite; }
  .glow-ring    { animation: glow 4s ease-in-out infinite; }

  .cta-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 15px 36px;
    background: #7c3aed; border: none; border-radius: 10px;
    color: #fff; font-size: 16px; font-weight: 700;
    cursor: pointer; letter-spacing: -0.2px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(124,58,237,0.45);
  }

  .cta-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 15px 36px;
    background: none; border: 1px solid #30363d; border-radius: 10px;
    color: #6b7280; font-size: 16px; font-weight: 500;
    cursor: pointer; transition: border-color 0.2s, color 0.2s;
  }
  .cta-ghost:hover { border-color: #7c3aed; color: #e6edf3; }

  .feature-row { cursor: default; }
  .feature-open {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; padding: 0;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: gap 0.2s;
  }
  .feature-open:hover { gap: 12px; }

  .mission-card {
    transition: border-color 0.2s, background 0.2s;
  }
  .mission-card:hover {
    border-color: #7c3aed50;
    background: #7c3aed08;
  }

  .step-card {
    transition: border-color 0.2s;
  }
  .step-card:hover { border-color: #7c3aed40; }
`;

// ── Preview tiles ─────────────────────────────────────────────────────────────

function PreviewScaleAdvisor() {
  const notes = [
    { n: 'D', c: '#f59e0b' }, { n: 'E', c: '#06b6d4' }, { n: 'F', c: '#a78bfa' },
    { n: 'G', c: '#06b6d4' }, { n: 'A', c: '#a78bfa' }, { n: 'B', c: '#06b6d4' }, { n: 'C', c: '#a78bfa' },
  ];
  return (
    <div style={{ padding: '28px 24px', background: '#0a0e14', borderRadius: 12, border: '1px solid #a78bfa40', borderTop: '3px solid #a78bfa', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: '#e6edf3' }}>Dm7</span>
        <span style={{ color: '#30363d', fontSize: 18 }}>→</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>D Dorian</span>
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
        {notes.map(({ n, c }) => (
          <div key={n} style={{ width: 34, height: 34, borderRadius: '50%', background: `${c}18`, border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c }}>
            {n}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#10b981', background: '#10b98112', border: '1px solid #10b98130', borderRadius: 6, padding: '5px 10px', display: 'inline-block' }}>
        💡 Bb Melodic Minor — 2nd above
      </div>
    </div>
  );
}

function PreviewProgressions() {
  const chords = [
    { s: 'Dm7', fn: 'Tonic', c: '#10b981' }, { s: 'Em7♭5', fn: 'Subdominant', c: '#3b82f6' },
    { s: 'A7alt', fn: 'Dominant', c: '#ef4444' }, { s: 'Dm7', fn: 'Tonic', c: '#10b981' },
  ];
  return (
    <div style={{ padding: '28px 24px', background: '#0a0e14', borderRadius: 12, border: '1px solid #f59e0b40', borderTop: '3px solid #f59e0b' }}>
      <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>D Dorian · modal · 4 chords</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {chords.map(({ s, fn, c }, i) => (
          <div key={i} style={{ background: '#161b22', border: `1px solid ${c}35`, borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#e6edf3', fontFamily: 'monospace', marginBottom: 4 }}>{s}</div>
            <div style={{ fontSize: 10, color: c, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{fn}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewHarmony() {
  const rows = [
    { d: 'I', q: 'm7', n: 'Dm7', c: '#10b981' }, { d: 'II', q: 'm7', n: 'Em7', c: '#6b7280' },
    { d: '♭III', q: 'maj7', n: 'Fmaj7', c: '#6b7280' }, { d: 'IV', q: '7', n: 'G7', c: '#f59e0b' },
    { d: 'V', q: 'm7', n: 'Am7', c: '#6b7280' }, { d: 'VI', q: 'm7♭5', n: 'Bm7♭5', c: '#6b7280' },
    { d: 'VII', q: 'maj7', n: 'Cmaj7', c: '#6b7280' },
  ];
  return (
    <div style={{ padding: '28px 24px', background: '#0a0e14', borderRadius: 12, border: '1px solid #06b6d440', borderTop: '3px solid #06b6d4', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>D Dorian — Scale Harmonization</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {rows.map(({ d, q, n, c }) => (
          <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', padding: '8px 4px', background: '#161b22', border: `1px solid ${c}30`, borderRadius: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{d}</span>
            <span style={{ fontSize: 9, color: '#4b5563' }}>{n}</span>
            <span style={{ fontSize: 9, color: '#30363d' }}>{q}</span>
          </div>
        ))}
      </div>
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
    <div style={{ padding: '28px 24px', background: '#0a0e14', borderRadius: 12, border: '1px solid #10b98140', borderTop: '3px solid #10b981' }}>
      <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Cmaj7 · Drop 2 voicing</div>
      <div style={{ display: 'flex', gap: 3, height: 80 }}>
        {whites.map(({ note, role, color }) => (
          <div key={note} style={{
            flex: 1, borderRadius: '0 0 6px 6px',
            background: color ? `${color}cc` : '#1e2630',
            border: `1px solid ${color ? color + '80' : '#30363d'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, gap: 2,
          }}>
            {role && <span style={{ fontSize: 9, fontWeight: 800, color: '#0d1117', fontFamily: 'monospace' }}>{role}</span>}
            <span style={{ fontSize: 8, color: color ? '#0d1117' : '#30363d', fontFamily: 'monospace' }}>{note}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        {[['#f59e0b', 'Root'], ['#a78bfa', '3rd'], ['#06b6d4', '5th'], ['#10b981', '7th']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b7280' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    tab: 'scaleadvisor' as Tab, num: '01', accent: '#a78bfa',
    headline: 'Know exactly which scale\nto play over any chord.',
    body: 'Chord-scale theory made practical. Enter any chord — maj7, m7b5, 7alt, dim7 — and instantly see the primary scale, safe extensions, avoid notes, and the melodic minor relationship that unlocks the whole system.',
    preview: <PreviewScaleAdvisor />,
  },
  {
    tab: 'progressions' as Tab, num: '02', accent: '#f59e0b',
    headline: 'Generate jazz, modal, and\ncinematic progressions.',
    body: 'Over 100 progression templates across 8 modes. Diatonic, modal interchange, tritone substitutions, altered dominants, backdoor cadences — all transposable to any key in one click.',
    preview: <PreviewProgressions />,
  },
  {
    tab: 'harmonization' as Tab, num: '03', accent: '#06b6d4',
    headline: 'See how every chord degree\nrelates to its scale.',
    body: 'Scale harmonization lays out all seven chord-scale pairs for any mode. Understand why the IV is major in Dorian, why the ♭VII resolves in Mixolydian, and how modal writing works at a structural level.',
    preview: <PreviewHarmony />,
  },
  {
    tab: 'voicings' as Tab, num: '04', accent: '#10b981',
    headline: 'Visualize every voicing\non a real piano keyboard.',
    body: 'Closed position, drop 2, drop 3, shell, rootless, quartal, spread, and upper structure triads — all rendered on an interactive keyboard with color-coded intervals and voice ordering.',
    preview: <PreviewVoicings />,
  },
];

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
        textAlign: 'center', padding: '80px 24px 60px',
        position: 'relative', overflow: 'hidden',
        background: `
          radial-gradient(ellipse 80% 55% at 50% -5%, #7c3aed22 0%, transparent 65%),
          linear-gradient(#7c3aed06 1px, transparent 1px),
          linear-gradient(90deg, #7c3aed06 1px, transparent 1px)
        `,
        backgroundSize: 'auto, 48px 48px, 48px 48px',
      }}>
        {/* Decorative glow rings */}
        <div className="glow-ring" style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          border: '1px solid #7c3aed18', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
        }} />
        <div className="glow-ring" style={{
          position: 'absolute', width: 900, height: 900, borderRadius: '50%',
          border: '1px solid #7c3aed0c', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          animationDelay: '1.5s',
        }} />

        {/* Logo */}
        <div className="hero-fade-1">
          <img src="/logo.png" alt="tonic" style={{ width: 88, height: 88, marginBottom: 28, mixBlendMode: 'screen' }} />
        </div>

        {/* Wordmark */}
        <h1 className="tonic-word hero-fade-2" style={{
          margin: '0 0 16px',
          fontSize: 'clamp(72px, 14vw, 140px)',
          fontWeight: 800,
          color: '#e6edf3',
          letterSpacing: '-4px',
          lineHeight: 0.9,
        }}>
          tonic
        </h1>

        {/* Tagline */}
        <p className="hero-fade-3" style={{
          margin: '0 0 28px',
          fontSize: 11,
          fontWeight: 700,
          color: '#7c3aed',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}>
          Explore &nbsp;·&nbsp; Hear &nbsp;·&nbsp; Create
        </p>

        {/* Mission */}
        <p className="hero-fade-4" style={{
          margin: '0 0 44px',
          fontSize: 'clamp(16px, 3vw, 22px)',
          color: '#8b949e',
          maxWidth: 480,
          lineHeight: 1.65,
          fontWeight: 400,
        }}>
          Music theory, finally built for musicians
          who actually <em style={{ color: '#c4b5fd', fontStyle: 'italic' }}>compose</em>.
        </p>

        {/* CTAs */}
        <div className="hero-fade-5" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="cta-primary" onClick={() => onNavigate('scaleadvisor')}>
            Start Exploring <span style={{ fontSize: 18 }}>→</span>
          </button>
          <button className="cta-ghost" onClick={() => {
            document.getElementById('tonic-features')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            See how it works
          </button>
        </div>

        {/* Scroll cue */}
        <div className="scroll-cue" style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: '#30363d', fontSize: 20 }}>
          ↓
        </div>
      </section>

      {/* ── MISSION STRIP ─────────────────────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d',
        background: '#161b22',
        padding: '48px 24px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 2,
        }}>
          {[
            { icon: '🎷', title: 'Built on jazz', body: 'Chord-scale theory from Coltrane to Jacob Collier, embedded in every tool.' },
            { icon: '🔄', title: 'Modal-first', body: '8 modes supported natively — Dorian, Phrygian, Lydian Dominant and beyond.' },
            { icon: '⚡', title: 'No fluff', body: 'Only practical tools for real musical problems. No quizzes, no gamification.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="mission-card" style={{
              padding: '32px 28px', borderRadius: 2,
              border: '1px solid transparent',
            }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="tonic-features" style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 64, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>How it works</p>
          <h2 className="tonic-word" style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#e6edf3', letterSpacing: '-1px' }}>
            Three steps. Infinite harmony.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
          {[
            { n: '01', title: 'Choose your context', body: 'Select a key, a mode, or paste a chord symbol. Set the harmonic framework you\'re working in.' },
            { n: '02', title: 'Explore the harmony', body: 'See scales, progressions, voicings, and harmonic relationships — all computed for your exact context.' },
            { n: '03', title: 'Apply it to your music', body: 'Compose, improvise, transcribe, and analyze with theory that finally makes intuitive sense.' },
          ].map(({ n, title, body }) => (
            <div key={n} className="step-card" style={{
              padding: '36px 28px', background: '#161b22',
              borderRadius: 12, border: '1px solid #21262d',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorative step number */}
              <div className="tonic-word" style={{
                position: 'absolute', top: -10, right: 16,
                fontSize: 96, fontWeight: 800,
                color: '#7c3aed0e', lineHeight: 1, pointerEvents: 'none',
                userSelect: 'none',
              }}>
                {n}
              </div>
              <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, fontFamily: 'monospace', marginBottom: 16 }}>{n}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ──────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 64, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>The tools</p>
          <h2 className="tonic-word" style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#e6edf3', letterSpacing: '-1px' }}>
            Built for every part of the process.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {FEATURES.map(({ tab, num, accent, headline, body, preview }, i) => {
            const reversed = i % 2 !== 0;
            return (
              <div key={tab} className="feature-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 2,
                background: '#161b22',
                borderRadius: 12,
                border: '1px solid #21262d',
                padding: '48px 40px',
                alignItems: 'center',
                direction: reversed ? 'rtl' : 'ltr',
              }}>
                {/* Text side */}
                <div style={{ direction: 'ltr' }}>
                  <div style={{ fontSize: 11, color: accent, fontWeight: 700, fontFamily: 'monospace', marginBottom: 18, letterSpacing: '0.1em' }}>
                    {num}
                  </div>
                  <h3 style={{
                    margin: '0 0 16px',
                    fontSize: 'clamp(22px, 3.5vw, 30px)',
                    fontWeight: 700, color: '#e6edf3',
                    lineHeight: 1.2, letterSpacing: '-0.5px',
                    whiteSpace: 'pre-line',
                  }}>
                    {headline}
                  </h3>
                  <p style={{ margin: '0 0 28px', fontSize: 15, color: '#6b7280', lineHeight: 1.75, maxWidth: 400 }}>
                    {body}
                  </p>
                  <button
                    className="feature-open"
                    onClick={() => onNavigate(tab)}
                    style={{ color: accent }}
                  >
                    Open tool <span>→</span>
                  </button>
                </div>

                {/* Preview tile */}
                <div style={{ direction: 'ltr' }}>
                  {preview}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── QUOTE ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 24px',
        borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d',
        textAlign: 'center',
        background: `radial-gradient(ellipse 60% 80% at 50% 50%, #7c3aed0a 0%, transparent 70%)`,
      }}>
        <blockquote style={{ margin: '0 auto', maxWidth: 680 }}>
          <p className="tonic-serif" style={{
            margin: '0 0 24px',
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontStyle: 'italic',
            color: '#c4b5fd',
            lineHeight: 1.5,
            fontWeight: 400,
            letterSpacing: '-0.3px',
          }}>
            "The relationship between a chord and its scale is not a rule — it's a conversation."
          </p>
          <cite style={{
            fontSize: 13, color: '#4b5563', letterSpacing: '0.15em',
            textTransform: 'uppercase', fontStyle: 'normal', fontWeight: 600,
          }}>
            — tonic
          </cite>
        </blockquote>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 24px',
        textAlign: 'center',
        background: `radial-gradient(ellipse 70% 100% at 50% 100%, #7c3aed15 0%, transparent 70%)`,
      }}>
        <p style={{ margin: '0 0 16px', fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Ready?
        </p>
        <h2 className="tonic-word" style={{
          margin: '0 0 12px',
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800, color: '#e6edf3',
          letterSpacing: '-2px', lineHeight: 1.05,
        }}>
          Hear music differently.
        </h2>
        <p style={{ margin: '0 0 44px', fontSize: 16, color: '#6b7280', lineHeight: 1.6 }}>
          All 9 tools. No account required. Free.
        </p>
        <button className="cta-primary" onClick={() => onNavigate('scaleadvisor')} style={{ fontSize: 17, padding: '17px 44px' }}>
          Open tonic <span style={{ fontSize: 20 }}>→</span>
        </button>
      </section>

    </div>
  );
}
