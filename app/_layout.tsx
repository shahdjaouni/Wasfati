import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/state/AppProvider';
import { colors, rtl } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Persisted for the next process. MainApplication sets the same flags before
// React starts, so an update is RTL on the first frame and nothing reloads.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Alexandria_700Bold: require('../assets/fonts/Alexandria-700.ttf'),
    IBMPlexSansArabic_400Regular: require('../assets/fonts/IBMPlexSansArabic-400.ttf'),
    IBMPlexSansArabic_500Medium: require('../assets/fonts/IBMPlexSansArabic-500.ttf'),
    IBMPlexSansArabic_600SemiBold: require('../assets/fonts/IBMPlexSansArabic-600.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }, []);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={[{ flex: 1, backgroundColor: colors.background }, rtl]}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: [{ backgroundColor: colors.background }, rtl],
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="recipe/[id]" />
            <Stack.Screen name="guests" />
          </Stack>
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
