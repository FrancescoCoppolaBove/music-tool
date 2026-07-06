import type { ProgressionStep } from '../data/types';

export default function ProgressionChart({
  title,
  musicalKey,
  steps,
}: {
  title?: string;
  musicalKey?: string;
  steps: ProgressionStep[];
}) {
  return (
    <div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', marginBottom: 12 }}>
          {title}
        </div>
      )}
      {musicalKey && (
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
          Tonalità:{' '}
          <strong style={{ color: '#8b949e' }}>{musicalKey}</strong>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {steps.flatMap((step, i) => {
          const card = (
            <div
              key={`s${i}`}
              style={{
                background: '#21262d',
                border: '1px solid #30363d',
                borderRadius: 10,
                padding: '10px 16px',
                textAlign: 'center',
                minWidth: 64,
              }}
            >
              {step.function && (
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                  {step.function}
                </div>
              )}
              <div style={{
                fontSize: 18, fontWeight: 700,
                color: '#e6edf3', fontFamily: 'monospace',
              }}>
                {step.chord}
              </div>
              {step.annotation && (
                <div style={{ fontSize: 10, color: '#c4b5fd', marginTop: 4 }}>
                  {step.annotation}
                </div>
              )}
            </div>
          );
          const arrow = i < steps.length - 1
            ? <span key={`a${i}`} style={{ color: '#4b5563', fontSize: 16 }}>→</span>
            : null;
          return arrow ? [card, arrow] : [card];
        })}
      </div>
    </div>
  );
}
