import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';

const STYLES = `
  @keyframes auth-fade-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .auth-gate {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d1117;
    padding: 24px;
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 20px;
    padding: 48px 40px;
    text-align: center;
    animation: auth-fade-in 0.5s ease both;
  }

  .auth-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 32px;
  }

  .auth-headline {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #e6edf3;
    margin: 0 0 8px;
    letter-spacing: -0.5px;
  }

  .auth-tagline {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 40px;
    line-height: 1.6;
  }

  .auth-google-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 14px 24px;
    background: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    transition: box-shadow 0.15s, transform 0.15s;
    margin-bottom: 24px;
  }

  .auth-google-btn:hover:not(:disabled) {
    box-shadow: 0 4px 20px rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }

  .auth-google-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .auth-features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
    border-top: 1px solid #21262d;
    padding-top: 24px;
  }

  .auth-feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #8b949e;
  }

  .auth-feature-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #1c2128;
    border: 1px solid #30363d;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 14px;
  }

  .auth-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 13px;
    color: #f87171;
    margin-bottom: 16px;
    text-align: left;
  }
`;

// Google logo SVG
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthGate() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      if (code.includes('popup-closed') || message.includes('popup-closed')) return;

      if (code === 'auth/unauthorized-domain') {
        setError('Dominio non autorizzato. Aggiungi questo dominio su Firebase Console → Authentication → Authorized domains.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Google sign-in non abilitato. Vai su Firebase Console → Authentication → Sign-in method → Google.');
      } else if (code === 'auth/popup-blocked') {
        setError('Popup bloccato dal browser. Permetti i popup per questo sito e riprova.');
      } else {
        setError(`Errore: ${code || message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-gate">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <img src="/logo.png" alt="tonic" style={{ width: 40, height: 40, mixBlendMode: 'screen' }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: '#e6edf3', letterSpacing: '-0.5px' }}>
              tonic
            </span>
          </div>

          <h1 className="auth-headline">Your music theory studio</h1>
          <p className="auth-tagline">
            Explore scales, train your ear and track your progress.<br />
            Sign in to sync across all your devices.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="auth-google-btn"
            onClick={handleSignIn}
            disabled={loading}
          >
            <GoogleLogo />
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🔥</div>
              <span>Practice streak saved across all devices</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">👂</div>
              <span>Ear training progress never lost</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🎵</div>
              <span>Personal song library, anywhere</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
