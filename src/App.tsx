import { useState, useEffect } from 'react';
import ChordVoicingsFeature from './features/chord-vocings/ChordVoicingsFeature';
import ScaleRecognitionFeature from './features/scale-recognition/ScaleRecognitionFeature';
import ScaleDictionaryFeature from './features/scale-dictionary/ScaleDictionaryFeature';
import EarTrainingFeature from './features/ear-training/EarTrainingFeature';
import CircleOfFifthsFeature from './features/circle-of-fifth/CircleOfFifthsFeature';
import ScaleHarmonizationFeature from './features/scale-harmonization/ScaleHarmonizationFeature';
import ModalInterchangeFeature from './features/modal-interchange/ModalInterchangeFeature';
import ChordProgressionFeature from './features/chord-progression/ChordProgressionFeature';
import ScaleAdvisorFeature from './features/scale-advisor/ScaleAdvisorFeature';
import HarmonicAnalysisFeature from './features/harmonic-analysis/HarmonicAnalysisFeature';
import RiffArchitectFeature from './features/riff-architect/RiffArchitectFeature';
import MelodyArchitectFeature from './features/melody-architect/MelodyArchitectFeature';
import IntervalQuizFeature from './features/interval-quiz/IntervalQuizFeature';
import HomePage from './features/home/HomePage';

// ─── Theme styles ─────────────────────────────────────────────────────────────

const HEADER_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

:root {
  --color-bg-base: #0d1117;
  --color-bg-surface: #161b22;
  --color-bg-raised: #1c2128;
  --color-bg-hover: #21262d;
  --color-border: #30363d;
  --color-border-subtle: #21262d;
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-muted: #6b7280;
  --color-accent: #7c3aed;
  --color-accent-dim: #6d28d9;
  --color-accent-soft: rgba(124,58,237,0.08);
  --color-accent-glow: rgba(124,58,237,0.3);
  --color-accent-text: #c4b5fd;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 100%;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  user-select: none;
}

.nav-item:hover {
  color: var(--color-accent-text);
}

.nav-item.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-accent);
}

.nav-dropdown-item {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: background 0.12s;
}

.nav-dropdown-item:hover {
  background: #21262d;
}

.nav-dropdown-item:hover .nav-dropdown-item-name {
  color: #e6edf3;
}

.nav-dropdown-item.active {
  background: rgba(124,58,237,0.08);
}

.nav-dropdown-item-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
  transition: color 0.12s;
}

.nav-dropdown-item.active .nav-dropdown-item-name {
  color: #c4b5fd;
}

.nav-dropdown-item-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.header-cta {
  transition: transform 0.15s, box-shadow 0.15s;
}

.header-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 24px rgba(124,58,237,0.5);
}
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | 'home'
  | 'voicings'
  | 'scales'
  | 'dictionary'
  | 'ear'
  | 'circle'
  | 'harmonization'
  | 'modal'
  | 'progressions'
  | 'scaleadvisor'
  | 'analysis'
  | 'riff'
  | 'melody'
  | 'quiz';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
  desc: string;
}

interface GroupDef {
  id: string;
  label: string;
  icon: string;
  tabs: TabDef[];
}

// ─── Navigation structure ────────────────────────────────────────────────────

const GROUPS: GroupDef[] = [
  {
    id: 'composition',
    label: 'Composition',
    icon: '✍️',
    tabs: [
      { id: 'scaleadvisor',  label: 'Scale Advisor',      icon: '🧭', desc: 'Find the right scale over any chord' },
      { id: 'progressions',  label: 'Chord Progressions', icon: '🎸', desc: 'Build jazz, modal & cinematic progressions' },
      { id: 'analysis',      label: 'Harmonic Analysis',  icon: '🔬', desc: 'Analyse key, Roman numerals & chord function' },
      { id: 'riff',          label: 'Riff Architect',     icon: '🎵', desc: 'Build a riff from rhythm, style & scale degrees' },
      { id: 'melody',        label: 'Melody Architect',   icon: '〰️', desc: 'Shape a melody with contour, approach & motif' },
    ],
  },
  {
    id: 'scale',
    label: 'Scale',
    icon: '🎼',
    tabs: [
      { id: 'scales',     label: 'Scale Recognition', icon: '🔍', desc: 'Identify a scale from its notes' },
      { id: 'dictionary', label: 'Scale Dictionary',  icon: '📚', desc: 'Browse all scales and their modes' },
    ],
  },
  {
    id: 'theory',
    label: 'Theory',
    icon: '📖',
    tabs: [
      { id: 'harmonization', label: 'Scale Harmony',     icon: '🎶', desc: 'See how chords relate to their scale' },
      { id: 'modal',         label: 'Modal Interchange', icon: '🔄', desc: 'Borrow chords from parallel modes' },
      { id: 'voicings',      label: 'Piano Voicings',    icon: '🎹', desc: 'Visualize drop 2, quartal & upper structures' },
      { id: 'circle',        label: 'Circle of Fifths',  icon: '🔵', desc: 'Explore key relationships at a glance' },
      { id: 'ear',           label: 'Ear Training',      icon: '👂', desc: 'Train your ear with interval exercises' },
      { id: 'quiz',          label: 'Scale Degree Quiz',  icon: '🎯', desc: 'Train your knowledge of major scale degrees' },
    ],
  },
];

