import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { isWeb } from '../utils/platform';

export async function registerForPushNotificationsAsync(userId: string) {
  if (isWeb) {
    console.log('Notifications non supportées sur le web');
    return;
  }
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;
  token = (await Notifications.getExpoPushTokenAsync()).data;
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
  return token;
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  if (isWeb) return;
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: {},
  };
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}