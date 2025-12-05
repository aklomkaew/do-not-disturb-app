import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

interface ScreenContainerProps {
  children: ReactNode;
}

export function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
