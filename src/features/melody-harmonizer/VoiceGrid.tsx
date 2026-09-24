// src/features/melody-harmonizer/VoiceGrid.tsx

import { useState } from 'react';
import type { HarmonizationResult } from './types';

const COLORS = ['#60a5fa', '#c4b5fd', '#6ee7b7', '#fdba74'];
const BG     = ['#1e3a5f', '#2d1b69', '#064e3b', '#431407'];

interface Props {
  result: HarmonizationResult;
}

export default function VoiceGrid({ result }: Props) {
  const [hover, setHover] = useState<{ si: number; vi: number } | null>(null);
  const { slots, voiceNames } = result;
  const voiceCount = Math.max(...slots.map(s => s.voices.length));

  function copyVoice(vi: number) {
    navigator.clipboard.writeText(
      slots.map(s => s.voices[vi] ?? '—').join(' ')
    );
  }

  function copyAll() {
    const lines = voiceNames.map((name, vi) =>
      `${name}: ${slots.map(s => s.voices[vi] ?? '—').join(' ')}`
    );
    navigator.clipboard.writeText(lines.join('\n'));
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 360 }}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            {slots.map((s, si) => (
              <th key={si} style={{ ...thStyle, textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: 10 }}>{s.chord}</div>
                {s.role === 'approach' && (
                  <div style={{ color: '#475569', fontSize: 9, fontFamily: 'monospace' }}>APR</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: voiceCount }, (_, vi) => (
            <tr key={vi}>
              <td style={{ ...tdLabel, color: COLORS[vi] ?? '#94a3b8' }}>
                {voiceNames[vi] ?? `Voice ${vi + 1}`}
              </td>
              {slots.map((s, si) => {
                const noteName   = s.voices[vi] ?? '—';
                const label      = s.voiceLabels[vi] ?? '';
                const isApproach = s.role === 'approach';
                const isHovered  = hover?.si === si && hover?.vi === vi;
                return (
                  <td
                    key={si}
                    style={{ textAlign: 'center', padding: '4px 3px', position: 'relative' }}
                    onMouseEnter={() => setHover({ si, vi })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <span style={{
                      display: 'inline-block',
                      background: BG[vi] ?? '#1e293b',
                      color: isApproach
                        ? `${COLORS[vi] ?? '#60a5fa'}88`
                        : (COLORS[vi] ?? '#e2e8f0'),
                      padding: '3px 9px', borderRadius: 4,
                      fontSize: 13, fontFamily: 'monospace',
                      fontWeight: vi === 0 ? 600 : 400,
                      border: isApproach ? `1px dashed #334155` : '1px solid transparent',
                      cursor: 'default',
                    }}>
                      {noteName}
                    </span>
                    {isHovered && (vi > 0) && label && (
                      <div style={{
                        position: 'absolute', bottom: '110%', left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1e293b', border: '1px solid #334155',
                        borderRadius: 6, padding: '4px 8px',
                        fontSize: 11, color: '#94a3b8',
                        whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none',
                      }}>
                        {noteName} = {label} of {s.chord}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {voiceNames.slice(1).map((name, i) => (
          <button key={i} onClick={() => copyVoice(i + 1)} style={copyBtn}>
            ⎘ Copia {name}
          </button>
        ))}
        <button
          onClick={copyAll}
          style={{ ...copyBtn, borderColor: '#3b5998', color: '#60a5fa' }}
        >
          ⎘ Copia tutte
        </button>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderBottom: '1px solid #1e293b',
  fontWeight: 'normal',
};

const tdLabel: React.CSSProperties = {
  padding: '4px 14px 4px 0',
  fontSize: 11, fontFamily: 'monospace',
  whiteSpace: 'nowrap', textAlign: 'right',
};

const copyBtn: React.CSSProperties = {
  background: '#1e293b', border: '1px solid #334155',
  borderRadius: 6, color: '#94a3b8',
  padding: '4px 12px', fontSize: 12, cursor: 'pointer',
};
