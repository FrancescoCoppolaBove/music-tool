import { useState, useEffect } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { ARTISTS } from './data/artistProfiles';
import { FONTS } from './components/shared';
import { ArtistDNAPanel } from './components/ArtistDNAPanel';
import { HarmonicPalettePanel } from './components/HarmonicPalettePanel';
import { RhythmicPanel } from './components/RhythmicPanel';
import { ConstructionBlueprintPanel } from './components/ConstructionBlueprintPanel';

export default function RiffArchitectFeature() {
  const { globalKey } = useGlobalKey();
  const [activeArtistId, setActiveArtistId] = useState('snarkyPuppy');
  const [selectedRoot, setSelectedRoot] = useState(globalKey);

  useEffect(() => { setSelectedRoot(globalKey); }, [globalKey]);

  const artist = ARTISTS.find(a => a.id === activeArtistId)!;
  const color = artist.color;

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <style>{FONTS}</style>

      {/* Page header */}
      <div style={{ padding: '28px 0 20px', borderBottom: '1px solid #21262d', marginBottom: 28 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: '#4b5563', textTransform: 'uppercase' }}>
              Music Theory · Composition
            </span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', color: '#e6edf3', margin: '0 0 18px' }}>
            Complex Riff Architect
          </h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ARTISTS.map(a => (
              <button key={a.id} onClick={() => setActiveArtistId(a.id)} style={{
                padding: '7px 16px', borderRadius: 6,
                border: `1px solid ${activeArtistId === a.id ? a.color : '#30363d'}`,
                background: activeArtistId === a.id ? `${a.color}18` : 'transparent',
                color: activeArtistId === a.id ? a.color : '#6b7280',
                fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        <ArtistDNAPanel artist={artist} color={color} />
        <HarmonicPalettePanel color={color} selectedRoot={selectedRoot} onRootChange={setSelectedRoot} />
        <RhythmicPanel color={color} />
        <ConstructionBlueprintPanel artist={artist} color={color} />
      </div>
    </div>
  );
}
