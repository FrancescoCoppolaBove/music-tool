import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getOrCreateUserProfile } from '../utils/firestoreConservatory';
import { firebaseEnabled } from '../../firebase';
import type { UserProfile, UserRole } from '../types/conservatory.types';

interface UserProfileContextValue {
  profile: UserProfile | null;
  profileLoading: boolean;
  role: UserRole | null;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  profileLoading: false,
  role: null,
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user || !firebaseEnabled) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    getOrCreateUserProfile(user)
      .then(p => { if (!cancelled) { setProfile(p); setProfileLoading(false); } })
      .catch(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [user?.uid]);

  return (
    <UserProfileContext.Provider value={{ profile, profileLoading, role: profile?.role ?? null }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
