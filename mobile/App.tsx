import { AuthenticatedNavigator } from '@/navigation/AuthenticatedNavigator';
import { LoginScreen } from '@/screens/LoginScreen';
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { cupidTheme } from '@/constants/theme';

export default function App() {
  const [fontsLoaded] = useFonts({});

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppShell fontsLoaded={fontsLoaded} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status } = useAuth();

  if (!fontsLoaded || status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: cupidTheme.colors.background,
        }}
      >
        <ActivityIndicator color={cupidTheme.colors.accent} />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <AuthenticatedNavigator />;
  }

  return <LoginScreen />;
}
