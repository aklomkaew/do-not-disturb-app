import { ScreenContainer } from '@/components/ScreenContainer';
import { StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

export function AdminScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Admin Console</Text>
        <Text style={styles.copy}>
          Restricted analytics and moderation tooling will render here. For now, the screen serves as a reminder to wire role-based
          access and the `/api/admin/*` endpoints.
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
