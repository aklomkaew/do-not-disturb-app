import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';

type Listener = (count: number) => void;
type MatchNotificationCallback = (matchedProfile: { displayName: string; age: number; photo?: string }) => void;

const listeners = new Set<Listener>();
const matchNotificationCallbacks = new Set<MatchNotificationCallback>();
let cachedCount = 0;
let previousCount: number | null = null;

export function updateMatchesCount(count: number, accessToken?: string) {
  const normalized = Math.max(0, count);
  const wasNewMatch = previousCount !== null && normalized > previousCount;
  cachedCount = normalized;
  
  // If we detected a new match and have an access token, fetch match details for notification
  if (wasNewMatch && accessToken && matchNotificationCallbacks.size > 0) {
    fetchLatestMatchForNotification(accessToken);
  }
  
  previousCount = normalized;
  listeners.forEach((listener) => listener(normalized));
}

async function fetchLatestMatchForNotification(accessToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return;
    
    const data = await response.json();
    const matches = data.matches ?? [];
    
    if (matches.length > 0) {
      const latestMatch = matches[0];
      if (latestMatch.partner) {
        const matchedProfile = {
          displayName: latestMatch.partner.displayName,
          age: latestMatch.partner.age,
          photo: latestMatch.partner.photos?.[0],
        };
        
        // Notify all registered callbacks
        matchNotificationCallbacks.forEach((callback) => callback(matchedProfile));
      }
    }
  } catch (error) {
    console.warn('Failed to fetch latest match for notification', error);
  }
}

export function registerMatchNotificationCallback(callback: MatchNotificationCallback) {
  matchNotificationCallbacks.add(callback);
  return () => {
    matchNotificationCallbacks.delete(callback);
  };
}

export async function refreshMatchesCount(accessToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    updateMatchesCount(data.matches?.length ?? 0, accessToken);
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

// Helper to manually trigger match notification (for immediate matches from swipe)
export function notifyMatch(matchedProfile: { displayName: string; age: number; photo?: string }) {
  matchNotificationCallbacks.forEach((callback) => callback(matchedProfile));
}
