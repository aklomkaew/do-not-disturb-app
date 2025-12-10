import { HealthStatus } from '@/hooks/useHealthCheck';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cupidTheme } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface StatusBannerProps {
  status: HealthStatus;
  timestamp: string | null;
}

export const StatusBanner = memo(function StatusBanner({ status, timestamp }: StatusBannerProps) {
  const tone = useMemo(() => {
    if (status === 'ok') {
      return {
        icon: 'sparkles-outline' as const,
        color: cupidTheme.colors.success,
        background: '#E3FFF8',
        border: '#BAF4E8',
        label: 'API online',
        helper: 'Pings are healthy and realtime features are ready.',
      };
    }
    if (status === 'error') {
      return {
        icon: 'alert-circle-outline' as const,
        color: cupidTheme.colors.error,
        background: '#FFECEF',
        border: '#FFD0D9',
        label: 'API offline',
        helper: 'Something is down. Exploring & match refreshes may pause momentarily.',
      };
    }
    return {
      icon: 'time-outline' as const,
      color: cupidTheme.colors.warning,
      background: '#FFF9EB',
      border: '#FFE8B8',
      label: 'Checking API…',
      helper: 'We run a quick health check every 30 seconds.',
    };
  }, [status]);

  return (
    <View style={[styles.container, { borderColor: tone.border, backgroundColor: tone.background }]}>
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: `${tone.color}1A` }]}>
          <Ionicons name={tone.icon} color={tone.color} size={18} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.label, { color: tone.color }]}>{tone.label}</Text>
          <Text style={styles.helper}>{tone.helper}</Text>
        </View>
        {timestamp ? <Text style={styles.meta}>{new Date(timestamp).toLocaleTimeString()}</Text> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderWidth: 1,
    borderRadius: cupidTheme.radii.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  helper: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
  },
  meta: {
    marginLeft: 8,
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
