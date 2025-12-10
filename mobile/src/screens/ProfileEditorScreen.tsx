import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/utils/uploadImage';
import { PhotoEntry, hydratePhotoEntries, mergePhotoEntries } from '@/utils/photoHelpers';
import { cupidTheme, cardShadow } from '@/constants/theme';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'ProfileEditor'>;
type Route = RouteProp<AuthStackParamList, 'ProfileEditor'>;

const genderOptions = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] as const;
const relationshipOptions = ['SINGLE', 'OPEN', 'COMPLICATED', 'TAKEN'] as const;

export function ProfileEditorScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { getAccessToken } = useAuth();

  const [displayName, setDisplayName] = useState(route.params.profile.displayName);
  const [age, setAge] = useState(String(route.params.profile.age ?? ''));
  const [gender, setGender] = useState(route.params.profile.gender);
  const [relationshipStatus, setRelationshipStatus] = useState(route.params.profile.relationshipStatus);
  const [bio, setBio] = useState(route.params.profile.bio ?? '');
  const [location, setLocation] = useState(route.params.profile.location ?? '');
  const [notifyMatches, setNotifyMatches] = useState(route.params.profile.matchNotificationsEnabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialPhotos = hydratePhotoEntries(route.params.profile.photoPaths, route.params.profile.photos);
  const [photos, setPhotos] = useState<PhotoEntry[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);

  const pickPhotos = async () => {
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

    const selected = result.assets?.map((asset) => asset.uri).filter(Boolean) ?? [];
    if (selected.length === 0) return;

    try {
      setUploading(true);
      const token = await getAccessToken();
      const uploaded = await Promise.all(selected.map((uri) => uploadImage({ assetUri: uri, accessToken: token })));
      const entries = uploaded.map(({ path, previewUrl }) => ({ path, url: previewUrl }));
      setPhotos((prev) => mergePhotoEntries(prev, entries));
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
        location: location.trim(),
        matchNotificationsEnabled: notifyMatches,
        media: { photos: photos.map((photo) => photo.path) },
      };

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
        throw new Error(await extractError(response));
      }

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
        <Text style={styles.heading}>Edit profile</Text>
        <Text style={styles.subheading}>Update your basic details anytime.</Text>

        <Text style={styles.label}>Photos (first is your profile picture)</Text>
        <Text style={styles.helper}>{uploading ? 'Uploading...' : 'Add up to 5 (3 recommended).'}</Text>
        <View style={styles.photoRow}>
          {photos.map((photo, idx) => (
            <View key={photo.path} style={styles.photoItem}>
              <Image source={{ uri: photo.url ?? photo.path }} style={styles.photo} />
              <Pressable style={styles.photoRemove} onPress={() => handleRemovePhoto(photo.path)} accessibilityLabel="Remove photo">
                <Text style={styles.photoRemoveLabel}>×</Text>
              </Pressable>
              <Pressable style={styles.photoRemovePill} onPress={() => handleRemovePhoto(photo.path)}>
                <Text style={styles.photoRemovePillLabel}>Remove</Text>
              </Pressable>
              <Text style={styles.photoBadge}>{idx === 0 ? 'Profile' : `#${idx + 1}`}</Text>
            </View>
          ))}
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

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="City, Country"
          placeholderTextColor={cupidTheme.colors.textMuted}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Share a little about yourself"
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
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  subheading: {
    color: cupidTheme.colors.textSecondary,
    marginBottom: 8,
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
  photoRemovePill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoRemovePillLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
