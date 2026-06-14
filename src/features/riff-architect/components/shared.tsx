export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`;

export function RhythmGrid({ pattern, color, offset = 0 }: { pattern: number[]; color: string; offset?: number }) {
  const beatSize = pattern.length <= 8 ? 28 : 22;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {pattern.map((beat, i) => {
        const isOn = beat === 1;
        const isFaded = isOn && i < offset;
        return (
          <div key={i} style={{
            width: beatSize, height: beatSize, borderRadius: 4,
            background: isOn ? (isFaded ? `${color}44` : color) : '#1c2128',
            border: `1px solid ${isOn ? color : '#30363d'}`,
            boxShadow: isOn && !isFaded ? `0 0 8px ${color}44` : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {i === 0 && (
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: isOn ? 'rgba(255,255,255,0.7)' : '#4b5563' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BeatLabels({ slots }: { slots: number }) {
  const beatSize = slots <= 8 ? 28 : 22;
  const labels = Array.from({ length: slots }, (_, i) => {
    if (slots === 8)  return ['1','e','+','a','2','e','+','a'][i] ?? '';
    if (slots === 16) return i % 4 === 0 ? String(Math.floor(i / 4) + 1) : i % 2 === 0 ? '+' : '';
    if (slots === 12) return i % 3 === 0 ? String(Math.floor(i / 3) + 1) : '';
    return i % 2 === 0 ? String(Math.floor(i / 2) + 1) : '';
  });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
      {labels.map((lbl, i) => (
        <div key={i} style={{
          width: beatSize, textAlign: 'center',
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          color: lbl && ['1','2','3','4'].includes(lbl) ? '#6b7280' : '#30363d',
        }}>
          {lbl}
        </div>
      ))}
    </div>
  );
}

export function GroupingGrid({ grouping, color, denominator }: { grouping: number[]; color: string; denominator: number }) {
  const groupColors = [color, '#06b6d4', '#10b981', '#f472b6', '#f59e0b'];
  const cellSize = denominator === 8 ? 22 : 28;
  const cells: { gIdx: number; isFirst: boolean; beatNum: number }[] = [];
  let beatNum = 1;
  for (let gIdx = 0; gIdx < grouping.length; gIdx++) {
    for (let bIdx = 0; bIdx < grouping[gIdx]; bIdx++) {
      cells.push({ gIdx, isFirst: bIdx === 0, beatNum: beatNum++ });
    }
  }
  return (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {cells.map(({ gIdx, isFirst, beatNum: bn }, i) => {
        const gc = groupColors[gIdx % groupColors.length];
        return (
          <div key={i} style={{
            width: cellSize, height: cellSize, borderRadius: 4,
            background: isFirst ? gc : `${gc}2e`,
            border: `1px solid ${isFirst ? gc : gc + '50'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isFirst ? `0 0 6px ${gc}44` : 'none',
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: isFirst ? 'rgba(255,255,255,0.9)' : gc, fontWeight: isFirst ? 500 : 400, lineHeight: 1 }}>
              {bn}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function NoteChip({ note, color }: { note: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: `${color}18`, border: `1px solid ${color}44`,
      fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
      color, letterSpacing: '0.04em',
    }}>
      {note}
    </span>
  );
}

export function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 3, height: 16, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280' }}>
        {text}
      </span>
    </div>
  );
}
