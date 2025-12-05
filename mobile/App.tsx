import { RootNavigator } from '@/navigation/RootNavigator';
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

  return <RootNavigator />;
}
