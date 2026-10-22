import { TRIAL_DAYS } from '../../config/plans';
import type { Tab } from '@shared/types/navigation.types';

/**
 * Shown instead of a Pro tool for Free users. The tool's chunk is never
 * downloaded. Note: tools run in the browser, so this is a product gate, not
 * a security boundary — AI and cloud features are enforced server-side.
 */
export default function ProGate({ toolLabel, onNavigate }: { toolLabel: string; onNavigate: (tab: Tab) => void }) {
  return (
    <div style={{
      margin: '48px auto', maxWidth: 520, padding: '32px 28px', textAlign: 'center',
      background: 'linear-gradient(160deg, #1c1530 0%, #161b22 60%)', border: '1px solid #3b2a63', borderRadius: 16,
    }}>
      <div style={{
        display: 'inline-block', marginBottom: 14, padding: '3px 10px', borderRadius: 100,
        background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
      }}>PRO</div>
      <h2 style={{ margin: '0 0 10px', fontSize: 22, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>{toolLabel}</h2>
      <p style={{ margin: '0 0 22px', fontSize: 14, color: '#8b949e', lineHeight: 1.6 }}>
        This tool is part of <strong style={{ color: '#c4b5fd' }}>tonic Pro</strong>, together with the composition and
        arranging labs, advanced ear training, the harmony course, AI tools and cloud sync.
      </p>
      <button
        type="button"
        onClick={() => onNavigate('pricing')}
        style={{
          padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700,
        }}
      >
        Try Pro free for {TRIAL_DAYS} days
      </button>
      <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>Cancel anytime before the trial ends — you won't be charged.</div>
    </div>
  );
}
