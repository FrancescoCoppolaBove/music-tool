import { useState, useMemo } from 'react';
import { EUCLIDEAN_PRESETS, POLYRHYTHMS, TIME_SIGNATURES, euclidean, lcm } from '../data/rhythmicPatterns';
import { RhythmGrid, BeatLabels, GroupingGrid, SectionLabel } from './shared';

type RhythmMode = 'euclidean' | 'polyrhythm' | 'displacement' | 'meters';
type MeterCategory = 'all' | 'simple' | 'compound' | 'odd' | 'large';

export function RhythmicPanel({ color }: { color: string }) {
  const [rhythmMode, setRhythmMode] = useState<RhythmMode>('euclidean');
  const [selectedEuclid, setSelectedEuclid] = useState(3);
  const [selectedPoly, setSelectedPoly] = useState(0);
  const [selectedMeterLabel, setSelectedMeterLabel] = useState('5/4');
  const [selectedGrouping, setSelectedGrouping] = useState(0);
  const [meterCategory, setMeterCategory] = useState<MeterCategory>('all');

  const euclidPreset = EUCLIDEAN_PRESETS[selectedEuclid];
  const euclidPattern = useMemo(() => euclidean(euclidPreset.n, euclidPreset.k), [euclidPreset.n, euclidPreset.k]);

  const dispBase = useMemo(() => euclidean(7, 16), []);
  const disp1    = useMemo(() => [...dispBase.slice(1),  ...dispBase.slice(0, 1)],  [dispBase]);
  const disp2    = useMemo(() => [...dispBase.slice(2),  ...dispBase.slice(0, 2)],  [dispBase]);

  const polyPreset = POLYRHYTHMS[selectedPoly];
  const polyWidth = lcm(polyPreset.against, polyPreset.over);

  const filteredMeters = useMemo(
    () => meterCategory === 'all' ? TIME_SIGNATURES : TIME_SIGNATURES.filter(ts => ts.category === meterCategory),
    [meterCategory]
  );

  const activeMeter = useMemo(
    () => filteredMeters.find(ts => ts.label === selectedMeterLabel) ?? filteredMeters[0],
    [filteredMeters, selectedMeterLabel]
  );

  const activeGroupingIdx = selectedGrouping < activeMeter.groupings.length ? selectedGrouping : 0;
  const activeGrouping = activeMeter.groupings[activeGroupingIdx];
  const groupColors = [color, '#06b6d4', '#10b981', '#f472b6', '#f59e0b'];

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel text="Rhythmic Architecture" color={color} />

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 22, borderBottom: '1px solid #21262d', flexWrap: 'wrap' }}>
        {(['euclidean', 'polyrhythm', 'displacement', 'meters'] as const).map(mode => (
          <button key={mode} onClick={() => setRhythmMode(mode)} style={{
            padding: '8px 16px', border: 'none',
            borderBottom: rhythmMode === mode ? `2px solid ${color}` : '2px solid transparent',
            background: rhythmMode === mode ? `${color}12` : 'transparent',
            color: rhythmMode === mode ? color : '#6b7280',
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
            transition: 'all 0.15s', marginBottom: -1, borderRadius: '5px 5px 0 0',
          }}>
            {mode}
          </button>
        ))}
      </div>

      {/* Euclidean */}
      {rhythmMode === 'euclidean' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {EUCLIDEAN_PRESETS.map((ep, i) => (
              <button key={ep.label} onClick={() => setSelectedEuclid(i)} style={{
                padding: '7px 13px', borderRadius: 6,
                border: `1px solid ${selectedEuclid === i ? color : '#30363d'}`,
                background: selectedEuclid === i ? `${color}18` : '#161b22',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: selectedEuclid === i ? color : '#8b949e' }}>
                  {ep.label}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                  {ep.name}
                </div>
              </button>
            ))}
          </div>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color }}>{euclidPreset.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#6b7280', marginLeft: 10 }}>{euclidPreset.name}</span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>
                {euclidPreset.n} hits / {euclidPreset.k} slots
              </span>
            </div>
            <BeatLabels slots={euclidPreset.k} />
            <RhythmGrid pattern={euclidPattern} color={color} />
            <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
              {euclidPreset.description}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>Binary:</span>
              {euclidPattern.map((b, i) => (
                <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: b === 1 ? color : '#30363d', fontWeight: b === 1 ? 500 : 400 }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Polyrhythm */}
      {rhythmMode === 'polyrhythm' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {POLYRHYTHMS.map((pr, i) => (
              <button key={pr.label} onClick={() => setSelectedPoly(i)} style={{
                padding: '7px 14px', borderRadius: 6,
                border: `1px solid ${selectedPoly === i ? color : '#30363d'}`,
                background: selectedPoly === i ? `${color}18` : '#161b22',
                color: selectedPoly === i ? color : '#6b7280',
                fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {pr.label}
              </button>
            ))}
          </div>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '22px 24px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color, marginBottom: 4 }}>
              {polyPreset.label}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#6b7280', marginBottom: 24, lineHeight: 1.65 }}>
              {polyPreset.description}
            </div>
            {(['against', 'over'] as const).map(role => {
              const count = role === 'against' ? polyPreset.against : polyPreset.over;
              const stepSize = polyWidth / count;
              return (
                <div key={role} style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                    {count} notes ({role})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {Array.from({ length: polyWidth }).map((_, i) => {
                      const isHit = Math.abs(i - Math.round(i / stepSize) * stepSize) < 0.5;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                          <div style={{
                            width: isHit ? 14 : 6, height: isHit ? 14 : 6, borderRadius: '50%',
                            background: isHit ? (role === 'against' ? color : '#6b7280') : '#1c2128',
                            border: `1px solid ${isHit ? (role === 'against' ? color : '#6b7280') : '#30363d'}`,
                            boxShadow: isHit && role === 'against' ? `0 0 8px ${color}55` : 'none',
                          }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 6, background: `${color}0c`, border: `1px solid ${color}20`, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e' }}>
              <span style={{ color }}>LCM = {polyWidth}</span>
              <span style={{ color: '#30363d', margin: '0 10px' }}>|</span>
              Ratio {polyPreset.against}:{polyPreset.over}
              <span style={{ color: '#30363d', margin: '0 10px' }}>|</span>
              "{polyPreset.against}" hits every {(polyWidth / polyPreset.against).toFixed(1)} grid units
            </div>
          </div>
        </div>
      )}

      {/* Displacement */}
      {rhythmMode === 'displacement' && (
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', marginBottom: 18, lineHeight: 1.65 }}>
            Base pattern: E(7,16) — the Snarky Pocket. Shift it forward by 1 or 2 sixteenth-notes
            to create rhythmic instability while preserving groove density.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Original', pattern: dispBase, shift: 0 },
              { label: '+1 sixteenth', pattern: disp1, shift: 1 },
              { label: '+2 sixteenths', pattern: disp2, shift: 2 },
            ].map(({ label, pattern, shift }) => (
              <div key={shift} style={{ background: '#161b22', border: `1px solid ${shift === 0 ? color + '44' : '#30363d'}`, borderRadius: 8, padding: '16px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: shift === 0 ? color : '#6b7280', fontWeight: shift === 0 ? 500 : 400, marginBottom: 10, letterSpacing: '0.04em' }}>
                  {label}
                </div>
                <BeatLabels slots={16} />
                <RhythmGrid pattern={pattern} color={color} offset={shift} />
                <div style={{ marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>
                  {pattern.filter(b => b === 1).length} hits / 16 slots
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 8, background: `${color}0c`, border: `1px solid ${color}20`, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e', lineHeight: 1.7 }}>
            <span style={{ color, fontWeight: 500 }}>Technique:</span> Play the Original for 4 bars.
            Switch to +1 sixteenth for 4 bars. Then +2 for 2 bars. Snap back to Original — the return creates a powerful sense of arrival.
          </div>
        </div>
      )}

      {/* Meters */}
      {rhythmMode === 'meters' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Filter</span>
            {(['all', 'simple', 'compound', 'odd', 'large'] as const).map(cat => (
              <button key={cat} onClick={() => setMeterCategory(cat)} style={{
                padding: '4px 11px', borderRadius: 5,
                border: `1px solid ${meterCategory === cat ? color : '#30363d'}`,
                background: meterCategory === cat ? `${color}18` : '#161b22',
                color: meterCategory === cat ? color : '#6b7280',
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                textTransform: 'capitalize', letterSpacing: '0.06em',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
            {filteredMeters.map(ts => (
              <button key={ts.label} onClick={() => { setSelectedMeterLabel(ts.label); setSelectedGrouping(0); }} style={{
                padding: '9px 15px', borderRadius: 7,
                border: `1px solid ${activeMeter.label === ts.label ? color : '#30363d'}`,
                background: activeMeter.label === ts.label ? `${color}18` : '#161b22',
                cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left',
              }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: activeMeter.label === ts.label ? color : '#8b949e', lineHeight: 1 }}>
                  {ts.label}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {ts.category}
                </div>
              </button>
            ))}
          </div>

          <div style={{ background: '#161b22', border: `1px solid ${color}33`, borderRadius: 10, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 38, color, lineHeight: 1 }}>
                {activeMeter.label}
              </span>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#c9d1d9', marginBottom: 3 }}>{activeMeter.feel}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: '#21262d', border: '1px solid #30363d', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {activeMeter.category}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: '#21262d', border: '1px solid #30363d', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#6b7280', letterSpacing: '0.05em' }}>
                    {activeMeter.numerator} {activeMeter.denominator === 4 ? 'quarter' : 'eighth'}-notes per bar
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Sub-grouping</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {activeMeter.groupings.map((g, i) => (
                  <button key={i} onClick={() => setSelectedGrouping(i)} style={{
                    padding: '6px 12px', borderRadius: 5,
                    border: `1px solid ${activeGroupingIdx === i ? color : '#30363d'}`,
                    background: activeGroupingIdx === i ? `${color}18` : 'transparent',
                    color: activeGroupingIdx === i ? color : '#6b7280',
                    fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.12s', letterSpacing: '0.04em',
                  }}>
                    {g.join('+')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18, padding: '16px 18px', borderRadius: 8, background: '#0d1117', border: '1px solid #21262d' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Beat map — {activeGrouping.join('+')} grouping
              </div>
              <GroupingGrid grouping={activeGrouping} color={color} denominator={activeMeter.denominator} />
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activeGrouping.map((g, i) => {
                  const gc = groupColors[i % groupColors.length];
                  return (
                    <span key={i} style={{ padding: '2px 9px', borderRadius: 4, background: `${gc}14`, border: `1px solid ${gc}33`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: gc }}>
                      Group {i + 1}: {g} {activeMeter.denominator === 8 ? '8th' : 'quarter'}-note{g !== 1 ? 's' : ''}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 8, background: `${color}0a`, border: `1px solid ${color}1a` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: `${color}66`, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Construction Tip
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8b949e', lineHeight: 1.8, margin: 0 }}>
                {activeMeter.tip}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Used by</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {activeMeter.artists.map(a => (
                    <span key={a} style={{ padding: '3px 9px', borderRadius: 4, background: `${color}10`, border: `1px solid ${color}28`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: `${color}99` }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Euclidean Ideas</div>
                {activeMeter.euclideanIdeas.map((idea, i) => {
                  const parts = idea.split('—');
                  return (
                    <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280', marginBottom: 4, lineHeight: 1.55 }}>
                      <span style={{ color }}>{parts[0]?.trim()}</span>
                      {parts[1] && <span style={{ color: '#4b5563' }}> — {parts[1].trim()}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
