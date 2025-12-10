import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/utils/uploadImage';
import { PhotoEntry, mergePhotoEntries, partitionSupportedAssets } from '@/utils/photoHelpers';
import { cupidTheme, cardShadow } from '@/constants/theme';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'CreateProfile'>;
type Route = RouteProp<AuthStackParamList, 'CreateProfile'>;

const genderOptions = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] as const;
const relationshipOptions = ['SINGLE', 'OPEN', 'COMPLICATED', 'TAKEN'] as const;

export function CreateProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { status, timestamp } = useHealthCheck();
  const { getAccessToken } = useAuth();
  const [displayName, setDisplayName] = useState(route.params.initialDisplayName);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<typeof genderOptions[number]>('OTHER');
  const [relationshipStatus, setRelationshipStatus] = useState<typeof relationshipOptions[number]>('SINGLE');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [uploading, setUploading] = useState(false);

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
      const entries = uploaded;
      setPhotos((prev) => mergePhotoEntries(prev, entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < 18) {
      setError('You must be at least 18 to join.');
      return;
    }

    if (bio.trim().length < 20) {
      setError('Tell us a bit more in your bio (20+ characters).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/profile/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          age: parsedAge,
          gender,
          relationshipStatus,
          location: location.trim(),
          bio: bio.trim(),
          matchNotificationsEnabled: notifyMatches,
          media: { photos: photos.map((photo) => photo.path) },
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
    <ScreenContainer scrollable={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBanner status={status} timestamp={timestamp} />
        <View style={styles.hero}>
          <Text style={styles.kicker}>Create your profile</Text>
          <Text style={styles.title}>Tell the community who you are.</Text>
          <Text style={styles.copy}>Thoughtful answers help us match you with people who share your priorities.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Photos (first is your profile picture)</Text>
          <Text style={styles.helper}>{uploading ? 'Uploading...' : 'Add up to 5 (3 recommended).'}</Text>
          <View style={styles.photoRow}>
            {photos.map((photo, idx) => (
              <View key={photo.path} style={styles.photoItem}>
                <Image source={{ uri: photo.url ?? photo.path }} style={styles.photo} />
                <Pressable style={styles.photoRemove} onPress={() => handleRemovePhoto(photo.path)} accessibilityLabel="Remove photo">
                  <Text style={styles.photoRemoveLabel}>×</Text>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Alex"
            placeholderTextColor={cupidTheme.colors.textMuted}
            autoCapitalize="words"
            editable={!submitting}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="27"
            placeholderTextColor={cupidTheme.colors.textMuted}
            keyboardType="number-pad"
            editable={!submitting}
          />

          <Text style={styles.label}>Gender</Text>
          <OptionGroup options={genderOptions} value={gender} onChange={setGender} disabled={submitting} />

          <Text style={styles.label}>Relationship status</Text>
          <OptionGroup options={relationshipOptions} value={relationshipStatus} onChange={setRelationshipStatus} disabled={submitting} />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, Country"
            placeholderTextColor={cupidTheme.colors.textMuted}
            editable={!submitting}
          />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Match notifications</Text>
              <Text style={styles.copy}>Get notified when someone matches with you.</Text>
            </View>
            <Switch
              value={notifyMatches}
              onValueChange={setNotifyMatches}
              disabled={submitting}
              trackColor={{ false: cupidTheme.colors.borderSubtle, true: cupidTheme.colors.accentSoft }}
              thumbColor={notifyMatches ? cupidTheme.colors.accent : '#FFFFFF'}
            />
          </View>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Share what makes you tick, your boundaries, or your perfect Do Not Disturb day."
            placeholderTextColor={cupidTheme.colors.textMuted}
            editable={!submitting}
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={cupidTheme.colors.surface} /> : <Text style={styles.buttonLabel}>Save & continue</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function OptionGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly T[];
  value: string;
  onChange: (val: T) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.optionGroup}>
      {options.map((option) => (
        <Pressable
          key={option}
          style={[styles.optionButton, value === option && styles.optionButtonActive]}
          onPress={() => !disabled && onChange(option)}
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
    gap: 18,
    paddingBottom: 48,
  },
  hero: {
    padding: 24,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 10,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  kicker: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: cupidTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    padding: 22,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    gap: 14,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
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
    minHeight: 140,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: 96,
    height: 120,
    borderRadius: 14,
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
    borderRadius: 14,
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
  helper: {
    color: cupidTheme.colors.textMuted,
    marginBottom: 8,
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
    backgroundColor: cupidTheme.colors.surfaceMuted,
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
    backgroundColor: cupidTheme.colors.accent,
    borderRadius: cupidTheme.radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
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
