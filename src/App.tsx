import { useState } from 'react';
import ChordVoicingsFeature from './features/chord-vocings/ChordVoicingsFeature';
import ScaleRecognitionFeature from './features/scale-recognition/ScaleRecognitionFeature';
import ScaleDictionaryFeature from './features/scale-dictionary/ScaleDictionaryFeature';
import EarTrainingFeature from './features/ear-training/EarTrainingFeature';
import CircleOfFifthsFeature from './features/circle-of-fifth/CircleOfFifthsFeature';
import ScaleHarmonizationFeature from './features/scale-harmonization/ScaleHarmonizationFeature';
import ModalInterchangeFeature from './features/modal-interchange/ModalInterchangeFeature';
import ChordProgressionFeature from './features/chord-progression/ChordProgressionFeature';

type Tab =
  | 'voicings'
  | 'scales'
  | 'dictionary'
  | 'ear'
  | 'circle'
  | 'harmonization'
  | 'modal'
  | 'progressions';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'voicings',      label: 'Piano Voicings',    icon: '🎹' },
  { id: 'scales',        label: 'Scale Recognition', icon: '🎼' },
  { id: 'dictionary',   label: 'Scale Dictionary',  icon: '📚' },
  { id: 'ear',           label: 'Ear Training',      icon: '👂' },
  { id: 'circle',        label: 'Circle of Fifths',  icon: '🔵' },
  { id: 'harmonization', label: 'Scale Harmony',     icon: '🎶' },
  { id: 'modal',         label: 'Modal Interchange', icon: '🔄' },
  { id: 'progressions',  label: 'Chord Progressions',icon: '🎸' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('voicings');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      color: '#e6edf3',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #21262d',
        background: '#161b22',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0 0' }}>
            <span style={{ fontSize: 20 }}>🎵</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.3px' }}>
              Music Theory Tool
            </span>
          </div>

          {/* Tab navigation — horizontally scrollable on mobile */}
          <nav style={{
            display: 'flex',
            gap: 0,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#7c3aed' : 'transparent'}`,
                  color: activeTab === tab.id ? '#e6edf3' : '#8b949e',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
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
        {activeTab === 'dictionary'   && <ScaleDictionaryFeature />}
        {activeTab === 'ear'           && <EarTrainingFeature />}
        {activeTab === 'circle'        && <CircleOfFifthsFeature />}
        {activeTab === 'harmonization' && <ScaleHarmonizationFeature />}
        {activeTab === 'modal'         && <ModalInterchangeFeature />}
        {activeTab === 'progressions'  && <ChordProgressionFeature />}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #21262d',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: 11,
        color: '#4b5563',
      }}>
        Music Theory Tool · Piano Voicings · Scale Recognition · Scale Dictionary · Ear Training · Circle of Fifths · Scale Harmony · Modal Interchange · Chord Progressions
      </footer>
    </div>
  );
}
