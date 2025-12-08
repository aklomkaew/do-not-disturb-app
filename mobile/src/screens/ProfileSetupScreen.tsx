import { ScreenContainer } from '@/components/ScreenContainer';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const genders = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] as const;
const statuses = ['SINGLE', 'OPEN', 'COMPLICATED', 'TAKEN'] as const;

type Gender = (typeof genders)[number];
type Status = (typeof statuses)[number];

export function ProfileSetupScreen() {
  const api = useApiClient();
  const { setProfileStatus, user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [relationshipStatus, setRelationshipStatus] = useState<Status>('SINGLE');
  const [age, setAge] = useState('25');
  const [bio, setBio] = useState('');
  const [mediaUrl, setMediaUrl] = useState('https://picsum.photos/400');
  const [isSaving, setIsSaving] = useState(false);

  function updateGender(value: Gender) {
    setGender(value);
  }

  async function handleSubmit() {
    try {
      setIsSaving(true);
      const payload = {
        displayName: displayName || user?.email.split('@')[0] || 'Anonymous',
        gender,
        age: Number(age) || 25,
        relationshipStatus,
        bio: bio || 'Excited to try Do Not Disturb!',
        media: [mediaUrl],
        preferences: {
          ageMin: 21,
          ageMax: 40,
          showGenders: ['FEMALE', 'MALE'],
        },
      };

      const response = await api.post('/api/profile', payload);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to create profile');
      }

      setProfileStatus('complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Create your profile</Text>
        <Text style={styles.copy}>Fill in the basics so you can start swiping.</Text>

        <Text style={styles.label}>Display Name</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Jordan" />

        <Text style={styles.label}>Age</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.row}>{genders.map((g) => <Chip key={g} label={g} active={gender === g} onPress={() => updateGender(g)} />)}</View>

        <Text style={styles.label}>Relationship Status</Text>
        <View style={styles.row}>
          {statuses.map((status) => (
            <Chip key={status} label={status} active={relationshipStatus === status} onPress={() => setRelationshipStatus(status)} />
          ))}
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} multiline numberOfLines={4} />

        <Text style={styles.label}>Photo URL</Text>
        <TextInput style={styles.input} value={mediaUrl} onChangeText={setMediaUrl} />

        <TouchableOpacity style={styles.cta} onPress={handleSubmit} disabled={isSaving}>
          <Text style={styles.ctaText}>{isSaving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 12,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  copy: {
    color: '#9CA3AF',
  },
  label: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#272934',
    borderRadius: 12,
    padding: 12,
    color: '#F9FAFB',
  },
  multiline: {
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#272934',
  },
  chipActive: {
    backgroundColor: '#F472B6',
    borderColor: '#F472B6',
  },
  chipText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0B0B0D',
  },
  cta: {
    marginTop: 16,
    backgroundColor: '#F472B6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0B0B0D',
    fontWeight: '700',
    fontSize: 16,
  },
});
