import { useState } from 'react';
import ChordVoicingsFeature from './features/chord-vocings/ChordVoicingsFeature';
import ScaleRecognitionFeature from './features/scale-recognition/ScaleRecognitionFeature';
import ChordProgressionFeature from './features/chord-progression/ChordProgressionFeature';

type Tab = 'voicings' | 'scales' | 'progressions';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'voicings',     label: 'Piano Voicings',     icon: '🎹' },
  { id: 'scales',       label: 'Scale Recognition',  icon: '🎼' },
  { id: 'progressions', label: 'Chord Progressions', icon: '🎸' },
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
        padding: '0 24px',
        background: '#161b22',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}>
          {/* Logo */}
          <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎵</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.3px' }}>
              Music Theory Tool
            </span>
          </div>

          {/* Tab navigation */}
          <nav style={{ display: 'flex', gap: 2 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#7c3aed' : 'transparent'}`,
                  color: activeTab === tab.id ? '#e6edf3' : '#8b949e',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {activeTab === 'voicings'     && <ChordVoicingsFeature />}
        {activeTab === 'scales'       && <ScaleRecognitionFeature />}
        {activeTab === 'progressions' && <ChordProgressionFeature />}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #21262d',
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: '#4b5563',
      }}>
        Music Theory Tool · Piano Voicings · Scale Recognition · Chord Progressions
      </footer>
    </div>
  );
}
