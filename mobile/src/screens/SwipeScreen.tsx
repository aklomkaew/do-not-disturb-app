import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { ProfileCard, ProfileCardData } from '@/components/ProfileCard';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { refreshMatchesCount, notifyMatch } from '@/hooks/useMatchesCount';
import { useMatchNotification } from '@/hooks/useMatchNotification';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

type DeckProfile = {
  id: string;
  displayName: string;
  age: number;
  location: string | null;
  bio: string;
  photos?: string[];
};

export function SwipeScreen() {
  const health = useHealthCheck();
  const { getAccessToken } = useAuth();
  const { showNotification } = useMatchNotification();
  const [deck, setDeck] = useState<DeckProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasSwipesToRewind, setHasSwipesToRewind] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0); // Track swipes made in this session
  const [hasMadeFirstSwipe, setHasMadeFirstSwipe] = useState(false); // Track if user has swiped at least once

  const fetchDeck = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/swipes/deck`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      const data = await response.json();
      setDeck(data.profiles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      fetchDeck();
      // Only reset hasSwipesToRewind if user hasn't made their first swipe yet
      // This prevents showing rewind button for the first person
      // After first swipe, hasSwipesToRewind will persist across navigation
      if (!hasMadeFirstSwipe) {
        setHasSwipesToRewind(false);
      }
    }, [fetchDeck, hasMadeFirstSwipe])
  );

  const currentProfile = deck[0];

  const handleSwipe = async (direction: 'LEFT' | 'RIGHT') => {
    if (!currentProfile) return;
    try {
      setActionLoading(true);
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetProfileId: currentProfile.id,
          direction,
        }),
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      const data = await response.json();
      if (direction === 'RIGHT' && data.match && currentProfile) {
        // Show notification immediately with the profile we just matched with
        notifyMatch({
          displayName: currentProfile.displayName,
          age: currentProfile.age,
          photo: currentProfile.photos?.[0],
        });
        // Also refresh the count (this may trigger another notification via callback if needed)
        refreshMatchesCount(token);
      }

      // After a successful swipe, there are now swipes to rewind
      setSwipeCount((prev) => prev + 1);
      setHasMadeFirstSwipe(true); // Mark that user has made at least one swipe
      // Set hasSwipesToRewind to true after first swipe, and it will persist across navigation
      setHasSwipesToRewind(true);

      setDeck((prev) => {
        const [, ...rest] = prev;
        if (rest.length === 0) {
          fetchDeck();
        }
        return rest;
      });
    } catch (err) {
      Alert.alert('Swipe failed', err instanceof Error ? err.message : 'Unable to swipe right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRewind = async () => {
    try {
      setActionLoading(true);
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/swipes/rewind`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No more swipes to rewind - hide the button
          setHasSwipesToRewind(false);
          // Don't show alert, just silently hide the button
          return;
        }
        throw new Error(await extractError(response));
      }

      // Rewind was successful - decrement our local swipe count
      setSwipeCount((prev) => Math.max(0, prev - 1));
      
      // If rewind succeeds, there might be more swipes (from this session or before)
      // So we keep the button visible. It will be hidden if the next rewind returns 404
      setHasSwipesToRewind(true);
      
      fetchDeck();
      refreshMatchesCount(token);
    } catch (err) {
      if (err instanceof Error && (err.message.includes('No swipes to rewind') || err.message.includes('404'))) {
        // No swipes to rewind - hide the button silently
        setHasSwipesToRewind(false);
        return;
      }
      Alert.alert('Rewind failed', err instanceof Error ? err.message : 'Unable to rewind right now.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <StatusBanner status={health.status} timestamp={health.timestamp} />
      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={cupidTheme.colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.secondaryButton} onPress={fetchDeck}>
            <Text style={styles.secondaryButtonLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : currentProfile ? (
        <>
          <ProfileCard
            profile={currentProfile as ProfileCardData}
            variant="default"
            showActions={true}
            onPass={() => handleSwipe('LEFT')}
            onLike={() => handleSwipe('RIGHT')}
            actionLoading={actionLoading}
          />
          {hasSwipesToRewind && hasMadeFirstSwipe && (
            <Pressable style={styles.rewindButton} onPress={handleRewind} disabled={actionLoading}>
              <Text style={styles.rewindLabel}>Rewind</Text>
            </Pressable>
          )}
        </>
      ) : (
        <View style={styles.stateCard}>
          <Text style={styles.heading}>You're all caught up! 🎉</Text>
          <Text style={styles.copy}>We'll notify you as soon as new profiles arrive. Check back soon!</Text>
          <Pressable style={styles.secondaryButton} onPress={fetchDeck}>
            <Text style={styles.secondaryButtonLabel}>Refresh</Text>
          </Pressable>
          {hasSwipesToRewind && hasMadeFirstSwipe && (
            <Pressable style={styles.rewindButton} onPress={handleRewind} disabled={actionLoading}>
              <Text style={styles.rewindLabel}>Rewind</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    padding: 32,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  heading: {
    fontSize: 24,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: cupidTheme.colors.error,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  rewindButton: {
    marginTop: 16,
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.accentSecondary,
    backgroundColor: cupidTheme.colors.surface,
    minHeight: 50,
    justifyContent: 'center',
  },
  rewindLabel: {
    color: cupidTheme.colors.accentSecondary,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    marginTop: 8,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: cupidTheme.colors.surface,
  },
  secondaryButtonLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
  },
});

async function extractError(response: Response) {
  try {
    const data = await response.json();
    return data?.message ?? data?.error?.message ?? 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
}
