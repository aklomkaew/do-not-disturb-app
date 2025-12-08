import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'CreateProfile'>;
type Route = RouteProp<AuthStackParamList, 'CreateProfile'>;

const genderOptions = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] as const;
const relationshipOptions = ['SINGLE', 'OPEN', 'COMPLICATED', 'TAKEN'] as const;

export function CreateProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { status, timestamp } = useHealthCheck();
  const { accessToken } = useAuth();
  const [displayName, setDisplayName] = useState(route.params.initialDisplayName);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<typeof genderOptions[number]>('OTHER');
  const [relationshipStatus, setRelationshipStatus] = useState<typeof relationshipOptions[number]>('SINGLE');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!accessToken) {
        throw new Error('Session expired. Please log in again.');
      }
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/profile/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          age: parsedAge,
          gender,
          relationshipStatus,
          location: location.trim(),
          bio: bio.trim(),
          matchNotificationsEnabled: notifyMatches,
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
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBanner status={status} timestamp={timestamp} />
        <View style={styles.hero}>
          <Text style={styles.kicker}>Create your profile</Text>
          <Text style={styles.title}>Tell the community who you are.</Text>
          <Text style={styles.copy}>Thoughtful answers help us match you with people who share your priorities.</Text>
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
