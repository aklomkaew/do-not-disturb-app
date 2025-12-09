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
import { cupidTheme } from '@/constants/theme';

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
      ? 'Hang tight while we spin up your new profile.'
      : 'Loading your matches and messages.';

  return (
    <ScreenContainer>
      <StatusBanner status={status} timestamp={timestamp} />

      <View style={styles.content}>
        {isError ? (
          <>
            <Text style={styles.title}>We hit a snag</Text>
            <Text style={styles.copy}>{error ?? 'Unable to confirm your account. Try again in a moment.'}</Text>
            <Pressable onPress={checkProfile} style={styles.retryButton}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={cupidTheme.colors.accent} />
            <Text style={styles.title}>
              {profileState === 'checking' ? 'Checking your account' : 'Almost there'}
            </Text>
            <Text style={styles.copy}>{loadingCopy}</Text>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    textAlign: 'center',
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: cupidTheme.colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: cupidTheme.radii.lg,
  },
  retryLabel: {
    color: cupidTheme.colors.surface,
    fontWeight: '700',
    fontSize: 15,
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
