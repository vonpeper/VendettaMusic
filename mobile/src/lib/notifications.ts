import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_URL, getSessionToken } from './auth-store';

// Configure notification behavior when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // For Expo SDK 50+, projectId is required if you are calling getExpoPushTokenAsync.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export async function registerPushTokenOnServer(token: string) {
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) return;

    const response = await fetch(`${API_BASE_URL}/api/mobile/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      console.log('Push token registered successfully on backend.');
    } else {
      console.warn('Failed to register push token on backend:', data.error);
    }
  } catch (error) {
    console.error('Error registering push token on backend:', error);
  }
}

export async function unregisterPushTokenOnServer(token: string) {
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) return;

    await fetch(`${API_BASE_URL}/api/mobile/push-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ token }),
    });
    console.log('Push token unregistered from backend.');
  } catch (error) {
    console.error('Error unregistering push token from backend:', error);
  }
}
