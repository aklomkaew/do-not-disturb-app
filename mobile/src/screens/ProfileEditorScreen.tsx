import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

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
  const [location, setLocation] = useState(route.params.profile.location ?? '');
  const [notifyMatches, setNotifyMatches] = useState(route.params.profile.matchNotificationsEnabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        location: location.trim(),
        matchNotificationsEnabled: notifyMatches,
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

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Edit profile</Text>
        <Text style={styles.subheading}>Update your basic details anytime.</Text>

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
