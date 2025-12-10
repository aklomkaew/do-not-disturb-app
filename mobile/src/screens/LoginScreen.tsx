import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

type Step = 'request' | 'verify';

const journeySteps = [
  {
    title: 'Confirm your device',
    description: 'Enter the mobile number tied to your invite.',
  },
  {
    title: 'Verify with a 6-digit code',
    description: 'Passwords create drag—codes keep things fast and safe.',
  },
  {
    title: 'Meet high-intent matches',
    description: 'Unlock your curated queue & mindful check-ins.',
  },
] as const;

const benefits = [
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Allowlisted & safe',
    copy: 'Only approved profiles get access, keeping the vibe intentional.',
  },
  {
    icon: 'leaf-outline' as const,
    title: 'Designed for focus',
    copy: 'Pause notifications anytime and protect deep work hours.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Curated intros',
    copy: 'Swipe less with smart batches refreshed throughout the week.',
  },
];

export function LoginScreen() {
  const { requestLoginCode, verifyLoginCode } = useAuth();
  const { status: apiStatus, timestamp } = useHealthCheck();
  const [step, setStep] = useState<Step>('request');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [testCode, setTestCode] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ctaLabel = useMemo(() => (step === 'request' ? 'Send SMS code' : 'Verify & continue'), [step]);

  const cleanedPhoneNumber = phoneNumber.trim();
  const normalizedPhoneNumber = useMemo(() => normalizePhoneNumber(cleanedPhoneNumber), [cleanedPhoneNumber]);

  const handleRequest = async () => {
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    setTestCode(undefined);

    try {
      const response = await requestLoginCode({ method: 'phone', phoneNumber: normalizedPhoneNumber });
      setStatusMessage(`We sent a code to ${response.target}. Enter it below to continue.`);
      setTestCode(response.testCode);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await verifyLoginCode({ method: 'phone', phoneNumber: normalizedPhoneNumber, code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (step === 'request') {
      handleRequest();
    } else {
      handleVerify();
    }
  };

  const canSubmit = () => {
    if (submitting) return false;
    if (step === 'request') {
      return cleanedPhoneNumber.length >= 6;
    }
    return cleanedPhoneNumber.length >= 6 && /^\d{6}$/.test(code.trim());
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.grid}>
          <View style={styles.stack}>
            <StatusBanner status={apiStatus} timestamp={timestamp} />
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>High intent dating</Text>
              <Text style={styles.title}>Passwordless access built for privacy.</Text>
              <Text style={styles.subtitle}>
                One thoughtfully verified community where you decide when to be reachable. Two quick steps stand between you and
                better matches.
              </Text>

              <View style={styles.timeline}>
                {journeySteps.map((item, index) => (
                  <TimelineStep key={item.title} item={item} index={index} activeStep={step} />
                ))}
              </View>

              <View style={styles.benefitList}>
                {benefits.map((benefit) => (
                  <View key={benefit.title} style={styles.benefitItem}>
                    <Ionicons name={benefit.icon} size={18} color={cupidTheme.colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitTitle}>{benefit.title}</Text>
                      <Text style={styles.benefitCopy}>{benefit.copy}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.stack}>
            <View style={styles.card}>
              <Text style={styles.formTitle}>{step === 'request' ? 'Step 1 · Verify your device' : 'Step 2 · Enter your code'}</Text>
              <Text style={styles.formSubtitle}>
                {step === 'request' ? 'We’ll text you a one-time code to this number.' : 'Codes expire quickly—enter it as soon as it arrives.'}
              </Text>

              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 555 123 4567"
                placeholderTextColor={cupidTheme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!submitting}
              />

              {step === 'verify' && (
                <>
                  <Text style={styles.label}>6-digit code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor={cupidTheme.colors.textMuted}
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
                    maxLength={6}
                    editable={!submitting}
                  />
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {statusMessage ? <Text style={styles.message}>{statusMessage}</Text> : null}
              {testCode ? (
                <Text style={styles.testCode}>
                  Dev code: <Text style={styles.testCodeValue}>{testCode}</Text>
                </Text>
              ) : null}

              <Pressable style={[styles.button, !canSubmit() && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit()}>
                {submitting ? <ActivityIndicator color={cupidTheme.colors.surface} /> : <Text style={styles.buttonLabel}>{ctaLabel}</Text>}
              </Pressable>

              {step === 'verify' ? (
                <Pressable onPress={() => setStep('request')} style={styles.link}>
                  <Text style={styles.linkLabel}>Need a new code?</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.supportCard}>
              <Text style={styles.supportTitle}>Need help?</Text>
              <Text style={styles.supportCopy}>
                Tap “Need a new code?” to restart or email concierge@donotdisturb.app for priority support. Email login lands soon.
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function normalizePhoneNumber(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  return trimmed;
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    gap: 20,
  },
  stack: {
    gap: 16,
  },
  heroCard: {
    padding: 24,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 16,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  heroEyebrow: {
    color: cupidTheme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  subtitle: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  timeline: {
    gap: 12,
  },
  benefitList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  benefitTitle: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  benefitCopy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: 22,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    gap: 14,
    ...cardShadow(),
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
  },
  formSubtitle: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderRadius: cupidTheme.radii.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: cupidTheme.colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
  },
  error: {
    color: cupidTheme.colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    color: cupidTheme.colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  testCode: {
    color: cupidTheme.colors.accentSecondary,
    fontSize: 13,
  },
  testCodeValue: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  button: {
    marginTop: 6,
    backgroundColor: cupidTheme.colors.accent,
    borderRadius: cupidTheme.radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...cardShadow('floating'),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: cupidTheme.colors.surface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  link: {
    alignItems: 'center',
  },
  linkLabel: {
    color: cupidTheme.colors.accentSecondary,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  supportCard: {
    padding: 18,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    gap: 6,
  },
  supportTitle: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  supportCopy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});

function TimelineStep({
  item,
  index,
  activeStep,
}: {
  item: (typeof journeySteps)[number];
  index: number;
  activeStep: Step;
}) {
  const activeIndex = activeStep === 'request' ? 0 : 1;
  const isComplete = index < activeIndex;
  const isActive = index === activeIndex;

  return (
    <View style={[stylesTimeline.item, isActive && stylesTimeline.itemActive]}>
      <View style={[stylesTimeline.badge, (isActive || isComplete) && stylesTimeline.badgeActive]}>
        <Text style={[stylesTimeline.badgeLabel, (isActive || isComplete) && stylesTimeline.badgeLabelActive]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[stylesTimeline.title, isActive && stylesTimeline.titleActive]}>{item.title}</Text>
        <Text style={stylesTimeline.copy}>{item.description}</Text>
      </View>
    </View>
  );
}

const stylesTimeline = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: cupidTheme.radii.lg,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  itemActive: {
    borderColor: cupidTheme.colors.accent,
    backgroundColor: cupidTheme.colors.accentSoft,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cupidTheme.colors.surface,
  },
  badgeActive: {
    borderColor: cupidTheme.colors.accent,
    backgroundColor: cupidTheme.colors.surface,
  },
  badgeLabel: {
    color: cupidTheme.colors.textMuted,
    fontWeight: '700',
  },
  badgeLabelActive: {
    color: cupidTheme.colors.accent,
  },
  title: {
    fontWeight: '700',
    color: cupidTheme.colors.textSecondary,
  },
  titleActive: {
    color: cupidTheme.colors.textPrimary,
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
