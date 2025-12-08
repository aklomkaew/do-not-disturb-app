import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            editable={!submitting}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="27"
            placeholderTextColor="#6B7280"
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
            placeholderTextColor="#6B7280"
            editable={!submitting}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Share what makes you tick, your boundaries, or your perfect Do Not Disturb day."
            placeholderTextColor="#6B7280"
            editable={!submitting}
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#0B0B0D" /> : <Text style={styles.buttonLabel}>Save & continue</Text>}
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
    gap: 16,
    paddingBottom: 48,
  },
  hero: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#111827',
    gap: 10,
  },
  kicker: {
    color: '#F472B6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
  },
  copy: {
    color: '#D1D5DB',
    lineHeight: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
  },
  label: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0D0F15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F9FAFB',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2D303E',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionButtonActive: {
    backgroundColor: '#F472B6',
    borderColor: '#F472B6',
  },
  optionLabel: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  optionLabelActive: {
    color: '#0B0B0D',
  },
  error: {
    color: '#FCA5A5',
  },
  button: {
    backgroundColor: '#F472B6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#0B0B0D',
    fontWeight: '700',
    fontSize: 16,
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
