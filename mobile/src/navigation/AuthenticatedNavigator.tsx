import { RootNavigator } from '@/navigation/RootNavigator';
import { CreateProfileScreen } from '@/screens/CreateProfileScreen';
import { ProfileEditorScreen } from '@/screens/ProfileEditorScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Welcome: undefined;
  CreateProfile: { initialDisplayName: string };
  ProfileEditor: { profile: ProfilePayload };
  MainTabs: undefined;
};

export type ProfilePayload = {
  displayName: string;
  age: number;
  gender: string;
  relationshipStatus: string;
  bio: string;
  location: string | null;
  matchNotificationsEnabled: boolean;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthenticatedNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="ProfileEditor" component={ProfileEditorScreen} />
        <Stack.Screen name="MainTabs" component={RootNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
