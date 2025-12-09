import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { cupidTheme } from '@/constants/theme';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, scrollable = true, contentContainerStyle }: ScreenContainerProps) {
  const { status, logout } = useAuth();

  const content = (
    <View style={styles.content}>
      {status === 'authenticated' ? (
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutLabel}>Log out</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backdrop} pointerEvents="none">
        <View style={[styles.blob, styles.blobPink]} />
        <View style={[styles.blob, styles.blobLavender]} />
        <View style={[styles.blob, styles.blobMint]} />
      </View>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cupidTheme.colors.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.35,
    transform: [{ scale: 1 }],
  },
  blobPink: {
    width: 320,
    height: 320,
    backgroundColor: cupidTheme.colors.accent,
    top: -120,
    right: -60,
  },
  blobLavender: {
    width: 360,
    height: 360,
    backgroundColor: '#DBC7FF',
    bottom: -140,
    left: -80,
  },
  blobMint: {
    width: 220,
    height: 220,
    backgroundColor: '#B9F5E5',
    bottom: 120,
    right: -40,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    alignItems: 'flex-end',
  },
  logoutButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: cupidTheme.radii.pill,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.border,
  },
  logoutLabel: {
    fontWeight: '700',
    color: cupidTheme.colors.textSecondary,
  },
});
