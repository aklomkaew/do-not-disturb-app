import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

type ProfileResponse = {
  displayName: string;
  age: number;
  gender: string;
  relationshipStatus: string;
  bio: string;
  location: string | null;
  matchNotificationsEnabled: boolean;
};

export function ProfileScreen() {
  const { user, accessToken, logout } = useAuth();
  const navigation = useNavigation<Navigation>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!accessToken) {
      setStatus('error');
      setError('Session expired. Please log in again.');
      return;
    }

    try {
      setStatus('loading');
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      const data = await response.json();
      const normalized: ProfileResponse = {
        displayName: data.profile.displayName,
        age: data.profile.age,
        gender: data.profile.gender,
        relationshipStatus: data.profile.relationshipStatus,
        bio: data.profile.bio,
        location: data.profile.location,
        matchNotificationsEnabled: data.profile.matchNotificationsEnabled ?? true,
      };

      setProfile(normalized);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to end your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          logout().catch((err) => console.warn('Failed to logout', err));
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (!profile) return;
    navigation.navigate('ProfileEditor', { profile });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.heading}>Profile & Settings</Text>
          <Text style={styles.copy}>You are signed in as {user?.email ?? user?.phoneNumber ?? 'unknown user'}.</Text>

          {status === 'loading' ? (
            <ActivityIndicator color="#F472B6" style={{ marginTop: 16 }} />
          ) : status === 'error' ? (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.secondaryButton} onPress={fetchProfile}>
                <Text style={styles.secondaryButtonLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : profile ? (
            <View style={styles.details}>
              <Detail label="Display name" value={profile.displayName} />
              <Detail label="Age" value={String(profile.age)} />
              <Detail label="Gender" value={formatLabel(profile.gender)} />
              <Detail label="Relationship status" value={formatLabel(profile.relationshipStatus)} />
              <Detail label="Location" value={profile.location ?? 'Not set'} />
              <View style={styles.bioBlock}>
                <Text style={styles.metaLabel}>Bio</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Account ID</Text>
            <Text style={styles.metaValue}>{user?.id}</Text>
            <Text style={styles.metaLabel}>Role</Text>
            <Text style={styles.metaValue}>{user?.role ?? 'USER'}</Text>
            <Text style={styles.metaLabel}>Allowlisted</Text>
            <Text style={styles.metaValue}>{user?.allowlisted ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={handleEdit} disabled={!profile}>
              <Text style={styles.secondaryButtonLabel}>Edit profile</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleLogout}>
              <Text style={styles.buttonLabel}>Log out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function formatLabel(value: string) {
  return value.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
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
  details: {
    marginTop: 8,
    gap: 8,
  },
  detailRow: {
    gap: 2,
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
  },
  bioBlock: {
    gap: 4,
    marginTop: 8,
  },
  bio: {
    color: '#E5E7EB',
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
    gap: 8,
  },
  button: {
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
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F472B6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    color: '#F472B6',
    fontWeight: '700',
  },
  errorState: {
    gap: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#FCA5A5',
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
