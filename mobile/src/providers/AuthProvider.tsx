import { API_BASE_URL } from '@/constants/config';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

type LoginMethod = 'email' | 'phone';

type RequestCodePayload =
  | {
      method: 'email';
      email: string;
    }
  | {
      method: 'phone';
      phoneNumber: string;
    };

type VerifyCodePayload = RequestCodePayload & { code: string };

type AuthUser = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  role: 'USER' | 'ADMIN';
  allowlisted: boolean;
};

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type RequestCodeResponse = {
  message: string;
  method: LoginMethod;
  target: string;
  expiresInSeconds: number;
  testCode?: string;
};

type AuthContextValue = AuthState & {
  requestLoginCode: (payload: RequestCodePayload) => Promise<RequestCodeResponse>;
  verifyLoginCode: (payload: VerifyCodePayload) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const SESSION_KEY = 'do-not-disturb-session';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const bootstrapSession = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(SESSION_KEY);
      if (!stored) {
        setState((prev) => ({ ...prev, status: 'unauthenticated', user: null, accessToken: null, refreshToken: null }));
        return;
      }

      const parsed = JSON.parse(stored) as { refreshToken?: string } | null;
      if (!parsed?.refreshToken) {
        setState((prev) => ({ ...prev, status: 'unauthenticated', user: null, accessToken: null, refreshToken: null }));
        return;
      }

      await refreshWithToken(parsed.refreshToken);
    } catch (error) {
      console.warn('Failed to restore session', error);
      setState((prev) => ({ ...prev, status: 'unauthenticated', user: null, accessToken: null, refreshToken: null }));
    }
  }, []);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const refreshWithToken = useCallback(async (refreshToken: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(await extractError(response));
    }

    const data = await response.json();
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ refreshToken: data.refreshToken }));

    setState({
      status: 'authenticated',
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }, []);

  const requestLoginCode = useCallback(async (payload: RequestCodePayload) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await extractError(response));
    }

    return (await response.json()) as RequestCodeResponse;
  }, []);

  const verifyLoginCode = useCallback(
    async (payload: VerifyCodePayload) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      const data = await response.json();
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ refreshToken: data.refreshToken }));

      setState({
        status: 'authenticated',
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
    []
  );

  const refreshSession = useCallback(async () => {
    if (!state.refreshToken) {
      throw new Error('No refresh token available');
    }
    await refreshWithToken(state.refreshToken);
  }, [refreshWithToken, state.refreshToken]);

  const logout = useCallback(async () => {
    const refreshToken = state.refreshToken;

    try {
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Failed to notify server about logout', error);
    } finally {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      setState({
        status: 'unauthenticated',
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    }
  }, [state.refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      requestLoginCode,
      verifyLoginCode,
      refreshSession,
      logout,
    }),
    [logout, refreshSession, requestLoginCode, state, verifyLoginCode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function extractError(response: Response) {
  try {
    const data = await response.json();
    return data?.message ?? data?.error?.message ?? 'Something went wrong';
  } catch (error) {
    console.warn('Failed to parse error response', error);
    return response.statusText || 'Request failed';
  }
}
