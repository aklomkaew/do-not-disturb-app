import { RootNavigator } from '@/navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [fontsLoaded] = useFonts({});

  return (
    <SafeAreaProvider>
      {fontsLoaded ? (
        <RootNavigator />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0B0D' }}>
          <ActivityIndicator color="#F472B6" />
        </View>
      )}
    </SafeAreaProvider>
  );
}
