import { ScreenContainer } from '@/components/ScreenContainer';
import { StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const adminTasks = [
  { label: 'Allowlist management', detail: 'Wire up `/api/admin/allowlist` to add/remove early members.' },
  { label: 'Escalations', detail: 'Route abuse reports to `/api/admin/incidents`.' },
  { label: 'Broadcasts', detail: 'Send announcements via `/api/admin/notifications`.' },
];

export function AdminScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Private beta safeguards</Text>
        <Text style={styles.heading}>Admin Console</Text>
        <Text style={styles.copy}>
          Restricted analytics and moderation tooling will render here. Wire role-based access and `/api/admin/*` endpoints to unlock
          controls below.
        </Text>
        <View style={styles.checklist}>
          {adminTasks.map((task) => (
            <View key={task.label} style={styles.taskRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={cupidTheme.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.taskLabel}>{task.label}</Text>
                <Text style={styles.taskDetail}>{task.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    gap: 10,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
  },
  eyebrow: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  heading: {
    fontSize: 22,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '800',
  },
  copy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
  },
  checklist: {
    marginTop: 8,
    gap: 10,
  },
  taskRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  taskLabel: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  taskDetail: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
