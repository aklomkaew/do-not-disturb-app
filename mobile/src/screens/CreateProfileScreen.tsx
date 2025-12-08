import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'CreateProfile'>;
type Route = RouteProp<AuthStackParamList, 'CreateProfile'>;

export function CreateProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { status, timestamp } = useHealthCheck();
  const { accessToken } = useAuth();
  const [displayName, setDisplayName] = useState(route.params.initialDisplayName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    try {
      if (!accessToken) {
        throw new Error('Session expired. Please log in again.');
      }
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/profile/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <StatusBanner status={status} timestamp={timestamp} />
      <View style={styles.hero}>
        <Text style={styles.kicker}>Create your profile</Text>
        <Text style={styles.title}>We just need a display name to get you started.</Text>
        <Text style={styles.copy}>You can update it and add detailed preferences once onboarding is complete.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Alex"
          placeholderTextColor="#6B7280"
          autoCapitalize="words"
          editable={!submitting}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#0B0B0D" /> : <Text style={styles.buttonLabel}>Save & continue</Text>}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#111827',
    gap: 10,
  },
  kicker: {
    color: '#F472B6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
  },
  copy: {
    color: '#D1D5DB',
    lineHeight: 20,
  },
  card: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
  },
  label: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0D0F15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F9FAFB',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2D303E',
  },
  error: {
    color: '#FCA5A5',
  },
  button: {
    backgroundColor: '#F472B6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#0B0B0D',
    fontWeight: '700',
    fontSize: 16,
  },
});

async function extractError(response: Response) {
  try {
    const data = await response.json();
    return data?.message ?? data?.error?.message ?? 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
}
