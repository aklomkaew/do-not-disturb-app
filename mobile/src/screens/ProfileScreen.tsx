import { ScreenContainer } from '@/components/ScreenContainer';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

type ProfileResponse = {
  displayName: string;
  age: number;
  gender: string;
  relationshipStatus: string;
  bio: string;
  location: string | null;
  matchNotificationsEnabled: boolean;
  photos: string[];
  photoPaths: string[];
};

export function ProfileScreen() {
  const { user, logout, getAccessToken } = useAuth();
  const navigation = useNavigation<Navigation>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const galleryWidth = Dimensions.get('window').width - 64;
  const allPhotos = profile?.photos ?? [];

  const fetchProfile = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
        photos: data.profile.media?.photos ?? [],
        photoPaths: data.profile.media?.paths ?? [],
      };

      setProfile(normalized);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  }, [getAccessToken]);

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
    try {
      setDeleting(true);
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(await extractError(response));
      }

      await logout();
    } catch (err) {
      Alert.alert('Delete failed', err instanceof Error ? err.message : 'Unable to delete the account right now.');
      if (err instanceof Error && err.message.toLowerCase().includes('session')) {
        await logout().catch(() => undefined);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {allPhotos.length > 0 ? (
            <View style={styles.gallery}>
              <PhotoCarousel photos={allPhotos} width={galleryWidth} height={260} />
              {allPhotos.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                  {allPhotos.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.thumb} />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          ) : (
            <View style={[styles.photoFallback, { width: galleryWidth }]}>
              <Text style={styles.photoFallbackText}>Add photos to showcase yourself.</Text>
            </View>
          )}
          <Text style={styles.heading}>Profile & Settings</Text>
          <Text style={styles.copy}>You are signed in as {user?.email ?? user?.phoneNumber ?? 'unknown user'}.</Text>

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
            <Pressable style={[styles.button, deleting && styles.buttonDisabled]} onPress={confirmDeleteAccount} disabled={deleting}>
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
  },
  card: {
    padding: 22,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 14,
  gallery: {
    gap: 8,
    marginBottom: 8,
  },
  thumbRow: {
    flexGrow: 0,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: cupidTheme.radii.md,
    marginRight: 8,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  photoFallback: {
    height: 220,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoFallbackText: {
    color: cupidTheme.colors.textMuted,
    fontWeight: '700',
  },
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  heading: {
    fontSize: 24,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
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
  meta: {
    marginTop: 16,
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
  actions: {
    marginTop: 18,
    gap: 10,
  },
  button: {
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.error,
    paddingVertical: 14,
    alignItems: 'center',
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

async function extractError(response: Response) {
  try {
    const data = await response.json();
    return data?.message ?? data?.error?.message ?? 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
}
