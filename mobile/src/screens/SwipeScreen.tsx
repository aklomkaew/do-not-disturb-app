import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

type DeckProfile = {
  id: string;
  displayName: string;
  age: number;
  location: string | null;
  bio: string;
};

export function SwipeScreen() {
  const health = useHealthCheck();
  const { accessToken } = useAuth();
  const [deck, setDeck] = useState<DeckProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDeck = useCallback(async () => {
    if (!accessToken) {
      setError('Session expired. Please log in again.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/swipes/deck`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      fetchDeck();
    }, [fetchDeck])
  );

  const currentProfile = deck[0];

  const handleSwipe = async (direction: 'LEFT' | 'RIGHT') => {
    if (!currentProfile || !accessToken) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetProfileId: currentProfile.id,
          direction,
        }),
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

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
    if (!accessToken) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/swipes/rewind`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      fetchDeck();
    } catch (err) {
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
          <ActivityIndicator color="#F472B6" />
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.secondaryButton} onPress={fetchDeck}>
            <Text style={styles.secondaryButtonLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : currentProfile ? (
        <View style={styles.card}>
          <Text style={styles.heading}>
            {currentProfile.displayName}, {currentProfile.age}
          </Text>
          <Text style={styles.location}>{currentProfile.location ?? 'Somewhere on Earth'}</Text>
          <Text style={styles.bio}>{currentProfile.bio}</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.actionButton, styles.passButton]} onPress={() => handleSwipe('LEFT')} disabled={actionLoading}>
              <Text style={styles.actionLabel}>Pass</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.likeButton]} onPress={() => handleSwipe('RIGHT')} disabled={actionLoading}>
              <Text style={styles.actionLabel}>Like</Text>
            </Pressable>
          </View>

          <Pressable style={styles.rewindButton} onPress={handleRewind} disabled={actionLoading}>
            <Text style={styles.rewindLabel}>Rewind</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.stateCard}>
          <Text style={styles.heading}>You’re all caught up!</Text>
          <Text style={styles.copy}>We’ll notify you as soon as new profiles arrive.</Text>
          <Pressable style={styles.secondaryButton} onPress={fetchDeck}>
            <Text style={styles.secondaryButtonLabel}>Refresh</Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
    alignItems: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
  },
  heading: {
    fontSize: 24,
    color: '#F9FAFB',
    fontWeight: '700',
  },
  location: {
    color: '#D1D5DB',
  },
  bio: {
    color: '#E5E7EB',
    lineHeight: 20,
  },
  copy: {
    color: '#D1D5DB',
  },
  errorText: {
    color: '#FCA5A5',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: '#374151',
  },
  likeButton: {
    backgroundColor: '#F472B6',
  },
  actionLabel: {
    color: '#0B0B0D',
    fontWeight: '700',
  },
  rewindButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  rewindLabel: {
    color: '#FBBF24',
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F472B6',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  secondaryButtonLabel: {
    color: '#F472B6',
    fontWeight: '600',
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
