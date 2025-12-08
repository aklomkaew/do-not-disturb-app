import { LoginScreen } from '@/screens/LoginScreen';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0B0D' }}>
        <ActivityIndicator color="#F472B6" />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <RootNavigator />;
  }

  return <LoginScreen />;
}
