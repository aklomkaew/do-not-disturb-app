import { ScreenContainer } from '@/components/ScreenContainer';
import { ProfileCard, ProfileCardData } from '@/components/ProfileCard';
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
import { updateMatchesCount } from '@/hooks/useMatchesCount';
import { formatLocationCompact } from '@/utils/locationHelpers';

type MatchItem = {
  id: string;
  createdAt: string;
  partner: {
    id: string;
    displayName: string;
    age: number;
    gender?: string;
    relationshipStatus?: string;
    location: string | null;
    bio: string;
    instagramHandle?: string | null;
    preferences?: {
      funQuestions?: import('@/components/FunQuestions').FunQuestionsAnswers;
    };
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
        const nextMatches = data.matches ?? [];
        setMatches(nextMatches);
        updateMatchesCount(nextMatches.length);
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
        contentContainerStyle={matches.length === 0 ? [styles.listContent, styles.emptyContainer] : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMatches(true)} tintColor={cupidTheme.colors.accent} />}
        ListHeaderComponent={<MatchesHeader matchCount={matches.length} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedMatch(item)}>
            <View style={styles.card}>
              {item.partner.photos?.[0] ? (
                <View style={styles.photoContainer}>
                  <Image 
                    source={{ uri: item.partner.photos[0] }} 
                    style={styles.photo}
                    resizeMode="cover"
                    fadeDuration={150}
                  />
                </View>
              ) : null}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {item.partner.displayName}, {item.partner.age}
                  </Text>
                  <Text style={styles.location}>{formatLocationCompact(item.partner.location)}</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="calendar-outline" size={14} color={cupidTheme.colors.accent} />
                  <Text style={styles.badgeLabel}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={styles.bio} numberOfLines={3}>
                {item.partner.bio}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.metaChip}>
                  <Ionicons name="people-outline" size={14} color={cupidTheme.colors.accent} />
                  <Text style={styles.metaChipLabel}>Mutual interest logged</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="sparkles-outline" size={14} color={cupidTheme.colors.textMuted} />
                  <Text style={styles.metaChipLabel}>Tap to view full profile</Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.stateCard}>
            <Ionicons name="heart-outline" size={40} color={cupidTheme.colors.accent} />
            <Text style={styles.heading}>No matches yet</Text>
            <Text style={styles.copy}>Keep exploring and we'll drop new matches here.</Text>
            <Text style={styles.copy}>We refresh your deck multiple times a week during beta.</Text>
          </View>
        }
      />
      {selectedMatch ? (
        <Modal animationType="slide" transparent visible onRequestClose={() => setSelectedMatch(null)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { width: modalWidth }]}>
              <ProfileCard
                profile={{
                  id: selectedMatch.partner.id,
                  displayName: selectedMatch.partner.displayName,
                  age: selectedMatch.partner.age,
                  gender: selectedMatch.partner.gender,
                  relationshipStatus: selectedMatch.partner.relationshipStatus,
                  location: selectedMatch.partner.location,
                  bio: selectedMatch.partner.bio,
                  instagramHandle: selectedMatch.partner.instagramHandle,
                  preferences: selectedMatch.partner.preferences,
                  photos: selectedMatch.partner.photos,
                } as ProfileCardData}
                variant="detailed"
                showActions={false}
              />
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
    letterSpacing: -0.3,
  },
  photoContainer: {
    width: '100%',
    height: 160,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  stateCard: {
    padding: 32,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  location: {
    color: cupidTheme.colors.textSecondary,
  },
  bio: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 22,
    fontSize: 15,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
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
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
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
