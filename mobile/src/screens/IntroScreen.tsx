import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
          Use email or phone to request a one-time code. Once you’re in, explore curated matches, private messaging, and put your
          time back in your control.
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
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#111827',
    gap: 12,
  },
  kicker: {
    color: '#F472B6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  copy: {
    color: '#D1D5DB',
    lineHeight: 20,
  },
  card: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 6,
  },
  cardTitle: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 16,
  },
  cardCopy: {
    color: '#9CA3AF',
  },
  cta: {
    marginTop: 20,
    backgroundColor: '#F472B6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#0B0B0D',
    fontSize: 16,
    fontWeight: '700',
  },
});
