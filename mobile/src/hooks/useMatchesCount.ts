import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';

type Listener = (count: number) => void;

const listeners = new Set<Listener>();
let cachedCount = 0;
let previousCount: number | null = null;

export function updateMatchesCount(count: number) {
  const normalized = Math.max(0, count);
  cachedCount = normalized;
  if (previousCount !== null && normalized > previousCount) {
    Alert.alert('New match', 'You just received a new match. Check the Matches tab!');
  }
  previousCount = normalized;
  listeners.forEach((listener) => listener(normalized));
}

export async function refreshMatchesCount(accessToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    updateMatchesCount(data.matches?.length ?? 0);
  } catch (error) {
    console.warn('Failed to refresh matches count', error);
  }
}

export function useMatchesCount() {
  const { accessToken, status } = useAuth();
  const [count, setCount] = useState<number>(cachedCount);

  useEffect(() => {
    const handleChange = (next: number) => setCount(next);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  useEffect(() => {
    if (!accessToken || status !== 'authenticated') {
      updateMatchesCount(0);
      return;
    }

    refreshMatchesCount(accessToken);
    const interval = setInterval(() => refreshMatchesCount(accessToken), 30_000);

    return () => {
      clearInterval(interval);
    };
  }, [accessToken, status]);

  return count;
}
