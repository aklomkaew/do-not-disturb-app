import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import type { AuthStackParamList } from '@/navigation/AuthenticatedNavigator';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export function WelcomeScreen() {
  const { user, accessToken } = useAuth();
  const { status, timestamp } = useHealthCheck();
  const [profileState, setProfileState] = useState<'checking' | 'missing' | 'exists' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const hasRedirected = useRef(false);

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

  useEffect(() => {
    if (!user || hasRedirected.current) return;

    if (profileState === 'missing') {
      hasRedirected.current = true;
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'CreateProfile',
            params: { initialDisplayName: displayNameFallback },
          },
        ],
      });
    } else if (profileState === 'exists') {
      hasRedirected.current = true;
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [displayNameFallback, navigation, profileState, user]);

  const isError = profileState === 'error';
  const loadingCopy =
    profileState === 'missing'
      ? 'Hang tight while we spin up the rest of your onboarding.'
      : 'Loading your matches, preferences, and pause settings.';

  const statusMeta = (() => {
    switch (profileState) {
      case 'checking':
        return {
          icon: 'time-outline' as const,
          label: 'Confirming your account',
          helper: 'Verifying invite status and refreshing your tokens.',
          color: cupidTheme.colors.warning,
        };
      case 'missing':
        return {
          icon: 'person-add-outline' as const,
          label: 'Profile needed',
          helper: 'Redirecting you to finish your onboarding momentarily.',
          color: cupidTheme.colors.accent,
        };
      case 'exists':
        return {
          icon: 'sparkles-outline' as const,
          label: 'All set',
          helper: 'Loading your personalized experience.',
          color: cupidTheme.colors.success,
        };
      case 'error':
      default:
        return {
          icon: 'alert-circle-outline' as const,
          label: 'We hit a snag',
          helper: error ?? 'Unable to confirm your account. Try again shortly.',
          color: cupidTheme.colors.error,
        };
    }
  })();

  const progressIndex =
    profileState === 'checking' ? 0 : profileState === 'missing' ? 1 : profileState === 'exists' ? 2 : profileState === 'error' ? 0 : 0;

  const checklist = [
    { label: 'Confirm session', detail: 'Refresh tokens & fetch member status.' },
    { label: 'Bootstrap profile', detail: 'Make sure your basics & photos are ready.' },
    { label: 'Route to experience', detail: 'Drop you into swiping or the matches hub.' },
  ];

  return (
    <ScreenContainer>
      <StatusBanner status={status} timestamp={timestamp} />

      <View style={styles.stack}>
        <View style={styles.statusCard}>
          <View style={[styles.iconBadge, { backgroundColor: `${statusMeta.color}1A` }]}>
            <Ionicons name={statusMeta.icon} size={28} color={statusMeta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{statusMeta.label}</Text>
            <Text style={styles.copy}>{statusMeta.helper}</Text>
          </View>
          {isError ? (
            <Pressable onPress={checkProfile} style={styles.retryButton}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          ) : (
            <ActivityIndicator color={statusMeta.color} />
          )}
        </View>

        <View style={styles.timeline}>
          {checklist.map((item, index) => {
            const state = index < progressIndex ? 'done' : index === progressIndex ? 'active' : 'next';
            return (
              <View
                key={item.label}
                style={[
                  styles.timelineRow,
                  state !== 'next' && { borderColor: cupidTheme.colors.accent },
                  state === 'done' && { backgroundColor: cupidTheme.colors.accentSoft },
                ]}
              >
                <View
                  style={[
                    styles.timelineDot,
                    (state === 'active' || state === 'done') && { backgroundColor: cupidTheme.colors.accent },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineLabel, state !== 'next' && { color: cupidTheme.colors.textPrimary }]}>{item.label}</Text>
                  <Text style={styles.timelineCopy}>{item.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Why the pause?</Text>
          <Text style={styles.tipCopy}>{loadingCopy}</Text>
          <Text style={styles.tipCopy}>We keep doors closed to bots & time-wasters—thank you for your patience.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 18,
  },
  statusCard: {
    padding: 20,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...cardShadow(),
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: cupidTheme.colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: cupidTheme.radii.pill,
  },
  retryLabel: {
    color: cupidTheme.colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  timeline: {
    gap: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    padding: 14,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: cupidTheme.colors.border,
  },
  timelineLabel: {
    fontWeight: '700',
    color: cupidTheme.colors.textSecondary,
  },
  timelineCopy: {
    color: cupidTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  tipCard: {
    padding: 18,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    gap: 6,
  },
  tipTitle: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  tipCopy: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 20,
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
