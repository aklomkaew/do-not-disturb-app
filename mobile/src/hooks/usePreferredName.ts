import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';

type Listener = (name: string | null) => void;

const listeners = new Set<Listener>();
let cachedName: string | null = null;

export function updatePreferredName(name: string | null) {
  cachedName = name;
  listeners.forEach((listener) => listener(cachedName));
}

export function usePreferredName() {
  const { accessToken, status, user } = useAuth();
  const [name, setName] = useState<string | null>(cachedName);

  useEffect(() => {
    const handleChange = (next: string | null) => setName(next);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  useEffect(() => {
    if (!accessToken || status !== 'authenticated') {
      updatePreferredName(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          updatePreferredName(data.profile?.displayName ?? null);
        }
      } catch (error) {
        console.warn('Failed to load profile name', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, status, user?.id]);

  if (name) {
    return name;
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  if (user?.id) {
    return `Member ${user.id.slice(0, 4).toUpperCase()}`;
  }

  return null;
}
