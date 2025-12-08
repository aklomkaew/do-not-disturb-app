import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

export function WelcomeScreen() {
  const { user, accessToken } = useAuth();
  const { status, timestamp } = useHealthCheck();
  const [profileState, setProfileState] = useState<'checking' | 'missing' | 'exists' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const displayNameFallback = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    if (user?.phoneNumber) {
      return `User ${user.phoneNumber.slice(-4)}`;
    }
    return `User ${user?.id.slice(0, 6)}`;
  }, [user]);

  const checkProfile = useCallback(() => {
    if (!user || !accessToken) {
      setProfileState('error');
      setError('Session not found. Please log in again.');
      return;
    }

    let cancelled = false;
    setProfileState('checking');
    setError(null);

    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 404) {
          if (!cancelled) setProfileState('missing');
          return;
        }

        if (!response.ok) {
          throw new Error(await extractError(response));
        }

        if (!cancelled) setProfileState('exists');
      } catch (err) {
        if (!cancelled) {
          setProfileState('error');
          setError(err instanceof Error ? err.message : 'Failed to check profile status');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  useEffect(() => {
    const cancel = checkProfile();
    return () => {
      if (typeof cancel === 'function') {
        cancel();
      }
    };
  }, [checkProfile]);

  const handleContinue = () => {
    if (!user) return;

    if (profileState === 'missing') {
      navigation.navigate('CreateProfile', {
        initialDisplayName: displayNameFallback,
      });
    } else if (profileState === 'exists') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  const ctaLabel =
    profileState === 'missing'
      ? 'Create your account'
      : profileState === 'exists'
      ? 'Start exploring'
      : 'Checking...';

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

      <ProfileStatusBadge state={profileState} error={error} onRetry={checkProfile} />

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
        style={[styles.cta, (profileState === 'checking' || profileState === 'error') && styles.ctaDisabled]}
        disabled={profileState === 'checking' || profileState === 'error'}
        onPress={handleContinue}
      >
        {profileState === 'checking' ? <ActivityIndicator color={cupidTheme.colors.surface} /> : <Text style={styles.ctaLabel}>{ctaLabel}</Text>}
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

function ProfileStatusBadge({
  state,
  error,
  onRetry,
}: {
  state: 'checking' | 'missing' | 'exists' | 'error';
  error: string | null;
  onRetry: () => void;
}) {
  let label = 'Checking profile status...';
  let badgeColor = cupidTheme.colors.warning;

  if (state === 'missing') {
    label = 'No profile found. Create one to continue.';
  } else if (state === 'exists') {
    label = 'Profile ready';
    badgeColor = cupidTheme.colors.success;
  } else if (state === 'error') {
    label = error ?? 'Profile lookup failed';
    badgeColor = cupidTheme.colors.error;
  }

  return (
    <View style={[styles.statusBadge, { borderColor: badgeColor }]}>
      <Text style={[styles.statusLabel, { color: badgeColor }]}>{label}</Text>
      {state === 'error' ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    padding: 26,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  kicker: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  copy: {
    marginTop: 10,
    color: cupidTheme.colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    marginTop: 18,
    padding: 22,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    gap: 14,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  cardTitle: {
    color: cupidTheme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 17,
  },
  meta: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: cupidTheme.colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    color: cupidTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  callouts: {
    marginTop: 18,
    gap: 12,
  },
  callout: {
    padding: 18,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    gap: 6,
  },
  calloutTitle: {
    color: cupidTheme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  calloutBody: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 18,
  },
  cta: {
    marginTop: 18,
    backgroundColor: cupidTheme.colors.accent,
    paddingVertical: 16,
    borderRadius: cupidTheme.radii.lg,
    alignItems: 'center',
    ...cardShadow('floating'),
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaLabel: {
    color: cupidTheme.colors.surface,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  statusBadge: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: cupidTheme.radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surface,
  },
  statusLabel: {
    fontWeight: '600',
    flex: 1,
    color: cupidTheme.colors.textPrimary,
  },
  retryLabel: {
    color: cupidTheme.colors.accentSecondary,
    fontWeight: '700',
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
