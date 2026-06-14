import { type Artist } from '../data/artistProfiles';

export function ArtistDNAPanel({ artist, color }: { artist: Artist; color: string }) {
  return (
    <div style={{
      border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
      borderRadius: 10, background: '#161b22', padding: '22px 26px', marginBottom: 28,
    }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 21, color, marginBottom: 3 }}>
          {artist.name}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#8b949e', letterSpacing: '0.02em' }}>
          {artist.tagline}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 20 }}>
        {[
          { label: 'Harmonic DNA', items: artist.harmonicDNA },
          { label: 'Rhythmic DNA', items: artist.rhythmicDNA },
        ].map(col => (
          <div key={col.label}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 8 }}>
              {col.label}
            </div>
            {col.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                <span style={{ color: `${color}88`, fontFamily: "'DM Mono', monospace", fontSize: 10, flexShrink: 0, marginTop: 3 }}>○</span>
                <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.55 }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 8 }}>
          Key Techniques
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px' }}>
          {artist.keyTechniques.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: `${color}66`, flexShrink: 0, minWidth: 18, marginTop: 3 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.55 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: 7 }}>
          Scale Preferences
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {artist.scalePreferences.map(s => (
            <span key={s} style={{
              padding: '2px 9px', borderRadius: 4,
              background: `${color}12`, border: `1px solid ${color}30`,
              fontFamily: "'DM Mono', monospace", fontSize: 11, color: `${color}bb`,
            }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 18px', borderRadius: 8, background: `${color}0c`, border: `1px solid ${color}20` }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${color}77`, marginBottom: 6 }}>
          Construction Approach
        </div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.75, color: '#c9d1d9', margin: 0 }}>
          {artist.exampleApproach}
        </p>
      </div>
    </div>
  );
}
