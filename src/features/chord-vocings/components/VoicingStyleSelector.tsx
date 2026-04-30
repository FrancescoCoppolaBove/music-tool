import type { VoicingStyle } from '../types/chord.types';

const STYLE_DESCRIPTIONS: Record<VoicingStyle, string> = {
  closed: 'Compact, close-position voicings and inversions',
  drop2: 'Classic jazz spread — 2nd highest note dropped an octave',
  drop3: 'Wide jazz spread — 3rd highest note dropped an octave',
  shell: 'Minimal guide-tone voicings (root, 3rd, 7th)',
  rootless: 'No root — color tones only, for piano in a jazz combo',
  open: 'Root + 5th low, 3rd + 7th high — resonant spread',
  quartal: 'Stacked perfect 4ths — modal, ambiguous sound',
  spread: 'Very wide voicings across 2–3 octaves',
  upperStructure: 'Shell voicing + upper structure triad on top',
};

interface Props {
  selected: VoicingStyle[];
  onChange: (styles: VoicingStyle[]) => void;
}

const ALL_STYLES: VoicingStyle[] = ['closed', 'drop2', 'drop3', 'shell', 'rootless', 'open', 'quartal', 'spread', 'upperStructure'];

export default function VoicingStyleSelector({ selected, onChange }: Props) {
  function toggle(style: VoicingStyle) {
    if (selected.includes(style)) {
      if (selected.length === 1) return; // always keep at least one
      onChange(selected.filter(s => s !== style));
    } else {
      onChange([...selected, style]);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#8b949e', fontWeight: 500 }}>Filter by voicing style</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onChange([...ALL_STYLES])}
            style={{ padding: '3px 10px', background: 'none', border: '1px solid #30363d', borderRadius: 5, color: '#8b949e', fontSize: 12, cursor: 'pointer' }}
          >
            All
          </button>
          <button
            onClick={() => onChange(['drop2', 'rootless', 'shell'])}
            style={{ padding: '3px 10px', background: 'none', border: '1px solid #30363d', borderRadius: 5, color: '#8b949e', fontSize: 12, cursor: 'pointer' }}
          >
            Jazz Essentials
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ALL_STYLES.map(style => {
          const isOn = selected.includes(style);
          return (
            <button
              key={style}
              onClick={() => toggle(style)}
              title={STYLE_DESCRIPTIONS[style]}
              style={{
                padding: '5px 12px',
                background: isOn ? '#1d4ed820' : 'none',
                border: `1px solid ${isOn ? '#3b82f6' : '#30363d'}`,
                borderRadius: 6,
                color: isOn ? '#93c5fd' : '#6b7280',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: isOn ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {style === 'upperStructure' ? 'Upper Structure' : style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
