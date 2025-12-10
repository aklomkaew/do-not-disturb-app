import { RootNavigator } from '@/navigation/RootNavigator';
import { CreateProfileScreen } from '@/screens/CreateProfileScreen';
import { ProfileEditorScreen } from '@/screens/ProfileEditorScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { cupidTheme } from '@/constants/theme';

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
  instagramHandle: string | null;
  matchNotificationsEnabled: boolean;
  photos: string[];
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: cupidTheme.colors.background,
    primary: cupidTheme.colors.accent,
    text: cupidTheme.colors.textPrimary,
    card: cupidTheme.colors.surface,
    border: cupidTheme.colors.borderSubtle,
  },
};

export function AuthenticatedNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="ProfileEditor" component={ProfileEditorScreen} />
      <Stack.Screen name="MainTabs" component={RootNavigator} />
    </Stack.Navigator>
  );
}
