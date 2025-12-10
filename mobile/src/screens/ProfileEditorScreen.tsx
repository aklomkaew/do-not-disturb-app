import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Modal, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/utils/uploadImage';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { updatePreferredName } from '@/hooks/usePreferredName';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'ProfileEditor'>;
type Route = RouteProp<AuthStackParamList, 'ProfileEditor'>;

const genderOptions = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] as const;
const relationshipOptions = ['SINGLE', 'OPEN', 'COMPLICATED', 'TAKEN'] as const;

export function ProfileEditorScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { accessToken } = useAuth();

  const [displayName, setDisplayName] = useState(route.params.profile.displayName);
  const [age, setAge] = useState(String(route.params.profile.age ?? ''));
  const [gender, setGender] = useState(route.params.profile.gender);
  const [relationshipStatus, setRelationshipStatus] = useState(route.params.profile.relationshipStatus);
  const [bio, setBio] = useState(route.params.profile.bio ?? '');
  const [instagramHandle, setInstagramHandle] = useState(route.params.profile.instagramHandle ?? '');
  const [notifyMatches, setNotifyMatches] = useState(route.params.profile.matchNotificationsEnabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(route.params.profile.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

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
      const uploads = [];
      for (const uri of selected) {
        uploads.push(uploadImage(uri));
      }
      const uploaded = await Promise.all(uploads);
      setPhotos((prev) => Array.from(new Set([...prev, ...uploaded])).slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!accessToken) {
        throw new Error('Session expired. Please log in again.');
      }
      setSubmitting(true);
      setError(null);

      const payload: Record<string, unknown> = {
        displayName: displayName.trim(),
        gender,
        relationshipStatus,
        bio: bio.trim(),
        instagramHandle: instagramHandle.trim().replace(/^@/, '') || null,
        matchNotificationsEnabled: notifyMatches,
        media: { photos },
      };

      if (age.trim().length > 0) {
        payload.age = Number(age);
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await extractError(response));
      }

      if (payload.displayName) {
        updatePreferredName(String(payload.displayName));
      }

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = () => {
    setConfirmingCancel(true);
  };

  const handleDiscardChanges = () => {
    setConfirmingCancel(false);
    navigation.goBack();
  };

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Edit profile</Text>
        <Text style={styles.subheading}>Update your basic details anytime.</Text>
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={18} color={cupidTheme.colors.accent} />
          <Text style={styles.tipCopy}>Profiles with 3+ photos and detailed bios see 2.4× more matches.</Text>
        </View>

        <Text style={styles.label}>Photos (first is your profile picture)</Text>
        <Text style={styles.helper}>{uploading ? 'Uploading...' : 'Add up to 5 (3 recommended).'}</Text>
        <View style={styles.photoRow}>
          {photos.map((uri, idx) => (
            <View key={uri} style={styles.photoItem}>
              <Image source={{ uri }} style={styles.photo} />
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

        <Text style={styles.label}>Instagram handle</Text>
        <TextInput
          style={styles.input}
          value={instagramHandle}
          onChangeText={setInstagramHandle}
          placeholder="@yourhandle"
          placeholderTextColor={cupidTheme.colors.textMuted}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Three adjectives, your interests, and why someone should date you."
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

        <View style={styles.buttonRow}>
          <Pressable style={styles.cancelButton} onPress={confirmCancel} disabled={submitting}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSave} disabled={submitting}>
            {submitting ? <ActivityIndicator color={cupidTheme.colors.surface} /> : <Text style={styles.buttonLabel}>Save changes</Text>}
          </Pressable>
        </View>
      </ScrollView>
      <Modal visible={confirmingCancel} transparent animationType="fade" onRequestClose={() => setConfirmingCancel(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Discard changes?</Text>
            <Text style={styles.modalCopy}>If you leave now, any edits you made will be lost.</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalSecondary} onPress={() => setConfirmingCancel(false)}>
                <Text style={styles.modalSecondaryLabel}>Keep editing</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={handleDiscardChanges}>
                <Text style={styles.modalPrimaryLabel}>Discard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  tipCopy: {
    color: cupidTheme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  cancelLabel: {
    color: cupidTheme.colors.textSecondary,
    fontWeight: '700',
  },
  button: {
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    padding: 24,
    gap: 12,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
    backgroundColor: cupidTheme.colors.accent,
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
