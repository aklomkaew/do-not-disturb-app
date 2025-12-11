import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState, useMemo } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/utils/uploadImage';
import { PhotoEntry, hydratePhotoEntries, mergePhotoEntries, partitionSupportedAssets } from '@/utils/photoHelpers';
import { cupidTheme, cardShadow } from '@/constants/theme';
import { updatePreferredName } from '@/hooks/usePreferredName';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'ProfileEditor'>;
type Route = RouteProp<AuthStackParamList, 'ProfileEditor'>;

const genderOptions = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] as const;
const relationshipOptions = ['SINGLE', 'OPEN', 'COMPLICATED', 'TAKEN'] as const;

export function ProfileEditorScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { getAccessToken } = useAuth();

  const initialProfile = route.params.profile;
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [age, setAge] = useState(String(initialProfile.age ?? ''));
  const [gender, setGender] = useState(initialProfile.gender);
  const [relationshipStatus, setRelationshipStatus] = useState(initialProfile.relationshipStatus);
  const [bio, setBio] = useState(initialProfile.bio ?? '');
  const [instagramHandle, setInstagramHandle] = useState(initialProfile.instagramHandle ?? '');
  const [notifyMatches, setNotifyMatches] = useState(initialProfile.matchNotificationsEnabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialPhotos = hydratePhotoEntries(initialProfile.photoPaths, initialProfile.photos);
  const [photos, setPhotos] = useState<PhotoEntry[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);

  // Track if changes were made
  const hasChanges = useMemo(() => {
    const initialAge = String(initialProfile.age ?? '');
    const initialPhotosPaths = initialPhotos.map((p) => p.path).sort().join(',');
    const currentPhotosPaths = photos.map((p) => p.path).sort().join(',');
    
    return (
      displayName.trim() !== initialProfile.displayName.trim() ||
      age.trim() !== initialAge.trim() ||
      gender !== initialProfile.gender ||
      relationshipStatus !== initialProfile.relationshipStatus ||
      bio.trim() !== (initialProfile.bio ?? '').trim() ||
      (instagramHandle.trim() !== (initialProfile.instagramHandle ?? '').trim()) ||
      notifyMatches !== initialProfile.matchNotificationsEnabled ||
      initialPhotosPaths !== currentPhotosPaths
    );
  }, [displayName, age, gender, relationshipStatus, bio, instagramHandle, notifyMatches, photos, initialProfile, initialPhotos]);

  const handleInstagramChange = (text: string) => {
    // Remove @ if user tries to add it, we'll add it automatically
    const cleaned = text.replace(/^@+/, '');
    console.log('Instagram handle input changed:', { original: text, cleaned, previousState: instagramHandle });
    setInstagramHandle(cleaned);
  };

  const handleCancel = () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Discard changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard changes', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const pickPhotos = async () => {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('We need access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (result.canceled) return;

    const assets = result.assets ?? [];
    const { supported, rejected } = partitionSupportedAssets(assets);
    if (rejected.length > 0) {
      setError(
        `Skipped ${rejected.length} unsupported file${rejected.length > 1 ? 's' : ''}. Only JPG, JPEG, PNG, and WEBP images are supported.`
      );
    }

    const selected = supported.map((asset) => asset.uri).filter(Boolean);
    if (selected.length === 0) return;

    try {
      setUploading(true);
      const token = await getAccessToken();
      const uploaded = await Promise.all(
        selected.map(async (uri) => {
          const { path, previewUrl } = await uploadImage({ assetUri: uri, accessToken: token });
          return { path, url: previewUrl ?? uri };
        })
      );
      setPhotos((prev) => mergePhotoEntries(prev, uploaded));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (path: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.path !== path));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const token = await getAccessToken();
      const payload: Record<string, unknown> = {
        displayName: displayName.trim(),
        gender,
        relationshipStatus,
        bio: bio.trim(),
        instagramHandle: instagramHandle.trim() || null,
        matchNotificationsEnabled: notifyMatches,
        media: { photos: photos.map((photo) => photo.path) },
      };
      
      console.log('Saving profile with payload:', JSON.stringify(payload, null, 2));
      console.log('Instagram handle being saved:', instagramHandle.trim() || null);

      if (age.trim().length > 0) {
        payload.age = Number(age);
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMsg = await extractError(response);
        console.error('Profile update failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const responseData = await response.json();
      console.log('Profile update successful, response:', JSON.stringify(responseData, null, 2));
      console.log('Instagram handle in response:', responseData?.profile?.instagramHandle);

      // Update preferred name cache for immediate UI updates
      updatePreferredName(displayName.trim());

      // Navigate back - this will trigger useFocusEffect in ProfileScreen to refresh
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Edit profile</Text>
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
        <Text style={styles.subheading}>Update your basic details anytime.</Text>

        <Text style={styles.label}>Photos (first is your profile picture)</Text>
        <Text style={styles.helper}>{uploading ? 'Uploading...' : 'Add up to 5 (3 recommended).'}</Text>
        <View style={styles.photoRow}>
          {photos.map((photo, idx) => {
            // Ensure we have a valid URL - use url if available, otherwise try path as URL, fallback to empty
            const photoUri = photo.url || (photo.path.startsWith('http') ? photo.path : null);
            return (
              <View key={photo.path} style={styles.photoItem}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Text style={styles.photoPlaceholderText}>Photo</Text>
                  </View>
                )}
                <Pressable style={styles.photoRemove} onPress={() => handleRemovePhoto(photo.path)} accessibilityLabel="Remove photo">
                  <Text style={styles.photoRemoveLabel}>×</Text>
                </Pressable>
                <Text style={styles.photoBadge}>{idx === 0 ? 'Profile' : `#${idx + 1}`}</Text>
              </View>
            );
          })}
          {photos.length < 5 ? (
            <Pressable style={styles.photoAdd} onPress={pickPhotos} disabled={submitting}>
              <Text style={styles.photoAddLabel}>+ Add</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          placeholderTextColor={cupidTheme.colors.textMuted}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="25"
          placeholderTextColor={cupidTheme.colors.textMuted}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Gender</Text>
        <OptionGroup options={genderOptions} value={gender} onChange={setGender} />

        <Text style={styles.label}>Relationship status</Text>
        <OptionGroup options={relationshipOptions} value={relationshipStatus} onChange={setRelationshipStatus} />

        <Text style={styles.label}>Instagram handle</Text>
        <View style={styles.instagramContainer} pointerEvents="box-none">
          <Text style={styles.instagramPrefix}>@</Text>
          <TextInput
            style={[styles.input, styles.instagramInput]}
            value={instagramHandle}
            onChangeText={handleInstagramChange}
            placeholder="username"
            placeholderTextColor={cupidTheme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            keyboardType="default"
          />
        </View>

        <Text style={styles.label}>Bio</Text>
        <Text style={styles.helper}>Share a little bit about yourself. 3 adjectives to describe yourself / interests, why should you date me, etc.</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Share a little bit about yourself. 3 adjectives to describe yourself / interests, why should you date me, etc."
          placeholderTextColor={cupidTheme.colors.textMuted}
          multiline
          numberOfLines={4}
        />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Match notifications</Text>
            <Text style={styles.subheading}>Get notified when someone matches with you.</Text>
          </View>
          <Switch
            value={notifyMatches}
            onValueChange={setNotifyMatches}
            disabled={submitting}
            trackColor={{ false: cupidTheme.colors.borderSubtle, true: cupidTheme.colors.accentSoft }}
            thumbColor={notifyMatches ? cupidTheme.colors.accent : '#FFFFFF'}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color={cupidTheme.colors.surface} /> : <Text style={styles.buttonLabel}>Save changes</Text>}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: string;
  onChange: (val: T) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      {options.map((option) => (
        <Pressable
          key={option}
          style={[styles.optionButton, value === option && styles.optionButtonActive]}
          onPress={() => onChange(option)}
        >
          <Text style={[styles.optionLabel, value === option && styles.optionLabelActive]}>{formatLabel(option)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function formatLabel(value: string) {
  return value.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 44,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    flex: 1,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  subheading: {
    color: cupidTheme.colors.textSecondary,
    marginBottom: 8,
  },
  instagramContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    paddingLeft: 18,
  },
  instagramPrefix: {
    color: cupidTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  instagramInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 4,
    paddingRight: 18,
    margin: 0,
    backgroundColor: 'transparent',
  },
  helper: {
    color: cupidTheme.colors.textMuted,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: cupidTheme.colors.textSecondary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderRadius: cupidTheme.radii.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: cupidTheme.colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
  },
  textArea: {
    minHeight: 130,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  photoItem: {
    width: 96,
    height: 120,
    borderRadius: cupidTheme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  photoRemoveLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: cupidTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  photoAdd: {
    width: 96,
    height: 120,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    backgroundColor: cupidTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderRadius: cupidTheme.radii.pill,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: cupidTheme.colors.surface,
  },
  optionButtonActive: {
    backgroundColor: cupidTheme.colors.accentSoft,
    borderColor: cupidTheme.colors.accent,
  },
  optionLabel: {
    color: cupidTheme.colors.textMuted,
    fontWeight: '700',
  },
  optionLabelActive: {
    color: cupidTheme.colors.textPrimary,
  },
  error: {
    color: cupidTheme.colors.error,
  },
  button: {
    marginTop: 16,
    backgroundColor: cupidTheme.colors.accent,
    borderRadius: cupidTheme.radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...cardShadow('floating'),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: cupidTheme.colors.surface,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.4,
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
