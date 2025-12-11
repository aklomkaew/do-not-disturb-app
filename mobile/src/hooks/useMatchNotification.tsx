import { createContext, useContext, useState, ReactNode } from 'react';
import { API_BASE_URL } from '@/constants/config';

export type MatchedProfile = {
  displayName: string;
  age: number;
  photo?: string;
};

type MatchNotificationContextType = {
  matchedProfile: MatchedProfile | null;
  showNotification: (profile: MatchedProfile) => void;
  hideNotification: () => void;
  fetchLatestMatch: (accessToken: string) => Promise<void>;
};

const MatchNotificationContext = createContext<MatchNotificationContextType | undefined>(undefined);

export function MatchNotificationProvider({ children }: { children: ReactNode }) {
  const [matchedProfile, setMatchedProfile] = useState<MatchedProfile | null>(null);

  const showNotification = (profile: MatchedProfile) => {
    setMatchedProfile(profile);
  };

  const hideNotification = () => {
    setMatchedProfile(null);
  };

  const fetchLatestMatch = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return;
      
      const data = await response.json();
      const matches = data.matches ?? [];
      
      if (matches.length > 0) {
        // Get the most recent match (first in the array since they're ordered by lastInteractionAt desc)
        const latestMatch = matches[0];
        if (latestMatch.partner) {
          showNotification({
            displayName: latestMatch.partner.displayName,
            age: latestMatch.partner.age,
            photo: latestMatch.partner.photos?.[0],
          });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch latest match for notification', error);
    }
  };

  return (
    <MatchNotificationContext.Provider
      value={{
        matchedProfile,
        showNotification,
        hideNotification,
        fetchLatestMatch,
      }}
    >
      {children}
    </MatchNotificationContext.Provider>
  );
}

export function useMatchNotification() {
  const context = useContext(MatchNotificationContext);
  if (context === undefined) {
    throw new Error('useMatchNotification must be used within a MatchNotificationProvider');
  }
  return context;
}
