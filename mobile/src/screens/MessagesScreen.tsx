import { ScreenContainer } from '@/components/ScreenContainer';
import { StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

export function MessagesScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Messages</Text>
        <Text style={styles.copy}>
          {`The dedicated inbox lives here. Hook up '/api/messages' for thread previews and '/api/matches/{matchId}/messages' for conversation detail in future phases.`}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    gap: 10,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  heading: {
    fontSize: 22,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
  },
});
