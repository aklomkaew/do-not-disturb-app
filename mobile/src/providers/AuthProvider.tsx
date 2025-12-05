import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { firebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { API_BASE_URL } from '@/constants/config';

const ACCESS_TOKEN_KEY = 'dnd_access_token';
const REFRESH_TOKEN_KEY = 'dnd_refresh_token';

export type AuthRole = 'user' | 'admin';
export type AuthProviderType = 'google' | 'instagram';

interface UserProfile {
  id: string;
  email: string;
  role: AuthRole;
  allowlisted: boolean;
}

interface SessionState {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextValue {
  user: UserProfile | null;
  session: SessionState | null;
  profileStatus: 'needs_profile' | 'complete' | null;
  isLoading: boolean;
  loginWithEmail: (email: string, role: AuthRole) => Promise<void>;
  logout: () => Promise<void>;
  setProfileStatus: (status: 'needs_profile' | 'complete') => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [profileStatus, setProfileStatusState] = useState<'needs_profile' | 'complete' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStoredSession() {
      try {
        const [accessToken, refreshToken] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        ]);
        if (accessToken && refreshToken) {
          setSession({ accessToken, refreshToken, expiresIn: 3600 });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStoredSession();

    const unsubscribe = onAuthStateChanged(firebaseAuth, () => {
      // Placeholder for when Firebase auth is fully wired.
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  async function loginWithEmail(email: string, role: AuthRole) {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message ?? 'Failed to log in');
      }

      const data = await response.json();
      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        allowlisted: data.user.allowlisted,
      };

      const sessionData: SessionState = {
        accessToken: data.session.accessToken,
        refreshToken: data.session.refreshToken,
        expiresIn: data.session.expiresIn,
      };

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, sessionData.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, sessionData.refreshToken);

      setUser(userProfile);
      setSession(sessionData);
          setProfileStatusState(data.profileStatus);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await signOut(firebaseAuth);
      setUser(null);
      setSession(null);
      setProfileStatusState(null);
    } finally {
      setIsLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      user,
      session,
      profileStatus,
      isLoading,
      loginWithEmail,
      logout,
      setProfileStatus: (status: 'needs_profile' | 'complete') => setProfileStatusState(status),
    }),
    [user, session, profileStatus, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
