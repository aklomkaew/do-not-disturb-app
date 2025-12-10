import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';

type Listener = (count: number) => void;

const listeners = new Set<Listener>();
let cachedCount = 0;
let previousCount: number | null = null;

export function updateMatchesCount(count: number) {
  cachedCount = count;
  if (previousCount !== null && count > previousCount) {
    Alert.alert('New match', 'You just received a new match. Check the Matches tab!');
  }
  previousCount = count;
  listeners.forEach((listener) => listener(count));
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

    let cancelled = false;

    async function fetchCount() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/matches`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          updateMatchesCount(data.matches?.length ?? 0);
        }
      } catch (error) {
        console.warn('Failed to fetch matches count', error);
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessToken, status]);

  return count;
}
