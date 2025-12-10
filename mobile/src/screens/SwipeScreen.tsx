import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
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
  const [deck, setDeck] = useState<DeckProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    }, [fetchDeck])
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
        <ProfileCard
          profile={currentProfile}
          onPass={() => handleSwipe('LEFT')}
          onLike={() => handleSwipe('RIGHT')}
          onRewind={handleRewind}
          actionLoading={actionLoading}
        />
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

function ProfileCard({
  profile,
  onPass,
  onLike,
  onRewind,
  actionLoading,
}: {
  profile: DeckProfile;
  onPass: () => void;
  onLike: () => void;
  onRewind: () => void;
  actionLoading: boolean;
}) {
  const photos = profile.photos ?? [];
  const hasPhotos = photos.length > 0;
  const width = Dimensions.get('window').width - 32;

  return (
    <View style={styles.card}>
      {hasPhotos ? (
        <PhotoCarousel photos={photos} width={width} />
      ) : (
        <View style={[styles.photoFallback, { width }]}>
          <Text style={styles.photoFallbackText}>No photos yet</Text>
        </View>
      )}

      <View style={styles.textOverlay}>
        <Text style={styles.heading}>
          {profile.displayName}, {profile.age}
        </Text>
        <Text style={styles.location}>{profile.location ?? 'Somewhere on Earth'}</Text>
        <Text style={styles.bio} numberOfLines={4}>
          {profile.bio}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.passButton]} onPress={onPass} disabled={actionLoading}>
          <Text style={styles.actionLabel}>Pass</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.likeButton]} onPress={onLike} disabled={actionLoading}>
          <Text style={[styles.actionLabel, styles.actionLabelContrast]}>Like</Text>
        </Pressable>
      </View>

      <Pressable style={styles.rewindButton} onPress={onRewind} disabled={actionLoading}>
        <Text style={styles.rewindLabel}>Rewind</Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  stateCard: {
    padding: 22,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    gap: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  card: {
    padding: 24,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 14,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  heading: {
    fontSize: 26,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
  },
  photoFallback: {
    height: 360,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    color: cupidTheme.colors.textMuted,
    fontWeight: '700',
  },
  textOverlay: {
    gap: 6,
  },
  location: {
    color: cupidTheme.colors.textSecondary,
  },
  bio: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 22,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    color: cupidTheme.colors.error,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: cupidTheme.radii.lg,
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
  },
  likeButton: {
    backgroundColor: cupidTheme.colors.accent,
    ...cardShadow('floating'),
  },
  actionLabel: {
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
  },
  actionLabelContrast: {
    color: cupidTheme.colors.surface,
  },
  rewindButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accentSecondary,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  rewindLabel: {
    color: cupidTheme.colors.accentSecondary,
    fontWeight: '700',
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
