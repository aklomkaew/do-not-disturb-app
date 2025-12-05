import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { StyleSheet, Text, View } from 'react-native';

export function SwipeScreen() {
  const health = useHealthCheck();

  return (
    <ScreenContainer>
      <StatusBanner status={health.status} timestamp={health.timestamp} />
      <View style={styles.card}>
        <Text style={styles.heading}>Swipe Deck</Text>
        <Text style={styles.copy}>
          This screen will render the stacked profile cards, gestures, and quick actions once the swipe APIs are wired up.
        </Text>
        <Text style={styles.meta}>Phase 2 skeleton — connect to `/api/profiles` in Phase 4.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 8,
  },
  heading: {
    fontSize: 20,
    color: '#F9FAFB',
    fontWeight: '700',
  },
  copy: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  meta: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
