import { ScreenContainer } from '@/components/ScreenContainer';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

type MatchItem = {
  id: string;
  createdAt: string;
  partner: {
    id: string;
    displayName: string;
    age: number;
    location: string | null;
    bio: string;
    photos?: string[];
    photoPaths?: string[];
  };
};

export function MatchesScreen() {
  const { getAccessToken } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const modalWidth = Dimensions.get('window').width - 48;

  const fetchMatches = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const token = await getAccessToken();
        const response = await fetch(`${API_BASE_URL}/api/matches`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(await extractError(response));
        }

        const data = await response.json();
        setMatches(data.matches ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAccessToken]
  );

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches])
  );

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.stateCard}>
          <ActivityIndicator color={cupidTheme.colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={matches.length === 0 && styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMatches(true)} tintColor={cupidTheme.colors.accent} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedMatch(item)} style={styles.card}>
            {item.partner.photos && item.partner.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
                {item.partner.photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.photoThumb} />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoFallbackText}>No photos yet</Text>
              </View>
            )}
            <Text style={styles.heading}>
              {item.partner.displayName}, {item.partner.age}
            </Text>
            <Text style={styles.location}>{item.partner.location ?? 'Somewhere on Earth'}</Text>
            <Text style={styles.bio} numberOfLines={3}>
              {item.partner.bio}
            </Text>
            <Text style={styles.meta}>Matched on {new Date(item.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.hint}>Tap to view gallery</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.stateCard}>
            <Text style={styles.heading}>No matches yet</Text>
            <Text style={styles.copy}>Keep swiping and we’ll drop new matches here.</Text>
          </View>
        }
      />
      {selectedMatch ? (
        <Modal animationType="slide" transparent visible onRequestClose={() => setSelectedMatch(null)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { width: modalWidth }]}>
              {selectedMatch.partner.photos && selectedMatch.partner.photos.length > 0 ? (
                <PhotoCarousel photos={selectedMatch.partner.photos} width={modalWidth - 24} height={320} />
              ) : (
                <View style={styles.photoFallback}>
                  <Text style={styles.photoFallbackText}>No photos to display</Text>
                </View>
              )}
              <Pressable style={styles.closeButton} onPress={() => setSelectedMatch(null)}>
                <Text style={styles.closeLabel}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  photoStrip: {
    flexGrow: 0,
  },
  photoThumb: {
    width: 120,
    height: 160,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    marginRight: 8,
  },
  photoFallback: {
    width: '100%',
    height: 160,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    color: cupidTheme.colors.textMuted,
    fontWeight: '700',
  },
  stateCard: {
    padding: 22,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
  },
  location: {
    color: cupidTheme.colors.textSecondary,
  },
  bio: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 20,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    textAlign: 'center',
  },
  meta: {
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
  },
  hint: {
    color: cupidTheme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: cupidTheme.colors.error,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: cupidTheme.colors.surface,
    borderRadius: cupidTheme.radii.xl,
    padding: 16,
    ...cardShadow('floating'),
    gap: 12,
  },
  closeButton: {
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeLabel: {
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
