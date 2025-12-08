import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBanner } from '@/components/StatusBanner';
import { useAuth } from '@/hooks/useAuth';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function WelcomeScreen() {
  const { user } = useAuth();
  const { status, timestamp } = useHealthCheck();

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

      <Pressable style={styles.cta}>
        <Text style={styles.ctaLabel}>Start exploring</Text>
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

const styles = StyleSheet.create({
  hero: {
    gap: 4,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#111827',
  },
  kicker: {
    color: '#F472B6',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  copy: {
    marginTop: 8,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  card: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1F2028',
    gap: 12,
  },
  cardTitle: {
    color: '#F3F4F6',
    fontWeight: '600',
    fontSize: 16,
  },
  meta: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  metaValue: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '600',
  },
  callouts: {
    marginTop: 16,
    gap: 12,
  },
  callout: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#0D0F15',
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 6,
  },
  calloutTitle: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 15,
  },
  calloutBody: {
    color: '#9CA3AF',
    lineHeight: 18,
  },
  cta: {
    marginTop: 16,
    backgroundColor: '#F472B6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#0B0B0D',
    fontWeight: '700',
    fontSize: 16,
  },
});
