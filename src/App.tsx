import { useState } from 'react';
import ChordVoicingsFeature from './features/chord-vocings/ChordVoicingsFeature';
import ScaleRecognitionFeature from './features/scale-recognition/ScaleRecognitionFeature';
import ScaleDictionaryFeature from './features/scale-dictionary/ScaleDictionaryFeature';
import EarTrainingFeature from './features/ear-training/EarTrainingFeature';
import CircleOfFifthsFeature from './features/circle-of-fifth/CircleOfFifthsFeature';
import ScaleHarmonizationFeature from './features/scale-harmonization/ScaleHarmonizationFeature';
import ModalInterchangeFeature from './features/modal-interchange/ModalInterchangeFeature';
import ChordProgressionFeature from './features/chord-progression/ChordProgressionFeature';
import ScaleAdvisorFeature from './features/scale-advisor/ScaleAdvisorFeature';
import HomePage from './features/home/HomePage';

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
  | 'scaleadvisor';

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
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '14px 16px',
          background: 'none', border: 'none',
          borderBottom: `2px solid ${isGroupActive || isOpen ? '#7c3aed' : 'transparent'}`,
          color: isGroupActive || isOpen ? '#e6edf3' : '#8b949e',
          fontSize: 13, fontWeight: isGroupActive ? 600 : 400,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'color 0.15s', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 15 }}>{group.icon}</span>
        <span>{group.label}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s', opacity: 0.5,
          }}
        >
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', left: 0,
            minWidth: 230, background: '#161b22',
            border: '1px solid #30363d', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 200, padding: '6px',
          }}
        >
          {group.tabs.map(tab => {
            const isCurrent = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', background: isCurrent ? '#7c3aed20' : 'none',
                  border: 'none', borderRadius: 7,
                  color: isCurrent ? '#c4b5fd' : '#8b949e',
                  fontSize: 13, fontWeight: isCurrent ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!isCurrent) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#30363d40';
                    (e.currentTarget as HTMLButtonElement).style.color = '#e6edf3';
                  }
                }}
                onMouseLeave={e => {
                  if (!isCurrent) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    (e.currentTarget as HTMLButtonElement).style.color = '#8b949e';
                  }
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {isCurrent && <span style={{ color: '#7c3aed', fontSize: 10 }}>●</span>}
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
          position: 'fixed', top: 59, left: 0, right: 0, zIndex: 300,
          background: '#161b22',
          borderBottom: '1px solid #30363d',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 59px)',
          padding: '8px 0 24px',
        }}
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

            {/* Logo — click goes home */}
            <button
              onClick={() => handleSelectTab('home')}
              title="tonic — home"
              style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 16px 10px 0',
                marginRight: 8,
                background: 'none', border: 'none',
                borderRight: '1px solid #21262d',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <img
                src="/logo.svg"
                alt="tonic"
                style={{ width: 34, height: 34, display: 'block' }}
              />
            </button>

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

            {/* ── Mobile: hamburger button (hidden on desktop) ── */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Open navigation menu"
              style={{
                display: 'none', /* overridden by CSS on mobile */
                alignItems: 'center', justifyContent: 'center',
                marginLeft: 'auto',
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
