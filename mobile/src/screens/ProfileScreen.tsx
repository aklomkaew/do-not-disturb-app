import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/hooks/useAuth';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to end your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          logout().catch((error) => console.warn('Failed to logout', error));
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Profile & Settings</Text>
        <Text style={styles.copy}>
          You are signed in as {user?.email ?? user?.phoneNumber ?? 'unknown user'}. Profile onboarding and preferences will live
          here soon.
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Account ID</Text>
          <Text style={styles.metaValue}>{user?.id}</Text>
          <Text style={styles.metaLabel}>Role</Text>
          <Text style={styles.metaValue}>{user?.role ?? 'USER'}</Text>
          <Text style={styles.metaLabel}>Allowlisted</Text>
          <Text style={styles.metaValue}>{user?.allowlisted ? 'Yes' : 'No'}</Text>
        </View>
        <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonLabel}>Log out</Text>
        </Pressable>
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
    marginTop: 12,
    gap: 4,
  },
  metaLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    color: '#F3F4F6',
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#F87171',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#0B0B0D',
    fontWeight: '700',
    fontSize: 16,
  },
});
