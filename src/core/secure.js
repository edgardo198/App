import * as SecureStore from 'expo-secure-store';

async function set(key, object) {
    try {
        await SecureStore.setItemAsync(key, JSON.stringify(object));
    } catch (error) {
        if (console && console.log) {
            console.log('Error en secure.set:', error.message || error);
        }
    }
}

async function get(key) {
    try {
        const data = await SecureStore.getItemAsync(key);
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
        await SecureStore.deleteItemAsync(key);
    } catch (error) {
        if (console && console.log) {
            console.log('Error en secure.remove:', error.message || error);
        }
    }
}

async function wipe() {
    const keysToDelete = ['credentials'];
    try {
        for (const key of keysToDelete) {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        if (console && console.log) {
            console.log('Error en secure.wipe:', error.message || error);
        }
    }
}


export default { set, get, remove, wipe };

