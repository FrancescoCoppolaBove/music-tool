import { useEffect, useState } from 'react';
import { billingEnabled, FREE_AI_MESSAGES_PER_DAY, PRICES, TRIAL_DAYS } from '../../config/plans';
import { useEntitlement } from '../../shared/context/entitlement';
import { onPaddleEvent, openBillingPortal, startCheckout } from '../../shared/utils/billingApi';

type Interval = 'monthly' | 'yearly';

const FREE_FEATURES = [
  'Scales, chords, voicings, circle of fifths',
  'Harmonic analysis, chord finder, progressions',
  'Cadence & scale-degree training, Daily Challenge',
  'Chord detection with your microphone',
  `Modal Buddy AI — ${FREE_AI_MESSAGES_PER_DAY} messages a day`,
];

const PRO_FEATURES = [
  'Everything in Free',
  'Reharmonization, Voice Leading & Chord Landing labs',
  'Riff, Melody & Song Architect, Groove Kitchen, Arrangement Blueprint',
  'Ear Training Pro, Sung Solfege, clef trainer, exam practice',
  'Full harmony course (Corso di Armonia)',
  'Audio Transcriber and Nail the Pitch',
  'Score → iReal Pro with AI, Modal Buddy 100 messages a day',
  'Practice Journal & Song Library synced on all devices',
];

const card: React.CSSProperties = { flex: '1 1 280px', padding: '24px 22px', borderRadius: 16, background: '#161b22', border: '1px solid #30363d' };
const button: React.CSSProperties = { width: '100%', padding: '12px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 };

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

function FeatureList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0, display: 'grid', gap: 10 }}>
      {items.map(f => (
        <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#c9d1d9', lineHeight: 1.45 }}>
          <span aria-hidden="true" style={{ color: accent, fontWeight: 800 }}>✓</span>{f}
        </li>
      ))}
    </ul>
  );
}

