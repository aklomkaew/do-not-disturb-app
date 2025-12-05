import { MessagesScreen } from '@/screens/MessagesScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SwipeScreen } from '@/screens/SwipeScreen';
import { MatchesScreen } from '@/screens/MatchesScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const enableAdminTab = process.env.EXPO_PUBLIC_ENABLE_ADMIN === 'true';

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0F1015',
            borderTopColor: '#1F2028',
          },
          tabBarActiveTintColor: '#F472B6',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarIcon: ({ color, size }) => {
            const iconName = iconForRoute(route.name);
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Swipe" component={SwipeScreen} />
        <Tab.Screen name="Matches" component={MatchesScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        {enableAdminTab && <Tab.Screen name="Admin" component={AdminScreen} />}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function iconForRoute(routeName: string): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'Swipe':
      return 'flame-outline';
    case 'Matches':
      return 'heart-outline';
    case 'Messages':
      return 'chatbubble-ellipses-outline';
    case 'Profile':
      return 'person-circle-outline';
    case 'Admin':
      return 'shield-checkmark-outline';
    default:
      return 'ellipse-outline';
  }
}