// ─── Desktop NavGroup dropdown ───────────────────────────────────────────────

function NavGroup({
  group, activeTab, isOpen, onToggle, onSelect,
}: {
  group: GroupDef;
  activeTab: Tab;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (tab: Tab) => void;
}) {
  const isGroupActive = group.tabs.some(t => t.id === activeTab);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      <button
        onClick={onToggle}
        className={`nav-item${isGroupActive || isOpen ? ' active' : ''}`}
      >
        <span>{group.label}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            opacity: 0.5,
          }}
        >
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', left: 0,
            minWidth: 260,
            background: '#1c2128',
            border: '1px solid #30363d',
            borderRadius: 12,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)',
            zIndex: 200,
            padding: '6px',
          }}
        >
          {group.tabs.map(tab => {
            const isCurrent = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`nav-dropdown-item${isCurrent ? ' active' : ''}`}
              >
                {/* Accent bar */}
                <span style={{
                  width: 3,
                  alignSelf: 'stretch',
                  background: isCurrent ? '#7c3aed' : '#30363d',
                  borderRadius: '3px 0 0 3px',
                  flexShrink: 0,
                  marginRight: 14,
                }} />
                {/* Text content */}
                <span style={{ flex: 1, padding: '12px 16px 12px 0' }}>
                  <span className="nav-dropdown-item-name" style={{ display: 'block' }}>
                    {tab.label}
                  </span>
                  <span className="nav-dropdown-item-desc" style={{ display: 'block' }}>
                    {tab.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Mobile full-screen menu ─────────────────────────────────────────────────

function MobileMenu({
  activeTab, onSelect, onClose,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 299,
          background: 'rgba(0,0,0,0.6)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 59, left: 0, right: 0, bottom: 0, zIndex: 300,
          background: '#161b22',
          borderTop: '1px solid #30363d',
          overflowY: 'scroll',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          padding: '8px 0 env(safe-area-inset-bottom, 32px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)',
        } as React.CSSProperties}
      >
        {GROUPS.map(group => (
          <div key={group.id}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 20px 8px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: '#4b5563', textTransform: 'uppercase',
              borderTop: '1px solid #21262d',
              marginTop: 4,
            }}>
              <span style={{ fontSize: 13 }}>{group.icon}</span>
              {group.label}
            </div>

            {/* Tabs in group */}
            {group.tabs.map(tab => {
              const isCurrent = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelect(tab.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 20px',
                    background: isCurrent ? '#7c3aed18' : 'none',
                    border: 'none',
                    borderLeft: `3px solid ${isCurrent ? '#7c3aed' : 'transparent'}`,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: isCurrent ? '#7c3aed22' : '#21262d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {tab.icon}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{
                      display: 'block',
                      fontSize: 15, fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent ? '#c4b5fd' : '#e6edf3',
                      lineHeight: 1.3,
                    }}>
                      {tab.label}
                    </span>
                    <span style={{
                      display: 'block',
                      fontSize: 12, color: '#6b7280',
                      marginTop: 2, lineHeight: 1.4,
                    }}>
                      {tab.desc}
                    </span>
                  </span>
                  {isCurrent && (
                    <span style={{ color: '#7c3aed', fontSize: 12, flexShrink: 0 }}>●</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  function handleToggleGroup(groupId: string) {
    setOpenGroup(prev => prev === groupId ? null : groupId);
  }

  function handleSelectTab(tab: Tab) {
    setActiveTab(tab);
    setOpenGroup(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Find the active tool name for mobile header breadcrumb
  const activeToolLabel = GROUPS.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label ?? null;

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', display: 'flex', flexDirection: 'column' }}>

      {/* Inject header styles + Google Fonts */}
      <style>{HEADER_STYLES}</style>

      {/* Desktop overlay — closes dropdowns on outside click */}
      {openGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setOpenGroup(null)} />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid #21262d',
        background: '#161b22',
        position: 'sticky', top: 0, zIndex: 160,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', height: 58 }}>

            {/* Logo + wordmark — click goes home */}
            <button
              onClick={() => handleSelectTab('home')}
              title="tonic — home"
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0',
                marginRight: 0,
                background: 'none', border: 'none',
                cursor: 'pointer', flexShrink: 0,
                gap: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="tonic"
                style={{ width: 36, height: 36, display: 'block', mixBlendMode: 'screen' }}
              />
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: '#e6edf3',
                letterSpacing: '-0.5px',
                marginLeft: 10,
                lineHeight: 1,
              }}>
                tonic
              </span>
            </button>

            {/* Divider */}
            <div style={{
              width: 1,
              height: 28,
              background: '#21262d',
              alignSelf: 'center',
              margin: '0 20px',
              flexShrink: 0,
            }} />

            {/* ── Desktop nav (hidden on mobile via CSS) ── */}
            <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'stretch', position: 'relative', zIndex: 161 }}>
              {GROUPS.map(group => (
                <NavGroup
                  key={group.id}
                  group={group}
                  activeTab={activeTab}
                  isOpen={openGroup === group.id}
                  onToggle={() => handleToggleGroup(group.id)}
                  onSelect={handleSelectTab}
                />
              ))}
            </nav>

            {/* ── Mobile: active page label (hidden on desktop) ── */}
            {activeToolLabel && (
              <div className="mobile-breadcrumb" style={{
                display: 'none', /* overridden by CSS on mobile */
                alignItems: 'center',
                flex: 1,
                fontSize: 14, fontWeight: 600, color: '#c4b5fd',
                paddingLeft: 12,
              }}>
                {activeToolLabel}
              </div>
            )}

            {/* Right spacer */}
            <div style={{ flex: 1 }} />

            {/* CTA pill — desktop only */}
            <button
              className="header-cta desktop-only"
              onClick={() => handleSelectTab('scaleadvisor')}
              style={{
                alignSelf: 'center',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                padding: '8px 18px',
                borderRadius: 100,
                border: 'none',
                boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                cursor: 'pointer',
              }}
            >
              Start Exploring →
            </button>

            {/* ── Mobile: hamburger button (hidden on desktop) ── */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Open navigation menu"
              style={{
                display: 'none', /* overridden by CSS on mobile */
                alignItems: 'center', justifyContent: 'center',
                marginLeft: 8,
                width: 44, height: '100%',
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#e6edf3',
                flexShrink: 0,
              }}
            >
              {mobileMenuOpen ? (
                /* X icon */
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* ── Mobile full menu ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <MobileMenu
          activeTab={activeTab}
          onSelect={handleSelectTab}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Main content ────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        maxWidth: activeTab === 'home' ? '100%' : 1200,
        width: '100%',
        margin: '0 auto',
        padding: activeTab === 'home' ? '0' : '24px 16px',
        boxSizing: 'border-box',
      }}>
        {activeTab === 'home'          && <HomePage onNavigate={handleSelectTab} />}
        {activeTab === 'voicings'      && <ChordVoicingsFeature />}
        {activeTab === 'scales'        && <ScaleRecognitionFeature />}
        {activeTab === 'dictionary'    && <ScaleDictionaryFeature />}
        {activeTab === 'ear'           && <EarTrainingFeature />}
        {activeTab === 'circle'        && <CircleOfFifthsFeature />}
        {activeTab === 'harmonization' && <ScaleHarmonizationFeature />}
        {activeTab === 'modal'         && <ModalInterchangeFeature />}
        {activeTab === 'progressions'  && <ChordProgressionFeature />}
        {activeTab === 'scaleadvisor'  && <ScaleAdvisorFeature />}
        {activeTab === 'analysis'      && <HarmonicAnalysisFeature />}
        {activeTab === 'riff'          && <RiffArchitectFeature />}
        {activeTab === 'melody'        && <MelodyArchitectFeature />}
        {activeTab === 'quiz'          && <IntervalQuizFeature />}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #21262d',
        padding: '12px 16px',
        textAlign: 'center',
        fontSize: 11,
        color: '#4b5563',
      }}>
        tonic · Explore. Hear. Create.
      </footer>
    </div>
  );
}
