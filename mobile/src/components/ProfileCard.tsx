import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { PhotoCarousel } from './PhotoCarousel';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export type ProfileCardData = {
  id: string;
  displayName: string;
  age: number;
  location: string | null;
  bio: string;
  photos?: string[];
};

type ProfileCardProps = {
  profile: ProfileCardData;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onPress?: () => void;
  onLike?: () => void;
  onPass?: () => void;
  actionLoading?: boolean;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 16;

export function ProfileCard({
  profile,
  variant = 'default',
  showActions = false,
  onPress,
  onLike,
  onPass,
  actionLoading = false,
}: ProfileCardProps) {
  const photos = profile.photos ?? [];
  const hasPhotos = photos.length > 0;
  
  // Responsive dimensions
  const cardWidth = SCREEN_WIDTH - (CARD_PADDING * 2);
  // Responsive photo heights with good aspect ratios
  const photoHeight = variant === 'compact' ? 280 : variant === 'detailed' ? 480 : 400;
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  const cardContent = (
    <View style={[styles.card, isCompact && styles.cardCompact, isDetailed && styles.cardDetailed]}>
      {/* Photo Section */}
      {hasPhotos ? (
        <View style={styles.photoWrapper}>
          <PhotoCarousel 
            photos={photos} 
            height={photoHeight}
          />
        </View>
      ) : (
        <View style={[styles.photoFallback, { height: photoHeight }]}>
          <Ionicons name="image-outline" size={48} color={cupidTheme.colors.border} />
          <Text style={styles.photoFallbackText}>No photos yet</Text>
        </View>
      )}

      {/* Profile Info Section */}
      <View style={[styles.content, isCompact && styles.contentCompact]}>
        {/* Name and Age */}
        <View style={styles.headerRow}>
          <View style={styles.nameSection}>
            <Text style={[styles.name, isCompact && styles.nameCompact]} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <Text style={[styles.age, isCompact && styles.ageCompact]}>
              {profile.age}
            </Text>
          </View>
          {!isCompact && (
            <View style={styles.locationChip}>
              <Ionicons name="location-outline" size={14} color={cupidTheme.colors.accent} />
              <Text style={styles.locationText} numberOfLines={1}>
                {profile.location ?? 'Location not set'}
              </Text>
            </View>
          )}
        </View>

        {/* Location (for compact variant) */}
        {isCompact && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={cupidTheme.colors.textMuted} />
            <Text style={styles.locationCompact} numberOfLines={1}>
              {profile.location ?? 'Somewhere on Earth'}
            </Text>
          </View>
        )}

        {/* Bio */}
        <Text 
          style={[styles.bio, isCompact && styles.bioCompact, isDetailed && styles.bioDetailed]} 
          numberOfLines={isDetailed ? undefined : isCompact ? 2 : 4}
        >
          {profile.bio || 'No bio provided'}
        </Text>

        {/* Action Buttons */}
        {showActions && (onLike || onPass) && (
          <View style={styles.actions}>
            {onPass && (
              <Pressable 
                style={[styles.actionButton, styles.passButton]} 
                onPress={onPass} 
                disabled={actionLoading}
                android_ripple={{ color: cupidTheme.colors.border }}
              >
                <Ionicons name="close-outline" size={20} color={cupidTheme.colors.textPrimary} />
                <Text style={styles.actionLabel}>Pass</Text>
              </Pressable>
            )}
            {onLike && (
              <Pressable 
                style={[styles.actionButton, styles.likeButton]} 
                onPress={onLike} 
                disabled={actionLoading}
                android_ripple={{ color: cupidTheme.colors.accentBold }}
              >
                <Ionicons name="heart" size={20} color={cupidTheme.colors.surface} />
                <Text style={[styles.actionLabel, styles.actionLabelContrast]}>Like</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: cupidTheme.colors.surfaceMuted }}>
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cupidTheme.colors.surface,
    borderRadius: cupidTheme.radii.xl,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    ...cardShadow(),
    overflow: 'hidden', // Ensure content doesn't overflow card boundaries
  },
  cardCompact: {
    padding: 20,
    gap: 14,
  },
  cardDetailed: {
    padding: 32,
    gap: 22,
  },
  photoWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  photoFallback: {
    width: '100%',
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
    gap: 8,
  },
  photoFallbackText: {
    color: cupidTheme.colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    gap: 12,
  },
  contentCompact: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  nameCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  age: {
    fontSize: 24,
    fontWeight: '600',
    color: cupidTheme.colors.textSecondary,
    letterSpacing: -0.3,
  },
  ageCompact: {
    fontSize: 20,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: cupidTheme.radii.pill,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    maxWidth: '45%',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: cupidTheme.colors.accent,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCompact: {
    fontSize: 13,
    color: cupidTheme.colors.textMuted,
    fontWeight: '500',
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: cupidTheme.colors.textSecondary,
    letterSpacing: 0.1,
  },
  bioCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  bioDetailed: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: cupidTheme.radii.lg,
    minHeight: 56,
  },
  passButton: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.border,
  },
  likeButton: {
    backgroundColor: cupidTheme.colors.accent,
    ...cardShadow('floating'),
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    letterSpacing: 0.3,
  },
  actionLabelContrast: {
    color: cupidTheme.colors.surface,
  },
});
