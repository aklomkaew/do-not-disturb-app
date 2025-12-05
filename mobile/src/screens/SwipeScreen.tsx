import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useApiClient } from '@/hooks/useApiClient';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DeckProfile {
  id: string;
  displayName: string;
  age: number;
  gender: string;
  relationshipStatus: string;
  bio: string;
}

export function SwipeScreen() {
  const health = useHealthCheck();
  const api = useApiClient();
  const [isLoading, setIsLoading] = useState(true);
  const [deck, setDeck] = useState<DeckProfile[]>([]);

  const fetchDeck = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/profiles?limit=10');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to load profiles');
      }
      setDeck(data.items ?? []);
    } catch (error) {
      console.warn('Failed to load deck', error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  async function handleSwipe(direction: 'left' | 'right') {
    const next = deck[0];
    if (!next) return;

    try {
      const response = await api.post('/api/swipes', {
        targetProfileId: next.id,
        direction: direction === 'right' ? 'RIGHT' : 'LEFT',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to swipe');
      }
      setDeck((prev) => prev.slice(1));
    } catch (error) {
      Alert.alert('Swipe failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return (
    <ScreenContainer>
      <StatusBanner status={health.status} timestamp={health.timestamp} />
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#F472B6" />
        </View>
      ) : deck.length === 0 ? (
        <EmptyDeck onRefetch={fetchDeck} />
      ) : (
        <ProfileCard profile={deck[0]} onPass={() => handleSwipe('left')} onLike={() => handleSwipe('right')} />
      )}
    </ScreenContainer>
  );
}

function ProfileCard({ profile, onPass, onLike }: { profile: DeckProfile; onPass: () => void; onLike: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{profile.displayName}</Text>
      <Text style={styles.meta}>{profile.age} • {profile.gender} • {profile.relationshipStatus}</Text>
      <Text style={styles.copy}>{profile.bio}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.chip, styles.pass]} onPress={onPass}>
          <Text style={styles.chipText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, styles.like]} onPress={onLike}>
          <Text style={styles.chipText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyDeck({ onRefetch }: { onRefetch: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Deck empty</Text>
      <Text style={styles.copy}>You are all caught up. Pull more profiles when you’re ready.</Text>
      <TouchableOpacity style={styles.chip} onPress={onRefetch}>
        <Text style={styles.chipText}>Reload</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 8,
  },
  heading: {
    fontSize: 22,
    color: '#F9FAFB',
    fontWeight: '700',
  },
  copy: {
    color: '#D1D5DB',
    fontSize: 15,
  },
  meta: {
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  chip: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pass: {
    backgroundColor: '#374151',
  },
  like: {
    backgroundColor: '#F472B6',
  },
  chipText: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
});
