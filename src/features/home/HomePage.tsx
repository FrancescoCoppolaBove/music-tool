type Tab = 'home' | 'voicings' | 'scales' | 'dictionary' | 'ear' | 'circle' | 'harmonization' | 'modal' | 'progressions' | 'scaleadvisor';

interface FeatureDef {
  id: Tab;
  icon: string;
  name: string;
  description: string;
}

interface GroupDef {
  id: string;
  label: string;
  icon: string;
  accent: string;
  features: FeatureDef[];
}

const FEATURE_GROUPS: GroupDef[] = [
  {
    id: 'composition',
    label: 'Composition',
    icon: '✍️',
    accent: '#7c3aed',
    features: [
      {
        id: 'scaleadvisor',
        icon: '🧭',
        name: 'Scale Advisor',
        description: 'Discover which scales and modes to play over any chord or progression. Built on chord-scale theory from jazz and modern harmony — with practical melodic minor tricks.',
      },
      {
        id: 'progressions',
        icon: '🎸',
        name: 'Chord Progressions',
        description: 'Generate sophisticated harmonic sequences in any key and mode. From diatonic to modal interchange, tritone subs, altered dominants, and beyond.',
      },
    ],
  },
  {
    id: 'scale',
    label: 'Scale',
    icon: '🎼',
    accent: '#2563eb',
    features: [
      {
        id: 'scales',
        icon: '🔍',
        name: 'Scale Recognition',
        description: 'Identify any scale from its notes. Supports 50+ scales from major and minor to exotic modes, bebop scales, and symmetric scales.',
      },
      {
        id: 'dictionary',
        icon: '📚',
        name: 'Scale Dictionary',
        description: 'Browse a complete reference of scales with intervals, modes, and harmonic context. Your go-to resource for understanding any tonal system.',
      },
    ],
  },
  {
    id: 'theory',
    label: 'Theory',
    icon: '📖',
    accent: '#0891b2',
    features: [
      {
        id: 'harmonization',
        icon: '🎶',
        name: 'Scale Harmony',
        description: 'Explore how chords and scales relate through harmonization. Understand modal writing, chord qualities per degree, and voice leading principles.',
      },
      {
        id: 'modal',
        icon: '🔄',
        name: 'Modal Interchange',
        description: 'Borrow chords from parallel modes. Understand how modal mixture creates color, tension, and unexpected emotional depth in your progressions.',
      },
      {
        id: 'voicings',
        icon: '🎹',
        name: 'Piano Voicings',
        description: 'Visualize chord voicings on a piano keyboard — closed position, drop 2/3, shell voicings, quartal, and upper structure triads.',
      },
      {
        id: 'circle',
        icon: '🔵',
        name: 'Circle of Fifths',
        description: 'Navigate key relationships, chord functions, and modulation paths through the fundamental map of tonal harmony.',
      },
      {
        id: 'ear',
        icon: '👂',
        name: 'Ear Training',
        description: 'Train your ear to recognize intervals, chords, and progressions. Essential for any musician who wants to transcribe and compose by ear.',
      },
    ],
  },
];

interface HomePageProps {
  onNavigate: (tab: Tab) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '72px 24px 64px',
        background: 'radial-gradient(ellipse 70% 60% at 50% 0%, #7c3aed18 0%, transparent 70%)',
        borderBottom: '1px solid #21262d',
        marginBottom: 48,
      }}>
        {/* Logo */}
        <img
          src="/logo.svg"
          alt="tonic"
          style={{ width: 96, height: 96, marginBottom: 28, opacity: 0.95 }}
        />

        {/* Title */}
        <h1 style={{
          margin: '0 0 12px',
          fontSize: 'clamp(48px, 8vw, 80px)',
          fontWeight: 800,
          color: '#e6edf3',
          letterSpacing: '-2px',
          lineHeight: 1,
        }}>
          tonic
        </h1>

        {/* Tagline */}
        <p style={{
          margin: '0 0 20px',
          fontSize: 'clamp(14px, 3vw, 18px)',
          fontWeight: 600,
          color: '#7c3aed',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          Explore · Hear · Create
        </p>

        {/* Description */}
        <p style={{
          margin: '0 0 40px',
          fontSize: 'clamp(14px, 2.5vw, 17px)',
          color: '#8b949e',
          maxWidth: 520,
          lineHeight: 1.7,
        }}>
          A complete music theory toolkit for composers, improvisers, and musicians
          who want to understand harmony at a deeper level.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => onNavigate('scaleadvisor')}
            style={{
              padding: '13px 32px',
              background: '#7c3aed',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.2px',
            }}
          >
            Start Exploring →
          </button>
          <button
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '13px 32px',
              background: 'none',
              border: '1px solid #30363d',
              borderRadius: 10,
              color: '#8b949e',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View all tools
          </button>
        </div>
      </section>

      {/* ── Feature groups ───────────────────────────────────────── */}
      <div id="features" style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingBottom: 64 }}>
        {FEATURE_GROUPS.map(group => (
          <section key={group.id}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: `1px solid ${group.accent}30`,
            }}>
              <span style={{ fontSize: 20 }}>{group.icon}</span>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: group.accent,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {group.label}
              </span>
            </div>

            {/* Feature cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
            }}>
              {group.features.map(feature => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  accent={group.accent}
                  onClick={() => onNavigate(feature.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Philosophy strip ─────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid #21262d',
        padding: '40px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { n: '9', label: 'Tools' },
            { n: '8', label: 'Modes' },
            { n: '50+', label: 'Scales' },
            { n: '∞', label: 'Progressions' },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
        <p style={{
          margin: '16px 0 0',
          fontSize: 13,
          color: '#4b5563',
          maxWidth: 440,
          lineHeight: 1.7,
        }}>
          Inspired by the harmonic language of Snarky Puppy, Jacob Collier, Radiohead,
          Weather Report, and the jazz tradition.
        </p>
      </div>

    </div>
  );
}

// ── Feature card sub-component ───────────────────────────────────────────────

function FeatureCard({
  feature,
  accent,
  onClick,
}: {
  feature: FeatureDef;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        padding: '20px 20px 20px',
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = accent;
        (e.currentTarget as HTMLButtonElement).style.background = `${accent}0a`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d';
        (e.currentTarget as HTMLButtonElement).style.background = '#161b22';
      }}
    >
      <div style={{ fontSize: 32 }}>{feature.icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3', marginBottom: 6 }}>
          {feature.name}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          {feature.description}
        </div>
      </div>
      <div style={{
        marginTop: 'auto',
        fontSize: 12,
        color: accent,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        Open tool <span style={{ fontSize: 14 }}>→</span>
      </div>
    </button>
  );
}
