import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

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
      Alert.alert('Action failed', err instanceof Error ? err.message : 'Unable to explore right now.');
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
      <View style={styles.heroCard}>
        <Ionicons name="compass-outline" size={22} color={cupidTheme.colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Explore queue</Text>
          <Text style={styles.heroCopy}>Discover intentional matches one curated card at a time.</Text>
        </View>
      </View>
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
          <Ionicons name="sparkles-outline" size={26} color={cupidTheme.colors.accent} />
          <Text style={styles.heading}>You’re all caught up!</Text>
          <Text style={styles.copy}>We’ll notify you as soon as new profiles arrive.</Text>
          <Pressable style={styles.secondaryButton} onPress={fetchDeck}>
            <Text style={styles.secondaryButtonLabel}>Refresh</Text>
          </Pressable>
          <Text style={styles.tipLabel}>Tip: Update your profile to unlock fresh batches faster.</Text>
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
  const bioLength = profile.bio.length;
  const tags = [
    profile.location ?? 'Location TBD',
    `${profile.age} yrs`,
    bioLength > 160 ? 'Thoughtful storyteller' : 'Concise communicator',
  ];

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
        <View style={styles.tagRow}>
          {tags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={styles.tag}>
              <Text style={styles.tagLabel}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.bio} numberOfLines={5}>
          {profile.bio}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.passButton]} onPress={onPass} disabled={actionLoading}>
          <Ionicons name="close" size={20} color={cupidTheme.colors.textPrimary} />
          <Text style={styles.actionLabel}>Pass</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.likeButton]} onPress={onLike} disabled={actionLoading}>
          <Ionicons name="heart" size={20} color={cupidTheme.colors.surface} />
          <Text style={[styles.actionLabel, styles.actionLabelContrast]}>Like</Text>
        </Pressable>
      </View>

      <Pressable style={styles.rewindButton} onPress={onRewind} disabled={actionLoading}>
        <Ionicons name="play-back" size={18} color={cupidTheme.colors.accentSecondary} />
        <Text style={styles.rewindLabel}>Rewind last pick</Text>
      </Pressable>
    </View>
  );
}

function PhotoCarousel({ photos, width }: { photos: string[]; width: number }) {
  const [index, setIndex] = useState(0);

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          setIndex(Math.round(offsetX / width));
        }}
        style={{ width }}
      >
        {photos.map((uri) => (
          <Image key={uri} source={{ uri }} style={[styles.heroImage, { width }]} />
        ))}
      </ScrollView>
      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 16,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  heroCopy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
  },
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
  heroImage: {
    height: 360,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    resizeMode: 'cover',
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: cupidTheme.radii.pill,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  tagLabel: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cupidTheme.colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: cupidTheme.colors.accent,
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
  tipLabel: {
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
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
