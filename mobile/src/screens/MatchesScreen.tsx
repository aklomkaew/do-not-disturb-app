import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

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
          <ActivityIndicator color="#F472B6" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMatches(true)} tintColor="#F472B6" />}
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 8,
    marginBottom: 12,
  },
  stateCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    alignItems: 'center',
    gap: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 20,
    color: '#F9FAFB',
    fontWeight: '700',
  },
  location: {
    color: '#D1D5DB',
  },
  bio: {
    color: '#E5E7EB',
    lineHeight: 18,
  },
  copy: {
    color: '#D1D5DB',
    textAlign: 'center',
  },
  meta: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  errorText: {
    color: '#FCA5A5',
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
