import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Step = 'request' | 'verify';
type Method = 'email' | 'phone';

export function LoginScreen() {
  const { requestLoginCode, verifyLoginCode } = useAuth();
  const { status: apiStatus, timestamp } = useHealthCheck();
  const [method, setMethod] = useState<Method>('email');
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [testCode, setTestCode] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const identifierLabel = method === 'email' ? 'Email address' : 'Phone number';
  const identifierKeyboard = method === 'email' ? 'email-address' : 'phone-pad';

  const ctaLabel = useMemo(() => {
    if (step === 'request') {
      return method === 'email' ? 'Send login link' : 'Send SMS code';
    }
    return 'Verify & continue';
  }, [method, step]);

  const handleRequest = async () => {
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    setTestCode(undefined);

    try {
      const payload =
        method === 'email'
          ? { method: 'email' as const, email: identifier.trim().toLowerCase() }
          : { method: 'phone' as const, phoneNumber: identifier.trim() };

      const response = await requestLoginCode(payload);
      setStatusMessage(`Code sent to ${response.target}`);
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
      const payload =
        method === 'email'
          ? { method: 'email' as const, email: identifier.trim().toLowerCase(), code }
          : { method: 'phone' as const, phoneNumber: identifier.trim(), code };

      await verifyLoginCode(payload);
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
      return identifier.trim().length > 3;
    }
    return identifier.trim().length > 3 && /^\d{6}$/.test(code.trim());
  };

  const toggleMethod = (next: Method) => {
    if (next === method) return;
    setMethod(next);
    setIdentifier('');
    setCode('');
    setStep('request');
    setStatusMessage(null);
    setError(null);
    setTestCode(undefined);
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Use email or phone to receive a secure one-time code.</Text>
        </View>

        <StatusBanner status={apiStatus} timestamp={timestamp} />

        <View style={styles.segment}>
          <MethodButton label="Email" active={method === 'email'} onPress={() => toggleMethod('email')} />
          <MethodButton label="Phone" active={method === 'phone'} onPress={() => toggleMethod('phone')} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{identifierLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={method === 'email' ? 'alex@example.com' : '+1 555 123 4567'}
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            keyboardType={identifierKeyboard}
            value={identifier}
            onChangeText={setIdentifier}
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

function MethodButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.methodButton, active && styles.methodButtonActive]} onPress={onPress}>
      <Text style={[styles.methodButtonLabel, active && styles.methodButtonLabelActive]}>{label}</Text>
    </Pressable>
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
  segment: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: '#111827',
    padding: 4,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#F472B6',
  },
  methodButtonLabel: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  methodButtonLabelActive: {
    color: '#0B0B0D',
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
