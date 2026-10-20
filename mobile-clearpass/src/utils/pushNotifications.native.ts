import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS !== 'android') return null;

  await Notifications.setNotificationChannelAsync('clearance-updates', {
    name: 'Clearance updates',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1e3a8a',
    sound: 'default',
  });

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '9420fa8e-80aa-44ee-b02e-921425c3a069',
  });
  return token.data;
};
