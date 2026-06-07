import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../../firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mobile: always call getRedirectResult — iOS Safari clears sessionStorage
    // during OAuth redirect, so flag-based detection is unreliable.
    // With the correct authDomain, getRedirectResult returns null cleanly when
    // no redirect is pending, so calling it unconditionally is safe.
    //
    // On desktop: only call it when we actually initiated a redirect (popup fallback),
    // to avoid unnecessary calls.
    const mobileRedirect = isMobile();
    const desktopRedirect = !mobileRedirect && localStorage.getItem('tonic_auth_redirect');

    if (mobileRedirect || desktopRedirect) {
      if (desktopRedirect) localStorage.removeItem('tonic_auth_redirect');
      getRedirectResult(auth).catch(() => {});
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (isMobile()) {
      // No flag needed — getRedirectResult is called unconditionally on mobile
      await signInWithRedirect(auth, provider);
      return;
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = String((err as Record<string, unknown>)?.code ?? '');
      if (code === 'auth/popup-blocked' || code === 'auth/popup-cancelled-by-user') {
        localStorage.setItem('tonic_auth_redirect', '1');
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
