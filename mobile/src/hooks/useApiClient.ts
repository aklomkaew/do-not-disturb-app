import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/providers/AuthProvider';
import { useCallback, useMemo } from 'react';

export function useApiClient() {
  const { session, logout } = useAuth();

  const request = useCallback(
    async (url: string, init?: RequestInit) => {
      if (!session?.accessToken) {
        throw new Error('Missing session');
      }

      const headers = new Headers(init?.headers ?? {});
      headers.set('Authorization', `Bearer ${session.accessToken}`);
      if (!headers.has('Content-Type') && init?.body) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...init,
        headers,
      });

      if (response.status === 401) {
        await logout();
        throw new Error('Session expired');
      }

      return response;
    },
    [logout, session?.accessToken]
  );

  return useMemo(
    () => ({
      get: (url: string) => request(url),
      post: (url: string, body?: any) =>
        request(url, {
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
        }),
      patch: (url: string, body?: any) =>
        request(url, {
          method: 'PATCH',
          body: body ? JSON.stringify(body) : undefined,
        }),
      del: (url: string) =>
        request(url, {
          method: 'DELETE',
        }),
    }),
    [request]
  );
}
