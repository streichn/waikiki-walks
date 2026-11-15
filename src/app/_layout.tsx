import { LibreCaslonText_400Regular, LibreCaslonText_400Regular_Italic, LibreCaslonText_700Bold } from '@expo-google-fonts/libre-caslon-text';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../lib/tracking'; // registers background tasks at startup
import { supabase } from '../lib/auth';
import { initPurchases } from '../lib/purchases';
import { startSync } from '../lib/sync';
import { useAccount } from '../store';
import { useTheme } from '../theme';

export default function RootLayout() {
  const t = useTheme();
  const [loaded] = useFonts({
    LibreCaslonText_400Regular,
    LibreCaslonText_400Regular_Italic,
    LibreCaslonText_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    const id = useAccount.getState().profile?.id;
    initPurchases(id && id !== 'guest' ? id : undefined);
    startSync();
    const sub = supabase?.auth.onAuthStateChange((_e, session) => {
      if (!session && useAccount.getState().profile?.provider !== 'guest') useAccount.getState().setProfile(undefined);
    });
    // Tapping an arrival notification opens that stop.
    const tapSub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    });
    return () => {
      sub?.data.subscription.unsubscribe();
      tapSub.remove();
    };
  }, []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: t.bg },
            headerTintColor: t.primary,
            headerTitleStyle: { fontFamily: t.font.display, color: t.text },
            contentStyle: { backgroundColor: t.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="walk/[id]/index" options={{ headerShown: false }} />
          <Stack.Screen name="walk/[id]/stop/[n]" options={{ headerShown: false }} />
          <Stack.Screen name="walk/[id]/go" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="auth" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="lens" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="about" options={{ title: 'About the book' }} />
          <Stack.Screen name="credits" options={{ title: 'Credits and copyright' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
