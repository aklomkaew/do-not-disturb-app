import { ReactNode, useMemo } from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { cupidTheme } from '@/constants/theme';
import { usePreferredName } from '@/hooks/usePreferredName';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, scrollable = true, contentContainerStyle }: ScreenContainerProps) {
  const { status, logout, user } = useAuth();
  const preferredName = usePreferredName();

  const userLabel = useMemo(() => {
    if (!user) return 'Guest';
    if (preferredName) return preferredName;
    if (user.email) return user.email;
    return `Member ${user.id.slice(0, 6)}`;
  }, [preferredName, user]);

  const initials = useMemo(() => {
    if (preferredName) {
      return preferredName
        .split(' ')
        .map((chunk) => chunk[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    if (user?.id) {
      return user.id.slice(0, 2).toUpperCase();
    }
    return 'DN';
  }, [preferredName, user]);

  const content = (
    <View style={[styles.content, !scrollable && styles.contentPadded]}>
      <View style={styles.chrome}>
        <View style={styles.brandBlock}>
          <Text style={styles.eyebrow}>Do Not Disturb</Text>
          <Text style={styles.brandTitle}>{status === 'authenticated' ? 'Welcome back' : 'Modern dating, calmer pace.'}</Text>
          <Text style={styles.brandCopy}>
            Slow down, opt-in, and connect with people who respect boundaries as much as chemistry.
          </Text>
        </View>
        {status === 'authenticated' ? (
          <TouchableOpacity style={styles.userPill} onPress={logout}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.userLabel}>{userLabel}</Text>
              <Text style={styles.logoutLabel}>Log out</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.betaPill}>
            <Text style={styles.betaLabel}>Private beta</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backdrop} pointerEvents="none">
        <View style={[styles.blob, styles.blobPink]} />
        <View style={[styles.blob, styles.blobLavender]} />
        <View style={[styles.blob, styles.blobMint]} />
      </View>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cupidTheme.colors.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.35,
    transform: [{ scale: 1 }],
  },
  blobPink: {
    width: 320,
    height: 320,
    backgroundColor: cupidTheme.colors.accent,
    top: -120,
    right: -60,
  },
  blobLavender: {
    width: 360,
    height: 360,
    backgroundColor: '#DBC7FF',
    bottom: -140,
    left: -80,
  },
  blobMint: {
    width: 220,
    height: 220,
    backgroundColor: '#B9F5E5',
    bottom: 120,
    right: -40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    gap: 20,
    maxWidth: 720,
    alignSelf: 'center',
  },
  contentPadded: {
    paddingHorizontal: 20,
  },
  chrome: {
    padding: 20,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  brandBlock: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    color: cupidTheme.colors.accent,
    fontWeight: '700',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  brandCopy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: cupidTheme.radii.pill,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
  },
  userLabel: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  logoutLabel: {
    fontSize: 12,
    color: cupidTheme.colors.textMuted,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cupidTheme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
  },
  betaPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: cupidTheme.radii.pill,
    backgroundColor: cupidTheme.colors.accentSoft,
  },
  betaLabel: {
    color: cupidTheme.colors.accentBold,
    fontWeight: '700',
    fontSize: 13,
  },
});
