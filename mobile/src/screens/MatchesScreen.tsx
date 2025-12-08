import { ScreenContainer } from '@/components/ScreenContainer';
import { useApiClient } from '@/hooks/useApiClient';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

interface MatchItem {
  id: string;
  profileAId: string;
  profileBId: string;
  profileA: { id: string; displayName: string };
  profileB: { id: string; displayName: string };
}

export function MatchesScreen() {
  const api = useApiClient();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/matches');
      const data = await response.json();
      setMatches(data.items ?? []);
    } catch (error) {
      console.warn('Failed to load matches', error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return (
    <ScreenContainer>
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#F472B6" />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <MatchRow match={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No matches yet. Like someone to get started!</Text>}
        />
      )}
    </ScreenContainer>
  );
}

function MatchRow({ match }: { match: MatchItem }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{match.profileA.displayName} ❤️ {match.profileB.displayName}</Text>
      <Text style={styles.subtitle}>Tap message tab to continue the conversation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 12,
  },
  row: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 4,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  empty: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
});
