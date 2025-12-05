import { ScreenContainer } from '@/components/ScreenContainer';
import { StyleSheet, Text, View } from 'react-native';

export function MatchesScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Matches</Text>
        <Text style={styles.copy}>
          Placeholder list for Mutual, Liked You, and You Liked tabs. Use this spot to hook into `/api/matches` and `/api/messages`
          later.
        </Text>
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
});
