import { ProfileScreen } from '@/screens/ProfileScreen';
import { SwipeScreen } from '@/screens/SwipeScreen';
import { MatchesScreen } from '@/screens/MatchesScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cupidTheme } from '@/constants/theme';
import { useMatchesCount } from '@/hooks/useMatchesCount';

const Tab = createBottomTabNavigator();

const enableAdminTab = process.env.EXPO_PUBLIC_ENABLE_ADMIN === 'true';

export function RootNavigator() {
  const matchesCount = useMatchesCount();

  return (
    <Tab.Navigator
      initialRouteName="Explore"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: cupidTheme.colors.backgroundSoft,
          borderTopColor: cupidTheme.colors.borderSubtle,
          height: 68,
          paddingBottom: 10,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: cupidTheme.colors.accent,
        tabBarInactiveTintColor: cupidTheme.colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const iconName = iconForRoute(route.name);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explore" component={SwipeScreen} />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarBadge: matchesCount > 0 ? (matchesCount > 99 ? '99+' : matchesCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: cupidTheme.colors.accent,
            color: cupidTheme.colors.surface,
            fontWeight: '700',
          },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {enableAdminTab && <Tab.Screen name="Admin" component={AdminScreen} />}
    </Tab.Navigator>
  );
}

function iconForRoute(routeName: string): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'Explore':
      return 'compass-outline';
    case 'Matches':
      return 'heart-outline';
    case 'Profile':
      return 'person-circle-outline';
    case 'Admin':
      return 'shield-checkmark-outline';
    default:
      return 'ellipse-outline';
  }
}
