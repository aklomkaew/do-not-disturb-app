import { HealthStatus } from '@/hooks/useHealthCheck';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusBannerProps {
  status: HealthStatus;
  timestamp: string | null;
}

export const StatusBanner = memo(function StatusBanner({ status, timestamp }: StatusBannerProps) {
  const color = status === 'ok' ? '#34D399' : status === 'error' ? '#F87171' : '#FBBF24';
  const label = status === 'ok' ? 'API online' : status === 'error' ? 'API offline' : 'Checking API...';

  return (
    <View style={[styles.container, { borderColor: color }]}> 
      <Text style={[styles.label, { color }]}>{label}</Text>
      {timestamp ? <Text style={styles.meta}>last ping {new Date(timestamp).toLocaleTimeString()}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#16171D',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 12,
  },
});
