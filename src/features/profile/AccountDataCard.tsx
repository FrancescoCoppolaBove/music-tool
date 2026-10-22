import { useState } from 'react';
import { deleteMyAccount, downloadMyData } from '../../shared/utils/accountApi';

const btn: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  border: '1px solid #30363d', background: '#21262d', color: '#e6edf3',
};
const danger: React.CSSProperties = { ...btn, borderColor: '#7f1d1d', background: '#3b0d0d', color: '#fca5a5' };

/** "I tuoi dati": GDPR export and account deletion (with an inline confirmation step). */
export default function AccountDataCard() {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: 'export' | 'delete', fn: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (err) {
      const code = String((err as { code?: string })?.code ?? '');
      if (code.includes('popup-closed') || code.includes('cancelled-popup')) return;
      setError(err instanceof Error ? err.message : 'Operazione non riuscita. Riprova.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pf-card">
      <div className="pf-section-header">I tuoi dati</div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#8b949e', lineHeight: 1.5 }}>
        Scarica una copia di tutti i dati associati al tuo account (profilo, statistiche, brani, esami) in formato JSON,
        oppure elimina definitivamente l'account.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" style={btn} disabled={busy !== null} onClick={() => run('export', downloadMyData)}>
          {busy === 'export' ? 'Preparazione…' : '⬇ Scarica i miei dati'}
        </button>
        {!confirming && (
          <button type="button" style={danger} disabled={busy !== null} onClick={() => setConfirming(true)}>
            Elimina account
          </button>
        )}
      </div>

      {confirming && (
        <div role="alertdialog" aria-label="Conferma eliminazione account" style={{ marginTop: 14, padding: 14, borderRadius: 10, border: '1px solid #7f1d1d', background: '#1f0a0a' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#fecaca', lineHeight: 1.5 }}>
            <strong>L'eliminazione è definitiva.</strong> Verranno cancellati profilo, statistiche, brani, risultati degli esami
            e, se sei docente, le tue classi e i compiti. Google ti chiederà di confermare l'identità.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" style={btn} disabled={busy !== null} onClick={() => setConfirming(false)}>Annulla</button>
            <button type="button" style={danger} disabled={busy !== null} onClick={() => run('delete', deleteMyAccount)}>
              {busy === 'delete' ? 'Eliminazione…' : 'Sì, elimina definitivamente'}
            </button>
          </div>
        </div>
      )}

      {error && <div role="alert" style={{ marginTop: 12, fontSize: 12, color: '#fca5a5' }}>{error}</div>}
    </div>
  );
}
