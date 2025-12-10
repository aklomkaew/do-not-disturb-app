import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';

export function usePreferredName() {
  const { accessToken, status, user } = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || status !== 'authenticated') {
      setName(null);
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
          setName(data.profile?.displayName ?? null);
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
