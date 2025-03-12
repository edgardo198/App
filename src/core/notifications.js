import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permisos necesarios', '¡Es necesario dar permisos para notificaciones!');
    return null;
  }
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
