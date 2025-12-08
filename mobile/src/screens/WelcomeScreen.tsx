import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function WelcomeScreen() {
  const { user } = useAuth();
  const { status, timestamp } = useHealthCheck();
  const [profileStatus, setProfileStatus] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  const displayNameFallback = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    if (user?.phoneNumber) {
      return `User ${user.phoneNumber.slice(-4)}`;
    }
    return `User ${user?.id.slice(0, 6)}`;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const userId = user.id;

    async function ensureProfile() {
      try {
        setProfileStatus('creating');
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/profile/bootstrap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            displayName: displayNameFallback,
          }),
        });

        if (!response.ok) {
          throw new Error(await extractError(response));
        }

        if (!cancelled) {
          setProfileStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setProfileStatus('error');
          setError(err instanceof Error ? err.message : 'Failed to create profile');
        }
      }
    }

    ensureProfile();
    return () => {
      cancelled = true;
    };
  }, [displayNameFallback, user]);

  return (
    <ScreenContainer>
      <StatusBanner status={status} timestamp={timestamp} />

      <View style={styles.hero}>
        <Text style={styles.kicker}>You're in 🎉</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.copy}>
          Logged in as {user?.email ?? user?.phoneNumber ?? 'mystery guest'}. Head to the tabs below to start swiping, check matches,
          or finish setting up your profile.
        </Text>
      </View>

      <ProfileStatusBadge status={profileStatus} error={error} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account snapshot</Text>
        <View style={styles.meta}>
          <Meta label="User ID" value={user?.id} />
          <Meta label="Role" value={user?.role ?? 'USER'} />
          <Meta label="Allowlisted" value={user?.allowlisted ? 'Yes' : 'No'} />
        </View>
      </View>

      <View style={styles.callouts}>
        <Callout title="Next steps" body="Finish onboarding in Profile, then explore Swipe and Matches anytime." />
        <Callout title="Need texting?" body="Phone login works once SMS providers are connected. Use email OTP in the meantime." />
      </View>

      <Pressable
        style={[styles.cta, profileStatus !== 'ready' && styles.ctaDisabled]}
        disabled={profileStatus !== 'ready'}
        onPress={() => navigation.navigate('Swipe' as never)}
      >
        {profileStatus === 'creating' ? (
          <ActivityIndicator color="#0B0B0D" />
        ) : (
          <Text style={styles.ctaLabel}>Start exploring</Text>
        )}
      </Pressable>
    </ScreenContainer>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value ?? '—'}</Text>
    </View>
  );
}

function Callout({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutTitle}>{title}</Text>
      <Text style={styles.calloutBody}>{body}</Text>
    </View>
  );
}

function ProfileStatusBadge({ status, error }: { status: 'idle' | 'creating' | 'ready' | 'error'; error: string | null }) {
  let label = 'Preparing profile...';
  let badgeColor = '#FBBF24';

  if (status === 'ready') {
    label = 'Profile ready';
    badgeColor = '#34D399';
  } else if (status === 'error') {
    label = error ?? 'Profile setup failed';
    badgeColor = '#F87171';
  }

  return (
    <View style={[styles.statusBadge, { borderColor: badgeColor }]}>
      <Text style={[styles.statusLabel, { color: badgeColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 4,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#111827',
  },
  kicker: {
    color: '#F472B6',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  copy: {
    marginTop: 8,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  card: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
  },
  cardTitle: {
    color: '#F3F4F6',
    fontWeight: '600',
    fontSize: 16,
  },
  meta: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  metaValue: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '600',
  },
  callouts: {
    marginTop: 16,
    gap: 12,
  },
  callout: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#0D0F15',
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 6,
  },
  calloutTitle: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 15,
  },
  calloutBody: {
    color: '#9CA3AF',
    lineHeight: 18,
  },
  cta: {
    marginTop: 16,
    backgroundColor: '#F472B6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    color: '#0B0B0D',
    fontWeight: '700',
    fontSize: 16,
  },
  statusBadge: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  statusLabel: {
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
