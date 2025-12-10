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
import Ionicons from '@expo/vector-icons/Ionicons';

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
        contentContainerStyle={[styles.listContent, matches.length === 0 && styles.emptyContainer]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMatches(true)} tintColor={cupidTheme.colors.accent} />}
        ListHeaderComponent={<MatchesHeader matchCount={matches.length} />}
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
            <Ionicons name="heart-outline" size={28} color={cupidTheme.colors.accent} />
            <Text style={styles.heading}>No matches yet</Text>
            <Text style={styles.copy}>Keep exploring and we’ll drop new matches here.</Text>
            <Text style={styles.copy}>We refresh your deck multiple times a week during beta.</Text>
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
  listContent: {
    gap: 16,
    padding: 16,
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  photo: {
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: cupidTheme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  badgeLabel: {
    fontSize: 12,
    color: cupidTheme.colors.accent,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: cupidTheme.radii.pill,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  metaChipLabel: {
    fontSize: 12,
    color: cupidTheme.colors.textSecondary,
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

function MatchesHeader({ matchCount }: { matchCount: number }) {
  return (
    <View style={headerStyles.container}>
      <View style={{ flex: 1 }}>
        <Text style={headerStyles.eyebrow}>Connections</Text>
        <Text style={headerStyles.title}>Your matches</Text>
        <Text style={headerStyles.copy}>
          We group compatible profiles and refresh them a few times per week. Check in here for every mutual match and curated intro.
        </Text>
      </View>
      <View style={headerStyles.countPill}>
        <Text style={headerStyles.count}>{matchCount}</Text>
        <Text style={headerStyles.countLabel}>Total matches</Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    ...cardShadow(),
  },
  eyebrow: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 20,
  },
  countPill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 18,
    minWidth: 100,
  },
  count: {
    fontSize: 28,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  countLabel: {
    fontSize: 12,
    color: cupidTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
