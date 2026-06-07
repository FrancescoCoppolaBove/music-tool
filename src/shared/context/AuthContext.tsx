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
  redirectError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  redirectError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) setUser(result.user);
      })
      .catch(err => {
        const code = String(err?.code ?? err?.message ?? '');
        setRedirectError(code);
        setLoading(false);
      });

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
      // Mobile browsers block popups — use redirect flow directly
      await signInWithRedirect(auth, provider);
      return;
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = String((err as Record<string, unknown>)?.code ?? '');
      if (code === 'auth/popup-blocked' || code === 'auth/popup-cancelled-by-user') {
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
    <AuthContext.Provider value={{ user, loading, redirectError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
