import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  photoPaths: string[];
};

export function ProfileScreen() {
  const { user, logout, getAccessToken } = useAuth();
  const navigation = useNavigation<Navigation>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    navigation.navigate('ProfileEditor', {
      profile: {
        displayName: profile.displayName,
        age: profile.age,
        gender: profile.gender,
        relationshipStatus: profile.relationshipStatus,
        bio: profile.bio,
        location: null, // Removed from UI
        instagramHandle: profile.instagramHandle,
        matchNotificationsEnabled: profile.matchNotificationsEnabled,
        photos: profile.photos,
        photoPaths: profile.photoPaths,
      },
    });
  };

  const confirmDeleteAccount = () => {
    if (deleting) {
      return; // Prevent multiple simultaneous delete attempts
    }
    
    // Use Modal for web, Alert for native
    if (Platform.OS === 'web') {
      setShowDeleteConfirm(true);
    } else {
      try {
        Alert.alert(
          'Delete account',
          'Are you sure you want to delete your account? This action cannot be undone. Your account and all associated data (matches, messages, etc.) will be permanently removed from the database.',
          [
            { 
              text: 'Cancel', 
              style: 'cancel'
            },
            { 
              text: 'Yes, delete it', 
              style: 'destructive', 
              onPress: async () => {
                try {
                  await deleteAccount();
                } catch (err) {
                  // Error is already handled in deleteAccount
                }
              }
            },
          ],
          { cancelable: true }
        );
      } catch (error) {
        // Fallback: use Modal
        setShowDeleteConfirm(true);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteAccount();
    } catch (err) {
      // Error is already handled in deleteAccount
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorMessage = await extractError(response);
        throw new Error(errorMessage);
      }

      // Account deleted successfully - logout and navigate to login
      await logout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to delete the account right now.';
      
      Alert.alert(
        'Delete failed',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // If session is invalid, force logout
              if (err instanceof Error && err.message.toLowerCase().includes('session')) {
                logout().catch(() => undefined);
              }
            }
          }
        ]
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* Profile Avatar */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {allPhotos.length > 0 && allPhotos[0] ? (
                <Image 
                  source={{ uri: allPhotos[0] }} 
                  style={styles.avatar}
                  resizeMode="cover"
                  fadeDuration={150}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={40} color={cupidTheme.colors.border} />
                </View>
              )}
            </View>
            <View style={styles.profileHeaderText}>
              <Text style={styles.heading}>Profile & Settings</Text>
              <Text style={styles.copy}>You are signed in as {user?.email ?? user?.phoneNumber ?? 'unknown user'}.</Text>
            </View>
          </View>

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
              <Detail label="Instagram handle" value={profile.instagramHandle ? `@${profile.instagramHandle}` : 'Not set'} />
              <View style={styles.bioBlock}>
                <Text style={styles.metaLabel}>Bio</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={handleEdit} disabled={!profile}>
              <Text style={styles.secondaryButtonLabel}>Edit profile</Text>
            </Pressable>
            <Pressable 
              style={[styles.button, deleting && styles.buttonDisabled]} 
              onPress={() => {
                if (!deleting) {
                  confirmDeleteAccount();
                }
              }} 
              disabled={deleting}
              accessibilityLabel="Delete account"
              accessibilityRole="button"
            >
              <Text style={styles.buttonLabel}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete your account? This action cannot be undone. Your account and all associated data (matches, messages, etc.) will be permanently removed from the database.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={handleDeleteCancel}>
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDeleteButton} onPress={handleDeleteConfirm}>
                <Text style={styles.modalDeleteLabel}>Yes, delete it</Text>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: cupidTheme.colors.accentSoft,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeaderText: {
    flex: 1,
    gap: 4,
  },
  heading: {
    fontSize: 26,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.4,
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
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    ...cardShadow('floating'),
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: cupidTheme.colors.borderSubtle,
  },
  buttonLabel: {
    color: cupidTheme.colors.surface,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  secondaryButton: {
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.accent,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surface,
    minHeight: 50,
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
  },
  errorState: {
    gap: 12,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.error,
  },
  errorText: {
    color: cupidTheme.colors.error,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: cupidTheme.colors.surface,
    borderRadius: cupidTheme.radii.xl,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    ...cardShadow('floating'),
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: 15,
    color: cupidTheme.colors.textSecondary,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.borderSubtle,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surfaceMuted,
    minHeight: 50,
    justifyContent: 'center',
  },
  modalCancelLabel: {
    color: cupidTheme.colors.textPrimary,
    fontWeight: '700',
  },
  modalDeleteButton: {
    flex: 1,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.error,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  modalDeleteLabel: {
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
