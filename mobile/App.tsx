import 'react-native-gesture-handler';
import { AuthenticatedNavigator, navigationTheme } from '@/navigation/AuthenticatedNavigator';
import { LoginScreen } from '@/screens/LoginScreen';
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { cupidTheme } from '@/constants/theme';

const LoginStack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({});

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === 'authenticated' ? <AuthenticatedNavigator /> : <LoginNavigator />}
    </NavigationContainer>
  );
}

function LoginNavigator() {
  return (
    <LoginStack.Navigator screenOptions={{ headerShown: false }}>
      <LoginStack.Screen name="Login" component={LoginScreen} />
    </LoginStack.Navigator>
  );
}
