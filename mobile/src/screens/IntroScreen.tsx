import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

type IntroScreenProps = {
  onGetStarted: () => void;
};

export function IntroScreen({ onGetStarted }: IntroScreenProps) {
  const { status, timestamp } = useHealthCheck();

  return (
    <ScreenContainer>
      <StatusBanner status={status} timestamp={timestamp} />
      <View style={styles.hero}>
        <Text style={styles.kicker}>Do Not Disturb</Text>
        <Text style={styles.title}>Modern dating, focused on real connection.</Text>
        <Text style={styles.copy}>
          Use email or phone to request a one-time code. Once you’re in, explore curated matches, respectful pacing, and put your time
          back in your control.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What to expect</Text>
        <Text style={styles.cardCopy}>• Secure passwordless login via email or SMS</Text>
        <Text style={styles.cardCopy}>• Fine-grained Do Not Disturb scheduling</Text>
        <Text style={styles.cardCopy}>• Admin-only allowlisting for early access</Text>
      </View>
      <Pressable style={styles.cta} onPress={onGetStarted}>
        <Text style={styles.ctaLabel}>Log in to continue</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 8,
    padding: 24,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 12,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  kicker: {
    color: cupidTheme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    marginTop: 18,
    padding: 22,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    gap: 8,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  cardTitle: {
    color: cupidTheme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 17,
  },
  cardCopy: {
    color: cupidTheme.colors.textMuted,
    fontSize: 14,
  },
  cta: {
    marginTop: 24,
    backgroundColor: cupidTheme.colors.accent,
    paddingVertical: 16,
    borderRadius: cupidTheme.radii.lg,
    alignItems: 'center',
    ...cardShadow('floating'),
  },
  ctaLabel: {
    color: cupidTheme.colors.surface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
