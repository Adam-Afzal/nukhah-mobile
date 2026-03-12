// lib/pushService.ts
import { Platform } from 'react-native';
import { supabase } from './supabase';

const PROJECT_ID = '12cd5d60-25de-41a7-a14d-2f15e1243c86';

// Use require() with try/catch so the import doesn't crash in Expo Go or web
// when the native module isn't registered yet.
let Notifications: typeof import('expo-notifications') | null = null;
let isDevice = false;
try {
  Notifications = require('expo-notifications');
  const Device = require('expo-device');
  isDevice = Device.isDevice ?? false;
} catch {}

/**
 * Register device for push notifications and save token to profile row.
 * No-ops on simulators, web, and environments without native modules.
 */
export async function registerForPushNotifications(
  profileId: string,
  profileType: 'brother' | 'sister'
): Promise<string | null> {
  const token = await getExpoPushToken();
  if (!token) return null;

  const { error } = await supabase
    .from(profileType)
    .update({ push_token: token })
    .eq('id', profileId);

  if (error) {
    console.error('Error saving push token:', error);
  } else {
    console.log('✅ Push token registered for', profileType, profileId);
  }

  return token;
}

/**
 * Register push token for a user who is still in the application stage
 * (no brother/sister profile row yet). Saves to brother_application or
 * sister_application so the admin can send a push on approval.
 */
export async function registerApplicationPushToken(
  userId: string,
  applicationType: 'brother' | 'sister'
): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;

  const table = applicationType === 'brother' ? 'brother_application' : 'sister_application';
  const { error } = await supabase
    .from(table)
    .update({ push_token: token })
    .eq('user_id', userId);

  if (error) {
    console.error('Error saving application push token:', error);
  } else {
    console.log('✅ Application push token registered for', applicationType);
  }
}

/**
 * Get the Expo push token for this device without saving it anywhere.
 * Returns null on simulator, web, or if permission denied.
 */
async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications || !isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    return tokenData.data;
  } catch {
    return null;
  }
}

/**
 * Send a push notification via Expo Push API.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
        sound: 'default',
      }),
    });

    const result = await response.json();
    if (result.data?.status === 'error') {
      console.error('Push send error:', result.data.message);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
