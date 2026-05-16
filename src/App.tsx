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
      { id: 'scaleadvisor',  label: 'Scale Advisor',      icon: '🧭' },
      { id: 'progressions',  label: 'Chord Progressions', icon: '🎸' },
    ],
  },
  {
    id: 'scale',
    label: 'Scale',
    icon: '🎼',
    tabs: [
      { id: 'scales',     label: 'Scale Recognition', icon: '🔍' },
      { id: 'dictionary', label: 'Scale Dictionary',  icon: '📚' },
    ],
  },
  {
    id: 'theory',
    label: 'Theory',
    icon: '📖',
    tabs: [
      { id: 'harmonization', label: 'Scale Harmony',     icon: '🎶' },
      { id: 'modal',         label: 'Modal Interchange', icon: '🔄' },
      { id: 'voicings',      label: 'Piano Voicings',    icon: '🎹' },
      { id: 'circle',        label: 'Circle of Fifths',  icon: '🔵' },
      { id: 'ear',           label: 'Ear Training',      icon: '👂' },
    ],
  },
];

// ─── NavGroup dropdown ───────────────────────────────────────────────────────

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
        <span className="nav-label">{group.label}</span>
        <svg
          className="nav-arrow"
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
          className="nav-dropdown"
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', left: 0,
            minWidth: 210, background: '#161b22',
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
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{tab.icon}</span>
                {tab.label}
                {isCurrent && <span style={{ marginLeft: 'auto', color: '#7c3aed', fontSize: 10 }}>●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  function handleToggleGroup(groupId: string) {
    setOpenGroup(prev => prev === groupId ? null : groupId);
  }

  function handleSelectTab(tab: Tab) {
    setActiveTab(tab);
    setOpenGroup(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', display: 'flex', flexDirection: 'column' }}>

      {/* Overlay — closes dropdowns on outside click */}
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
          <div style={{ display: 'flex', alignItems: 'stretch' }}>

            {/* Logo — click goes home */}
            <button
              onClick={() => handleSelectTab('home')}
              title="tonic — home"
              style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 20px 10px 0',
                marginRight: 8,
                background: 'none', border: 'none',
                borderRight: '1px solid #21262d',
                cursor: 'pointer',
              }}
            >
              <img
                src="/logo.svg"
                alt="tonic"
                style={{ width: 38, height: 38, display: 'block' }}
              />
            </button>

            {/* Nav groups */}
            <nav style={{ display: 'flex', alignItems: 'stretch', position: 'relative', zIndex: 161 }}>
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

          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        maxWidth: activeTab === 'home' ? '100%' : 1200,
        width: '100%',
        margin: '0 auto',
        padding: activeTab === 'home' ? '0' : '24px 16px',
        boxSizing: 'border-box',
      }}>
        {activeTab === 'home'         && <HomePage onNavigate={handleSelectTab} />}
        {activeTab === 'voicings'     && <ChordVoicingsFeature />}
        {activeTab === 'scales'       && <ScaleRecognitionFeature />}
        {activeTab === 'dictionary'   && <ScaleDictionaryFeature />}
        {activeTab === 'ear'          && <EarTrainingFeature />}
        {activeTab === 'circle'       && <CircleOfFifthsFeature />}
        {activeTab === 'harmonization'&& <ScaleHarmonizationFeature />}
        {activeTab === 'modal'        && <ModalInterchangeFeature />}
        {activeTab === 'progressions' && <ChordProgressionFeature />}
        {activeTab === 'scaleadvisor' && <ScaleAdvisorFeature />}
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
