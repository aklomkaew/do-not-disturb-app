import { ScreenContainer } from '@/components/ScreenContainer';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePreferredName } from '@/hooks/usePreferredName';

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        instagramHandle: data.profile.instagramHandle ?? null,
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
    setDeleteError(null);
    setConfirmingDelete(true);
  };

  const deleteAccount = async () => {
    if (!accessToken) {
      await logout().catch(() => undefined);
      setConfirmingDelete(false);
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);
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
      setConfirmingDelete(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete the account right now.');
    } finally {
      setDeleting(false);
    }
  };

  const primaryPhoto = profile?.photos?.[0];
  const secondaryPhotos = profile?.photos?.slice(1) ?? [];

  const preferredName = usePreferredName();
  const greetingName = useMemo(() => {
    if (profile?.displayName) return profile.displayName;
    if (preferredName) return preferredName;
    if (user?.email) return user.email.split('@')[0];
    return user?.id ? `Member ${user.id.slice(0, 4)}` : 'Friend';
  }, [preferredName, profile?.displayName, user?.email, user?.id]);

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

      <Modal visible={confirmingDelete} transparent animationType="fade" onRequestClose={() => setConfirmingDelete(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="warning-outline" size={32} color={cupidTheme.colors.error} />
            <Text style={styles.modalTitle}>Delete your account?</Text>
            <Text style={styles.modalCopy}>
              This removes your profile, matches, and any appearances in Explore for everyone. This cannot be undone.
            </Text>
            {deleteError ? <Text style={styles.modalError}>{deleteError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={() => setConfirmingDelete(false)} disabled={deleting}>
                <Text style={styles.modalSecondaryLabel}>Keep account</Text>
              </Pressable>
              <Pressable style={[styles.modalPrimary, deleting && styles.buttonDisabled]} onPress={deleteAccount} disabled={deleting}>
                <Text style={styles.modalPrimaryLabel}>{deleting ? 'Deleting…' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: cupidTheme.colors.surface,
    borderRadius: cupidTheme.radii.xl,
    padding: 24,
    gap: 12,
    ...cardShadow(),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  modalCopy: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 20,
  },
  modalError: {
    color: cupidTheme.colors.error,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalSecondary: {
    flex: 1,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  modalSecondaryLabel: {
    color: cupidTheme.colors.textSecondary,
    fontWeight: '700',
  },
  modalPrimary: {
    flex: 1,
    borderRadius: cupidTheme.radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.error,
    ...cardShadow('floating'),
  },
  modalPrimaryLabel: {
    color: cupidTheme.colors.surface,
    fontWeight: '800',
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