export default function PricingFeature() {
  const { isPro, entitlement, loading } = useEntitlement();
  const [interval, setInterval] = useState<Interval>('yearly');
  const [busy, setBusy] = useState(false);
  // Tagged with the view it belongs to, so a checkout error doesn't linger once Pro is active.
  const [failure, setFailure] = useState<{ view: 'pro' | 'free'; message: string } | null>(null);
  const view = isPro ? 'pro' : 'free';
  const error = failure?.view === view ? failure.message : null;
  const [activating, setActivating] = useState(false);

  // Checkout done → wait for the webhook to flip the entitlement (usually seconds).
  useEffect(() => onPaddleEvent(e => { if (e.name === 'checkout.completed') setActivating(true); }), []);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setFailure(null);
    try { await fn(); } catch (err) { setFailure({ view, message: err instanceof Error ? err.message : 'Something went wrong. Try again.' }); } finally { setBusy(false); }
  }

  if (!billingEnabled) {
    return (
      <div style={{ ...card, maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, color: '#e6edf3' }}>tonic Pro is coming soon</h1>
        <p style={{ margin: 0, fontSize: 14, color: '#8b949e' }}>During the beta every tool is unlocked. Enjoy!</p>
      </div>
    );
  }

  if (loading) return <div role="status" style={{ textAlign: 'center', padding: 64, color: '#8b949e' }}>Loading your plan…</div>;

  if (isPro && entitlement) {
    const pastDue = entitlement.status === 'past_due';
    return (
      <div style={{ ...card, maxWidth: 560, margin: '40px auto' }}>
        <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>PRO</div>
        <h1 style={{ margin: '12px 0 8px', fontSize: 22, color: '#e6edf3' }}>{activating ? 'Welcome to tonic Pro 🎉' : 'Your plan: tonic Pro'}</h1>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: '#8b949e', lineHeight: 1.6 }}>
          {entitlement.status === 'trialing' && <>Free trial until <strong>{formatDate(entitlement.currentPeriodEnd)}</strong>. </>}
          {entitlement.cancelAt
            ? <>Cancelled — Pro stays active until <strong>{formatDate(entitlement.cancelAt)}</strong>.</>
            : entitlement.status === 'active' && <>Renews on <strong>{formatDate(entitlement.currentPeriodEnd)}</strong>.</>}
        </p>
        {pastDue && (
          <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: '#3b2a0d', border: '1px solid #a16207', color: '#fde68a', fontSize: 13 }}>
            Your last payment didn't go through. Update your payment method to keep Pro.
          </div>
        )}
        <button type="button" disabled={busy} style={{ ...button, background: '#21262d', color: '#e6edf3', border: '1px solid #30363d' }} onClick={() => run(openBillingPortal)}>
          {busy ? 'Opening…' : 'Manage subscription, payment method & invoices'}
        </button>
        {error && <div role="alert" style={{ marginTop: 12, fontSize: 12, color: '#fca5a5' }}>{error}</div>}
      </div>
    );
  }

  if (activating) {
    return (
      <div role="status" style={{ ...card, maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <div className="tool-loading-spinner" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
        <h1 style={{ margin: '0 0 8px', fontSize: 20, color: '#e6edf3' }}>Activating your Pro plan…</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#8b949e' }}>Payment received. This usually takes a few seconds.</p>
      </div>
    );
  }

  const price = PRICES[interval];
  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <header style={{ textAlign: 'center', margin: '16px 0 28px' }}>
        <h1 style={{ margin: '0 0 10px', fontSize: 30, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>Go further with tonic Pro</h1>
        <p style={{ margin: 0, fontSize: 15, color: '#8b949e' }}>Composition labs, advanced training, AI and cloud sync. {TRIAL_DAYS} days free.</p>
      </header>

      <div role="radiogroup" aria-label="Billing period" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
        {(['monthly', 'yearly'] as const).map(i => (
          <button
            key={i} type="button" role="radio" aria-checked={interval === i} onClick={() => setInterval(i)}
            style={{
              padding: '8px 16px', borderRadius: 100, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              border: `1px solid ${interval === i ? '#7c3aed' : '#30363d'}`,
              background: interval === i ? 'rgba(124,58,237,0.18)' : 'transparent', color: interval === i ? '#c4b5fd' : '#8b949e',
            }}
          >
            {i === 'monthly' ? 'Monthly' : 'Yearly · save 35%'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section style={card} aria-label="Free plan">
          <h2 style={{ margin: 0, fontSize: 18, color: '#e6edf3' }}>Free</h2>
          <div style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, color: '#e6edf3' }}>0 €</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Your current plan</div>
          <FeatureList items={FREE_FEATURES} accent="#8b949e" />
        </section>

        <section style={{ ...card, border: '1px solid #7c3aed', background: 'linear-gradient(160deg, #1c1530 0%, #161b22 70%)' }} aria-label="Pro plan">
          <h2 style={{ margin: 0, fontSize: 18, color: '#c4b5fd' }}>Pro</h2>
          <div style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, color: '#e6edf3' }}>
            {price.label} <span style={{ fontSize: 14, fontWeight: 500, color: '#8b949e' }}>{price.per}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{'note' in price ? price.note : 'VAT included where applicable'}</div>
          <button
            type="button" disabled={busy}
            style={{ ...button, marginTop: 18, background: '#7c3aed', color: '#fff' }}
            onClick={() => run(() => startCheckout(interval))}
          >
            {busy ? 'Opening checkout…' : `Start ${TRIAL_DAYS}-day free trial`}
          </button>
          <div style={{ marginTop: 8, fontSize: 11.5, color: '#6b7280', textAlign: 'center' }}>
            Cancel anytime before the trial ends and you won't be charged. Payments handled by Paddle.
          </div>
          {error && <div role="alert" style={{ marginTop: 10, fontSize: 12, color: '#fca5a5' }}>{error}</div>}
          <FeatureList items={PRO_FEATURES} accent="#a78bfa" />
        </section>
      </div>
    </div>
  );
}
