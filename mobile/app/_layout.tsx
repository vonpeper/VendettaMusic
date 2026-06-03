import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { getSessionToken } from '../src/lib/auth-store';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, registerPushTokenOnServer } from '../src/lib/notifications';
// @ts-ignore
import '../global.css';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getSessionToken();
        const inAuthGroup = segments[0] === '(auth)';

        if (!token && !inAuthGroup) {
          // If not logged in and not in login screen, redirect to login
          router.replace('/(auth)/login');
        } else if (token && inAuthGroup) {
          // If logged in and in login screen, redirect to tabs dashboard
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Auth guard error:', err);
      } finally {
        setCheckedAuth(true);
      }
    }
    checkAuth();
  }, [segments]);

  // Hook up notification registration when logged in
  useEffect(() => {
    async function initNotifications() {
      const token = await getSessionToken();
      if (token) {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await registerPushTokenOnServer(pushToken);
        }
      }
    }
    if (checkedAuth) {
      initNotifications();
    }
  }, [checkedAuth]);

  // Set up notification foreground & interaction listeners
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.eventId) {
        router.push(`/event/${data.eventId}`);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  if (!checkedAuth) {
    return null; // Or custom loading spinner
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Detalle del Show', headerBackTitle: 'Atrás' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
