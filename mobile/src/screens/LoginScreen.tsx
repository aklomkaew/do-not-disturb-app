import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth, AuthRole } from '@/providers/AuthProvider';

export function LoginScreen() {
  const { loginWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AuthRole>('user');

  async function handleLogin() {
    try {
      await loginWithEmail(email.trim(), role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login';
      Alert.alert('Login failed', message);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.heading}>Welcome to Do Not Disturb</Text>
        <Text style={styles.subtitle}>Choose a provider (Google / Instagram) and sign in. For now, enter your email to simulate the flow.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#6B7280"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          <RoleButton label="User" active={role === 'user'} onPress={() => setRole('user')} />
          <RoleButton label="Admin" active={role === 'admin'} onPress={() => setRole('admin')} />
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleLogin} disabled={isLoading || !email}>
          <Text style={styles.ctaText}>{isLoading ? 'Signing in...' : 'Continue'}</Text>
        </TouchableOpacity>

        <View style={styles.helper}>
          <Text style={styles.helperText}>Google / Instagram OAuth coming in the next iteration.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function RoleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.roleButton, active && styles.roleButtonActive]} onPress={onPress}>
      <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  panel: {
    backgroundColor: '#15161C',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 24,
    color: '#F9FAFB',
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  label: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#272934',
    borderRadius: 12,
    padding: 12,
    color: '#F9FAFB',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#272934',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#F472B6',
    borderColor: '#F472B6',
  },
  roleButtonText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#0B0B0D',
  },
  cta: {
    marginTop: 12,
    backgroundColor: '#F472B6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0B0B0D',
    fontWeight: '700',
    fontSize: 16,
  },
  helper: {
    alignItems: 'center',
  },
  helperText: {
    color: '#6B7280',
    fontSize: 12,
  },
});
