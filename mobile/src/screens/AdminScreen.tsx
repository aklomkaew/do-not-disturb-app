import { ScreenContainer } from '@/components/ScreenContainer';
import { StyleSheet, Text, View } from 'react-native';

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
