import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDefaultApiBaseUrl() {
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest?.debuggerHost ??
    '';

  const host = debuggerHost.split(':')[0];

  if (host) {
    const protocol = Platform.select({ web: 'http', default: 'http' });
    return `${protocol}://${host}:4000`;
  }

  return 'http://localhost:4000';
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? resolveDefaultApiBaseUrl();
