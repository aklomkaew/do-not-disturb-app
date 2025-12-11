import { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { cupidTheme, cardShadow } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type MatchNotificationDialogProps = {
  visible: boolean;
  matchedProfile: {
    displayName: string;
    age: number;
    photo?: string;
  } | null;
  onClose: () => void;
  autoDismissDuration?: number; // in milliseconds, default 10000ms (10 seconds)
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const DIALOG_WIDTH = SCREEN_WIDTH - 32;

export function MatchNotificationDialog({
  visible,
  matchedProfile,
  onClose,
  autoDismissDuration = 10000,
}: MatchNotificationDialogProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (visible && matchedProfile) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleClose();
      }, autoDismissDuration);

      return () => clearTimeout(timer);
    } else {
      // Reset animations when not visible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, matchedProfile, autoDismissDuration]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!matchedProfile) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} activeOpacity={1}>
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.dialog}>
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={20} color={cupidTheme.colors.textMuted} />
            </Pressable>

            {/* Match Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="heart" size={32} color={cupidTheme.colors.accent} />
              </View>
            </View>

            {/* Match Title */}
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>
              You and {matchedProfile.displayName} liked each other
            </Text>

            {/* Profile Photo */}
            {matchedProfile.photo ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: matchedProfile.photo }} style={styles.photo} />
              </View>
            ) : (
              <View style={[styles.photoContainer, styles.photoPlaceholder]}>
                <Ionicons name="person" size={48} color={cupidTheme.colors.border} />
              </View>
            )}

            {/* Profile Name */}
            <Text style={styles.profileName}>
              {matchedProfile.displayName}, {matchedProfile.age}
            </Text>

            {/* Sparkle decoration */}
            <View style={styles.sparkles}>
              <Ionicons name="sparkles" size={16} color={cupidTheme.colors.accentGlow} style={styles.sparkle1} />
              <Ionicons name="sparkles" size={20} color={cupidTheme.colors.accentGlow} style={styles.sparkle2} />
              <Ionicons name="sparkles" size={18} color={cupidTheme.colors.accentGlow} style={styles.sparkle3} />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogContainer: {
    width: DIALOG_WIDTH,
    maxWidth: 400,
  },
  dialog: {
    backgroundColor: cupidTheme.colors.surface,
    borderRadius: cupidTheme.radii.xl,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: cupidTheme.colors.accentSoft,
    ...cardShadow('floating'),
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  iconBackground: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: cupidTheme.colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: cupidTheme.colors.accent,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: cupidTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: cupidTheme.colors.accent,
    marginTop: 8,
    ...cardShadow('floating'),
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  sparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  sparkle1: {
    position: 'absolute',
    top: 60,
    left: 24,
    opacity: 0.7,
  },
  sparkle2: {
    position: 'absolute',
    top: 100,
    right: 28,
    opacity: 0.8,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 80,
    left: 32,
    opacity: 0.6,
  },
});
