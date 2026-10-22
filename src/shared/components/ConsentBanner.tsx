import { useEffect, useState } from 'react';
import { getConsent, onOpenConsentPreferences, setConsent } from '../consent/consent';
import { LEGAL_LINKS } from '../../config/legal';

/**
 * Cookie banner. Shown until the user decides, and again from the
 * "Cookie preferences" link. Accept and Reject have equal weight, and closing
 * the banner counts as reject (Garante Privacy guidelines, 10 June 2021).
 */
export default function ConsentBanner() {
  const [open, setOpen] = useState(() => getConsent() === null);

  useEffect(() => onOpenConsentPreferences(() => setOpen(true)), []);

  if (!open) return null;

  function decide(analytics: boolean) {
    setConsent(analytics);
    setOpen(false);
  }

  const button: React.CSSProperties = {
    flex: '1 1 120px', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: '1px solid #30363d', background: '#21262d', color: '#e6edf3',
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed', zIndex: 9500, left: 16, right: 16,
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        maxWidth: 560, margin: '0 auto', padding: '16px 18px',
        background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
        boxShadow: '0 12px 36px rgba(0,0,0,0.5)', color: '#c9d1d9', fontSize: 13, lineHeight: 1.5,
      }}
    >
      <button
        type="button"
        aria-label="Close (reject optional cookies)"
        onClick={() => decide(false)}
        style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: '#8b949e', fontSize: 18, cursor: 'pointer' }}
      >
        ×
      </button>
      <p style={{ margin: '0 24px 12px 0' }}>
        tonic uses technical storage to keep you signed in and save your progress. With your consent we also use{' '}
        <strong>Google Analytics</strong> to understand which tools are used, so we can improve them.
        {LEGAL_LINKS.cookies && (
          <> Read the <a href={LEGAL_LINKS.cookies} target="_blank" rel="noopener noreferrer" style={{ color: '#a5b4fc' }}>Cookie Policy</a>.</>
        )}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" style={button} onClick={() => decide(false)}>Reject</button>
        <button type="button" style={button} onClick={() => decide(true)}>Accept</button>
      </div>
    </div>
  );
}
