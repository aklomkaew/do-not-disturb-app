import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
  };
};

export function MatchesScreen() {
  const { accessToken } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(
    async (isRefresh = false) => {
      if (!accessToken) {
        setError('Session expired.');
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/matches`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
    [accessToken]
  );

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches])
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.stateCard}>
          <ActivityIndicator color={cupidTheme.colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.stateCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={matches.length === 0 && styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMatches(true)} tintColor={cupidTheme.colors.accent} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.heading}>
              {item.partner.displayName}, {item.partner.age}
            </Text>
            <Text style={styles.location}>{item.partner.location ?? 'Somewhere on Earth'}</Text>
            <Text style={styles.bio} numberOfLines={3}>
              {item.partner.bio}
            </Text>
            <Text style={styles.meta}>Matched on {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.stateCard}>
            <Text style={styles.heading}>No matches yet</Text>
            <Text style={styles.copy}>Keep swiping and we’ll drop new matches here.</Text>
          </View>
        }
      />
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
  errorText: {
    color: cupidTheme.colors.error,
    textAlign: 'center',
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
