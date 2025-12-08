import { ScreenContainer } from '@/components/ScreenContainer';
import { API_BASE_URL } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useAuth } from '@/hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
          placeholderTextColor="#6B7280"
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="25"
          placeholderTextColor="#6B7280"
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
          placeholderTextColor="#6B7280"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Share a little about yourself"
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={4}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#0B0B0D" /> : <Text style={styles.buttonLabel}>Save changes</Text>}
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
    gap: 12,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subheading: {
    color: '#D1D5DB',
    marginBottom: 8,
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
    marginTop: 12,
    backgroundColor: '#F472B6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
