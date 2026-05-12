import { Alert, Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported && isRunningInExpoGo()) {
  Notifications.setAutoServerRegistrationEnabledAsync(false).catch(() => null);
}

export async function registerForPushNotificationsAsync() {
  if (!notificationsSupported) {
    return null;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Es necesario dar permisos para notificaciones.');
      return null;
    }

    if (isRunningInExpoGo() || Constants.executionEnvironment === 'storeClient') {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.warn('No se pudo registrar el push token:', error?.message || error);
    return null;
  }
}

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
