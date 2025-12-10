import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

type ProfileResponse = {
  displayName: string;
  age: number;
  gender: string;
  relationshipStatus: string;
  bio: string;
  instagramHandle: string | null;
  matchNotificationsEnabled: boolean;
  photos: string[];
};

export function ProfileScreen() {
  const { user, accessToken, logout } = useAuth();
  const navigation = useNavigation<Navigation>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        instagramHandle: data.profile.instagramHandle ?? null,
        matchNotificationsEnabled: data.profile.matchNotificationsEnabled ?? true,
        photos: data.profile.media?.photos ?? [],
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

  const handleEdit = () => {
    if (!profile) return;
    navigation.navigate('ProfileEditor', { profile });
  };

  const confirmDeleteAccount = () => {
    Alert.alert('Delete account', 'Are you sure? Your account and matches will be permanently removed.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, delete it', style: 'destructive', onPress: () => deleteAccount().catch(() => undefined) },
    ]);
  };

  const deleteAccount = async () => {
    if (!accessToken) {
      Alert.alert('Delete account', 'Session expired. Please log in again.');
      await logout().catch(() => undefined);
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(await extractError(response));
      }

      await logout();
    } catch (err) {
      Alert.alert('Delete failed', err instanceof Error ? err.message : 'Unable to delete the account right now.');
    } finally {
      setDeleting(false);
    }
  };

  const primaryPhoto = profile?.photos?.[0];
  const secondaryPhotos = profile?.photos?.slice(1) ?? [];

  const fallbackId = user?.id ? user.id.slice(0, 4) : '0000';
  const greetingName = profile?.displayName ?? user?.email?.split('@')[0] ?? `Member ${fallbackId}`;

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {primaryPhoto ? <Image source={{ uri: primaryPhoto }} style={styles.heroImage} /> : null}
          <Text style={styles.heading}>Profile & Settings</Text>
          <Text style={styles.greeting}>Hello {greetingName}</Text>

          {status === 'loading' ? (
            <ActivityIndicator color={cupidTheme.colors.accent} style={{ marginTop: 16 }} />
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
              <Detail label="Instagram" value={profile.instagramHandle ? `@${profile.instagramHandle.replace(/^@/, '')}` : 'Not provided'} />
              <Detail label="Match notifications" value={profile.matchNotificationsEnabled ? 'Enabled' : 'Disabled'} />
              <View style={styles.bioBlock}>
                <Text style={styles.metaLabel}>Bio</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
              {secondaryPhotos.length > 0 ? (
                <View style={styles.photoStrip}>
                  {secondaryPhotos.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.photoThumb} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={handleEdit} disabled={!profile}>
              <Text style={styles.secondaryButtonLabel}>Edit profile</Text>
            </Pressable>
            <Pressable style={[styles.button, deleting && styles.buttonDisabled]} onPress={confirmDeleteAccount} disabled={deleting}>
              <Ionicons name="trash-outline" size={18} color={cupidTheme.colors.surface} />
              <Text style={styles.buttonLabel}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
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
    paddingBottom: 36,
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    padding: 22,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 14,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  heading: {
    fontSize: 24,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
  },
  greeting: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: 2,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: cupidTheme.radii.lg,
    marginBottom: 12,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 15,
  },
  details: {
    marginTop: 10,
    gap: 10,
  },
  detailRow: {
    gap: 4,
  },
  metaLabel: {
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    color: cupidTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  bioBlock: {
    gap: 6,
    marginTop: 10,
  },
  bio: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 20,
  },
  photoStrip: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  photoThumb: {
    width: 96,
    height: 120,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
  button: {
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.error,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    ...cardShadow('floating'),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: cupidTheme.colors.surface,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  secondaryButton: {
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  secondaryButtonLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
  },
  errorState: {
    gap: 10,
    marginTop: 12,
  },
  errorText: {
    color: cupidTheme.colors.error,
  },
});

function AccountPill({ icon, label, highlight }: { icon: keyof typeof Ionicons.glyphMap; label: string; highlight?: boolean }) {
  return (
    <View
      style={[
        pillStyles.pill,
        highlight && {
          borderColor: cupidTheme.colors.accent,
          backgroundColor: cupidTheme.colors.accentSoft,
        },
      ]}
    >
      <Ionicons name={icon} size={14} color={highlight ? cupidTheme.colors.accent : cupidTheme.colors.textMuted} />
      <Text style={[pillStyles.label, highlight && { color: cupidTheme.colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

async function extractError(response: Response) {
  try {
    const data = await response.json();
    return data?.message ?? data?.error?.message ?? 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
}
