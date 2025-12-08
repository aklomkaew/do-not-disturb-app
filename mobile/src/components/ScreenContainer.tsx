import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cupidTheme } from '@/constants/theme';

interface ScreenContainerProps {
  children: ReactNode;
}

export function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backdrop} pointerEvents="none">
        <View style={[styles.blob, styles.blobPink]} />
        <View style={[styles.blob, styles.blobLavender]} />
        <View style={[styles.blob, styles.blobMint]} />
      </View>
      <View style={styles.content}>{children}</View>
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
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
});
