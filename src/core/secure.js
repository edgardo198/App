import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

function getWebStorage() {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  return globalThis.localStorage;
}

async function set(key, object) {
  try {
    const payload = JSON.stringify(object);
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.setItem(key, payload);
      return;
    }

    await SecureStore.setItemAsync(key, payload);
  } catch (error) {
    if (console && console.log) {
      console.log('Error en secure.set:', error.message || error);
    }
  }
}

async function get(key) {
  try {
    const webStorage = getWebStorage();
    const data = webStorage ? webStorage.getItem(key) : await SecureStore.getItemAsync(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    if (console && console.log) {
      console.log('Error en secure.get:', error.message || error);
    }
    return null;
  }
}

async function remove(key) {
  try {
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    if (console && console.log) {
      console.log('Error en secure.remove:', error.message || error);
    }
  }
}

async function wipe() {
  const keysToDelete = ['credentials', 'tokens'];
  try {
    const webStorage = getWebStorage();

    for (const key of keysToDelete) {
      if (webStorage) {
        webStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    }
  } catch (error) {
    if (console && console.log) {
      console.log('Error en secure.wipe:', error.message || error);
    }
  }
}

export default { set, get, remove, wipe };

