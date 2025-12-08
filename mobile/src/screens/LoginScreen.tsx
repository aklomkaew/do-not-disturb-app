import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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

  const handleRequest = async () => {
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    setTestCode(undefined);

    try {
      const response = await requestLoginCode({ method: 'phone', phoneNumber: cleanedPhoneNumber });
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
      await verifyLoginCode({ method: 'phone', phoneNumber: cleanedPhoneNumber, code });
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
            placeholderTextColor="#6B7280"
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
                placeholderTextColor="#6B7280"
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
            {submitting ? <ActivityIndicator color="#0B0B0D" /> : <Text style={styles.buttonLabel}>{ctaLabel}</Text>}
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

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0D0F15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F9FAFB',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2D303E',
  },
  error: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  message: {
    color: '#A7F3D0',
    fontSize: 14,
  },
  testCode: {
    color: '#BFDBFE',
    fontSize: 13,
  },
  testCodeValue: {
    fontWeight: '700',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#F472B6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: '#0B0B0D',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    alignItems: 'center',
  },
  linkLabel: {
    color: '#93C5FD',
    fontSize: 14,
    marginTop: 8,
  },
});
