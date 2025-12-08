import { RootNavigator } from '@/navigation/RootNavigator';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { LoginScreen } from '@/screens/LoginScreen';
import { ProfileSetupScreen } from '@/screens/ProfileSetupScreen';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

export default function App() {
  const [fontsLoaded] = useFonts({});

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0B0D' }}>
        <ActivityIndicator color="#F472B6" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, profileStatus, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0B0D' }}>
        <ActivityIndicator color="#F472B6" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (profileStatus === 'needs_profile') {
    return <ProfileSetupScreen />;
  }

  return <RootNavigator />;
}
