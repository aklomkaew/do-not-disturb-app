import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { LocationPicker } from '@/components/LocationPicker';
import { FunQuestions, type FunQuestionsAnswers } from '@/components/FunQuestions';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, InteractionManager, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { DraggablePhotoRow } from '@/components/DraggablePhotoRow';
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
  const [location, setLocation] = useState<string | null>(null);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [bio, setBio] = useState('');
  const [funQuestions, setFunQuestions] = useState<FunQuestionsAnswers>({});
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const originalPhotoOrderRef = useRef<string[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [optimizeOrderLoading, setOptimizeOrderLoading] = useState(false);

  useEffect(() => {
    if (photos.length === 0) {
      originalPhotoOrderRef.current = null;
    } else if (originalPhotoOrderRef.current === null) {
      originalPhotoOrderRef.current = photos.map((p) => p.path);
    }
  }, [photos]);
  const [bioSuggestions, setBioSuggestions] = useState<string[] | null>(null);
  const [bioBeforeSuggestions, setBioBeforeSuggestions] = useState<string | null>(null);
  const [bioLoading, setBioLoading] = useState(false);

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

  const handleRemovePhoto = (path: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.path !== path));
  };

  const handleImproveBio = async () => {
    if (!bio.trim() || bioLoading) return;
    try {
      setBioLoading(true);
      setBioSuggestions(null);
      setBioBeforeSuggestions(bio.trim());
      setError(null);
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/ai/rewrite-bio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio: bio.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to get suggestions');
      setBioSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not improve bio');
    } finally {
      setBioLoading(false);
    }
  };

  const handleOptimizePhotoOrder = async () => {
    if (photos.length < 2 || submitting || uploading) return;
    try {
      setOptimizeOrderLoading(true);
      setError(null);
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/ai/suggest-photo-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoPaths: photos.map((p) => p.path) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to get order');
      const ordered = data.orderedPaths as string[];
      if (Array.isArray(ordered) && ordered.length === photos.length) {
        const reordered = ordered
          .map((path) => photos.find((p) => p.path === path))
          .filter((p): p is PhotoEntry => !!p);
        if (reordered.length === photos.length) {
          setPhotos(reordered);
          await new Promise<void>((resolve) => {
            InteractionManager.runAfterInteractions(() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => setTimeout(resolve, 150));
              });
            });
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not optimize photo order');
    } finally {
      setOptimizeOrderLoading(false);
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
        body: JSON.stringify((() => {
          // Clean funQuestions - remove undefined values, null, and empty arrays/strings
          const cleanedFunQuestions: Record<string, unknown> = {};
          Object.entries(funQuestions).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            
            if (Array.isArray(value)) {
              const filtered = value.filter(v => v !== undefined && v !== null && v !== '');
              if (filtered.length > 0) {
                cleanedFunQuestions[key] = filtered;
              }
            } else if (typeof value === 'string') {
              const trimmed = value.trim();
              if (trimmed.length > 0) {
                cleanedFunQuestions[key] = trimmed;
              }
            } else if (value !== '') {
              cleanedFunQuestions[key] = value;
            }
          });

          const payload: Record<string, unknown> = {
            displayName: displayName.trim(),
            age: parsedAge,
            gender,
            relationshipStatus,
            location: location?.trim() || null,
            instagramHandle: instagramHandle.trim() || null,
            bio: bio.trim(),
            matchNotificationsEnabled: notifyMatches,
            media: { photos: photos.map((photo) => photo.path) },
          };

          // Only include preferences if we have at least one valid fun question answer
          if (Object.keys(cleanedFunQuestions).length > 0) {
            payload.preferences = { funQuestions: cleanedFunQuestions };
          }

          return payload;
        })()),
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
      <NestableScrollContainer
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <StatusBanner status={status} timestamp={timestamp} />
        <View style={styles.hero}>
          <Text style={styles.kicker}>Create your profile</Text>
          <Text style={styles.title}>Tell the community who you are.</Text>
          <Text style={styles.copy}>Thoughtful answers help us match you with people who share your priorities.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Photos {photos.length === 0 && <Text style={{ color: cupidTheme.colors.error }}>*</Text>}</Text>
            {photos.length > 0 && (
              <Text style={styles.photoCount}>{photos.length}/5</Text>
            )}
          </View>
          {photos.length >= 2 && (
            <View style={styles.photoOrderActions}>
              <Pressable
                style={[styles.aiButton, (submitting || uploading || optimizeOrderLoading) && styles.aiButtonDisabled]}
                onPress={handleOptimizePhotoOrder}
                disabled={submitting || uploading || optimizeOrderLoading}
              >
                {optimizeOrderLoading ? (
                  <ActivityIndicator size="small" color={cupidTheme.colors.accent} />
                ) : (
                  <Text style={styles.aiButtonLabel}>✨ Optimize order</Text>
                )}
              </Pressable>
              {originalPhotoOrderRef.current != null &&
                photos.map((p) => p.path).join(',') !== originalPhotoOrderRef.current.join(',') && (
                  <Pressable
                    style={[styles.revertButton, (submitting || uploading) && styles.aiButtonDisabled]}
                    onPress={() => {
                      const original = originalPhotoOrderRef.current ?? [];
                      const photoMap = new Map(photos.map((p) => [p.path, p]));
                      const reordered: PhotoEntry[] = [];
                      for (const path of original) {
                        const entry = photoMap.get(path);
                        if (entry) reordered.push(entry);
                      }
                      for (const p of photos) {
                        if (!original.includes(p.path)) reordered.push(p);
                      }
                      setPhotos([...reordered]);
                    }}
                    disabled={submitting || uploading}
                  >
                    <Text style={styles.revertButtonLabel}>↩ Revert to original</Text>
                  </Pressable>
                )}
            </View>
          )}
          <Text style={styles.helper}>
            {uploading 
              ? 'Uploading photos...' 
              : photos.length === 0
              ? 'Add at least one photo to get started. Your first photo will be your profile picture.'
              : 'Your first photo is your profile picture. Add up to 5 photos total (3 recommended for best results).'}
          </Text>
          <DraggablePhotoRow
            photos={photos}
            onReorder={setPhotos}
            onRemove={handleRemovePhoto}
            onAdd={pickPhotos}
            disabled={submitting || uploading}
            canAdd={photos.length < 5}
          />
          {photos.length === 0 && (
            <Text style={styles.photoWarning}>At least one photo is required to create your profile.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Display name <Text style={{ color: cupidTheme.colors.error }}>*</Text></Text>
          <Text style={styles.helper}>This is how others will see you on the app.</Text>
          <TextInput
            style={[styles.input, displayName.trim().length > 0 && displayName.trim().length < 2 && styles.inputError]}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (error && error.includes('Display name')) setError(null);
            }}
            placeholder="Alex"
            placeholderTextColor={cupidTheme.colors.textMuted}
            autoCapitalize="words"
            editable={!submitting}
            maxLength={30}
          />
          {displayName.trim().length > 0 && displayName.trim().length < 2 && (
            <Text style={styles.fieldError}>Display name must be at least 2 characters</Text>
          )}

          <Text style={styles.label}>Age <Text style={{ color: cupidTheme.colors.error }}>*</Text></Text>
          <Text style={styles.helper}>You must be 18 or older to join.</Text>
          <TextInput
            style={[styles.input, age.length > 0 && (!Number.isFinite(Number(age)) || Number(age) < 18) && styles.inputError]}
            value={age}
            onChangeText={(text) => {
              // Only allow numbers
              const numericText = text.replace(/[^0-9]/g, '');
              setAge(numericText);
              if (error && error.includes('age')) setError(null);
            }}
            placeholder="27"
            placeholderTextColor={cupidTheme.colors.textMuted}
            keyboardType="number-pad"
            editable={!submitting}
            maxLength={3}
          />
          {age.length > 0 && (!Number.isFinite(Number(age)) || Number(age) < 18) && (
            <Text style={styles.fieldError}>You must be at least 18 to join</Text>
          )}

          <Text style={styles.label}>Gender</Text>
          <OptionGroup options={genderOptions} value={gender} onChange={setGender} disabled={submitting} />

          <Text style={styles.label}>Relationship status</Text>
          <OptionGroup options={relationshipOptions} value={relationshipStatus} onChange={setRelationshipStatus} disabled={submitting} />

          <Text style={styles.label}>Location</Text>
          <Text style={styles.helper}>Optional. Select your NYC neighborhood.</Text>
          <LocationPicker value={location} onChange={setLocation} disabled={submitting} />

          <Text style={styles.label}>Instagram handle</Text>
          <Text style={styles.helper}>Optional. Share your Instagram to help others connect with you.</Text>
          <View style={styles.instagramContainer} pointerEvents="box-none">
            <Text style={styles.instagramPrefix}>@</Text>
            <TextInput
              style={[styles.input, styles.instagramInput]}
              value={instagramHandle}
              onChangeText={(text) => {
                // Remove @ if user tries to add it, we'll add it automatically
                const cleaned = text.replace(/^@+/, '');
                setInstagramHandle(cleaned);
              }}
              placeholder="username"
              placeholderTextColor={cupidTheme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              keyboardType="default"
              maxLength={30}
            />
          </View>

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

          <Text style={styles.label}>Bio <Text style={{ color: cupidTheme.colors.error }}>*</Text></Text>
          <View style={styles.bioHeader}>
            <Text style={styles.helper}>Tell others about yourself. What makes you unique?</Text>
            {bio.trim().length > 0 && (
              <Text style={styles.charCount}>{bio.trim().length}/500</Text>
            )}
          </View>
          <Pressable
            style={[styles.aiButton, (bio.length < 10 || bioLoading || submitting) && styles.aiButtonDisabled]}
            onPress={handleImproveBio}
            disabled={bio.length < 10 || bioLoading || submitting}
          >
            {bioLoading ? (
              <ActivityIndicator size="small" color={cupidTheme.colors.accent} />
            ) : (
              <Text style={styles.aiButtonLabel}>✨ Improve with AI</Text>
            )}
          </Pressable>
          <TextInput
            style={[styles.input, styles.textArea, bio.trim().length > 0 && bio.trim().length < 20 && styles.inputError]}
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              setBioSuggestions(null);
              setBioBeforeSuggestions(null);
              if (error && error.includes('bio')) setError(null);
            }}
            placeholder="Share your interests, what you're looking for, or what makes you special. Be authentic!"
            placeholderTextColor={cupidTheme.colors.textMuted}
            editable={!submitting}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          {bio.trim().length > 0 && bio.trim().length < 20 && (
            <Text style={styles.fieldError}>Please write at least 20 characters to help others get to know you</Text>
          )}
          {bioSuggestions && bioSuggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              <Text style={styles.suggestionsTitle}>AI suggestions</Text>
              {bioSuggestions.map((s: string, i: number) => (
                <Pressable
                  key={i}
                  style={styles.suggestionItem}
                  onPress={() => { setBio(s); setBioSuggestions(null); }}
                >
                  <Text style={styles.suggestionText} numberOfLines={4}>{s}</Text>
                  <Text style={styles.suggestionUse}>Use this →</Text>
                </Pressable>
              ))}
              <View style={styles.suggestionActions}>
                {bioBeforeSuggestions != null && (
                  <Pressable
                    style={styles.revertButton}
                    onPress={() => { setBio(bioBeforeSuggestions); setBioSuggestions(null); setBioBeforeSuggestions(null); }}
                  >
                    <Text style={styles.revertButtonLabel}>↩ Revert to original</Text>
                  </Pressable>
                )}
                <Pressable style={styles.suggestionDismiss} onPress={() => { setBioSuggestions(null); }}>
                  <Text style={styles.suggestionDismissLabel}>Dismiss</Text>
                </Pressable>
              </View>
            </View>
          )}
          {bioBeforeSuggestions != null && bio !== bioBeforeSuggestions && !bioSuggestions?.length && (
            <Pressable
              style={styles.revertButtonStandalone}
              onPress={() => { setBio(bioBeforeSuggestions); setBioBeforeSuggestions(null); }}
            >
              <Text style={styles.revertButtonLabel}>↩ Revert to original</Text>
            </Pressable>
          )}

          <FunQuestions 
            answers={funQuestions} 
            onChange={setFunQuestions}
            disabled={submitting}
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <Pressable 
            style={[styles.button, (submitting || photos.length === 0) && styles.buttonDisabled]} 
            onPress={handleSubmit} 
            disabled={submitting || photos.length === 0}
            accessibilityLabel="Save and continue"
            accessibilityHint="Saves your profile and continues to the main app"
          >
            {submitting ? (
              <ActivityIndicator color={cupidTheme.colors.surface} />
            ) : (
              <Text style={styles.buttonLabel}>
                {photos.length === 0 ? 'Add a photo to continue' : 'Save & continue'}
              </Text>
            )}
          </Pressable>
        </View>
      </NestableScrollContainer>
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
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderRadius: cupidTheme.radii.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: cupidTheme.colors.textPrimary,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.border,
    minHeight: 50,
  },
  textArea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  photoItem: {
    width: 96,
    height: 120,
    borderRadius: cupidTheme.radii.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.border,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: cupidTheme.colors.surfaceMuted,
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
    textAlign: 'center',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  photoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    letterSpacing: 0.3,
  },
  photoAdd: {
    width: 96,
    height: 120,
    borderRadius: cupidTheme.radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cupidTheme.colors.accent,
    backgroundColor: cupidTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  helper: {
    color: cupidTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    marginTop: -4,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoCount: {
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  photoWarning: {
    color: cupidTheme.colors.error,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  photoAddDisabled: {
    opacity: 0.5,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  charCount: {
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  inputError: {
    borderColor: cupidTheme.colors.error,
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    color: cupidTheme.colors.error,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 16,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: cupidTheme.radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.error,
    marginTop: 4,
  },
  error: {
    color: cupidTheme.colors.error,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  button: {
    backgroundColor: cupidTheme.colors.accent,
    borderRadius: cupidTheme.radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
  aiButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.accentSoft,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  aiButtonLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  suggestionsBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    gap: 10,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  suggestionItem: {
    padding: 12,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  suggestionText: {
    fontSize: 14,
    color: cupidTheme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestionUse: {
    fontSize: 12,
    fontWeight: '700',
    color: cupidTheme.colors.accent,
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  photoOrderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  revertButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
  },
  revertButtonStandalone: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
  },
  revertButtonLabel: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionDismiss: {
    paddingVertical: 6,
  },
  suggestionDismissLabel: {
    color: cupidTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
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