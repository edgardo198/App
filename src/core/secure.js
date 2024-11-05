import * as SecureStore from 'expo-secure-store';

async function set(key, object) {
    try {
        await SecureStore.setItemAsync(key, JSON.stringify(object));
    } catch (error) {
        console.log('secure.set', error);
    }
}

async function get(key) {
    try {
        const data = await SecureStore.getItemAsync(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.log('secure.get', error);
    }
}

async function remove(key) {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (error) {
        console.log('secure.remove', error);
    }
}

async function wipe() {
    const keysToDelete = ['key1', 'key2', 'key3']; 
    try {
        for (const key of keysToDelete) {
            await SecureStore.deleteItemAsync(key);
        }
        console.log('Todas las claves han sido eliminadas.');
    } catch (error) {
        console.log('secure.wipe', error);
    }
}

export default { set, get, remove, wipe };

