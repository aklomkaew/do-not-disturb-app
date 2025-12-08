import { RootNavigator } from '@/navigation/RootNavigator';
import { CreateProfileScreen } from '@/screens/CreateProfileScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Welcome: undefined;
  CreateProfile: { userId: string; initialDisplayName: string };
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthenticatedNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="MainTabs" component={RootNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
