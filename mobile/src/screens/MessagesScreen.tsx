import { ScreenContainer } from '@/components/ScreenContainer';
import { StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const placeholderThreads = [
  {
    id: '1',
    name: 'Tara · product strategist',
    preview: '“Happy to pause notifications during your launch week. What’s your ideal check-in cadence?”',
    status: 'Match confirmed · replies unlock soon',
  },
  {
    id: '2',
    name: 'Miguel · chef & runner',
    preview: '“Let’s align travel schedules. I’m in Lisbon for a pop-up until the 18th.”',
    status: 'Pending your response',
  },
  {
    id: '3',
    name: 'Priya · founder',
    preview: '“I block Thursday nights for deep work. Friday coffee?”',
    status: 'New intro',
  },
];

export function MessagesScreen() {
  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Inbox</Text>
          <Text style={styles.heading}>Conversations</Text>
          <Text style={styles.copy}>
            This is where curated matches land once both people opt into messaging. We keep it minimal so boundaries stay clear.
          </Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeLabel}>Beta</Text>
          <Text style={styles.heroBadgeCopy}>Messaging opens gradually</Text>
        </View>
      </View>

      <View style={styles.threadList}>
        {placeholderThreads.map((thread) => (
          <View key={thread.id} style={styles.threadCard}>
            <View style={styles.threadAvatar}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={cupidTheme.colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.threadName}>{thread.name}</Text>
              <Text style={styles.threadPreview}>{thread.preview}</Text>
              <View style={styles.threadStatus}>
                <Ionicons name="time-outline" size={14} color={cupidTheme.colors.textMuted} />
                <Text style={styles.threadStatusLabel}>{thread.status}</Text>
              </View>
            </View>
            <Ionicons name="lock-closed-outline" size={18} color={cupidTheme.colors.textMuted} />
          </View>
        ))}
      </View>

      <View style={styles.roadmap}>
        <Text style={styles.roadmapTitle}>Upcoming wiring</Text>
        <Text style={styles.roadmapCopy}>
          Connect `/api/messages` for thread summaries and `/api/matches/{matchId}/messages` for real-time chat to bring this screen to
          life.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 22,
    borderRadius: cupidTheme.radii.xl,
    backgroundColor: cupidTheme.colors.surface,
    gap: 12,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  heroBadge: {
    alignItems: 'flex-end',
    gap: 4,
  },
  heroBadgeLabel: {
    fontSize: 12,
    color: cupidTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroBadgeCopy: {
    color: cupidTheme.colors.textSecondary,
    fontSize: 13,
  },
  threadList: {
    gap: 12,
  },
  threadCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  threadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadName: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  threadPreview: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 18,
  },
  threadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  threadStatusLabel: {
    color: cupidTheme.colors.textMuted,
    fontSize: 12,
  },
  roadmap: {
    marginTop: 12,
    padding: 18,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    gap: 6,
  },
  roadmapTitle: {
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
  },
  roadmapCopy: {
    color: cupidTheme.colors.textSecondary,
    lineHeight: 20,
  },
});
