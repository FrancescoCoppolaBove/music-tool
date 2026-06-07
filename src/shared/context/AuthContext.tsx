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
    // Only call getRedirectResult if we actually initiated a redirect (popup-blocked fallback).
    // signInWithPopup is now the primary method on all platforms, so this is rarely needed.
    if (localStorage.getItem('tonic_auth_redirect')) {
      localStorage.removeItem('tonic_auth_redirect');
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

    // Use popup on all platforms — on iOS it opens a SFSafariViewController
    // which maintains state correctly without cross-origin storage issues.
    // signInWithRedirect on iOS Chrome fails due to storage partitioning.
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
