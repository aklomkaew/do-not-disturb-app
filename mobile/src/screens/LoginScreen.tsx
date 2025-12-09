import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';

type Step = 'request' | 'verify';

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
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Do Not Disturb</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to log in or create an account. We’ll text you a one-time code to continue.
          </Text>
        </View>

        <StatusBanner status={apiStatus} timestamp={timestamp} />

        <View style={styles.card}>
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
  header: {
    gap: 10,
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
  card: {
    marginTop: 18,
    padding: 22,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    gap: 14,
    ...cardShadow(),
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
});
