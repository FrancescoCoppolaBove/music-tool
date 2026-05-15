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

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
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
    id: 'scale',
    label: 'Scale',
    icon: '🎼',
    tabs: [
      { id: 'scales',        label: 'Scale Recognition', icon: '🔍' },
      { id: 'dictionary',    label: 'Scale Dictionary',  icon: '📚' },
      { id: 'harmonization', label: 'Scale Harmony',     icon: '🎶' },
      { id: 'scaleadvisor',  label: 'Scale Advisor',     icon: '🧭' },
    ],
  },
  {
    id: 'accordi',
    label: 'Accordi',
    icon: '🎹',
    tabs: [
      { id: 'voicings',     label: 'Piano Voicings',     icon: '🎹' },
      { id: 'progressions', label: 'Chord Progressions', icon: '🎸' },
      { id: 'modal',        label: 'Modal Interchange',  icon: '🔄' },
    ],
  },
  {
    id: 'teoria',
    label: 'Teoria',
    icon: '📖',
    tabs: [
      { id: 'circle', label: 'Circle of Fifths', icon: '🔵' },
      { id: 'ear',    label: 'Ear Training',     icon: '👂' },
    ],
  },
];

// ─── NavGroup dropdown component ─────────────────────────────────────────────

function NavGroup({
  group,
  activeTab,
  isOpen,
  onToggle,
  onSelect,
}: {
  group: GroupDef;
  activeTab: Tab;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (tab: Tab) => void;
}) {
  const isGroupActive = group.tabs.some(t => t.id === activeTab);
  const activeTabInGroup = group.tabs.find(t => t.id === activeTab);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          borderBottom: `2px solid ${isGroupActive || isOpen ? '#7c3aed' : 'transparent'}`,
          color: isGroupActive || isOpen ? '#e6edf3' : '#8b949e',
          fontSize: 13,
          fontWeight: isGroupActive ? 600 : 400,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'color 0.15s',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 15 }}>{group.icon}</span>
        <span>
          {activeTabInGroup ? activeTabInGroup.label : group.label}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            marginLeft: 2,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            opacity: 0.6,
          }}
        >
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 2px)',
          left: 0,
          minWidth: 210,
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 200,
          overflow: 'hidden',
          padding: '6px',
        }}>
          {group.tabs.map(tab => {
            const isCurrent = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  background: isCurrent ? '#7c3aed20' : 'none',
                  border: 'none',
                  borderRadius: 7,
                  color: isCurrent ? '#c4b5fd' : '#8b949e',
                  fontSize: 13,
                  fontWeight: isCurrent ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s, color 0.1s',
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
                {isCurrent && (
                  <span style={{ marginLeft: 'auto', color: '#7c3aed', fontSize: 10 }}>●</span>
                )}
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
  const [activeTab, setActiveTab] = useState<Tab>('voicings');
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  function handleToggleGroup(groupId: string) {
    setOpenGroup(prev => (prev === groupId ? null : groupId));
  }

  function handleSelectTab(tab: Tab) {
    setActiveTab(tab);
    setOpenGroup(null);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      color: '#e6edf3',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Overlay — chiude i dropdown se si clicca fuori */}
      {openGroup && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
          onClick={() => setOpenGroup(null)}
        />
      )}

      {/* Header */}
      <header style={{
        borderBottom: '1px solid #21262d',
        background: '#161b22',
        position: 'sticky',
        top: 0,
        zIndex: 160,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          {/* Logo + nav — tutto in una riga */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {/* Logo */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingRight: 24, borderRight: '1px solid #21262d',
              marginRight: 8,
            }}>
              <span style={{ fontSize: 18 }}>🎵</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                Music Theory Tool
              </span>
            </div>

            {/* Dropdown groups */}
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

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '24px 16px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
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

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #21262d',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: 11,
        color: '#4b5563',
      }}>
        Music Theory Tool · Scale · Accordi · Teoria
      </footer>
    </div>
  );
}
