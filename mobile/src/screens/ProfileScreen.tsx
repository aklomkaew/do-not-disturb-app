import { ScreenContainer } from '@/components/ScreenContainer';
import { StyleSheet, Text, View } from 'react-native';

export function ProfileScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Profile & Settings</Text>
        <Text style={styles.copy}>
          This space will host the onboarding questionnaire, Do Not Disturb schedule, and account settings. For now, it serves as
          a placeholder so navigation is wired up.
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
